'use strict';

// 以内存空间换 CPU 执行时间
const clazzBufMap = new Map();

class RpcCommand {
  constructor(obj, options = {}) {
    this.obj = obj;
    this.options = options;
    this.oneway = !!(obj && obj.oneway);
  }

  get className() {
    throw new Error('not implement');
  }

  get proto() {
    return this.options.proto;
  }

  get codecType() {
    return this.options.codecType;
  }

  get timeout() {
    return this.obj.timeout;
  }

  get classMap() {
    // 优先用 obj.classMap
    if (this.obj && this.obj.classMap) {
      return this.obj.classMap;
    }
    return this.options.classMap;
  }

  serializeClazz(byteBuffer) {
    if (!clazzBufMap.has(this.className)) {
      const buf = Buffer.from(this.className);
      clazzBufMap.set(this.className, buf);
      byteBuffer.put(buf);
    } else {
      byteBuffer.put(clazzBufMap.get(this.className));
    }
  }
}

module.exports = RpcCommand;
