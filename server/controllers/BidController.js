const {getBidsForNeed, addNewBid, getBid, updateBidStatus, setBidRequester} = require('../store/bids');
const {addBidToCaptain,getBids} = require('../store/captains');
const {addNewVehicle} = require('../store/vehicles');
const {hasStore} = require('../lib/environment');
const createConstraints = require('./constraints/bid/create');
const validate = require('../lib/validate');

const create = async (req, res) => {
  const {needId} = req.params;
  const params = req.body;
  params.need_id = needId;

  const validationErrors = validate(params, createConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    let bid = await addNewBid(params, needId);
    await addNewVehicle(bid.id);
    bid = await getBid(bid.id);
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
  await addBidToCaptain(bid.dav_id, bidId);
  res.status(200).send();
};

const fetchChosen = async (req, res) => {
  const {davId} = req.params;
  const bids = await getBids(davId);
  res.status(200).send(bids);
};


module.exports = {fetch, chooseBid, create, fetchChosen};
