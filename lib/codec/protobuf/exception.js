'use strict';

exports.encode = (byteBuffer, cmd) => {
  byteBuffer.put(Buffer.from(cmd.obj.message));
};

exports.decode = (byteBuffer, options) => {
  const contentLen = options.contentLen;
  const content = byteBuffer.read(contentLen);
  return new Error(content.toString());
};
