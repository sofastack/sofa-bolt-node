'use strict';

const debug = require('debug')('hessian#compile');
const utils = require('./utils');
const codegen = require('@protobufjs/codegen');

const cache = new Map();
const typeMap = {
  bool: require('./primitive_type/boolean'),
  boolean: require('./primitive_type/boolean'),
  'java.lang.Boolean': require('./primitive_type/java.lang.boolean'),
  int: require('./primitive_type/int'),
  'java.lang.Integer': require('./primitive_type/java.lang.integer'),
  short: require('./primitive_type/int'),
  'java.lang.Short': require('./primitive_type/java.lang.integer'),
  long: require('./primitive_type/long'),
  'java.lang.Long': require('./primitive_type/java.lang.long'),
  double: require('./primitive_type/double'),
  'java.lang.Double': require('./primitive_type/java.lang.double'),
  float: require('./primitive_type/double'),
  'java.lang.Float': require('./primitive_type/java.lang.double'),
  byte: require('./primitive_type/int'),
  'java.lang.Byte': require('./primitive_type/java.lang.integer'),
  char: require('./primitive_type/java.lang.string'),
  'java.lang.Character': require('./primitive_type/java.lang.string'),
  'java.lang.String': require('./primitive_type/java.lang.string'),
  'java.util.Map': require('./primitive_type/java.util.map'),
  'java.util.HashMap': require('./primitive_type/java.util.map'),
  'java.util.List': require('./primitive_type/java.util.list'),
  'java.util.Set': require('./primitive_type/java.util.list'),
  'java.util.Collection': require('./primitive_type/java.util.list'),
  'java.util.ArrayList': require('./primitive_type/java.util.arraylist'),
  'java.util.Date': require('./primitive_type/java.util.date'),
  'java.lang.Class': require('./primitive_type/java.lang.class'),
  'java.util.Currency': require('./primitive_type/java.util.currency'),
  'java.math.BigDecimal': require('./primitive_type/java.math.bigdecimal'),
  'java.util.Locale': require('./primitive_type/java.util.locale'),
  'java.lang.Exception': require('./primitive_type/java.lang.exception'),
  'java.lang.StackTraceElement': require('./primitive_type/java.lang.stacktraceelement'),
  'java.lang.Object': require('./primitive_type/java.lang.object'),
};
const arrayTypeMap = {
  'java.util.Locale': 'com.caucho.hessian.io.LocaleHandle',
};
const bufferType = {
  byte: true,
  'java.lang.Byte': true,
};

/**
 * 预编译
 *
 * @param {Object} info
 *   - {String} $class - 类名
 * @param {String} version - hessian 版本：1.0, 2.0
 * @param {Object} classMap - 类型映射
 * @return {Function} serializeFn
 */
module.exports = (info, version, classMap) => {
  info.type = info.type || info.$class;
  const uniqueId = utils.normalizeUniqId(info, version);
  return compile(uniqueId, info, classMap, version);
};

