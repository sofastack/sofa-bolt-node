'use strict';

const assert = require('assert');
const utils = require('../../utils');

exports.encode = (byteBuffer, cmd) => {
  const req = cmd.obj.appRequest;
  const methodInfo = utils.getMethodInfo(cmd.proto, req.serverSignature, req.methodName);
  if (!methodInfo.responseType) return;

  const responseType = methodInfo.resolvedResponseType;
  // NOTE:
  // responseType.create 的性能更好，但权衡用户友好性还是选择 responseType.fromObject
  // responseType.fromObject 和 responseType.create 的区别在于前者会做一些额外的转换工作，比如：
  //
  // @example:
  // ```js
  // responseType.create({
  //   name: 'zongyu',
  //   group: 1,  // 这里只能传 0 或 1
  // });
  //
  // responseType.fromObject({
  //   name: 'zongyu',
  //   group: 'A', // 这里可以传 A, B, 0, 1
  // });
  // ```
  //
  // ```proto
  // message EchoResponse {
  //     string name = 1;
  //     Group group = 2;
  // }
  //
  // enum Group {
  //     A = 0;
  //     B = 1;
  // }
  // ```
  const buf = responseType.encode(responseType.fromObject(cmd.obj.appResponse)).finish();
  byteBuffer.put(buf);
};

exports.decode = (byteBuffer, options) => {
  const { sentReqs, packetId, proto, contentLen } = options;
  const content = byteBuffer.read(contentLen);
  const error = null;
  let appResponse;
  const data = sentReqs.get(packetId);
  assert(data && data.req, '[sofa-bolt-node] not found req for res#' + packetId);
  const methodInfo = utils.getMethodInfo(proto, data.req.serverSignature, data.req.methodName);
  if (methodInfo.responseType) {
    const responseType = methodInfo.resolvedResponseType;
    appResponse = responseType.decode(content);
    Object.defineProperty(appResponse, 'toObject', {
      enumerable: false,
      value(opt) {
        return responseType.toObject(this, opt);
      },
    });
  }
  return { error, appResponse };
};
