// Dependencies
const fs = require('fs')
const express = require('express');
const path = require('path');
const http = require("http");
const https = require("https");

const videochat = require('./lib/videochat');
const notFound = require('./middleware/not-found');
const workInProgress = require('./middleware/work-in-progress');

const app = express();

// Variablen
const httpPort = 80;
const httpsPort = 443;
const serverOptions = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
}

const httpServer = http.createServer(app, serverOptions);
const httpsServer = https.createServer(app, serverOptions);

app.use('/', express.static(__dirname + '/public'));

app.get('/videochat',(req, res) => {
    videochat.init(httpServer);
    res.status(200).sendFile(path.resolve(__dirname, './public/videochat.html'));
});

app.get('/friends',(req, res) => {
    workInProgress(req, res);
});

app.get('/profile',(req, res) => {
    workInProgress(req, res);
});

app.get('/settings',(req, res) => {
    workInProgress(req, res);
});

app.all('*', (req, res) => {
    notFound(req, res);
});

// Start server
httpServer.listen(httpPort,() => {
    console.log('\x1b[33m%s\x1b[0m','\nSERVER: Server is running on port ' + httpPort);
});

// httpsServer.listen(httpsPort,() => {
//     console.log('\x1b[33m%s\x1b[0m','\nSERVER: Server is running on port ' + httpsPort);
// });
