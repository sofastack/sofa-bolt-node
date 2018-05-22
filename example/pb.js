'use strict';

const net = require('net');
const path = require('path');
const pump = require('pump');
const urlparse = require('url').parse;
const protocol = require('../lib');
const protobuf = require('antpb');

const protoPath = path.join(__dirname, 'proto');
const proto = protobuf.loadAll(protoPath);

const sentReqs = new Map();
const address = urlparse('bolt://127.0.0.1:12200', true);
const encoder = protocol.encoder({ sentReqs, proto, address });
const decoder = protocol.decoder({ sentReqs, proto });

const socket = net.connect(12200, '127.0.0.1');
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

encoder.codecType = 'protobuf';

const req = {
  serverSignature: 'com.alipay.sofa.rpc.test.ProtoService:1.0',
  methodName: 'echoObj',
  args: [{
    name: 'peter',
    group: 'B',
  }],
  requestProps: {
    rpc_trace_context: {},
  },
  timeout: 3000,
};
sentReqs.set(1, { req });

decoder.on('response', res => {
  console.log(res);
  console.log(res.data.appResponse.code);
});

encoder.writeRequest(1, req);
