const express = require('express');
const cors = require('cors');

const { appKey, appPort, appUrl } = require('./config/app');
const app = express();

app.use(cors());
app.use(express());

app.get('/home', (req, res) => res.send('Hello World! Home Screen'));
app.listen(appPort, () => console.log(`App listening on PORT ${appPort}!`));
