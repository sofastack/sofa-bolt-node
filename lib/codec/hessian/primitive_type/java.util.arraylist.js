'use strict';

const utils = require('../utils');

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('const hasEnd = encoder._writeListBegin(obj.length, \'\');');

  const generic = classInfo.generic;
  if (generic && generic.length === 1) {
    gen('for (const item of obj) {');
    const genericDefine = utils.normalizeType(generic[0]);
    const uniqueId = utils.normalizeUniqId(genericDefine, version);
    gen('  let desc;');
    gen('  if (item && item.$class) {');
    gen('    desc = item;');
    gen('  } else {');
    gen('   desc = %j;', genericDefine);
    gen('  }');
    gen('  compile(\'%s\', desc, classMap, version)(item, encoder, appClassMap);', uniqueId);
    gen('}');
  } else {
    gen('for (const item of obj) { encoder.write(item); }');
  }
  gen('if (hasEnd) { encoder.byteBuffer.putChar(\'z\'); }');
};
