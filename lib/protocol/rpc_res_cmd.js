'use strict';

const Base = require('./rpc_cmd');
const Constants = require('./const');
const codecMap = require('../codec');
const ResponseStatus = require('./enum/response_status');
const SimpleMapSerializer = require('../simple_map_serializer');

// { true|false: headerBuffer }
// 以内存空间换 CPU 执行时间
const _headerBufferCache = new Map();
const _className = 'com.alipay.sofa.rpc.core.response.SofaResponse';
const _errorClassName = 'com.alipay.remoting.rpc.exception.RpcServerException';

class RpcResponseCommand extends Base {
  constructor(res, options) {
    let responseStatus = res.status;
    if (res.isError == null) {
      res.isError = !!res.errorMsg;
    }
    if (!responseStatus) {
      responseStatus = res.isError ?
        ResponseStatus.SERVER_EXCEPTION :
        ResponseStatus.SUCCESS;

      if (options.codecType === 'protobuf' && res.appResponse) {
        if (res.appResponse instanceof Error) {
          responseStatus = ResponseStatus.SERVER_EXCEPTION;
        }
      }
    }
    super(res, options);
    this.responseStatus = responseStatus;
  }

  get isError() {
    return this.obj.isError;
  }

  get className() {
    return _className;
  }

  serializeHeader(byteBuffer) {
    if (this.codecType === 'protobuf') {
      const isError = this.isError ? 'true' : 'false';
      let headerBuffer = _headerBufferCache.get(isError);
      if (!headerBuffer) {
        const headers = {
          sofa_head_response_error: isError,
        };
        headerBuffer = SimpleMapSerializer.encode(headers);
        _headerBufferCache.set(isError, headerBuffer);
      }
      byteBuffer.put(headerBuffer);
    }
  }

  serializeContent(byteBuffer) {
    const codec = codecMap[this.codecType];
    if (this.responseStatus === ResponseStatus.SUCCESS) {
      codec.encode(byteBuffer, this);
    } else {
      let err;
      if (this.obj && this.obj.appResponse instanceof Error) {
        err = this.obj.appResponse;
      } else if (this.obj && this.obj.errorMsg) {
        err = new Error(this.obj.errorMsg);
      } else {
        err = new Error(Constants.errorMessages[this.responseStatus] ||
          'Exception caught in invocation. responseStatus: ' + this.responseStatus);
      }
      codec.encode(byteBuffer, {
        className: _errorClassName,
        codecType: this.codecType,
        obj: err,
      });
    }
  }

  static decode(byteBuffer, ctx) {
    const codecType = ctx.codecType;
    const codec = codecMap[codecType];
    const responseStatus = byteBuffer.getShort();
    const classLen = byteBuffer.getShort();
    const headerLen = byteBuffer.getShort();
    const contentLen = byteBuffer.getInt();
    const className = byteBuffer.readRawString(classLen);

    if (codecType === 'protobuf') {
      const headerBuf = byteBuffer.read(headerLen);
      const headers = SimpleMapSerializer.decode(headerBuf);
      ctx = {
        headers,
        contentLen,
        proto: ctx.proto,
        packetId: ctx.packetId,
        sentReqs: ctx.sentReqs,
      };
    } else {
      byteBuffer.skip(headerLen);
    }
    let data;
    if (responseStatus === ResponseStatus.SUCCESS) {
      data = codec.decode(byteBuffer, className, ctx);
    } else {
      let error;
      if (contentLen === 0) {
        error = new Error('Server exception when invoke with callback.Please check the server log!');
      } else {
        const remotingError = codec.decode(byteBuffer, _errorClassName, ctx);
        if (remotingError) {
          error = new Error(remotingError);
        } else {
          const errorMsg = Constants.errorMessages[responseStatus] ||
            'Exception caught in invocation. responseStatus: ' + responseStatus;
          error = new Error(errorMsg);
        }
      }
      error.stack = ''; // 对于这种 rpc 框架异常，错误栈设置为空字符串，以免误导
      data = { error };
    }
    return { data, className };
  }
}

module.exports = RpcResponseCommand;
