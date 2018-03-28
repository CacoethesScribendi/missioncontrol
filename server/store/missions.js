const redis = require('./redis');
const { getBid } = require('./bids');
const { getNeed } = require('./needs');
const { getVehicle } = require('./vehicles');
const { createMissionUpdate } = require('./mission_updates');

const getMission = async missionId => {
  const mission = await redis.hgetallAsync(`missions:${missionId}`);
  const vehicle = await getVehicle(mission.vehicle_id);
  mission.vehicle = vehicle;
  mission.mission_id = missionId;
  return mission;
};

const getLatestMission = async requesterId => {
  const missions = await redis.zrevrangeAsync(`requester_missions:${requesterId}`, 0, -1);
  let mission = null;
  if (missions.length > 0) {
    mission = await getMission(missions[0]);
    if (typeof mission === 'object') {
      return mission;
    }
  }
};

const updateMission = async (id, params) => {
  const key_value_array = [].concat(...Object.entries(params));
  return await redis.hmsetAsync(`missions:${id}`, ...key_value_array);
};

const createMission = async (bidId) => {
  // get bid details
  const bid = await getBid(bidId);
  const { mission_id, vehicle_id, price, time_to_pickup, time_to_dropoff, need_id, requester_id, dav_id } = bid;

  // get need details
  const need = await getNeed(need_id);
  const { pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude, pickup_at, cargo_type, weight } = need;

  // get new unique id for mission
  const missionId = mission_id;
  const started_at = Date.now();
  const status = 'started';

  // Save mission in user missions history
  redis.zaddAsync(`requester_missions:${bid.requester_id}`, started_at, missionId);

  createMissionUpdate(missionId, 'started');

  // create a new mission entry in Redis
  await redis.hmsetAsync(`missions:${missionId}`,
    'mission_id', missionId,
    'requester_id', requester_id,
    'vehicle_id', vehicle_id,
    'price', price,
    'time_to_pickup', time_to_pickup,
    'time_to_dropoff', time_to_dropoff,
    'bid_id', bidId,
    'dav_id', dav_id,
    'need_id', need_id,
    'pickup_latitude', pickup_latitude,
    'pickup_longitude', pickup_longitude,
    'dropoff_latitude', dropoff_latitude,
    'dropoff_longitude', dropoff_longitude,
    'pickup_at', pickup_at,
    'cargo_type', cargo_type,
    'weight', weight,
    'started_at', started_at,
    'status', status,
  );

  return await getMission(missionId);
};

module.exports = {
  createMission,
  getMission,
  getLatestMission,
  updateMission,
};