function compile(uniqueId, info, classMap, version) {
  let encodeFn = cache.get(uniqueId);
  if (encodeFn) return encodeFn;

  const type = info.type || info.$class;
  // 先获取 classInfo，因为 type 后面会变
  const classInfo = classMap && classMap[type];

  const gen = codegen([ 'obj', 'encoder', 'appClassMap' ], 'encode');
  // 默认值
  if (info.defaultValue) {
    gen('if (obj == null) { obj = %j; }', info.defaultValue);
  }
  if (info.isArray) {
    gen('if (obj == null) { return encoder.writeNull(); }');
    const arrayDepth = info.arrayDepth || 1;
    if (bufferType[type] && arrayDepth === 1) {
      gen('encoder.writeBytes(obj);');
    } else {
      let arrayType = arrayTypeMap[type] || type;
      for (let i = 0; i < arrayDepth; i++) arrayType = '[' + arrayType;

      gen('if (encoder._checkRef(obj)) { return; }');
      gen('const hasEnd = encoder._writeListBegin(obj.length, \'%s\');', arrayType);

      const item = arrayDepth > 1 ? {
        type,
        arrayDepth: arrayDepth - 1,
        isMap: info.isMap,
        isEnum: info.isEnum,
        isArray: info.isArray,
        generic: info.generic,
        abstractClass: info.abstractClass,
      } : {
        type,
        isMap: info.isMap,
        isEnum: info.isEnum,
        generic: info.generic,
        abstractClass: info.abstractClass,
      };
      const uniqueId = utils.normalizeUniqId(item, version);
      gen('for (const item of obj) {');
      gen('  compile(\'%s\', %j, classMap, version)(item, encoder, appClassMap);', uniqueId, item);
      gen('}');
      gen('if (hasEnd) { encoder.byteBuffer.putChar(\'z\'); }');
    }
  } else if (typeMap[type]) {
    typeMap[type](gen, info, version);
  } else if (info.isMap) {
    typeMap['java.util.Map'](gen, info, version);
  } else if (classInfo && !info.abstractClass && !info.$abstractClass) {
    gen('if (obj == null) { return encoder.writeNull(); }');
    gen('if (encoder._checkRef(obj)) { return; }');

    const keys = classInfo ? Object.keys(classInfo).filter(key => {
      const attr = classInfo[key];
      return !attr.isStatic && !attr.isTransient;
    }) : [];

    if (version === '1.0') {
      gen('encoder.byteBuffer.put(0x4d);');
      gen('encoder.writeType(\'%s\');', type);
      for (const key of keys) {
        gen('encoder.writeString(\'%s\');', key);
        const attr = classInfo[key];
        const uniqueId = utils.normalizeUniqId(attr, version);
        gen('compile(\'%s\', %j, classMap, version)(obj[\'%s\'], encoder, appClassMap);', uniqueId, attr, key);
      }
      gen('encoder.byteBuffer.put(0x7a);');
    } else {
      gen('const ref = encoder._writeObjectBegin(\'%s\');', type);
      gen('if (ref === -1) {');
      gen('encoder.writeInt(%d);', keys.length);
      for (const key of keys) {
        gen('encoder.writeString(\'%s\');', key);
      }
      gen('encoder._writeObjectBegin(\'%s\'); }', type);

      for (const key of keys) {
        const attr = classInfo[key];
        const uniqueId = utils.normalizeUniqId(attr, version);
        gen('compile(\'%s\', %j, classMap, version)(obj[\'%s\'], encoder, appClassMap);', uniqueId, attr, key);
      }
    }
  } else if (info.isEnum) {
    gen('if (obj == null) { return encoder.writeNull(); }');
    gen('if (encoder._checkRef(obj)) { return; }');

    if (version === '1.0') {
      gen('encoder.byteBuffer.put(0x4d);');
      gen('encoder.writeType(\'%s\');', type);
      gen('encoder.writeString(\'name\');');
      gen('encoder.writeString(typeof obj.name === \'string\' ? obj.name : obj);');
      gen('encoder.byteBuffer.put(0x7a);');
    } else {
      gen('const ref = encoder._writeObjectBegin(\'%s\');', type);
      gen('if (ref === -1) {');
      gen('encoder.writeInt(1);');
      gen('encoder.writeString(\'name\');');
      gen('encoder._writeObjectBegin(\'%s\'); }', type);
      gen('encoder.writeString(typeof obj.name === \'string\' ? obj.name : obj);');
    }
  } else {
    gen('if (obj == null) { return encoder.writeNull(); }');
    gen('if (obj && obj.$class) {');
    gen('  const fnKey = utils.normalizeUniqId(obj, version);');
    gen('  compile(fnKey, obj, classMap, version)(obj.$, encoder, appClassMap);');
    gen('}');
    gen('else { encoder.write({ $class: \'%s\', $: obj }); }', type);
  }
  encodeFn = gen({ compile, classMap, version, utils });
  debug('gen encodeFn for [%s] => %s\n', uniqueId, '\n' + encodeFn.toString());
  cache.set(uniqueId, encodeFn);
  return encodeFn;
}
