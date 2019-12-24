'use strict';

const Constants = require('./const');
const CommandCode = require('./enum/cmd_code');
const RpcCommandType = require('./enum/rpc_type');
const RpcRequestCommand = require('./rpc_req_cmd');
const RpcResponseCommand = require('./rpc_res_cmd');
const byteBuffer = require('../shared_byte_buffer');

const protocolType = 'bolt';
/**
 * Request command protocol for v1
 * 0     1     2           4           6           8          10           12          14         16
 * +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
 * |proto| type| cmdcode   |ver2 |   requestId           |codec|        timeout        |  classLen |
 * +-----------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+
 * |headerLen  | contentLen            |                             ... ...                       |
 * +-----------+-----------+-----------+                                                                                               +
 * |               className + header  + content  bytes                                            |
 * +                                                                                               +
 * |                               ... ...                                                         |
 * +-----------------------------------------------------------------------------------------------+
 *
 * proto: code for protocol
 * type: request/response/request oneway
 * cmdcode: code for remoting command
 * ver2:version for remoting command
 * requestId: id of request
 * codec: code for codec
 * headerLen: length of header
 * contentLen: length of content
 *
 * Response command protocol for v1
 * 0     1     2     3     4           6           8          10           12          14         16
 * +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
 * |proto| type| cmdcode   |ver2 |   requestId           |codec|respstatus |  classLen |headerLen  |
 * +-----------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+
 * | contentLen            |                  ... ...                                              |
 * +-----------------------+                                                                       +
 * |                          header  + content  bytes                                             |
 * +                                                                                               +
 * |                               ... ...                                                         |
 * +-----------------------------------------------------------------------------------------------+
 * respstatus: response status
 *
 * @author jiangping
 * @version $Id: RpcProtocol.java, v 0.1 2015年9月28日 下午7:04:04 tao Exp $
 *
 * @param {Object} obj - obj
 * @param {Object} options - options
 * @return {Buffer} buf
 */
exports.encode = (obj, options) => {
  byteBuffer.reset();
  byteBuffer.put(0x01); // bp=1 代表是 bolt
  byteBuffer.put(options.rpcType);
  byteBuffer.putShort(options.cmdCode);
  byteBuffer.put(0x01);
  byteBuffer.putInt(options.id);
  byteBuffer.put(Constants.codecName2Code[options.codecType]);

  if (options.rpcType === RpcCommandType.RESPONSE) {
    byteBuffer.putShort(obj.responseStatus);
  } else {
    byteBuffer.putInt(obj.timeout || 0);
  }

  const offset = byteBuffer.position();
  byteBuffer.skip(8);

  let start = byteBuffer.position();
  obj.serializeClazz(byteBuffer);
  byteBuffer.putShort(offset, byteBuffer.position() - start);

  start = byteBuffer.position();
  obj.serializeHeader(byteBuffer);
  byteBuffer.putShort(offset + 2, byteBuffer.position() - start);

  start = byteBuffer.position();
  obj.serializeContent(byteBuffer);
  byteBuffer.putInt(offset + 4, byteBuffer.position() - start);
  return byteBuffer.array();
};

/**
 * 解码
 * @param {ByteBuffer} io - 二进制包装
 * @param {Object}  options
 *   - {Object} [proto] - proto
 *   - {Object} [classMap] - classMap
 *   - {Object} [classCache] - 类定义缓存
 *   - {Map} [sentReqs] - 请求集合
 * @return {Object} 反序列化后的对象
 */
exports.decode = (io, options = {}) => {
  const rpcType = io.get();
  const cmdCode = io.getShort();
  io.skip(1); // ver2
  const packetId = io.getInt();
  const codecType = Constants.codecCode2Name[io.get()];

  const ctx = {
    packetId,
    codecType,
    classMap: options.classMap,
    proto: options.proto,
    sentReqs: options.sentReqs,
    classCache: options.classCache,
  };

  // response
  if (rpcType === RpcCommandType.RESPONSE) {
    if (cmdCode === CommandCode.HEARTBEAT_VALUE) {
      return { packetId, packetType: 'heartbeat_ack', options: { protocolType, codecType }, meta: null };
    }
    const ret = RpcResponseCommand.decode(io, ctx);
    return {
      packetId,
      packetType: 'response',
      data: ret.data,
      className: ret.className,
      options: {
        protocolType,
        codecType,
      },
      meta: null,
    };
  }

  // request
  const timeout = io.getInt();
  if (cmdCode === CommandCode.HEARTBEAT_VALUE) {
    return { packetId, packetType: 'heartbeat', options: { protocolType, codecType, timeout }, meta: null };
  }
  const ret = RpcRequestCommand.decode(io, ctx);
  return {
    packetId,
    packetType: 'request',
    data: ret.data,
    className: ret.className,
    options: {
      protocolType,
      codecType,
      timeout,
      proto: options.proto,
      classMap: options.classMap,
    },
    meta: null,
  };
};
