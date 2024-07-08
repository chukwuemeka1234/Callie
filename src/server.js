// server.js
const express = require('express');
const { PeerServer } = require('peer');

const app = express();
const server = require('http').Server(app);

const peerServer = PeerServer({ port: 9000, path: '/callie-1' });

app.use('/peerjs', peerServer);

server.listen(9000);
