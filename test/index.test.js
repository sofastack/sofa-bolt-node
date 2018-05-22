'use strict';

const protocol = require('..');
const assert = require('assert');
const awaitEvent = require('await-event');
const PassThrough = require('stream').PassThrough;
const classMap = require('./fixtures/class_map');

describe('test/index.test.js', () => {
  const obj = {
    b: true,
    name: 'testname',
    field: 'xxxxx',
    testObj2: { name: 'xxx', finalField: 'xxx' },
    testEnum: { name: 'B' },
    testEnum2: [{ name: 'B' }, { name: 'C' }],
    bs: new Buffer([ 0x02, 0x00, 0x01, 0x07 ]),
    list1: [{ name: 'A' }, { name: 'B' }],
    list2: [ 2017, 2016 ],
    list3: [{ name: 'aaa', finalField: 'xxx' },
      { name: 'bbb', finalField: 'xxx' },
    ],
    list4: [ 'xxx', 'yyy' ],
    list5: [ new Buffer([ 0x02, 0x00, 0x01, 0x07 ]), new Buffer([ 0x02, 0x00, 0x01, 0x06 ]) ],
    map1: { 2017: { name: 'B' } },
    map2: {
      2107: 2106,
    },
    map3: {},
    map4: { xxx: 'yyy' },
    map5: { 2017: new Buffer([ 0x02, 0x00, 0x01, 0x06 ]) },
  };

  [
    [ 'bolt2', 'hessian2', 2, true ],
    [ 'bolt2', 'hessian2', 2, false ],
    [ 'bolt2', 'hessian2', 1, false ],
    [ 'bolt', 'hessian2', null, null ],
  ].forEach(data => {
    const [ protocolType, codecType, boltVersion, crcEnable ] = data;
    let extra = '';
    if (protocolType === 'bolt2') {
      extra = '+ boltVersion: ' + boltVersion + ' + crcEnable: ' + crcEnable;
    }
    describe(protocolType + ' + ' + codecType + extra, () => {
      it('should encode/decode request / response', async function() {
        const options = {
          sentReqs: new Map(),
          classMap,
        };
        const socket = new PassThrough();
        const encoder = protocol.encoder(options);
        const decoder = protocol.decoder(options);
        encoder.pipe(socket).pipe(decoder);
        encoder.protocolType = protocolType;
        encoder.codecType = codecType;
        encoder.boltVersion = boltVersion;
        encoder.crcEnable = crcEnable;

        let item = await Promise.all([
          awaitEvent(decoder, 'request'),
          new Promise((resolve, reject) => {
            encoder.writeRequest(1, {
              args: [{
                $class: 'com.alipay.test.TestObj',
                $: obj,
              }],
              serverSignature: 'com.alipay.test.TestService:1.0',
              methodName: 'echoObj',
              requestProps: {},
              timeout: 3000,
            }, (err, packet) => { err ? reject(err) : resolve(packet); });
          }),
        ]);
        const req = item[0];
        let input = item[1];

        assert(req.packetId === input.packetId);
        assert(req.packetType === input.packetType);
        assert(req.data && !req.data.targetAppName);
        assert(req.data.methodName === 'echoObj');
        assert(req.data.serverSignature === 'com.alipay.test.TestService:1.0');

        assert(input.meta && Buffer.isBuffer(input.meta.data));
        assert(input.meta.protocolType === protocolType);
        assert(input.meta.codecType === codecType);

        const [ size1, size2 ] = await Promise.all([
          null,
          classMap,
        ].map(async classMap => {
          item = await Promise.all([
            awaitEvent(decoder, 'response'),
            new Promise((resolve, reject) => {
              encoder.writeResponse(req, {
                isError: false,
                appResponse: {
                  $class: 'com.alipay.test.TestObj',
                  $: obj,
                },
                classMap,
              }, (err, packet) => { err ? reject(err) : resolve(packet); });
            }),
          ]);

          const res = item[0];
          input = item[1];

          assert(res.packetId === req.packetId);
          assert(res.packetType === 'response');
          assert(res.data);
          assert(!res.data.error);
          assert.deepEqual(res.data.appResponse, obj);

          assert(input.meta && Buffer.isBuffer(input.meta.data));
          assert(input.meta.protocolType === protocolType);
          assert(input.meta.codecType === codecType);

          return input.meta.size;
        }));

        assert(size1 === size2);
      });
    });
  });
});
