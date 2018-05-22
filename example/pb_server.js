'use strict';

const net = require('net');
const path = require('path');
const pump = require('pump');
const protocol = require('../lib');
const protobuf = require('antpb');

const protoPath = path.join(__dirname, 'proto');
const proto = protobuf.loadAll(protoPath);

const server = net.createServer(socket => {
  const options = {
    sentReqs: new Map(),
    proto,
  };
  const encoder = protocol.encoder(options);
  const decoder = protocol.decoder(options);
  pump(encoder, socket, decoder, err => {
    console.log(err);
  });

  decoder.on('request', req => {
    const reqData = req.data.args[0].toObject({ enums: String });
    encoder.writeResponse(req, {
      isError: false,
      appResponse: {
        code: 200,
        message: 'hello ' + reqData.name + ', you are in ' + reqData.group,
      },
    });
  });

  decoder.on('heartbeat', hb => {
    console.log(hb);
    encoder.writeHeartbeatAck(hb);
  });
});

server.listen(12200);
