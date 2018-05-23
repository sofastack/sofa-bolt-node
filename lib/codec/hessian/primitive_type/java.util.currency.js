'use strict';

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('if (typeof obj === \'object\' && obj.currencyCode) {');
  gen('  obj = obj.currencyCode');
  gen('}');

  if (version === '1.0') {
    gen('encoder.byteBuffer.put(0x4d);');
    gen('encoder.writeType(\'%s\');', classInfo.type);
    gen('encoder.writeString(\'currencyCode\');');
    gen('encoder.writeString(obj);');
    gen('encoder.byteBuffer.put(0x7a);');
  } else {
    gen('const ref = encoder._writeObjectBegin(\'%s\');', classInfo.type);
    gen('if (ref === -1) {');
    gen('encoder.writeInt(1);');
    gen('encoder.writeString(\'currencyCode\');');
    gen('encoder._writeObjectBegin(\'%s\'); }', classInfo.type);
    gen('encoder.writeString(obj);');
  }
};
