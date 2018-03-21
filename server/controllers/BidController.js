const {getBidsForNeed, addNewBid, getBid, updateBidStatus, setBidRequester} = require('../store/bids');
const {getCaptain} = require('../store/captains');
const {hasStore} = require('../lib/environment');
const createConstraints = require('./constraints/bid/create');
const validate = require('../lib/validate');
const axios = require('axios');

const create = async (req, res) => {
  const {needId} = req.params;
  const params = req.body;
  params.need_id = needId;
  const validationErrors = validate(params, createConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    const bid = await addNewBid(params, needId);
    if (bid) {
      res.json(bid);
    } else {
      res.status(500).send('Something broke!');
    }
  }
};

const fetch = async (req, res) => {
  const {needId} = req.params;
  const bids = (!hasStore() || !needId) ? [] : await getBidsForNeed(needId);
  res.status(200).json(bids);
};

const chooseBid = async (req, res) => {
  const {requester_id} = req.query;
  const {bidId} = req.params;
  await updateBidStatus(bidId, 'awarded');
  await setBidRequester(bidId, requester_id);
  const bid = await getBid(bidId);
  notifyCaptain(bid);
  res.status(200).send();
};

const notifyCaptain = async (bid) => {
  const captain = await getCaptain(bid.dav_id);
  const notification = {
    notification_type: 'bid',
    data: {
      bid: bid
    }
  };
  axios.post(captain.notification_url, notification);
};



module.exports = {fetch, chooseBid, create};
