const redis = require('./redis');

const signContract = async ({bid_id, id, ttl}) => {
  redis.saddAsync(`contracts:${id}`, bid_id);
  redis.hmsetAsync(`contracts_bids:${id}:${bid_id}`,
    'status', 'signed',
    'bid_id', bid_id,
    'id', id
  );
  redis.expire(`contracts:${id}`, ttl);
  redis.expire(`contracts_bids:${id}:${bid_id}`, ttl);
};


const getContract = async (contractId, bidId) => {
  return await redis.hgetallAsync(`contracts_bids:${contractId}:${bidId}`);
};

module.exports = {signContract, getContract};
