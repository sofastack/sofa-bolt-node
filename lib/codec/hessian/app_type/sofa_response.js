'use strict';

const compile = require('sofa-hessian-node').compile;
const builtInClassMap = require('./builtin_class_map');

const encodeSofaResponseMap = {
  hessian2: compile({
    type: 'com.alipay.sofa.rpc.core.response.SofaResponse',
  }, '2.0', builtInClassMap),
};

exports.encode = (target, encoder) => {
  const codecType = target.codecType;
  encodeSofaResponseMap[codecType](target.obj, encoder, target.classMap);
};

exports.decode = decoder => {
  const result = decoder.read();
  let appResponse;
  let responseProps;
  let error = null;
  if (typeof result === 'string') {
    error = new Error(result);
    error.stack = '';
    return { error, appResponse, responseProps };
  }
  if (result instanceof Error) {
    error = result;
    return { error, appResponse, responseProps };
  }
  appResponse = result.appResponse;
  responseProps = result.responseProps;
  if (appResponse instanceof Error) {
    error = appResponse;
    appResponse = null;
  } else if (result.isError) {
    error = new Error(result.errorMsg);
    error.stack = '';
  }
  return { error, appResponse, responseProps };
};
