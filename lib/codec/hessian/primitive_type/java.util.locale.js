'use strict';

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('if (typeof obj === \'object\') {');
  gen('  obj = obj.value');
  gen('}');

  if (version === '1.0') {
    gen('encoder.byteBuffer.put(0x4d);');
    gen('encoder.writeType(\'com.caucho.hessian.io.LocaleHandle\');');
    gen('encoder.writeString(\'value\');');
    gen('encoder.writeString(obj);');
    gen('encoder.byteBuffer.put(0x7a);');
  } else {
    gen('const ref = encoder._writeObjectBegin(\'com.caucho.hessian.io.LocaleHandle\');');
    gen('if (ref === -1) {');
    gen('encoder.writeInt(1);');
    gen('encoder.writeString(\'value\');');
    gen('encoder._writeObjectBegin(\'com.caucho.hessian.io.LocaleHandle\'); }');
    gen('encoder.writeString(obj);');
  }
};
