'use strict';

const protocol = require('./protocol');
const Writable = require('stream').Writable;
const RpcCommandType = require('./protocol/enum/rpc_type');

const packetLengthFns = {
  1(buf, bufLength) {
    const type = buf[1];
    const headerLength = type === RpcCommandType.RESPONSE ? 20 : 22;
    if (bufLength < headerLength) {
      return 0;
    }
    return type === RpcCommandType.RESPONSE ?
      headerLength + buf.readInt16BE(12) + buf.readInt16BE(14) + buf.readInt32BE(16) :
      headerLength + buf.readInt16BE(14) + buf.readInt16BE(16) + buf.readInt32BE(18);
  },
  2(buf, bufLength) {
    const type = buf[2];
    const headerLength = type === RpcCommandType.RESPONSE ? 22 : 24;
    if (bufLength < headerLength) {
      return 0;
    }
    let len = type === RpcCommandType.RESPONSE ?
      headerLength + buf.readInt16BE(14) + buf.readInt16BE(16) + buf.readInt32BE(18) :
      headerLength + buf.readInt16BE(16) + buf.readInt16BE(18) + buf.readInt32BE(20);
    // 如果 crc 校验开启，还需要加 4 bytes
    if (buf[11] === 0x01) {
      len += 4;
    }
    return len;
  },
};

class ProtocolDecoder extends Writable {
  constructor(options = {}) {
    super(options);
    this._buf = null;
    this.options = options;
  }

  _write(chunk, encoding, callback) {
    // 合并 buf 中的数据
    this._buf = this._buf ? Buffer.concat([ this._buf, chunk ]) : chunk;
    try {
      let unfinish = false;
      do {
        unfinish = this._decode();
      } while (unfinish);
      callback();
    } catch (err) {
      err.name = 'BoltDecodeError';
      err.data = this._buf ? this._buf.toString('base64') : '';
      callback(err);
    }
  }

  _decode() {
    const version = this._buf[0]; // 第一位标记协议
    const bufLength = this._buf.length;
    const getPacketLength = packetLengthFns[version];
    if (!getPacketLength) {
      const err = new Error('[sofa-bolt-node] Unknown protocol type:' + version);
      throw err;
    }
    const packetLength = getPacketLength(this._buf, bufLength);
    if (packetLength === 0 || bufLength < packetLength) {
      return false;
    }
    const packet = this._buf.slice(0, packetLength);
    // 调用反序列化方法获取对象
    const obj = protocol.decode(packet, this.options);
    this.emit(obj.packetType, obj);
    const restLen = bufLength - packetLength;
    if (restLen) {
      this._buf = this._buf.slice(packetLength);
      return true;
    }
    this._buf = null;
    return false;
  }

  _destroy(err, callback) {
    this._buf = null;
    callback(err);
  }
}

module.exports = ProtocolDecoder;
