'use strict';

const is = require('is-type-of');
const has = require('utility').has;

/* eslint-disable no-bitwise */
const crc = require('crc');
const MAX_PACKET_ID = Math.pow(2, 30); // 避免 hessian 写大整数

const TWO_PWR_16_DBL = 1 << 16;
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

/**
 * 创建全局唯一的 packetId
 * @return {Number} packetId
 */
exports.nextId = () => {
  exports.id += 1;
  if (exports.id >= MAX_PACKET_ID) {
    exports.id = 1;
  }
  return exports.id;
};

exports.id = 0;

exports.crc32 = buf => {
  const r = crc.crc32(buf);
  // crc32 返回的是一个 unsigned int32，需要转换成 int32
  return (r % TWO_PWR_32_DBL) | 0;
};
/* eslint-enable no-bitwise */

const methodMap = new Map();
exports.getMethodInfo = (proto, serviceId, methodName) => {
  const serviceName = serviceId.split(':')[0];
  const key = serviceId + '#' + methodName;
  let method = methodMap.get(key);
  if (!method) {
    const service = proto.lookupService(serviceName);
    method = service.get(methodName);
    if (!method) {
      throw new Error(`no such Method '${methodName}' in Service '${serviceId}'`);
    }
    method = method.resolve();
    methodMap.set(key, method);
  }
  return method;
};

const DEFAULT_CLASSNAME = {
  boolean: 'boolean',
  int: 'int',
  long: 'long',
  double: 'double',
  date: 'java.util.Date',
  string: 'java.lang.String',
  byteArray: '[B',
  list: 'java.util.ArrayList',
  map: 'java.util.HashMap',
  exception: 'java.lang.RuntimeException',
  null: 'null',
};

const arrayTypeMap = {
  short: 'S',
  int: 'I',
  boolean: 'Z',
  double: 'D',
  long: 'J',
  float: 'F',
  byte: 'B',
  string: 'Ljava.lang.String;',
  object: 'Ljava.lang.Object;',
};

/*
 * auto detect a val to a java type
 * if val.$class was set, return val.$class
 * @param {Object} val
 * @return {String}
 */
exports.getJavaClassname = val => {
  if (is.nullOrUndefined(val) || is.NaN(val)) {
    return DEFAULT_CLASSNAME.null;
  }

  if (val.$class) {
    const type = has(val, '$abstractClass') ? val.$abstractClass : val.$class;

    // 数组
    if (val.isArray) {
      const arrayDepth = val.arrayDepth || 1;
      let prefix = '';
      for (let i = 0; i < arrayDepth; i++) {
        prefix += '[';
      }
      return prefix + (arrayTypeMap[type] || ('L' + type + ';'));
    }
    if (type.startsWith('[')) {
      const len = type.length;
      let i = 0;
      for (; i < len; i++) {
        if (type[i] !== '[') break;
      }
      const prefix = type.slice(0, i);
      const itemType = type.slice(i);
      return prefix + (arrayTypeMap[itemType] || ('L' + itemType + ';'));
    }
    return type;
  }

  const type = typeof val;
  switch (type) {
    case 'boolean':
      return DEFAULT_CLASSNAME.boolean;
    case 'string':
      return DEFAULT_CLASSNAME.string;
    case 'number':
      if (is.long(val)) {
        return DEFAULT_CLASSNAME.long;
      }
      if (is.int(val)) {
        return DEFAULT_CLASSNAME.int;
      }
      return DEFAULT_CLASSNAME.double;
    default:
      break;
  }

  if (is.date(val)) {
    return DEFAULT_CLASSNAME.date;
  }
  if (is.buffer(val)) {
    return DEFAULT_CLASSNAME.byteArray;
  }
  if (is.array(val)) {
    return DEFAULT_CLASSNAME.list;
  }
  if (is.error(val)) {
    return DEFAULT_CLASSNAME.exception;
  }

  return DEFAULT_CLASSNAME.map;
};

exports.writeMethodArgs = (args, encoder) => {
  for (let i = 0; i < args.length; i++) {
    // support {$class: 'java.lang.String', $: null}
    let arg = args[i];
    if (arg && arg.$class && is.nullOrUndefined(arg.$)) {
      arg = null;
    }
    encoder.write(arg);
  }
};

function flatCopyTo(prefix, sourceMap, distMap) {
  for (const k in sourceMap) {
    const key = prefix + k;
    const val = sourceMap[k];
    if (typeof val === 'string') {
      distMap[key] = val;
    } else if (typeof val === 'number') {
      distMap[key] = val.toString();
    } else if (typeof val === 'object') {
      flatCopyTo(key + '.', val, distMap);
    }
  }
}
exports.flatCopyTo = flatCopyTo;

function treeCopyTo(prefix, sourceMap, distMap, remove) {
  const len = prefix.length;
  for (const key in sourceMap) {
    if (key.startsWith(prefix)) {
      distMap[key.slice(len)] = sourceMap[key];
      if (remove) {
        delete sourceMap[key];
      }
    }
  }
}
exports.treeCopyTo = treeCopyTo;
