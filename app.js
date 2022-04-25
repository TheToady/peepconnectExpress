// Dependencies
const fs = require('fs')
const express = require('express');
const path = require('path');

const videochat = require('./lib/videochat');
const notFound = require('./middleware/not-found');
const workInProgress = require('./middleware/work-in-progress');

const app = express();
const http = require("http").Server(app);

// Variablen
const httpPort = 5080; // --> 2052

app.use('/', express.static(__dirname + '/public'));

app.get('/videochat',(req, res) => {
    videochat.init(http);
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



http.listen(httpPort,() => {
    console.log('\x1b[33m%s\x1b[0m','\nSERVER: Server is running on port ' + httpPort);
});
