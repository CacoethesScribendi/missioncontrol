const redis = require('./redis');

const addNewCaptain = async ({dav_id, notification_url}) => {
  redis.hmsetAsync(`captains:${dav_id}`,
    'id', dav_id,
    'notification_url', notification_url
  );

  return dav_id;
};

const addNeedTypeForCaptain = async ({dav_id, need_type, region}) => {
  redis.saddAsync(`needTypes:${need_type}`, dav_id); // adds this captain davId to the needType
  console.log(region); // just to get rid of the lint issues
  return dav_id;
  // TODO: Save need types and region(s)
};


const getCaptain = async davId => {
  return await redis.hgetallAsync(`captains:${davId}`);
};

const getCaptainsForNeedType = async (needType) => {
  const davIds = await redis.smembersAsync(`needTypes:${needType}`);
  const captains = await Promise.all(davIds.map((id) => {
    return redis.hgetallAsync(`captains:${id}`);
  })).then(captains => captains);

  return captains;
};

module.exports = {
  addNewCaptain,
  getCaptain,
  getCaptainsForNeedType,
  addNeedTypeForCaptain
};

