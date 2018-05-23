'use strict';

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('if (typeof obj === \'string\') {');
  gen('  obj = obj.indexOf(\'[\') !== -1 ? (\'[L\' + obj.replace(/(\\[L)|(\\[)|;/g, \'\') + \';\') : obj');
  gen('}');

  gen('if (typeof obj === \'object\') {');
  gen('  obj = obj.name');
  gen('}');

  if (version === '1.0') {
    gen('encoder.byteBuffer.put(0x4d);');
    gen('encoder.writeType(\'%s\');', classInfo.type);
    gen('encoder.writeString(\'name\');');
    gen('encoder.writeString(obj);');
    gen('encoder.byteBuffer.put(0x7a);');
  } else {
    gen('const ref = encoder._writeObjectBegin(\'%s\');', classInfo.type);
    gen('if (ref === -1) {');
    gen('encoder.writeInt(1);');
    gen('encoder.writeString(\'name\');');
    gen('encoder._writeObjectBegin(\'%s\'); }', classInfo.type);
    gen('encoder.writeString(obj);');
  }
};
