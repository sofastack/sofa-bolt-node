'use strict';

const mm = require('mm');
const path = require('path');
const protocol = require('..');
const assert = require('assert');
const protobuf = require('antpb');
const urlparse = require('url').parse;
const awaitEvent = require('await-event');
const PassThrough = require('stream').PassThrough;

const protoPath = path.join(__dirname, 'fixtures/proto');

describe('test/pb.test.js', () => {
  afterEach(mm.restore);

  it('should encode / decode protobuf', async function() {
    const proto = protobuf.loadAll(protoPath);
    const sentReqs = new Map();
    const address = urlparse('tr://127.0.0.1:12200?serialization=protobuf&app_name=test&p=1&_TIMEOUT=4000', true);
    const encoder = protocol.encoder({ sentReqs, proto, address });
    const decoder = protocol.decoder({ sentReqs, proto });

    const socket = new PassThrough();
    encoder.pipe(socket).pipe(decoder);
    const r = {
      serverSignature: 'com.alipay.test.service.ProtoService:1.0',
      methodName: 'echoObj',
      args: [{
        name: 'peter',
        group: 'B',
      }],
      requestProps: {},
      timeout: 3000,
    };
    sentReqs.set(1, { req: r });

    setImmediate(() => {
      encoder.writeRequest(1, r);
    });

    let req = await awaitEvent(decoder, 'request');
    assert(req && req.packetId);
    assert(req.packetType === 'request');
    assert(req.data && Array.isArray(req.data.args) && req.data.args.length === 1);
    assert.deepEqual(req.data.args[0].toObject({
      enums: String,
    }), { name: 'peter', group: 'B' });
    assert(req.options && req.options.protocolType === 'bolt');
    assert(req.options.codecType === 'protobuf');

    setImmediate(() => {
      encoder.writeResponse(req, {
        isError: false,
        errorMsg: null,
        appResponse: {
          code: 200,
          message: req.data.args[0].name,
        },
      });
    });

    let res = await awaitEvent(decoder, 'response');
    assert(res && res.packetId === req.packetId);
    assert(res.packetType === 'response');
    assert(res.data && !res.data.error);
    assert.deepEqual(res.data.appResponse, { code: 200, message: 'peter' });
    assert.deepEqual(res.data.appResponse.toObject(), { code: 200, message: 'peter' });
    assert(res.options);
    assert(res.options.protocolType === 'bolt');
    assert(res.options.codecType === 'protobuf');

    setImmediate(() => {
      encoder.writeRequest(1, {
        serverSignature: 'com.alipay.test.service.ProtoService:1.0',
        methodName: 'echoObj',
        args: [{
          name: 'peter',
          group: 'B',
        }],
        requestProps: { rpc_trace_context: { sofaRpcId: '0.1', sofaCallerIp: '10.15.230.107', sofaTraceId: '0a0fe66b14781611353261001', sofaPenAttrs: 'uid=5B&mark=T&', sofaCallerApp: 'loadagent', zproxyTimeout: '3000' } },
        timeout: 3000,
      });
    });
    req = await awaitEvent(decoder, 'request');
    setImmediate(() => {
      encoder.writeResponse(req, {
        errorMsg: 'mock error',
        appResponse: null,
      });
    });

    // isError => true
    res = await awaitEvent(decoder, 'response');
    assert(res && res.packetId === req.packetId);
    assert(res.packetType === 'response');
    console.log(res.data);
    assert(res.data && res.data.error && res.data.error.message === 'Error: mock error');
    assert(!res.data.appResponse);
    assert(res.options);
    assert(res.options.protocolType === 'bolt');
    assert(res.options.codecType === 'protobuf');

    // appResponse => Error
    setImmediate(() => {
      encoder.writeRequest(1, {
        serverSignature: 'com.alipay.test.service.ProtoService:1.0',
        methodName: 'echoObj',
        args: [{
          name: 'peter',
          group: 'B',
        }],
        requestProps: {},
        timeout: 3000,
      });
    });
    req = await awaitEvent(decoder, 'request');
    setImmediate(() => {
      encoder.writeResponse(req, {
        isError: false,
        errorMsg: null,
        appResponse: new Error('mock error'),
      });
    });

    res = await awaitEvent(decoder, 'response');
    assert(res && res.packetId === req.packetId);
    assert(res.packetType === 'response');
    assert(res.data && res.data.error && res.data.error.message === 'Error: mock error');
    assert(!res.data.appResponse);
    assert(res.options);
    assert(res.options.protocolType === 'bolt');
    assert(res.options.codecType === 'protobuf');


    // appResponse => Error
    setImmediate(() => {
      encoder.writeRequest(1, {
        serverSignature: 'com.alipay.test.service.ProtoService:1.0',
        methodName: 'echoObj',
        args: [{
          name: 'peter',
          group: 'B',
        }],
        requestProps: {},
        timeout: 3000,
      });
    });
    req = await awaitEvent(decoder, 'request');
    setImmediate(() => {
      encoder.writeResponse(req, {
        isError: false,
        errorMsg: null,
        appResponse: {},
      });
    });

    mm(r, 'methodName', 'not-exists');

    try {
      await awaitEvent(decoder, 'error');
    } catch (err) {
      assert(err.name === 'BoltDecodeError');
      assert(err.message === 'no such Method \'not-exists\' in Service \'com.alipay.test.service.ProtoService:1.0\'');
    }
  });
});
