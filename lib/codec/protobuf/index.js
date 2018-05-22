'use strict';

const classMap = {
  'com.alipay.sofa.rpc.core.request.SofaRequest': require('./request'),
  'com.alipay.sofa.rpc.core.response.SofaResponse': require('./response'),
  'com.alipay.remoting.rpc.exception.RpcServerException': require('./exception'),
};

exports.encode = (byteBuffer, cmd) => {
  const className = cmd.className;
  classMap[className].encode(byteBuffer, cmd);
};

exports.decode = (byteBuffer, className, options) => {
  return classMap[className].decode(byteBuffer, options);
};
