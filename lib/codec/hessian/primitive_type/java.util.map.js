'use strict';

const utils = require('../utils');

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('encoder.byteBuffer.put(0x4d);');
  if (classInfo.type === 'java.util.HashMap' || classInfo.type === 'java.util.Map') {
    gen('encoder.writeType(\'\');');
  } else {
    gen('encoder.writeType(\'%s\');', classInfo.type);
  }

  const generic = classInfo.generic;
  if (generic && generic.length === 2) {
    gen('if (obj instanceof Map) {');
    gen('  for (const entry of obj.entries()) {');
    gen('    const key = entry[0];');
    gen('    const value = entry[1];');
    const genericKeyDefine = utils.normalizeType(generic[0]);
    const genericValueDefine = utils.normalizeType(generic[1]);
    const keyId = utils.normalizeUniqId(genericKeyDefine, version);
    const valueId = utils.normalizeUniqId(genericValueDefine, version);
    gen('    const encodeKey = compile(\'%s\', %j, classMap, version); encodeKey(key, encoder, appClassMap);', keyId, genericKeyDefine);
    gen('    const encodeValue = compile(\'%s\', %j, classMap, version); encodeValue(value, encoder, appClassMap);', valueId, genericValueDefine);
    gen('  }\n  } else {');
    gen('  for (const key in obj) {');
    gen('    const value = obj[key];');
    const convertor = utils.converts[genericKeyDefine.type];
    if (convertor) {
      gen('    const encodeKey = compile(\'%s\', %j, classMap, version); encodeKey(%s(key), encoder, appClassMap);', keyId, genericKeyDefine, convertor);
    } else {
      gen('    const encodeKey = compile(\'%s\', %j, classMap, version); encodeKey(key, encoder, appClassMap);', keyId, genericKeyDefine);
    }
    gen('    const encodeValue = compile(\'%s\', %j, classMap, version); encodeValue(value, encoder, appClassMap);', valueId, genericValueDefine);
    gen('  }\n  }');
  } else {
    gen('if (obj instanceof Map) {');
    gen('  for (const entry of obj.entries()) {');
    gen('    const key = entry[0];');
    gen('    const value = entry[1];');
    gen('    encoder.writeString(key);');
    gen('    if (value && value.$class) {');
    gen('      const fnKey = utils.normalizeUniqId(value, version);');
    gen('      compile(fnKey, value, appClassMap, version)(value.$, encoder);');
    gen('    } else {');
    gen('      encoder.write(value);');
    gen('    }');
    gen('  }\n  } else {');
    gen('  for (const key in obj) {');
    gen('    const value = obj[key];');
    gen('    encoder.writeString(key);');
    gen('    if (value && value.$class) {');
    gen('      const fnKey = utils.normalizeUniqId(value, version);');
    gen('      compile(fnKey, value, appClassMap, version)(value.$, encoder);');
    gen('    } else {');
    gen('      encoder.write(value);');
    gen('    }');
    gen('  }\n  }');
  }
  gen('encoder.byteBuffer.put(0x7a);');

};
