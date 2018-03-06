const redis = require('./redis');
const { aerospikeConfig } = require('../config/aerospike');
const Aerospike = require('aerospike');
const config = require('../config');
// const { randomBid } = require('../simulation/vehicles');
const { getVehicle/* , generateSoloVehicleForBid */ } = require('../store/vehicles');
const { getNeed } = require('./needs');
const aerospike = Aerospike.client(aerospikeConfig());

const saveBid = async ({ vehicle_id, time_to_pickup, time_to_dropoff, price, price_type, price_description, expires_at }, needId, userId) => {
  // get new unique id for bid
  const bidId = await redis.incrAsync('next_bid_id');

  // Save bid id in need_bids
  redis.rpushAsync(`need_bids:${needId}`, bidId);

  // Add bid to bids
  redis.hmsetAsync(`bids:${bidId}`,
    'id', bidId,
    'vehicle_id', vehicle_id,
    'user_id', userId,
    'price', price,
    'price_type', price_type,
    'price_description', price_description,
    'expires_at', expires_at,
    'time_to_pickup', time_to_pickup,
    'time_to_dropoff', time_to_dropoff,
    'need_id', needId,
  );

  // Set TTL for bid
  setBidTTL(bidId);
  return bidId;
};

const getBid = async bidId => {
  // Set TTL for bid
  setBidTTL(bidId);
  return await redis.hgetallAsync(`bids:${bidId}`);
};


aerospike.connect(function (error) {
  if (error) {
    // handle failure
    console.log('Connection to Aerospike cluster failed!');
  } else {
    // handle success
    console.log('Connection to Aerospike cluster succeeded!');
  }
  let key = new Aerospike.Key('test', 'test', 0x1234);
  // Record to be written to the database
  let bins = {
    uid: 1000,                // integer data stored in bin called "uid"
    name: 'user_name',         // string data stored in bin called "user_name"
    dob: { mm: 12, dd: 29, yy: 1995 },  // map data stored (msgpack format) in bin called "dob"
    friends: [1001, 1002, 1003],  // list data stored (msgpack format) in bin called "friends"
    avatar: Buffer.from([0xa, 0xb, 0xc])   // blob data stored in a bin called "avatar"
  };
  // Put the record to the database.
  aerospike.put(key, bins, function (error) {
    if (error) {
      console.log('error: %s', error.message);
    } else {
      console.log('Record written to database successfully.');
      aerospike.get(key, function (error, record) {
        if (error) {
          switch (error.code) {
            case Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND:
              console.log('NOT_FOUND -', key);
              break;
            default:
              console.log('ERR - ', error, key);
          }
        } else {
          console.log('OK - ', record);
        }
        aerospike.close();
      });
    }
  });
});

const getBidsForNeed = async needId => {
  // get request details
  const need = await getNeed(needId);
  if (!need) return [];

  const userId = need.user_id;

  // get bids for need
  const bidIds = await redis.lrangeAsync(`need_bids:${needId}`, 0, -1);
  const bids = await Promise.all(
    bidIds.map(bidId => {
      setBidTTL(bidId);
      return redis.hgetallAsync(`bids:${bidId}`);
    }),
  );

  // If not enough bids, make some up
  if (bidIds.length < 10) {
    const { pickup_longitude, pickup_latitude, dropoff_latitude, dropoff_longitude } = need;
    const pickup = { lat: pickup_latitude, long: pickup_longitude };
    const dropoff = { lat: dropoff_latitude, long: dropoff_longitude };
    const vehicleIds = await redis.georadiusAsync(
      'vehicle_positions',
      pickup_longitude,
      pickup_latitude,
      2000,
      'm',
    );
    if (vehicleIds.length > bidIds.length) {
      // Just a hacky way to get more bids from different vehicles.
      // Not guaranteed to not have duplicate bids from same vehicle
      const vehicleId = vehicleIds[bidIds.length];
      let vehicle = await getVehicle(vehicleId);
      if (vehicle.status !== 'available') {
        // if the vehicle is not available then we will generate
        // some new vehicle to simulate the entry of new providers (default radius)
        // TODO: remove simulation code from here
        // const pickupNumber = {lat: parseFloat(pickup.lat), long: parseFloat(pickup.long)};
        // vehicle = generateSoloVehicleForBid(pickupNumber);
      }
      let newBid = await generateBidFromVehicle(vehicle, pickup, dropoff, needId, userId);
      bids.push(newBid);
    }
  }
  return bids;
};

const generateBidFromVehicle = async (vehicle, pickup, dropoff, needId, userId) => {
  // TODO: Get bids from captains
  // const origin = { lat: vehicle.coords.lat, long: vehicle.coords.long };
  let newBid = {};//randomBid(origin, pickup, dropoff);
  newBid.vehicle_id = vehicle.id;
  const newBidId = await saveBid(newBid, needId, userId);
  newBid.id = newBidId;
  return newBid;
};

const deleteBidsForNeed = async needId => {
  const bidIds = await redis.lrangeAsync(`need_bids:${needId}`, 0, -1);
  await Promise.all(
    bidIds.map(bidId => redis.del(`bids:${bidId}`))
  );
  return await redis.del(`need_bids:${needId}`);
};

module.exports = {
  getBidsForNeed,
  getBid,
  deleteBidsForNeed,
};

const setBidTTL = bidId => redis.expire(`bids:${bidId}`, config('bids_ttl'));
