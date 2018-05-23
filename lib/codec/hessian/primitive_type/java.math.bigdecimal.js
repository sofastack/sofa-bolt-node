'use strict';

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('if (typeof obj === \'object\') {');
  gen('  obj = obj.value || 0');
  gen('}');

  if (version === '1.0') {
    gen('encoder.byteBuffer.put(0x4d);');
    gen('encoder.writeType(\'%s\');', classInfo.type);
    gen('encoder.writeString(\'value\');');
    gen('encoder.writeString(String(obj));');
    gen('encoder.byteBuffer.put(0x7a);');
  } else {
    gen('const ref = encoder._writeObjectBegin(\'%s\');', classInfo.type);
    gen('if (ref === -1) {');
    gen('encoder.writeInt(1);');
    gen('encoder.writeString(\'value\');');
    gen('encoder._writeObjectBegin(\'%s\'); }', classInfo.type);
    gen('encoder.writeString(String(obj));');
  }
};
