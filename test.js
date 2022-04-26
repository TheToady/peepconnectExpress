const fs = require('fs')
const express = require('express');
const app = express();
const http = require("http");
const https = require("https");
const httpServer = http.createServer(app, {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
})
const httpsServer = https.createServer(app, {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
})

// Variablen
const httpPort = 80;
const httpsPort = 443;

app.get('*',(req, res) => {
    res.status(200).send('hi');
    const { Server } = require("socket.io");
    io = new Server(http, {
        cors: {
            origin: "https://gitzbrecht.dev"
        }
    })
});

httpsServer.listen(httpsPort,() => {
    console.log('\x1b[33m%s\x1b[0m','\nSERVER: Server is running on port ' + httpsPort);
});
httpServer.listen(httpPort,() => {
    console.log('\x1b[33m%s\x1b[0m','\nSERVER: Server is running on port ' + httpPort);
});