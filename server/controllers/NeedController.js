const {createNeed, getNeed, deleteNeed} = require('../store/needs');
const {deleteBidsForNeed} = require('../store/bids');
const {addNewCaptain, getCaptainsForNeedType} = require('../store/captains');
const createConstraints = require('./constraints/need/create');
const needTypesConstraints = require('./constraints/need/needTypesConstraints');
const registerConstraints = require('./constraints/need/registerConstraints');
const needTypes = require('../config/needTypes');
const validate = require('../lib/validate');
const axios = require('axios');

const registerNeedSupport = async (req, res) => {
  let params = req.body;
  validateRegistrationParameters(params, res);
  const davId = await addNewCaptain(params.need_types, params.notification_url);
  res.json({dav_id: davId});
}


const validateRegistrationParameters = (params, res) => {
  let validationErrors = validate(params, registerConstraints)
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    validationErrors = [];
    const needTypes = params.need_types;
    needTypes.forEach(item => {
      const error = validate(item, needTypesConstraints);
      if (error) validationErrors.push(error);
    })
    if (validationErrors.length > 0) res.status(422).json(validationErrors);
  }
}

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
  const captains = await getCaptainsForNeedType(needTypes[0]) // defaults to drone delivery
  const need = getNeed(needId);
  const notification = {
    notification_type: 'new_need',
    data: {
      need: need
    }
  }

  Promise.all(captains.map(captain => axios.post(captain.notification_url, notification)))
}


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


module.exports = {create, cancel, registerNeedSupport};
