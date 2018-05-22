'use strict';

const EncoderV1 = require('hessian.js-1').EncoderV1;
const DecoderV1 = require('hessian.js-1').DecoderV1;
const appTypeMap = require('./app_type/app_type_map');
const encoder = new EncoderV1({ size: 1 });
const decoder = new DecoderV1();

const originByteBuffer = encoder.byteBuffer;

/**
 * 编码
 * @param {ByteBuffer} byteBuffer - the byte buffer
 * @param {RpcCommand} cmd - the rpcCommand
 * @return {void}
 */
exports.encode = (byteBuffer, cmd) => {
  const className = cmd.className;

  encoder.byteBuffer = originByteBuffer;
  encoder.reset();
  encoder.byteBuffer = byteBuffer;

  appTypeMap[className].encode(cmd, encoder);
};

/**
 * 解码
 * @param {ByteBuffer} byteBuffer - the byte buffer
 * @param {String} className - the class name
 * @return {Object} 反序列化结果
 */
exports.decode = (byteBuffer, className) => {
  decoder.byteBuffer = byteBuffer;
  decoder.refMap = {};
  decoder.refId = 0;
  const handler = appTypeMap[className];
  if (handler) {
    return handler.decode(decoder);
  }
  return decoder.read();
};
