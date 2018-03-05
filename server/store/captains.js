const redis = require('./redis');
const uuid = require('uuid/v4');

const addNewCaptain = async (needTypes, notificationURL) => {
  const davId = uuid();
  redis.hmsetAsync(`captains:${davId}`,
    'id', davId,
    'notification_url', notificationURL
  );

  Promise.all(needTypes.map(item => redis.saddAsync(`needTypes:${item.need_type}`, davId))); // adds this captain davId to the needType

  // TODO: Save need types and region(s)

  return davId;
};

const getCaptainsForNeedType = async (needType) => {
  const davIds = await redis.smembersAsync(`needTypes:${needType}`);
  const captains = await Promise.map(davIds.map((id) => {
    return redis.hgetallAsync(`captains:${id}`);
  }));

  return captains;
};

module.exports = {
  addNewCaptain,
  getCaptainsForNeedType
};

