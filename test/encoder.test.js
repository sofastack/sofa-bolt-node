'use strict';

const mm = require('mm');
const net = require('net');
const pump = require('pump');
const protocol = require('../');
const assert = require('assert');
const urlparse = require('url').parse;
const awaitEvent = require('await-event');
const sleep = require('mz-modules/sleep');
const PassThrough = require('stream').PassThrough;

describe('test/encoder.test.js', () => {
  beforeEach(mm.restore);

  const reqSample = {
    args: [ 1, 2 ],
    serverSignature: 'com.alipay.test.TestService:1.0',
    methodName: 'plus',
    requestProps: {
      foo: 'bar',
    },
    timeout: 3000,
  };

  const resSample = {
    isError: false,
    errorMsg: null,
    appResponse: {
      $class: 'java.lang.Integer',
      $: 3,
    },
  };

  it('should create encoder ok', () => {
    const sentReqs = new Map();
    let address = urlparse('bolt://127.0.0.1:12200?serialization=hessian2', true);
    let encoder = protocol.encoder({ address, sentReqs });
    assert(encoder.protocolType === 'bolt');
    assert(encoder.codecType === 'hessian2');

    address = urlparse('bolt://127.0.0.1:12200?serialization=hessian', true);
    encoder = protocol.encoder({ address, sentReqs });
    assert(encoder.protocolType === 'bolt');
    assert(encoder.codecType === 'hessian');

    encoder = protocol.encoder({ sentReqs });
    assert(encoder.protocolType === 'bolt');
    assert(encoder.codecType === 'hessian2');

    encoder = protocol.encoder({ sentReqs, codecType: 'protobuf' });
    assert(encoder.protocolType === 'bolt');
    assert(encoder.codecType === 'protobuf');
    assert(encoder.boltVersion === 1);
    assert(encoder.crcEnable === false);

    encoder.codecType = 'hessian2';
    encoder.boltVersion = 2;
    encoder.crcEnable = true;
    assert(encoder.codecType === 'hessian2');
    assert(encoder.boltVersion === 2);
    assert(encoder.crcEnable === true);
  });

  it('should process timeout ok for bolt', async function() {
    const sentReqs = new Map();
    const socket = new PassThrough();
    const encoder = protocol.encoder({ sentReqs, address: urlparse('bolt://127.0.0.1:12200', true) });
    const decoder = protocol.decoder({ sentReqs });
    encoder.pipe(socket).pipe(decoder);

    setImmediate(() => {
      encoder.writeRequest(1, {
        args: [],
        serverSignature: 'com.test.TestService:1.0',
        methodName: 'test',
        timeout: 300000,
      });
    });

    let req = await awaitEvent(decoder, 'request');
    assert(req.options && req.options.timeout === 300000);
    assert(req.options.protocolType === 'bolt');
    assert(req.options.codecType === 'hessian2');
    assert(req.packetId === 1);

    try {
      await new Promise((resolve, reject) => {
        encoder.writeRequest(1, {
          args: [],
          serverSignature: 'com.test.TestService:1.0',
          methodName: 'test',
        }, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      assert(false);
    } catch (err) {
      assert(err && err.message === '[RpcRequestCommand] req.timeout should be a number');
    }

    setImmediate(() => {
      encoder.writeRequest(1, {
        args: [],
        serverSignature: 'com.test.TestService:1.0',
        methodName: 'test',
        timeout: 1000,
      });
    });

    req = await awaitEvent(decoder, 'request');
    assert(req.packetId === 1);
    assert(req.options && req.options.timeout === 1000);
  });

  [
    [ 'bolt - hessian2', 'bolt', 'hessian2', urlparse('bolt://127.0.0.1:12200?serialization=hessian2', true) ],
  ].forEach(([ spec, protocolType, codecType, address ]) => {
    describe(spec, () => {
      it('should encode request', async function() {
        const sentReqs = new Map();
        const socket = new PassThrough();
        const encoder = protocol.encoder({ sentReqs, address });
        const decoder = protocol.decoder({ sentReqs });
        encoder.pipe(socket).pipe(decoder);

        setImmediate(() => {
          encoder.writeRequest(1, Object.assign({}, reqSample));
        });

        let req = await awaitEvent(decoder, 'request');
        assert(req.packetId === 1);
        assert(req.packetType === 'request');
        assert(req.className === 'com.alipay.sofa.rpc.core.request.SofaRequest');
        assert(req.data && req.data.methodName === reqSample.methodName);
        assert(req.data.serverSignature === reqSample.serverSignature);
        assert.deepEqual(req.data.args, reqSample.args);
        assert.deepEqual(req.data.requestProps, reqSample.requestProps);
        assert.deepEqual(req.data.uniformContextHeaders, reqSample.uniformContextHeaders);
        assert(req.options && req.options.protocolType === protocolType);
        assert(req.options.codecType === codecType);
        assert(req.meta);
        assert(req.meta.size > 0);
        assert(req.meta.start > 0);
        assert(req.meta.rt >= 0);

        setImmediate(() => {
          encoder.writeRequest(2, Object.assign({}, reqSample));
        });

        req = await awaitEvent(decoder, 'request');
        assert(req.packetId === 2);
        assert(req.packetType === 'request');
        assert(req.className === 'com.alipay.sofa.rpc.core.request.SofaRequest');
        assert(req.data && req.data.methodName === reqSample.methodName);
        assert(req.data.serverSignature === reqSample.serverSignature);
        assert.deepEqual(req.data.args, reqSample.args);
        assert.deepEqual(req.data.requestProps, reqSample.requestProps);
        assert.deepEqual(req.data.uniformContextHeaders, reqSample.uniformContextHeaders);
        assert(req.options && req.options.protocolType === protocolType);
        assert(req.options.codecType === codecType);
        assert(req.meta);
        assert(req.meta.size > 0);
        assert(req.meta.start > 0);
        assert(req.meta.rt >= 0);

        setImmediate(() => {
          encoder.writeResponse(req, resSample);
        });

        const res = await awaitEvent(decoder, 'response');
        assert(res.packetId === 2);
        assert(res.packetType === 'response');
        assert.deepEqual(res.data, { error: null, appResponse: 3, responseProps: null });
        assert(res.options && res.options.protocolType === protocolType);
        assert(res.options.codecType === codecType);
        assert(res.meta);
        assert(res.meta.size > 0);
        assert(res.meta.start > 0);
        assert(res.meta.rt >= 0);
      });

      it('should handle encode error', async function() {
        const sentReqs = new Map();
        const socket = new PassThrough();
        const encoder = protocol.encoder({ sentReqs, address });
        const decoder = protocol.decoder({ sentReqs });
        encoder.pipe(socket).pipe(decoder);

        await assert.rejects(async () => {
          await new Promise((resolve, reject) => {
            encoder.writeRequest(1, {
              args: [{
                $class: 'java.lang.String',
                $: false,
              }],
              serverSignature: 'com.alipay.test.TestService:1.0',
              methodName: 'test',
              requestProps: null,
              timeout: 3000,
            }, (err, packet) => {
              if (err) {
                reject(err);
              } else {
                resolve(packet);
              }
            });
          });
        }, {
          name: 'TypeError',
          message: 'hessian writeString expect input type is `string`, but got `boolean` : false ',
        });

        setImmediate(() => {
          encoder.writeRequest(2, {
            args: [{
              $class: 'java.lang.String',
              $: 'hello',
            }],
            serverSignature: 'com.alipay.test.TestService:1.0',
            methodName: 'test',
            requestProps: null,
            timeout: 3000,
          });
        });

        const req = await awaitEvent(decoder, 'request');
        assert(req.packetId === 2);
        assert(req.packetType === 'request');
        assert(req.className === 'com.alipay.sofa.rpc.core.request.SofaRequest');
        assert(req.data && req.data.methodName === 'test');
        assert(req.data.serverSignature === 'com.alipay.test.TestService:1.0');
        assert.deepEqual(req.data.args, [ 'hello' ]);
        assert(req.meta);
        assert(req.meta.size > 0);
        assert(req.meta.start > 0);
        assert(req.meta.rt >= 0);
      });

      it('should encode error response', async function() {
        const sentReqs = new Map();
        const socket = new PassThrough();
        const encoder = protocol.encoder({ sentReqs, address });
        const decoder = protocol.decoder({ sentReqs });
        encoder.pipe(socket).pipe(decoder);

        setImmediate(() => {
          encoder.writeRequest(1, {
            args: [ 1, 2 ],
            serverSignature: 'com.alipay.test.TestService:1.0',
            methodName: 'plus',
            requestProps: null,
            uniformContextHeaders: null,
            timeout: 3000,
          }, err => {
            err && console.log(err);
          });
        });

        const req = await awaitEvent(decoder, 'request');

        setImmediate(() => {
          encoder.writeResponse(req, {
            isError: true,
            errorMsg: 'mock error message',
            appResponse: null,
          });
        });
        let res = await awaitEvent(decoder, 'response');

        assert(res.packetId === 1);
        assert(res.packetType === 'response');
        assert(res.options && res.options.protocolType === protocolType);
        assert(res.options.codecType === codecType);
        assert(res.data && res.data.error);
        assert(!res.data.appResponse);
        assert(res.data.error.message.includes('mock error message'));

        req.options.protocolType = 'bolt';
        req.options.codecType = 'hessian2';

        setImmediate(() => {
          encoder.writeResponse(req, {
            isError: true,
            errorMsg: 'xxx error',
            appResponse: null,
          });
        });
        res = await awaitEvent(decoder, 'response');
        assert(res.packetId === 1);
        assert(res.packetType === 'response');
        assert(res.options && res.options.protocolType === 'bolt');
        assert(res.options.codecType === 'hessian2');
        assert(res.data && res.data.error);
        assert(!res.data.appResponse);
        assert(res.data.error.message.includes('xxx error'));

        setImmediate(() => {
          encoder.writeResponse(req, {
            isError: true,
            status: 0x0007,
            errorMsg: null,
            appResponse: null,
          });
        });
        res = await awaitEvent(decoder, 'response');
        assert(res.packetId === 1);
        assert(res.packetType === 'response');
        assert(res.options && res.options.protocolType === 'bolt');
        assert(res.options.codecType === 'hessian2');
        assert(res.data && res.data.error);
        assert(!res.data.appResponse);
        assert(res.data.error.message.includes('Invoke timeout when invoke with callback.'));
      });

      it('should encode biz error response', async function() {
        const sentReqs = new Map();
        const socket = new PassThrough();
        const encoder = protocol.encoder({ sentReqs, address });
        const decoder = protocol.decoder({ sentReqs });
        encoder.pipe(socket).pipe(decoder);

        setImmediate(() => {
          encoder.writeRequest(1, {
            args: [ 1, 2 ],
            serverSignature: 'com.alipay.test.TestService:1.0',
            methodName: 'plus',
            requestProps: null,
            uniformContextHeaders: null,
            timeout: 3000,
          });
        });
        const req = await awaitEvent(decoder, 'request');

        setImmediate(() => {
          encoder.writeResponse(req, {
            isError: false,
            errorMsg: null,
            appResponse: {
              $class: 'java.lang.Exception',
              $: new Error('mock error'),
            },
          });
        });
        const res = await awaitEvent(decoder, 'response');

        assert(res.packetId === 1);
        assert(res.packetType === 'response');
        assert(res.options && res.options.protocolType === protocolType);
        assert(res.options.codecType === codecType);
        assert(res.data && res.data.error);
        assert(!res.data.appResponse);
        assert(res.data.error.message.includes('mock error'));
      });

      it('should encode heartbeat', async function() {
        const sentReqs = new Map();
        const socket = new PassThrough();
        const encoder = protocol.encoder({ sentReqs, address });
        const decoder = protocol.decoder({ sentReqs });
        encoder.pipe(socket).pipe(decoder);

        setImmediate(() => {
          encoder.writeHeartbeat(1, { clientUrl: 'xxx' });
        });
        const hb = await awaitEvent(decoder, 'heartbeat');

        assert(hb.packetId === 1);
        assert(hb.packetType === 'heartbeat');
        assert(hb.options && hb.options.protocolType === protocolType);
        assert(hb.options.codecType === codecType);
        if (protocolType === 'bolt') {
          assert(hb.options.timeout === 3000);
        }

        setImmediate(() => {
          encoder.writeHeartbeatAck(hb);
        });

        const hbAck = await awaitEvent(decoder, 'heartbeat_ack');
        assert(hbAck.packetId === 1);
        assert(hbAck.packetType === 'heartbeat_ack');
        assert(hbAck.options && hbAck.options.protocolType === protocolType);
        assert(hbAck.options.codecType === codecType);
      });
    });
  });

  it('should set codecType through req.codecType', async function() {
    const address = urlparse('bolt://127.0.0.1:12200?serialization=hessian', true);
    const sentReqs = new Map();
    const socket = new PassThrough();
    const encoder = protocol.encoder({ sentReqs, address });
    const decoder = protocol.decoder({ sentReqs });
    encoder.pipe(socket).pipe(decoder);

    encoder.codecType = 'hessian';

    setImmediate(() => {
      encoder.writeRequest(1, Object.assign({ codecType: 'hessian2' }, reqSample));
    });

    const req = await awaitEvent(decoder, 'request');
    assert(req.packetId === 1);
    assert(req.packetType === 'request');
    assert(req.className === 'com.alipay.sofa.rpc.core.request.SofaRequest');
    assert(req.data && req.data.methodName === reqSample.methodName);
    assert(req.data.serverSignature === reqSample.serverSignature);
    assert.deepEqual(req.data.args, reqSample.args);
    assert.deepEqual(req.data.requestProps, reqSample.requestProps);
    assert.deepEqual(req.data.uniformContextHeaders, reqSample.uniformContextHeaders);
    assert(req.options && req.options.protocolType === 'bolt');
    assert(req.options.codecType === 'hessian2');
    assert(req.meta);
    assert(req.meta.size > 0);
    assert(req.meta.start > 0);
    assert(req.meta.rt >= 0);
  });


  describe('drain', () => {
    let server;
    let port;
    before(done => {
      server = net.createServer();
      server.on('connection', socket => {
        const opts = {
          sentReqs: new Map(),
          address: urlparse('bolt://127.0.0.1:' + port + '?serialization=hessian2'),
        };
        const encoder = protocol.encoder(opts);
        const decoder = protocol.decoder(opts);
        pump(encoder, socket, decoder);

        decoder.on('request', req => {
          encoder.writeResponse(req, resSample);
        });
      });
      server.listen(0, () => {
        port = server.address().port;
        done();
      });
    });
    after(done => {
      server.close();
      server.once('close', done);
    });

    it('should process drain ok', done => {
      const socket = net.connect(port, '127.0.0.1');
      const opts = {
        sentReqs: new Map(),
        address: urlparse('bolt://127.0.0.1:' + port + '?serialization=hessian2'),
      };
      const encoder = protocol.encoder(opts);
      const decoder = protocol.decoder(opts);
      pump(encoder, socket, decoder);

      for (let i = 0; i < 1000; i++) {
        encoder.writeRequest(i, reqSample);
      }

      let counter = 0;
      decoder.on('response', res => {
        counter++;
        assert(res && res.data && !res.data.error);
        assert(res.data.appResponse === 3);
        if (counter === 1000) {
          socket.destroy();
          done();
        }
      });
    });

    it('should throw error if response timeout', done => {
      const server = net.createServer();
      server.on('connection', socket => {
        const opts = {
          sentReqs: new Map(),
          address: urlparse('bolt://127.0.0.1:' + port + '?serialization=hessian2'),
        };
        const encoder = protocol.encoder(opts);
        const decoder = protocol.decoder(opts);
        pump(encoder, socket, decoder);

        decoder.on('request', req => {
          setTimeout(() => {
            encoder.writeResponse(req, resSample, err => {
              assert(err && err.message.includes('service:com.alipay.test.TestService:1.0#plus spends'));
              assert(err.resultCode === '03');
              assert(err.name === 'ResponseTimeoutError');
              socket.destroy();
              server.close();
              done();
            });
          }, 200);
        });
      });
      server.listen(0, () => {
        const port = server.address().port;
        const opts = {
          sentReqs: new Map(),
          address: urlparse('bolt://127.0.0.1:' + port + '?serialization=hessian2'),
        };
        const socket = net.connect(port, '127.0.0.1');
        const encoder = protocol.encoder(opts);
        const decoder = protocol.decoder(opts);
        pump(encoder, socket, decoder);

        encoder.writeRequest(1, {
          args: [ 1, 2 ],
          serverSignature: 'com.alipay.test.TestService:1.0',
          methodName: 'plus',
          requestProps: {
            foo: 'bar',
          },
          timeout: 100,
        });
      });
    });

    it('should ignore timeout request after drain', async () => {
      const socket = net.connect(port, '127.0.0.1');
      const opts = {
        sentReqs: new Map(),
        address: urlparse('bolt://127.0.0.1:' + port + '?serialization=hessian2'),
      };
      const encoder = protocol.encoder(opts);
      const decoder = protocol.decoder(opts);
      pump(encoder, socket, decoder);

      mm(encoder, '_limited', 'true');
      mm(encoder, '_requestEncode', () => {
        throw new Error('should not run here');
      });
      encoder.writeRequest(1, {
        args: [ 1, 2 ],
        serverSignature: 'com.alipay.test.TestService:1.0',
        methodName: 'plus',
        requestProps: {
          foo: 'bar',
        },
        timeout: 100,
      }, err => {
        assert(!err);
      });

      await sleep(200);

      encoder.emit('drain');

      await sleep(100);

      socket.destroy();
    });
  });
});
