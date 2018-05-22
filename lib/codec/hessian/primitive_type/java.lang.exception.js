'use strict';

const utils = require('../utils');

module.exports = (gen, classInfo, version) => {
  gen('if (obj == null) { return encoder.writeNull(); }');

  gen('if (encoder._checkRef(obj)) { return; }');

  classInfo = {
    detailMessage: {
      type: 'java.lang.String',
    },
    stackTrace: {
      type: 'java.lang.StackTraceElement',
      isArray: true,
    },
    cause: {
      type: 'java.lang.Throwable',
    },
  };
  const keys = [ 'detailMessage', 'stackTrace', 'cause' ];
  gen('if (obj instanceof Error) {');
  gen('  const stackTraceElements = [];');
  gen('  const lines = obj.stack.match(/ at .+$/gm);');
  gen('  if (lines) {');
  gen('    for (var line of lines) {');
  gen('      const splits = line.replace(\' at \', \'\').split(\'(\');');
  gen('      if (splits.length < 2) {');
  gen('        splits.push(splits[0]);');
  gen('        splits[0] = \'<anonymous>.<anonymous>\';');
  gen('      }');
  gen('      const declaring = splits[0];');
  gen('      const lastIndexDot = declaring.lastIndexOf(\'.\');');
  gen('      const declaringClass = declaring.substring(0, lastIndexDot) || \'<unknow>\';');
  gen('      const methodName = declaring.substring(lastIndexDot + 1).trim();');
  gen('      const fileSplits = splits[1].split(\':\');');
  gen('      const fileName = fileSplits[0].replace(\')\', \'\');');
  gen('      const lineNumber = parseInt(fileSplits[1]) || 0;');
  gen('      stackTraceElements.push({ declaringClass, methodName, fileName, lineNumber });');
  gen('    }');
  gen('  }');
  gen('  obj = { detailMessage: obj.name + \': \' + obj.message, stackTrace: stackTraceElements }');
  gen('} else {');
  gen('  return encoder.write({ $class: \'java.lang.Exception\', $: obj });');
  gen('}');

  if (version === '1.0') {
    gen('encoder.byteBuffer.put(0x4d);');
    gen('encoder.writeType(\'java.lang.Exception\');');
    for (const key of keys) {
      gen('encoder.writeString(\'%s\');', key);
      const attr = classInfo[key];
      const uniqueId = utils.normalizeUniqId(attr, version);
      gen('compile(\'%s\', %j, classMap, version)(obj[\'%s\'], encoder);', uniqueId, attr, key);
    }
    gen('encoder.byteBuffer.put(0x7a);');
  } else {
    gen('const ref = encoder._writeObjectBegin(\'java.lang.Exception\');');
    gen('if (ref === -1) {');
    gen('encoder.writeInt(%d);', keys.length);
    for (const key of keys) {
      gen('encoder.writeString(\'%s\');', key);
    }
    gen('encoder._writeObjectBegin(\'java.lang.Exception\'); }');

    for (const key of keys) {
      const attr = classInfo[key];
      const uniqueId = utils.normalizeUniqId(attr, version);
      gen('compile(\'%s\', %j, classMap, version)(obj[\'%s\'], encoder);', uniqueId, attr, key);
    }
  }
};
