'use strict';

const { v3, v4 } = require('sofa-hessian-node');

const encoder_v3 = new v3.Encoder({ size: 1 });
const decoder_v3 = new v3.Decoder();
const encoder_v4 = new v4.Encoder({ size: 1 });
const decoder_v4 = new v4.Decoder();

// 默认为 hessian 3.0
let version = '3.0';

exports.getEncoder = () => {
  return version === '3.0' ? encoder_v3 : encoder_v4;
};

exports.getDecoder = () => {
  return version === '3.0' ? decoder_v3 : decoder_v4;
};


exports.compile = (...args) => {
  if (version === '3.0') {
    return v3.compile(...args);
  }
  return v4.compile(...args);
};

exports.setVersion = ver => {
  version = ver;
};
