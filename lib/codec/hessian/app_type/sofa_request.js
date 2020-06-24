'use strict';

const utils = require('../../../utils');
const { compile } = require('../hessian');
const builtInClassMap = require('./builtin_class_map');

exports.encode = (target, encoder) => {
  const req = target.obj;
  const classMap = target.classMap;
  const codecType = target.codecType;

  const methodArgSigs = [];
  const methodArgs = req.args;
  const methodLength = methodArgs.length;
  for (let i = 0; i < methodLength; i++) {
    methodArgSigs.push(utils.getJavaClassname(methodArgs[i]));
  }
  // encode SofaRequest
  compile({
    type: 'com.alipay.sofa.rpc.core.request.SofaRequest',
  }, '2.0', builtInClassMap)({
    targetAppName: req.targetAppName,
    methodName: req.methodName,
    methodArgSigs,
    targetServiceUniqueName: req.serverSignature,
    requestProps: req.requestProps,
  }, encoder);

  // encode methodArgs
  if (!classMap) {
    utils.writeMethodArgs(methodArgs, encoder);
  } else {
    const version = codecType === 'hessian' ? '1.0' : '2.0';
    for (let i = 0; i < methodLength; i++) {
      const arg = methodArgs[i];
      if (arg && arg.$class) {
        compile(arg, version, classMap)(arg.$, encoder);
      } else {
        encoder.write(arg);
      }
    }
  }
};

exports.decode = decoder => {
  const reqObj = decoder.readObject();
  const req = {
    targetAppName: reqObj.targetAppName,
    methodName: reqObj.methodName,
    serverSignature: reqObj.targetServiceUniqueName,
    args: [],
    methodArgSigs: reqObj.methodArgSigs,
    requestProps: reqObj.requestProps,
  };
  if (!reqObj.methodArgSigs || !reqObj.methodArgSigs.length) {
    return req;
  }
  for (let i = 0; i < reqObj.methodArgSigs.length; i++) {
    req.args.push(decoder.read());
  }
  return req;
};
