'use strict';

const v1 = require('./v1');
const v2 = require('./v2');
const ByteBuffer = require('byte');
const CommandCode = require('./enum/cmd_code');
const RpcCommandType = require('./enum/rpc_type');
const RpcRequestCommand = require('./rpc_req_cmd');
const RpcResponseCommand = require('./rpc_res_cmd');
const HeartbeatCommand = require('./heartbeat_cmd');
const HeartbeatAckCommand = require('./heartbeat_ack_cmd');

exports.requestEncode = (id, req, options) => {
  let cmd;
  if (req.className) {
    cmd = req;
    cmd.options = options;
  } else {
    cmd = new RpcRequestCommand(req, options);
  }
  return exports.encode(cmd, {
    protocolType: options.protocolType,
    rpcType: req.oneway ? RpcCommandType.REQUEST_ONEWAY : RpcCommandType.REQUEST,
    cmdCode: CommandCode.RPC_REQUEST,
    codecType: options.codecType,
    boltVersion: Number(options.boltVersion),
    crcEnable: !!options.crcEnable,
    id,
  });
};

exports.responseEncode = (id, res, options) => {
  let cmd;
  if (res.className) {
    cmd = res;
    cmd.options = options;
  } else {
    cmd = new RpcResponseCommand(res, options);
  }
  return exports.encode(cmd, {
    protocolType: options.protocolType,
    rpcType: RpcCommandType.RESPONSE,
    cmdCode: CommandCode.RPC_RESPONSE,
    codecType: options.codecType,
    boltVersion: Number(options.boltVersion),
    crcEnable: !!options.crcEnable,
    id,
  });
};

exports.heartbeatEncode = (id, hb, options) => {
  return exports.encode(new HeartbeatCommand(hb, options), {
    protocolType: options.protocolType,
    rpcType: RpcCommandType.REQUEST,
    cmdCode: CommandCode.HEARTBEAT_VALUE,
    codecType: options.codecType,
    boltVersion: Number(options.boltVersion),
    crcEnable: !!options.crcEnable,
    id,
  });
};

exports.heartbeatAckEncode = (id, options) => {
  return exports.encode(new HeartbeatAckCommand(null, options), {
    protocolType: options.protocolType,
    rpcType: RpcCommandType.RESPONSE,
    cmdCode: CommandCode.HEARTBEAT_VALUE,
    codecType: options.codecType,
    boltVersion: Number(options.boltVersion),
    crcEnable: !!options.crcEnable,
    id,
  });
};

exports.encode = (cmd, options) => {
  // CE 1.3.0之前的bolt：bp=1，没有bv
  // CE 1.3.0开始：
  // bp=2，bv=1 等同于老的bp=1
  // bp=2，bv=2 是带了crc的新协议。
  //
  // 以后如果协议有变更，bp不会变，一直用2。增加bv，比如bp=2,bv=3。
  if (options.protocolType === 'bolt2') {
    return v2.encode(cmd, options);
  }
  return v1.encode(cmd, options);
};


const byteBuffer = new ByteBuffer({ size: 1 });

/**
 * 反序列化
 * @param {ByteBuffer} buf - 二进制
 * @param {Object}  options
 *   - {Map} reqs - 请求集合
 *   - {Object} [classCache] - 类定义缓存
 * @return {Object} 反序列化后的对象
 */
exports.decode = (buf, options) => {
  const start = Date.now();
  const bufLength = buf.length;
  byteBuffer._bytes = buf;
  byteBuffer._limit = bufLength;
  byteBuffer._size = bufLength;
  byteBuffer._offset = 0;
  const boltCode = byteBuffer.get();
  const ret = boltCode === 0x2 ? v2.decode(byteBuffer, options) : v1.decode(byteBuffer, options);
  ret.meta = {
    size: bufLength,
    start,
    rt: Date.now() - start,
  };
  return ret;
};
