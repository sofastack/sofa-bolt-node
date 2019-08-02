'use strict';

const assert = require('assert');
const ProtocolEncoder = require('./encoder');
const ProtocolDecoder = require('./decoder');
const compile = require('sofa-hessian-node').compile;
const builtinClazzMap = require('./codec/hessian/app_type/builtin_class_map');
const appTypeMap = require('./codec/hessian/app_type/app_type_map');
exports.BaseRpcCmd = require('./protocol/rpc_cmd');
exports.codec = require('./codec');

const globalOptions = {};

exports.setOptions = options => {
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
    const encodeMap = {
      hessian: compile({ type: clazz }, '1.0', builtinClazzMap),
      hessian2: compile({ type: clazz }, '2.0', builtinClazzMap),
    };

    appTypeMap[clazz] = {
      encode: (target, encoder) => {
        encodeMap[ target.codecType ](target.obj, encoder);
      },
      decode: decoder => {
        return decoder.readObject();
      },
    };
  }
};

exports.RpcClient = require('./rpc_client');
