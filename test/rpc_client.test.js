'use strict';

const net = require('net');
const assert = require('assert');
const awaitEvent = require('await-event');
const url = require('url');
const { encoder, decoder, RpcClient, BaseRpcCmd, codec: codecMap, registerAppClazzMap } = require('../lib');
const Connection = require('connection');

describe('test/rpc_client.test.js', () => {
  let client;
  let server;
  let serverClient;

  class Request extends BaseRpcCmd {
    serializeHeader() {}

    serializeContent(byteBuffer) {
      const codec = codecMap[this.codecType];
      codec.encode(byteBuffer, this);
    }

    get className() {
      return 'com.alipay.foo.Request';
    }

    get timeout() {
      return 100;
    }
  }

  class Response extends BaseRpcCmd {
    serializeHeader() {}

    serializeContent(byteBuffer) {
      const codec = codecMap[this.codecType];
      codec.encode(byteBuffer, this);
    }

    get className() {
      return 'com.alipay.foo.Response';
    }

    get timeout() {
      return 100;
    }
  }

  const clazzMap = {
    'com.alipay.foo.Request': {
      hello: { type: 'java.lang.String' },
    },
    'com.alipay.foo.Response': {
      result: { type: 'java.lang.String' },
    },
  };

  beforeEach(async () => {
    registerAppClazzMap(clazzMap);
    const port = 12200;
    server = net.createServer();
    server.listen(port);
    await awaitEvent(server, 'listening');
    const p = awaitEvent(server, 'connection');
    client = new RpcClient({
      logger: console,
      address: url.parse(`tcp://127.0.0.1:${port}`),
    });
    await client.ready();
    const serverSocket = await p;
    serverClient = new Connection({
      logger: console,
      socket: serverSocket,
      protocol: {
        name: 'Bolt',
        encoder,
        decoder,
      },
    });
  });

  afterEach(async () => {
    await client.close();
    await serverClient.close();
    server.close();
    await awaitEvent(server, 'close');
    client = null;
    serverClient = null;
  });

  describe('invoke', () => {
    it('should success', async () => {
      const p = client.invoke(new Request({
        hello: 'hi, server',
      }));
      const req = await serverClient.await('request');
      assert.deepStrictEqual(req.data, {
        hello: 'hi, server',
      });
      assert(req.className === 'com.alipay.foo.Request');
      await serverClient.writeResponse(req, new Response({
        result: 'hi, client',
      }));
      const res = await p;
      assert.deepStrictEqual(res.data, {
        result: 'hi, client',
      });
      assert(res.className === 'com.alipay.foo.Response');
    });
  });

  describe('oneway', () => {
    it('should success', async () => {
      const p = serverClient.await('request');
      client.oneway(new Request({
        hello: 'hi, server',
      }));
      const req = await p;
      assert.deepStrictEqual(req.data, {
        hello: 'hi, server',
      });
      assert(req.className === 'com.alipay.foo.Request');
    });
  });
});
