'use strict';

const path = require('path');
const antpb = require('antpb');
const assert = require('assert');
const utils = require('../lib/utils');

describe('test/utils.test.js', () => {
  it('should get nextId ok', () => {
    const id = utils.nextId();
    assert(id > 0);
    assert(utils.nextId() === id + 1);
    utils.id = Math.pow(2, 30) - 1;
    assert(utils.nextId() === 1);
  });

  it('should crc32 ok', () => {
    let v = utils.crc32(Buffer.from('hello'));
    assert(v === 907060870);

    v = utils.crc32(Buffer.from('4FB9636F6D2E616C697061792E736F66612E7270632E717569636B73746172742E54657374244572726F72940D64657461696C4D6573736167650563617573650A737461636B54726163651473757070726573736564457863657074696F6E736F90076D6573736167654A005674001C5B6A6176612E6C616E672E537461636B5472616365456C656D656E746E014FAB6A6176612E6C616E672E537461636B5472616365456C656D656E74940E6465636C6172696E67436C6173730A6D6574686F644E616D650866696C654E616D650A6C696E654E756D6265726F91530023636F6D2E616C697061792E736F66612E7270632E717569636B73746172742E54657374046D61696E09546573742E6A617661AE7A567400326A6176612E7574696C2E436F6C6C656374696F6E7324556E6D6F6469666961626C6552616E646F6D4163636573734C6973746E007A', 'hex'));
    assert(v === 903305630);
  });

  it('should getMethodInfo ok', () => {
    const dir = path.join(__dirname, 'fixtures', 'proto');
    const proto = antpb.loadAll(dir);

    const methodInfo = utils.getMethodInfo(proto, 'com.alipay.test.service.ProtoService', 'echoObj');
    assert(methodInfo.type === 'rpc');
    assert(methodInfo.requestType === 'EchoRequest');
    assert(methodInfo.responseType === 'EchoResponse');
    assert(methodInfo.resolvedRequestType && methodInfo.resolvedResponseType);

    const methodInfo2 = utils.getMethodInfo(proto, 'com.alipay.test.service.ProtoService', 'echoObj');
    assert(methodInfo2 === methodInfo);

    assert.throws(() => {
      utils.getMethodInfo(proto, 'com.alipay.test.service.ProtoService2', 'echoObj');
    }, null, 'no such Service \'com.alipay.test.service.ProtoService2\' in Root');
    assert.throws(() => {
      utils.getMethodInfo(proto, 'com.alipay.test.service.ProtoService', 'echoObj2');
    }, null, 'no such Method \'echoObj2\' in Service \'com.alipay.test.service.ProtoService\'');
  });

  it('should getJavaClassname ok', () => {
    assert(utils.getJavaClassname(null) === 'null');
    assert(utils.getJavaClassname(undefined) === 'null');

    assert(utils.getJavaClassname(true) === 'boolean');
    assert(utils.getJavaClassname('123') === 'java.lang.String');
    assert(utils.getJavaClassname(123) === 'int');
    assert(utils.getJavaClassname(5147483648) === 'long');
    assert(utils.getJavaClassname(1.2) === 'double');

    assert(utils.getJavaClassname(new Date()) === 'java.util.Date');
    assert(utils.getJavaClassname(Buffer.from([ 1, 2, 3, 4 ])) === '[B');
    assert(utils.getJavaClassname([ 1, 2, 3, 4 ]) === 'java.util.ArrayList');
    assert(utils.getJavaClassname(new Error('mock error')) === 'java.lang.RuntimeException');
    assert(utils.getJavaClassname({}) === 'java.util.HashMap');

    assert(utils.getJavaClassname({
      $class: 'classname',
      $abstractClass: 'abstractClassName',
      $: {},
    }) === 'abstractClassName');
    assert(utils.getJavaClassname({
      $class: 'classname',
      $: {},
    }) === 'classname');

    assert(utils.getJavaClassname({
      $class: '[short',
      $: [ 1, 2, 3 ],
    }) === '[S');
    assert(utils.getJavaClassname({
      $class: '[int',
      $: [ 1, 2, 3 ],
    }) === '[I');
    assert(utils.getJavaClassname({
      $class: '[boolean',
      $: [ true, false ],
    }) === '[Z');
    assert(utils.getJavaClassname({
      $class: '[double',
      $: [ 1.1, 2.2 ],
    }) === '[D');
    assert(utils.getJavaClassname({
      $class: '[long',
      $: [ 1, 2 ],
    }) === '[J');
    assert(utils.getJavaClassname({
      $class: '[float',
      $: [ 1.2, 2.1 ],
    }) === '[F');
    assert(utils.getJavaClassname({
      $class: '[string',
      $: [ '123', '321' ],
    }) === '[Ljava.lang.String;');
    assert(utils.getJavaClassname({
      $class: '[object',
      $: [],
    }) === '[Ljava.lang.Object;');
    assert(utils.getJavaClassname({
      $class: '[classname',
      $: [],
    }) === '[Lclassname;');
    assert(utils.getJavaClassname({
      $class: 'java.lang.String',
      $: [ '1', '2' ],
      isArray: true,
    }) === '[Ljava.lang.String;');
    assert(utils.getJavaClassname({
      $class: 'java.lang.String',
      $: [
        [ '1', '2' ],
        [ '3', '4' ],
      ],
      isArray: true,
      arrayDepth: 2,
    }) === '[[Ljava.lang.String;');
    assert(utils.getJavaClassname({
      $class: 'byte',
      $: Buffer.from('A'),
      isArray: true,
    }) === '[B');
  });

  it('should flatCopyTo ok', () => {
    const prefix = 'rpc_trace_context.';
    const sourceMap = {
      sofaCallerApp: 'test',
      sofaCallerIp: '10.10.10.10',
      sofaPenAttrs: '',
      sofaRpcId: 0,
      sofaTraceId: '0a0fe93f1488349732342100153695',
      sysPenAttrs: '',
      penAttrs: 'Hello=world&',
      foo: {
        bar: 'bar',
      },
    };
    const distMap = {};
    utils.flatCopyTo(prefix, sourceMap, distMap);

    assert.deepEqual(distMap, {
      'rpc_trace_context.sofaCallerApp': 'test',
      'rpc_trace_context.sofaCallerIp': '10.10.10.10',
      'rpc_trace_context.sofaPenAttrs': '',
      'rpc_trace_context.sofaRpcId': '0',
      'rpc_trace_context.sofaTraceId': '0a0fe93f1488349732342100153695',
      'rpc_trace_context.sysPenAttrs': '',
      'rpc_trace_context.penAttrs': 'Hello=world&',
      'rpc_trace_context.foo.bar': 'bar',
    });
  });

  it('should treeCopyTo ok', () => {
    const prefix = 'rpc_trace_context.';
    const sourceMap = {
      'rpc_trace_context.sofaCallerApp': 'test',
      'rpc_trace_context.sofaCallerIp': '10.10.10.10',
      'rpc_trace_context.sofaPenAttrs': '',
      'rpc_trace_context.sofaRpcId': '0',
      'rpc_trace_context.sofaTraceId': '0a0fe93f1488349732342100153695',
      'rpc_trace_context.sysPenAttrs': '',
      'rpc_trace_context.penAttrs': 'Hello=world&',
      'xxx.yyy': 'bar',
    };
    const distMap = {};
    utils.treeCopyTo(prefix, sourceMap, distMap);
    assert.deepEqual(distMap, {
      sofaCallerApp: 'test',
      sofaCallerIp: '10.10.10.10',
      sofaPenAttrs: '',
      sofaRpcId: '0',
      sofaTraceId: '0a0fe93f1488349732342100153695',
      sysPenAttrs: '',
      penAttrs: 'Hello=world&',
    });

    assert.deepEqual(sourceMap, {
      'rpc_trace_context.sofaCallerApp': 'test',
      'rpc_trace_context.sofaCallerIp': '10.10.10.10',
      'rpc_trace_context.sofaPenAttrs': '',
      'rpc_trace_context.sofaRpcId': '0',
      'rpc_trace_context.sofaTraceId': '0a0fe93f1488349732342100153695',
      'rpc_trace_context.sysPenAttrs': '',
      'rpc_trace_context.penAttrs': 'Hello=world&',
      'xxx.yyy': 'bar',
    });

    const distMap2 = {};
    utils.treeCopyTo(prefix, sourceMap, distMap2, true);
    assert.deepEqual(distMap2, {
      sofaCallerApp: 'test',
      sofaCallerIp: '10.10.10.10',
      sofaPenAttrs: '',
      sofaRpcId: '0',
      sofaTraceId: '0a0fe93f1488349732342100153695',
      sysPenAttrs: '',
      penAttrs: 'Hello=world&',
    });

    assert.deepEqual(sourceMap, {
      'xxx.yyy': 'bar',
    });
  });
});
