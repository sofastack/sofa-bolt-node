'use strict';

const assert = require('assert');
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// Buffer.concat x 47,095 ops/sec ±1.36% (82 runs sampled)
// no concat x 190,193 ops/sec ±1.09% (89 runs sampled)
// Fastest is no concat

const headers = {
  service: 'com.alipay.foo',
  sofa_head_method_name: 'bar',
  sofa_head_target_app: 'app_name',
  sofa_head_target_service: 'com.alipay.foo',
  'rpc_trace_context.sofaRpcId': '0',
  'rpc_trace_context.sofaTraceId': '73ca1a17a7add98142146174',
  'rpc_trace_context.sofaCallerIp': '127.0.0.1',
  'rpc_trace_context.sysPenAttrs': 'f=t&',
  'rpc_trace_context.sofaPenAttrs': 'f=t&',
  'rpc_trace_context.sofaCallerApp': 'app_name',
  empty_string: '',
  null_val: null,
};

function encode(map) {
  const buffers = [];
  for (const key in map) {
    const keyLengthBuffer = Buffer.alloc(4);
    if (key) {
      const keyBuffer = Buffer.from(key);
      keyLengthBuffer.writeInt32BE(keyBuffer.length);
      buffers.push(keyLengthBuffer);
      buffers.push(keyBuffer);
    } else {
      keyLengthBuffer.writeInt32BE(0);
      buffers.push(keyLengthBuffer);
    }

    const value = map[key];
    const valueLengthBuffer = Buffer.alloc(4);
    if (value) {
      const valueBuffer = Buffer.from(value);
      valueLengthBuffer.writeInt32BE(valueBuffer.length);
      buffers.push(valueLengthBuffer);
      buffers.push(valueBuffer);
    } else {
      // https://github.com/alipay/sofa-rpc/blob/9a014c76d656a9950d231d2430c4119e1b7d73be/extension-impl/remoting-bolt/src/main/java/com/alipay/sofa/rpc/codec/bolt/SimpleMapSerializer.java#L100
      valueLengthBuffer.writeInt32BE(value == null ? -1 : 0);
      buffers.push(valueLengthBuffer);
    }
  }
  return Buffer.concat(buffers);
}

function encodeWithOutConcat(map) {
  let length = 0;
  const keyMap = {};
  for (const key in map) {
    length += 8;
    const lengthObj = {
      keyLength: 0,
      valLength: 0,
    };
    if (key) {
      const keyLength = Buffer.byteLength(key);
      lengthObj.keyLength = keyLength;
      length += keyLength;
    }
    const val = map[key];
    if (val) {
      const valLength = Buffer.byteLength(val);
      lengthObj.valLength = valLength;
      length += valLength;
    }
    keyMap[key] = lengthObj;
  }
  const buf = Buffer.allocUnsafe(length);
  let offset = 0;
  for (const key in map) {
    const { keyLength, valLength } = keyMap[key];
    buf.writeInt32BE(keyLength, offset);
    offset += 4;
    if (key) {
      buf.write(key, offset, keyLength);
      offset += keyLength;
    }
    if (!valLength) {
      // https://github.com/alipay/sofa-rpc/blob/9a014c76d656a9950d231d2430c4119e1b7d73be/extension-impl/remoting-bolt/src/main/java/com/alipay/sofa/rpc/codec/bolt/SimpleMapSerializer.java#L100
      buf.writeInt32BE(map[key] == null ? -1 : 0, offset);
      offset += 4;
    } else {
      buf.writeInt32BE(valLength, offset);
      offset += 4;
      buf.write(map[key], offset, valLength);
      offset += valLength;
    }
  }
  return buf;
}

const buf1 = encode(headers);
const buf2 = encodeWithOutConcat(headers);

assert.deepStrictEqual(buf1, buf2);

// add tests
suite.add('Buffer.concat', function() {
  encode(headers);
})
  .add('no concat', function() {
    encodeWithOutConcat(headers);
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // run async
  .run({ async: true });
