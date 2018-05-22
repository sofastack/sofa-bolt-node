'use strict';

const assert = require('assert');
const SimpleMapSerializer = require('../lib/simple_map_serializer');

describe('test/simple_map_serializer.test.js', () => {
  it('should encode ok', () => {
    let buf = SimpleMapSerializer.encode({ foo: 'bar' });
    assert.deepEqual(buf, new Buffer('AAAAA2ZvbwAAAANiYXI=', 'base64'));
    buf = SimpleMapSerializer.encode({ a: 'a', b: 'b', c: 'c' });
    assert.deepEqual(buf, new Buffer('AAAAAWEAAAABYQAAAAFiAAAAAWIAAAABYwAAAAFj', 'base64'));
    buf = SimpleMapSerializer.encode({ '': '123' });
    assert.deepEqual(buf, new Buffer('AAAAAAAAAAMxMjM=', 'base64'));
    buf = SimpleMapSerializer.encode({ 123: '' });
    assert.deepEqual(buf, new Buffer('AAAAAzEyMwAAAAA=', 'base64'));
  });

  it('should decode ok', () => {
    const map = {
      service: 'com.alipay.remoting.rpc.test.ProtoService:1.0:bolt',
      'rpc_trace_context.sofaRpcId': '0',
      'rpc_trace_context.sofaTraceId': '0a0fe9d41488955146071100140705',
      'rpc_trace_context.sofaCallerIp': '10.15.233.212',
      'rpc_trace_context.sysPenAttrs': '',
      'rpc_trace_context.sofaPenAttrs': '',
      'rpc_trace_context.sofaCallerApp': 'test',
      sofa_head_method_name: 'echoStr',
      sofa_head_target_app: 'test',
      sofa_head_target_service: 'com.alipay.remoting.rpc.test.ProtoService:1.0:bolt',
    };
    const buf = SimpleMapSerializer.encode(map);
    assert.deepEqual(SimpleMapSerializer.decode(buf), map);

    assert(SimpleMapSerializer.decode(null) === null);
    assert(SimpleMapSerializer.decode(new Buffer(0)) === null);
  });
});
