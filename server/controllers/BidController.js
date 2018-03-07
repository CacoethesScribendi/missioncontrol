const {getBidsForNeed, addNewBid, getBid, updateBidStage} = require('../store/bids');
const {getCaptain} = require('../store/captains');
const {hasStore} = require('../lib/environment');
const {createMission} = require('../store/missions');
const {updateVehicleStatus} = require('../store/vehicles');
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
  const {user_id} = req.query;
  const {bidId} = req.params;
  await updateBidStage(bidId, 'awarded');
  const bid = await getBid(bidId);
  notifyCaptain(bid);
  const mission = await createMission({
    user_id,
    bidId,
  });
  if (mission) {
    await updateVehicleStatus(mission.vehicle_id, 'contract_received');
    res.json({mission});
  } else {
    res.status(500).send('Something broke!');
  }
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
