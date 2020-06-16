'use strict';

const assert = require('assert');
const ProtocolEncoder = require('./encoder');
const ProtocolDecoder = require('./decoder');
const { compile, setVersion } = require('./codec/hessian');
const builtinClazzMap = require('./codec/hessian/app_type/builtin_class_map');
const appTypeMap = require('./codec/hessian/app_type/app_type_map');
exports.BaseRpcCmd = require('./protocol/rpc_cmd');
exports.codec = require('./codec');

const globalOptions = {};

exports.setOptions = (options = {}) => {
  if (options.hessianVersion) {
    setVersion(options.hessianVersion);
  }
  Object.assign(globalOptions, options);
};

exports.decoder = options => {
  return new ProtocolDecoder(Object.assign({}, globalOptions, options));
};

exports.encoder = options => {
  return new ProtocolEncoder(Object.assign({}, globalOptions, options));
};

exports.registerAppClazzMap = function(clazzMap) {
  assert(clazzMap, 'clazzMap is required');
  const clazzs = Object.keys(clazzMap);
  Object.assign(builtinClazzMap, clazzMap);
  for (const clazz of clazzs) {
    appTypeMap[clazz] = {
      encode(target, encoder) {
        compile({ type: clazz }, '2.0', builtinClazzMap)(target.obj, encoder);
      },
      decode(decoder) {
        return decoder.readObject();
      },
    };
  }
};

exports.setHessianVersion = setVersion;

exports.RpcClient = require('./rpc_client');
