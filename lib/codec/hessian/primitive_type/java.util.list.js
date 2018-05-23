'use strict';

const utils = require('../utils');

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (encoder._checkRef(obj)) { return; }');

  gen('const hasEnd = encoder._writeListBegin(obj.length, \'%s\');', classInfo.type);

  const generic = classInfo.generic;
  if (generic && generic.length === 1) {
    gen('for (const item of obj) {');
    const genericDefine = utils.normalizeType(generic[0]);
    const uniqueId = utils.normalizeUniqId(genericDefine, version);
    gen('  let desc;');
    gen('  let val = item;');
    gen('  let uniqueId = \'%s\'', uniqueId);
    gen('  if (item && item.$class) {');
    gen('    desc = item;');
    gen('    const type = item.$class;');
    gen('    if (item.isArray) {');
    gen('      let arrayDepth = item.arrayDepth || 1;');
    gen('      while (arrayDepth--) type = \'[\' + type;');
    gen('    }');
    gen('    uniqueId = type;');
    gen('    if (item.generic) {');
    gen('      for (const it of item.generic) {');
    gen('        uniqueId += (\'#\' + it.type);');
    gen('      }');
    gen('    }');
    gen('    uniqueId += \'#\' + version;');
    gen('    val = item.$;');
    gen('  } else {');
    gen('   desc = %j;', genericDefine);
    gen('  }');
    gen('  compile(uniqueId, desc, classMap, version)(val, encoder, appClassMap);');
    gen('}');
  } else {
    gen('for (const item of obj) { encoder.write(item); }');
  }
  gen('if (hasEnd) { encoder.byteBuffer.putChar(\'z\'); }');
};
