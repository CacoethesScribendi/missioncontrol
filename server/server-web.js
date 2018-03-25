const cors = require('./middleware/cors');
const getOrCreateUser = require('./middleware/getOrCreateRequester');

const StatusController = require('./controllers/StatusController');
const NeedController = require('./controllers/NeedController');
const BidController = require('./controllers/BidController');
const MissionController = require('./controllers/MissionController');
const CaptainController = require('./controllers/CaptainController');
const ContractController = require('./controllers/ContractController');

// Create thrift connection to Captain
require('./client-thrift').start({
  port: process.env.CAPTAIN_PORT,
  host: process.env.CAPTAIN_HOST,
});

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.WEB_SERVER_PORT || 8888;

app.use(cors);
app.use(bodyParser.json());
app.use(getOrCreateUser);

app.get('/healthy', (req, res) => {
  res.send('hello world');
});

app.get('/status', StatusController.getStatus);

app.post('/needs', NeedController.create);
app.get('/needs/:davId', NeedController.getForCaptain);
app.delete('/needs/:needId', NeedController.cancel);

app.get('/bids/:needId', BidController.fetch);
app.put('/bids/:bidId/choose', BidController.chooseBid);

app.get('/mission_command', MissionController.command);


// endpoints for captain/dav-js
app.post('/captains', CaptainController.create);
app.post('/captains/:davId', CaptainController.registerNeedTypeForCaptain);

app.post('/bids/:needId', BidController.create);
app.post('/contracts/:bidId', ContractController.sign);
app.post('/missions/:bidId', MissionController.begin);
app.put('/missions/:missionId', MissionController.update);

module.exports = {
  start: () => {
    // Start the server
    app.listen(port, () => {
      console.log(`Web server started. Listening on port ${port}`);
    });
  },
};
