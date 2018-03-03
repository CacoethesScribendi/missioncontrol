const redis = require('./redis');
const config = require('../config');
const needTypes = require('../config/needTypes');


const getNeed = async needId => {
  // Set TTL for need
  setNeedTTL(needId);
  return await redis.hgetallAsync(`needs:${needId}`);
};

const createNeed = async needDetails => {
  needDetails.need_type = needTypes[0] // default to drone delivery for now
  // get new unique id for need
  const needId = await redis.incrAsync('next_need_id');
  const key_value_array = [].concat(...Object.entries(needDetails));
  redis.hmsetAsync(`needs:${needId}`, ...key_value_array);

  // Set TTL for need
  setNeedTTL(needId);
  return needId;
};

const deleteNeed = async needId => {
  return await redis.del(`needs:${needId}`);
};

const setNeedTTL = needId => redis.expire(`needs:${needId}`, config('needs_ttl'));

module.exports = {
  createNeed,
  getNeed,
  deleteNeed
};
