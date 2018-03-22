const {getMission, updateMission, createMission} = require('../store/missions');
const {updateVehiclePosition, getVehicle } = require('../store/vehicles');
const {getBid} = require('../store/bids');
const {createMissionUpdate} = require('../store/mission_updates');
const {getCaptain} = require('../store/captains');
const validate = require('../lib/validate');
const beginConstraints = require('./constraints/mission/begin');
const updateConstraints = require('./constraints/mission/update');
const axios = require('axios');

const begin = async (req, res) => {
  const {bidId} = req.params;
  const params = req.body;
  params.bid_id = bidId;
  const validationErrors = validate(params, beginConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    const bid = await getBid(bidId);
    if ((bid.status !== 'contractSigned') || (bid.dav_id !== params.dav_id)) {
      res.status(401).send('Unauthorized');
    } else {
      let mission = await createMission(bidId);
      await updateVehiclePosition(mission.vehicle, params.longitude, params.latitude);
      mission = await getMission(mission.mission_id); //refresh mission
      if (mission) {
        console.log(mission);
        res.json({mission});
      } else {
        res.status(500).send('Something broke!');
      }
    }
  }
};

const update = async (req, res) => {
  const {missionId} = req.params;
  const params = req.body;
  const validationErrors = validate(params, updateConstraints);
  if (validationErrors) {
    res.status(422).json(validationErrors);
  } else {
    let mission = await getMission(missionId);
    if ((mission.status !== 'started') || (mission.dav_id !== params.dav_id)){
      res.status(401).send('Unauthorized');
    } else {
      const vehicle = await getVehicle(mission.vehicle_id);
      const {status, longitude, latitude} = params;
      const key = `${status}At`;
      const updateParams = {status: status};
      updateParams[key] = Date.now();
      await updateMission(missionId, updateParams);
      await updateVehiclePosition(vehicle, longitude, latitude);
      mission = await getMission(missionId); //refresh mission
      createMissionUpdate(missionId, status);
      res.status(200).json(mission);
    }
  }
};

const command = async (req, res) => {
  const {requester_id, mission_id, command} = req.query;
  let mission = await getMission(mission_id);

  if (requester_id !== mission.requester_id) return res.sendStatus(401);

  if (command === 'takeoff_pickup' && mission.status === 'atPickup') {
    await updateMission(mission_id, {'packageReadyAt': Date.now(), status: 'packageReady'});
    await createMissionUpdate(mission_id, 'packageReady');
    mission = await getMission(mission_id); //refresh mission
    const captain = await getCaptain(mission.dav_id);
    const notification = {
      notification_type: 'mission',
      data: {
        mission: mission
      }
    };
    axios.post(captain.notification_url, notification);
  }


  res.json({mission});
};

module.exports = {command, begin, update};
