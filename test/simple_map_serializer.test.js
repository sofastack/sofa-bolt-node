'use strict';

const assert = require('assert');
const SimpleMapSerializer = require('../lib/simple_map_serializer');

describe('test/simple_map_serializer.test.js', () => {
  it('should encode ok', () => {
    let buf = SimpleMapSerializer.encode({ foo: 'bar' });
    assert.deepEqual(buf, Buffer.from('AAAAA2ZvbwAAAANiYXI=', 'base64'));
    buf = SimpleMapSerializer.encode({ a: 'a', b: 'b', c: 'c' });
    assert.deepEqual(buf, Buffer.from('AAAAAWEAAAABYQAAAAFiAAAAAWIAAAABYwAAAAFj', 'base64'));
    buf = SimpleMapSerializer.encode({ '': '123' });
    assert.deepEqual(buf, Buffer.from('AAAAAAAAAAMxMjM=', 'base64'));
    buf = SimpleMapSerializer.encode({ 123: '' });
    assert.deepEqual(buf, Buffer.from('AAAAAzEyMwAAAAA=', 'base64'));
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
    assert(SimpleMapSerializer.decode(Buffer.alloc(0)) === null);
  });

  it('should decode null ok', () => {
    const buf = Buffer.from('00000018736f66615f686561645f7461726765745f736572766963650000002d636f6d2e616c697061792e736f66612e7270632e70726f746f6275662e50726f746f536572766963653a312e300000001b7270635f74726163655f636f6e746578742e736f6661527063496400000001300000001d7270635f74726163655f636f6e746578742e736f6661547261636549640000001e3165323730646638313532383439313930313139373130353732363835320000001f7270635f74726163655f636f6e746578742e736f666143616c6c6572496463000000000000001e7270635f74726163655f636f6e746578742e736f666143616c6c65724970000000000000001e7270635f74726163655f636f6e746578742e736f666150656e417474727300000000000000207270635f74726163655f636f6e746578742e736f666143616c6c65725a6f6e650000000000000014736f66615f686561645f7461726765745f617070ffffffff0000000870726f746f636f6c00000004626f6c7400000007736572766963650000002d636f6d2e616c697061792e736f66612e7270632e70726f746f6275662e50726f746f536572766963653a312e300000001d7270635f74726163655f636f6e746578742e73797350656e4174747273000000000000001f7270635f74726163655f636f6e746578742e736f666143616c6c65724170700000000000000015736f66615f686561645f6d6574686f645f6e616d65000000076563686f4f626a', 'hex');
    const map = SimpleMapSerializer.decode(buf);

    assert.deepEqual(map, {
      sofa_head_target_service: 'com.alipay.sofa.rpc.protobuf.ProtoService:1.0',
      'rpc_trace_context.sofaRpcId': '0',
      'rpc_trace_context.sofaTraceId': '1e270df81528491901197105726852',
      'rpc_trace_context.sofaCallerIdc': '',
      'rpc_trace_context.sofaCallerIp': '',
      'rpc_trace_context.sofaPenAttrs': '',
      'rpc_trace_context.sofaCallerZone': '',
      sofa_head_target_app: null,
      protocol: 'bolt',
      service: 'com.alipay.sofa.rpc.protobuf.ProtoService:1.0',
      'rpc_trace_context.sysPenAttrs': '',
      'rpc_trace_context.sofaCallerApp': '',
      sofa_head_method_name: 'echoObj',
    });

    assert.deepEqual(SimpleMapSerializer.encode(map), buf);
  });
});
