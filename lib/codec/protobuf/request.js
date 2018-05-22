'use strict';

const utils = require('../../utils');

exports.encode = (byteBuffer, cmd) => {
  const methodInfo = utils.getMethodInfo(cmd.proto, cmd.obj.serverSignature, cmd.obj.methodName);
  if (methodInfo.requestType) {
    const requestType = methodInfo.resolvedRequestType;
    // NOTE:
    // requestType.create 的性能更好，但权衡用户友好性还是选择 requestType.fromObject
    // requestType.fromObject 和 requestType.create 的区别在于前者会做一些额外的转换工作，比如：
    //
    // @example:
    // ```js
    // requestType.create({
    //   name: 'zongyu',
    //   group: 1,  // 这里只能传 0 或 1
    // });
    //
    // requestType.fromObject({
    //   name: 'zongyu',
    //   group: 'A', // 这里可以传 A, B, 0, 1
    // });
    // ```
    //
    // ```proto
    // message EchoRequest {
    //     string name = 1;
    //     Group group = 2;
    // }
    //
    // enum Group {
    //     A = 0;
    //     B = 1;
    // }
    // ```
    byteBuffer.put(requestType.encode(requestType.fromObject(cmd.obj.args[0])).finish());
  }
};

exports.decode = (byteBuffer, options) => {
  const { proto, headers, contentLen } = options;
  const serverSignature = headers.sofa_head_target_service;
  const methodName = headers.sofa_head_method_name;
  const traceMap = {};
  utils.treeCopyTo('rpc_trace_context.', headers, traceMap, true);
  const methodInfo = utils.getMethodInfo(proto, serverSignature, methodName);
  const data = {
    args: [],
    serverSignature,
    methodName,
    requestProps: Object.assign({
      rpc_trace_context: traceMap,
    }, headers),
  };
  if (methodInfo.requestType && contentLen) {
    const content = byteBuffer.read(contentLen);
    const requestType = methodInfo.resolvedRequestType;
    const req = requestType.decode(content);
    Object.defineProperty(req, 'toObject', {
      enumerable: false,
      value(opt) {
        return requestType.toObject(this, opt);
      },
    });
    data.args.push(req);
  }
  return data;
};
