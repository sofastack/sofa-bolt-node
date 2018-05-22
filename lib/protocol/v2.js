'use strict';

const utils = require('../utils');
const Constants = require('./const');
const CommandCode = require('./enum/cmd_code');
const RpcCommandType = require('./enum/rpc_type');
const RpcRequestCommand = require('./rpc_req_cmd');
const RpcResponseCommand = require('./rpc_res_cmd');
const byteBuffer = require('../shared_byte_buffer');

const protocolType = 'bolt2';

/**
 * Request command protocol for v2
 * 0     1     2           4           6           8          10     11     12          14         16
 * +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+------+-----+-----+-----+-----+
 * |proto| ver1|type | cmdcode   |ver2 |   requestId           |codec|switch|   timeout             |
 * +-----------+-----------+-----------+-----------+-----------+------------+-----------+-----------+
 * |classLen   |headerLen  |contentLen             |           ...                                  |
 * +-----------+-----------+-----------+-----------+                                                +
 * |               className + header  + content  bytes                                             |
 * +                                                                                                +
 * |                               ... ...                                  | CRC32(optional)       |
 * +------------------------------------------------------------------------------------------------+
 *
 * proto: code for protocol
 * ver1: version for protocol
 * type: request/response/request oneway
 * cmdcode: code for remoting command
 * ver2:version for remoting command
 * requestId: id of request
 * codec: code for codec
 * switch: function switch for protocol
 * headerLen: length of header
 * contentLen: length of content
 * CRC32: CRC32 of the frame(Exists when ver1 > 1)
 *
 * Response command protocol for v2
 * 0     1     2     3     4           6           8          10     11    12          14          16
 * +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+------+-----+-----+-----+-----+
 * |proto| ver1| type| cmdcode   |ver2 |   requestId           |codec|switch|respstatus |  classLen |
 * +-----------+-----------+-----------+-----------+-----------+------------+-----------+-----------+
 * |headerLen  | contentLen            |                      ...                                   |
 * +-----------------------------------+                                                            +
 * |               className + header  + content  bytes                                             |
 * +                                                                                                +
 * |                               ... ...                                  | CRC32(optional)       |
 * +------------------------------------------------------------------------------------------------+
 *
 * @author jiangping
 * @version $Id: RpcProtocol.java, v 0.1 2015年9月28日 下午7:04:04 tao Exp $
 *
 * @param {Object} obj - obj
 * @param {Object} options - options
 * @return {Buffer} buf
 */
exports.encode = (obj, options) => {
  const crcEnable = options.crcEnable;

  byteBuffer.reset();
  byteBuffer.put(0x02); // bp=0x02
  byteBuffer.put(options.boltVersion);
  byteBuffer.put(options.rpcType);
  byteBuffer.putShort(options.cmdCode);
  byteBuffer.put(0x01);
  byteBuffer.putInt(options.id);
  byteBuffer.put(Constants.codecName2Code[options.codecType]);
  byteBuffer.put(crcEnable ? 0x01 : 0x00);

  if (options.rpcType === RpcCommandType.RESPONSE) {
    byteBuffer.putShort(obj.responseStatus);
  } else {
    byteBuffer.putInt(obj.timeout);
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

  // 如果开启 crc 校验，需要计算 packet 的 crc32 值 append 在最后
  if (crcEnable) {
    const frame = byteBuffer._bytes.slice(0, byteBuffer.position());
    byteBuffer.putInt(utils.crc32(frame));
  }
  return byteBuffer.array();
};

exports.decode = (io, options = {}) => {
  const boltVersion = io.get();
  const rpcType = io.get();
  const cmdCode = io.getShort();
  io.skip(1); // ver2
  const packetId = io.getInt();
  const codecType = Constants.codecCode2Name[io.get()];
  const crcEnable = io.get() === 0x01;

  if (crcEnable) {
    const packetLen = io.limit() - 4;
    const frame = io._bytes.slice(0, packetLen);
    const crcValue = io._bytes.readInt32BE(packetLen);
    if (utils.crc32(frame) !== crcValue) {
      throw new Error('CRC check failed!');
    }
  }

  const ctx = {
    packetId,
    codecType,
    classMap: options.classMap,
    proto: options.proto,
    sentReqs: options.sentReqs,
  };

  // response
  if (rpcType === RpcCommandType.RESPONSE) {
    if (cmdCode === CommandCode.HEARTBEAT_VALUE) {
      return { packetId, packetType: 'heartbeat_ack', options: { protocolType, boltVersion, codecType, crcEnable }, meta: null };
    }
    const ret = RpcResponseCommand.decode(io, ctx);
    return {
      packetId,
      packetType: 'response',
      data: ret.data,
      className: ret.className,
      options: {
        protocolType,
        boltVersion,
        codecType,
        crcEnable,
      },
      meta: null,
    };
  }

  // request
  const timeout = io.getInt();
  if (cmdCode === CommandCode.HEARTBEAT_VALUE) {
    return { packetId, packetType: 'heartbeat', options: { protocolType, boltVersion, codecType, timeout, crcEnable }, meta: null };
  }
  const ret = RpcRequestCommand.decode(io, ctx);
  return {
    packetId,
    packetType: 'request',
    data: ret.data,
    className: ret.className,
    options: {
      protocolType,
      boltVersion,
      codecType,
      timeout,
      crcEnable,
      proto: options.proto,
      classMap: options.classMap,
    },
    meta: null,
  };
};
