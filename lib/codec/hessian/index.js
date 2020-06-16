'use strict';

const appTypeMap = require('./app_type/app_type_map');
const { compile, getEncoder, getDecoder, setVersion } = require('./hessian');

/**
 * 编码
 * @param {ByteBuffer} byteBuffer - the byte buffer
 * @param {RpcCommand} cmd - the rpcCommand
 * @return {void}
 */
exports.encode = (byteBuffer, cmd) => {
  const encoder = getEncoder();
  const className = cmd.className;
  const originByteBuffer = encoder.byteBuffer;

  encoder.byteBuffer = originByteBuffer;
  encoder.reset();
  encoder.byteBuffer = byteBuffer;

  appTypeMap[className].encode(cmd, encoder);
  encoder.byteBuffer = originByteBuffer;
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
  const decoder = getDecoder();
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

exports.setVersion = setVersion;
exports.compile = compile;
