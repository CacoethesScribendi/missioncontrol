const {createNeed, getNeed, deleteNeed} = require('../store/needs');
const {deleteBidsForNeed} = require('../store/bids');
const {getCaptainsForNeedType} = require('../store/captains');
const createConstraints = require('./constraints/need/create');
const validate = require('../lib/validate');
const axios = require('axios');

const create = async (req, res) => {
  const params = req.body;
  const validationErrors = validate(params, createConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    const allowedParamsKeys = Object.keys(createConstraints);
    Object.keys(params).forEach(key => {
      if (!allowedParamsKeys.includes(key)) delete params[key];
    });
    params.user_id = req.query.user_id;
    const needId = await createNeed(params);
    notifyCaptains(needId);
    if (needId) {
      res.json({needId});
    } else {
      res.status(500).send('Something broke!');
    }
  }
};

const notifyCaptains = async (needId) => {
  const need = await getNeed(needId);
  const captains = await getCaptainsForNeedType(need.need_type);
  const notification = {
    notification_type: 'new_need',
    data: {
      need: need
    }
  };

  Promise.all(captains.map(captain => axios.post(captain.notification_url, notification)));
};


const cancel = async (req, res) => {
  const {needId} = req.params;
  const need = await getNeed(needId);
  if (need) {
    await deleteNeed(need);
    await deleteBidsForNeed(need);
    res.send('need cancelled');
  } else {
    res.status(500).send('Something broke!');
  }
};


module.exports = {create, cancel};
