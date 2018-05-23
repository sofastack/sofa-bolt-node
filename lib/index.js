'use strict';

const ProtocolEncoder = require('./encoder');
const ProtocolDecoder = require('./decoder');

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
