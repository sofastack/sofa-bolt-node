'use strict';

const protocol = require('./protocol');
const Transform = require('stream').Transform;
const noop = require('utility').noop;

class ProtocolEncoder extends Transform {
  /**
   * 协议编码器
   *
   * @param {Object} options
   *   - {Map} sentReqs - 请求集合 <id, ...>
   *   - {Map} classCache - 类定义缓存
   *   - {Object} classMap - 针对 hessian 序列化的 schema
   *   - {URL} [address] - TCP socket 地址
   * @class
   */
  constructor(options = {}) {
    super(options);
    this.options = options;

    let codecType = 'hessian2';
    if (options.codecType) {
      codecType = options.codecType;
    } else if (options.address && options.address.query && options.address.query.serialization) {
      codecType = options.address.query.serialization;
    }
    this.encodeOptions = {
      protocolType: 'bolt',
      codecType,
      boltVersion: 1,
      crcEnable: false,
      proto: options.proto,
      classMap: options.classMap,
      classCache: options.classCache,
    };
    this.sentReqs = options.sentReqs;

    this._limited = false;
    this._queue = [];
    this.once('close', () => { this._queue = []; });
    this.on('drain', () => {
      this._limited = false;
      do {
        const item = this._queue.shift();
        if (!item) break;

        const packet = item[0];
        const callback = item[1];
        // 对于 rpc 请求，如果已经超时，则不需要再写入了
        if (packet.packetType === 'request' && (Date.now() - packet.meta.start) >= packet.req.timeout) {
          continue;
        }
        this._writePacket(packet, callback);
      } while (!this._limited);
    });
  }

  get protocol() {
    return protocol;
  }

  get protocolType() {
    return this.encodeOptions.protocolType;
  }

  set protocolType(val) {
    this.encodeOptions.protocolType = val;
  }

  get codecType() {
    return this.encodeOptions.codecType;
  }

  set codecType(val) {
    this.encodeOptions.codecType = val;
  }

  get boltVersion() {
    return this.encodeOptions.boltVersion;
  }

  set boltVersion(val) {
    this.encodeOptions.boltVersion = val;
  }

  get crcEnable() {
    return this.encodeOptions.crcEnable;
  }

  set crcEnable(val) {
    this.encodeOptions.crcEnable = val;
  }

  writeRequest(id, req, callback) {
    this._writePacket({
      packetId: id,
      packetType: 'request',
      req,
      meta: this._createMeta(this.encodeOptions),
    }, callback);
  }

  writeResponse(req, res, callback) {
    this._writePacket({
      packetId: req.packetId,
      packetType: 'response',
      req,
      res,
      meta: this._createMeta(req.options),
    }, callback);
  }

  writeHeartbeat(id, hb, callback) {
    this._writePacket({
      packetId: id,
      packetType: 'heartbeat',
      hb,
      meta: this._createMeta(this.encodeOptions),
    }, callback);
  }

  writeHeartbeatAck(hb, callback) {
    this._writePacket({
      packetId: hb.packetId,
      packetType: 'heartbeatAck',
      hb,
      meta: this._createMeta(hb.options),
    }, callback);
  }

  _createMeta(proto) {
    return Object.create(proto, {
      start: {
        writable: true,
        configurable: true,
        value: Date.now(),
      },
      data: {
        writable: true,
        configurable: true,
        value: null,
      },
      size: {
        writable: true,
        configurable: true,
        value: 0,
      },
      encodeRT: {
        writable: true,
        configurable: true,
        value: 0,
      },
    });
  }

  _writePacket(packet, callback = noop) {
    if (this._limited) {
      this._queue.push([ packet, callback ]);
    } else {
      const start = Date.now();
      let buf;
      try {
        buf = this['_' + packet.packetType + 'Encode'](packet);
      } catch (err) {
        return callback(err, packet);
      }
      packet.meta.data = buf;
      packet.meta.size = buf.length;
      packet.meta.encodeRT = Date.now() - start;
      // @refer: https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
      // The return value is true if the internal buffer is less than the highWaterMark configured
      // when the stream was created after admitting chunk. If false is returned, further attempts to
      // write data to the stream should stop until the 'drain' event is emitted.
      this._limited = !this.write(buf, err => {
        callback(err, packet);
      });
    }
  }

  _requestEncode(packet) {
    const id = packet.packetId;
    const req = packet.req;
    if (req.codecType) {
      packet.meta.codecType = req.codecType;
    }
    return this.protocol.requestEncode(id, req, packet.meta);
  }

  _responseEncode(packet) {
    const id = packet.packetId;
    const req = packet.req;
    const res = packet.res;

    const rt = Date.now() - req.meta.start;
    if (req.options.timeout && rt > req.options.timeout) {
      const serviceId = req.data.serverSignature + '#' + req.data.methodName;
      const err = new Error('service:' + serviceId + ' spends ' + rt + '(ms), and exceed the ' + req.options.timeout + '(ms) limit.');
      err.resultCode = '03';
      err.name = 'ResponseTimeoutError';
      throw err;
    }
    res.appRequest = req.data;
    return this.protocol.responseEncode(id, res, packet.meta);
  }

  _heartbeatEncode(packet) {
    const id = packet.packetId;
    const hb = packet.hb;
    return this.protocol.heartbeatEncode(id, hb, this.encodeOptions);
  }

  _heartbeatAckEncode(packet) {
    const id = packet.packetId;
    return this.protocol.heartbeatAckEncode(id, packet.meta);
  }

  _transform(buf, encoding, callback) {
    callback(null, buf);
  }
}

module.exports = ProtocolEncoder;
