const express = require('express');
const cors = require('cors');

const config = require('./config/app');
const router = require('./router');

const port = config.appPort;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(router);

app.listen(port, () => console.log(`App listening on PORT ${port}!`));
