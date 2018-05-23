'use strict';

const assert = require('assert');
const Base = require('./rpc_cmd');
const utils = require('../utils');
const codecMap = require('../codec');
const SimpleMapSerializer = require('../simple_map_serializer');

const _className = 'com.alipay.sofa.rpc.core.request.SofaRequest';

class RpcRequestCommand extends Base {
  constructor(req, options) {
    assert(req && typeof req.timeout === 'number', '[RpcRequestCommand] req.timeout should be a number');
    super(req, options);
  }

  get className() {
    return _className;
  }

  serializeHeader(byteBuffer) {
    const serverSignature = this.obj.serverSignature;
    const headers = {
      service: serverSignature,
    };
    if (this.codecType === 'protobuf') {
      headers.sofa_head_method_name = this.obj.methodName;
      headers.sofa_head_target_app = this.obj.targetAppName || '';
      headers.sofa_head_target_service = serverSignature;
      if (this.obj.requestProps) {
        utils.flatCopyTo('', this.obj.requestProps, headers);
      }
    }
    const headerBuffer = SimpleMapSerializer.encode(headers);
    byteBuffer.put(headerBuffer);
  }

  serializeContent(byteBuffer) {
    const codec = codecMap[this.codecType];
    codec.encode(byteBuffer, this);
  }

  static decode(byteBuffer, ctx) {
    const codecType = ctx.codecType;
    const codec = codecMap[codecType];
    const classLen = byteBuffer.getShort();
    const headerLen = byteBuffer.getShort();
    const contentLen = byteBuffer.getInt();
    const className = byteBuffer.readRawString(classLen);

    if (codecType === 'protobuf') {
      const headerBuf = byteBuffer.read(headerLen);
      const headers = SimpleMapSerializer.decode(headerBuf);
      ctx = {
        headers,
        proto: ctx.proto,
        contentLen,
      };
    } else {
      byteBuffer.skip(headerLen);
    }
    const data = codec.decode(byteBuffer, className, ctx);
    return { data, className };
  }
}

module.exports = RpcRequestCommand;
