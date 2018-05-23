'use strict';

const net = require('net');
const pump = require('pump');
const protocol = require('../lib');

const server = net.createServer(socket => {
  const sentReqs = new Map();
  const classCache = new Map();
  const classMap = {};

  const options = {
    sentReqs,
    classMap,
    classCache,
  };
  const encoder = protocol.encoder(options);
  const decoder = protocol.decoder(options);
  pump(encoder, socket, decoder, err => {
    console.log(err);
  });

  decoder.on('request', req => {
    console.log(req);
    encoder.writeResponse(req, {
      isError: false,
      appResponse: {
        $class: 'java.lang.String',
        $: `hello ${req.data.args[0]} !`,
      },
    });
  });

  decoder.on('heartbeat', hb => {
    console.log(hb);
    encoder.writeHeartbeatAck(hb);
  });
});

server.listen(12200);
