const {getBid, updateBidStatus} = require('../store/bids');
const signConstraints = require('./constraints/contract/sign');
const {signContract, getContract} = require('../store/contracts');
const {addNewVehicle} = require('../store/vehicles');
const {getCaptain} = require('../store/captains');
const validate = require('../lib/validate');
const axios = require('axios');

const sign = async (req, res) => {
  const {bidId} = req.params;
  const params = req.body;
  params.bid_id = bidId;
  const validationErrors = validate(params, signConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    const bid = await getBid(bidId);
    if ((bid.status !== 'awarded') || (bid.dav_id !== params.dav_id)) {
      res.status(401).send('Unauthorized');
    } else {
      setTimeout(function () {
        signAndNotifyCaptain(params);
      }, 6000);
      res.status(200).send();
    }
  }
};


const signAndNotifyCaptain = async function ({id, bid_id, dav_id, ttl}) {
  await signContract({bid_id, id, ttl});
  addNewVehicle(bid_id);
  updateBidStatus(bid_id, 'contractSigned');
  const captain = await getCaptain(dav_id);
  const contract = await getContract(id, bid_id);
  const notification = {
    notification_type: 'contract',
    data: {
      contract: contract
    }
  };
  axios.post(captain.notification_url, notification);
};

module.exports = {sign};
