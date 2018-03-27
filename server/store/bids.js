const redis = require('./redis');
// const config = require('../config');
// const { randomBid } = require('../simulation/vehicles');
const { aerospikeConfig } = require('../config/aerospike');
const {getNeed} = require('./needs');
const Aerospike = require('aerospike');
const aerospike = Aerospike.client(aerospikeConfig());

const addNewBid = async (bid, needId) => {
  // get new unique id for bid
  const bidId = await redis.incrAsync('next_bid_id');

  // Save bid id in need_bids
  redis.rpushAsync(`need_bids:${needId}`, bidId);

  // Add bid to bids
  await redis.hmsetAsync(`bids:${bidId}`,
    'id', bidId,
    'vehicle_id', bid.vehicle_id,
    'dav_id', bid.dav_id,
    'price', bid.price,
    'price_type', bid.price_type,
    'price_description', bid.price_description,
    'expires_at', bid.expires_at,
    'time_to_pickup', bid.time_to_pickup,
    'time_to_dropoff', bid.time_to_dropoff,
    'need_id', needId,
    'drone_contact', bid.drone_contact,
    'drone_manufacturer', bid.drone_manufacturer,
    'drone_model', bid.drone_model,
    'status', 'awaitingAward'
  );

  if (bid.ttl) setBidTTL(bidId, bid.ttl);

  return await getBid(bidId);
};

const updateBidStatus = async (id, status) => {
  return await redis.hsetAsync(`bids:${id}`, 'status', status);
};

const setBidVehicle = (id, vehicleId) => redis.hsetAsync(`bids:${id}`, 'vehicle_id', vehicleId);
const setBidRequester = (id, requesterId) => redis.hsetAsync(`bids:${id}`, 'requester_id', requesterId);

const getBid = async bidId => {
  // Set TTL for bid
  return await redis.hgetallAsync(`bids:${bidId}`);
};

const getBids = async (davId) => {
  const ids = await getBidsIds(davId);
  const bids = await Promise.all(ids.map(bidId => getBid(bidId)));
  return bids;
};

const getBidsIds = async (davId) => {
  try {
    let policy = new Aerospike.WritePolicy({
      exists: Aerospike.policy.exists.CREATE_OR_REPLACE
    });
    await aerospike.connect();
    let key = new Aerospike.Key(namespace, 'bids', davId);
    let res = await aerospike.get(key, policy);
    return res.bins.bids;
  }
  catch (error) {
    if (error.message.includes('Record does not exist in database')) {
      return [];
    }
    throw error;
  }
};

const getBidsForNeed = async needId => {
  // get request details
  const need = await getNeed(needId);
  if (!need) return [];

  // get bids for need
  const bidIds = await redis.lrangeAsync(`need_bids:${needId}`, 0, -1);
  const bids = await Promise.all(
    bidIds.map(bidId => {
      return redis.hgetallAsync(`bids:${bidId}`);
    }),
  );

  return bids;
};


const deleteBidsForNeed = async needId => {
  const bidIds = await redis.lrangeAsync(`need_bids:${needId}`, 0, -1);
  await Promise.all(
    bidIds.map(bidId => redis.del(`bids:${bidId}`))
  );
  return await redis.del(`need_bids:${needId}`);
};

module.exports = {
  addNewBid,
  getBidsForNeed,
  getBid,
  deleteBidsForNeed,
  updateBidStatus,
  setBidVehicle,
  setBidRequester,
  getBids
};

const setBidTTL = (bidId, ttl) => redis.expire(`bids:${bidId}`, ttl);
