const redis = require('./redis');
const { aerospikeConfig, namespace } = require('../config/aerospike');
const Aerospike = require('aerospike');
const GeoJSON = Aerospike.GeoJSON;
const filter = Aerospike.filter;
const aerospike = Aerospike.client(aerospikeConfig());
const _ = require('lodash');


const addNewCaptain = async ({ dav_id, notification_url }) => {
  await redis.hmsetAsync(`captains:${dav_id}`,
    'id', dav_id,
    'notification_url', notification_url
  );

  return dav_id;
};

const addNeedTypeForCaptain = async ({ dav_id, need_type, region }) => {
  await redis.saddAsync(`needTypes:${need_type}`, dav_id); // adds this captain davId to the needType
  await aerospike.connect();
  await createRegionIndex(need_type);
  let key = new Aerospike.Key(namespace, need_type, dav_id);
  let bins = {
    dav_id: dav_id,
    region: new GeoJSON({ type: 'AeroCircle', coordinates: [[region.longitude, region.latitude], region.radius] })
  };
  let policy = new Aerospike.WritePolicy({
    exists: Aerospike.policy.exists.CREATE_OR_REPLACE
  });
  await aerospike.put(key, bins, {}, policy);
  return dav_id;
};

const createRegionIndex = async (need_type) => {
  var options = {
    ns: namespace,
    set: need_type,
    bin: 'region',
    index: `idx_${namespace}_${need_type}_region`,
    datatype: Aerospike.indexDataType.GEO2DSPHERE
  };

  try {
    await aerospike.createIndex(options);
  } catch (error) {
    if (error.message.match(/Index .* already exists/).length === 0) {
      console.log(error);
    }
  }
};


const getCaptain = async davId => {
  return await redis.hgetallAsync(`captains:${davId}`);
};

const getCaptainsForNeedType = (needType, { pickup, dropoff }) => {
  return new Promise(async (resolve, reject) => {

    try {
      const pickupResults = [];
      const dropoffResults = [];
      const client = await aerospike.connect();
      const pickupStream = geoQueryStreamForTerminal(pickup, needType, client);

      pickupStream.on('data', (pickupRecord) => {
        pickupResults.push(pickupRecord.bins.dav_id);
      });

      pickupStream.on('end', () => {
        const dropoffStream = geoQueryStreamForTerminal(dropoff, needType, client);

        dropoffStream.on('data', (dropoffRecord) => {
          dropoffResults.push(dropoffRecord.bins.dav_id);
        });

        dropoffStream.on('end', async () => {
          const davIds = _.intersection(dropoffResults, pickupResults);
          const captains = await Promise.all(davIds.map((id) => {
            return redis.hgetallAsync(`captains:${id}`);
          })).then(captains => captains);

          resolve(captains);
        });
      });

    } catch (err) {
      reject(err);
    }

  });
};

const geoQueryStreamForTerminal = (terminal, needType) => {
  const geoFilters = [];
  geoFilters.push(filter.geoContainsPoint('region', terminal.longitude, terminal.latitude));
  const args = { filters: geoFilters };
  const query = aerospike.query(namespace, needType, args);
  const stream = query.foreach();
  return stream;
};

module.exports = {
  addNewCaptain,
  getCaptain,
  getCaptainsForNeedType,
  addNeedTypeForCaptain
};

