'use strict';

const EncoderV2 = require('hessian.js-1').EncoderV2;
const DecoderV2 = require('hessian.js-1').DecoderV2;
const appTypeMap = require('./app_type/app_type_map');
const encoder = new EncoderV2({ size: 1 });
const decoder = new DecoderV2();

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
 * @param {Object} options
 *   - {Object} [classCache] - 类定义缓存
 * @return {Object} 反序列化结果
 */
exports.decode = (byteBuffer, className, options) => {
  className = className.trim();
  decoder.byteBuffer = byteBuffer;
  decoder.refMap = {};
  decoder.refId = 0;
  decoder.types = [];
  decoder.classes = [];
  decoder.classCache = options && options.classCache;

  const handler = appTypeMap[className];
  if (handler) {
    return handler.decode(decoder);
  }
  return decoder.read();
};
