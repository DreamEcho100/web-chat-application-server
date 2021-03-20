const express = require('express');
const cors = require('cors');
const http = require('http');

const config = require('./config/app');
const router = require('./router');

const port = config.appPort;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

app.use(router);

const server = http.createServer(app);
const SoketServer = require('./socket');
SoketServer(server);

server.listen(port, () => console.log(`App listening on PORT ${port}!`));
