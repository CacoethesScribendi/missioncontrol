const redis = require('./redis');

const createMissionUpdate = async (missionId, status) => {
  await redis.zaddAsync(`mission_updates:${missionId}`, Date.now(), status);
};

module.exports = {
  createMissionUpdate,
};
