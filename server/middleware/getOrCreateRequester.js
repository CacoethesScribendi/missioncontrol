const { getOrCreateRequester } = require('../store/requesters');

module.exports = async (req, res, next) => {
  const { requester_id } = req.query;
  let requester = await getOrCreateRequester(requester_id);
  req.requester = requester;
  next();
};
