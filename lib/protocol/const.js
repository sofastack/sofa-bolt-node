'use strict';

const ResponseStatus = require('./enum/response_status');

// 序列化相关
exports.codecName2Code = {
  hessian2: 1,
  protobuf: 11,
};

exports.codecCode2Name = {
  1: 'hessian2',
  11: 'protobuf',
};

exports.clazzBufMap = {
  'com.alipay.sofa.rpc.core.request.SofaRequest': Buffer.from('com.alipay.sofa.rpc.core.request.SofaRequest'),
  'com.alipay.sofa.rpc.core.response.SofaResponse': Buffer.from('com.alipay.sofa.rpc.core.response.SofaResponse'),
};

exports.errorMessages = {
  [ResponseStatus.TIMEOUT]: 'Invoke timeout when invoke with callback.',
  [ResponseStatus.CONNECTION_CLOSED]: 'Connection closed when invoke with callback.',
  [ResponseStatus.SERVER_THREADPOOL_BUSY]: 'Server thread pool busy when invoke with callback.',
};
