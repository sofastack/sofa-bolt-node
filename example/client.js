'use strict';

const net = require('net');
const pump = require('pump');
const protocol = require('../lib');

const sentReqs = new Map();
const classCache = new Map();
const classMap = {};

const options = {
  sentReqs,
  classMap,
  classCache,
};

const socket = net.connect(12200, '127.0.0.1');
const encoder = protocol.encoder(options);
const decoder = protocol.decoder(options);

socket.once('connect', () => {
  console.log('connected');
});
socket.once('close', () => {
  console.log('close');
});
socket.once('error', err => {
  console.log(err);
});

pump(encoder, socket, decoder, err => {
  console.log(err);
});

decoder.on('response', res => {
  console.log(res);
});
decoder.on('heartbeat_ack', res => {
  console.log(res);
});

encoder.writeRequest(1, {
  args: [{
    $class: 'java.lang.String',
    $: 'peter',
  }],
  serverSignature: 'com.alipay.sofa.rpc.quickstart.HelloService:1.0',
  methodName: 'sayHello',
  timeout: 3000,
});

encoder.writeHeartbeat(2, { clientUrl: 'xxx' });
