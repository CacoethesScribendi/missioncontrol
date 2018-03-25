const { createNeed, getNeed, deleteNeed } = require('../store/needs');
const { deleteBidsForNeed } = require('../store/bids');
const { getCaptainsForNeedType, addNeedToCaptain, getNeeds } = require('../store/captains');
const createConstraints = require('./constraints/need/create');
const validate = require('../lib/validate');

const create = async (req, res) => {
  const params = req.body;
  const validationErrors = validate(params, createConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    try {

      const allowedParamsKeys = Object.keys(createConstraints);
      Object.keys(params).forEach(key => {
        if (!allowedParamsKeys.includes(key)) delete params[key];
      });
      params.requester_id = req.query.requester_id;
      const needId = await createNeed(params);
      const terminals = {
        pickup: {
          longitude: params.pickup_longitude,
          latitude: params.pickup_latitude
        }, dropoff: {
          longitude: params.dropoff_longitude,
          latitude: params.dropoff_latitude
        }
      };
      await notifyCaptains(needId, terminals);
      res.json({ needId });
    }
    catch (error) {
      console.error(error);
      res.status(500).send('Something broke!');
    }
  }
};

const notifyCaptains = async (needId, terminals) => {
  const need = await getNeed(needId);
  const captains = await getCaptainsForNeedType(need.need_type, terminals);
  await Promise.all(captains.map(async captain => await addNeedToCaptain(captain.id)));
};


const cancel = async (req, res) => {
  const { needId } = req.params;
  const need = await getNeed(needId);
  if (need) {
    await deleteNeed(need);
    await deleteBidsForNeed(need);
    res.send('need cancelled');
  } else {
    res.status(500).send('Something broke!');
  }
};

const getForCaptain = async (req, res) => {
  const { davId } = req.params;
  const needs = await getNeeds(davId);
  res.send(needs);
};


module.exports = { create, cancel, getForCaptain };
