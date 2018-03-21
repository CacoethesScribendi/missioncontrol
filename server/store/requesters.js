const redis = require('./redis');

const getRequester = async requesterId => {
  return await redis.hgetallAsync(`requesters:${requesterId}`);
};

const createRequester = async requesterId => {
  if (!requesterId) requesterId = await redis.incrAsync('next_requester_id');
  redis.hmsetAsync(`requesters:${requesterId}`, 'requester_id', requesterId);
  return requesterId;
};

const getOrCreateRequester = async requesterId => {
  let requester = await getRequester(requesterId);
  if (!requester) {
    await createRequester(requesterId);
    requester = await getRequester(requesterId);
  }
  return requester;
};

module.exports = {
  getOrCreateRequester,
};
