'use strict';

const defaultValueMap = new Map();
let defaultValueId = 0;

function normalizeUniqId(info, version) {
  let type = info.type || info.$class || info.$abstractClass;
  if (info.isArray) {
    let arrayDepth = info.arrayDepth || 1;
    while (arrayDepth--) type = '[' + type;
  }
  let fnKey = type;
  if (info.generic) {
    for (const item of info.generic) {
      fnKey += ('#' + item.type);
    }
  }
  if (info.defaultValue) {
    if (!defaultValueMap.has(info.defaultValue)) {
      defaultValueMap.set(info.defaultValue, defaultValueId++);
    }
    fnKey += '#' + defaultValueId;
  }
  fnKey += '#' + version;
  return fnKey;
}

exports.normalizeUniqId = normalizeUniqId;

const converts = {
  'java.lang.Boolean': 'Boolean',
  boolean: 'Boolean',
  'java.lang.Integer': 'Number',
  int: 'Number',
  'java.lang.Short': 'Number',
  short: 'Number',
  'java.lang.Double': 'Number',
  double: 'Number',
  'java.lang.Float': 'Number',
  float: 'Number',
};

exports.converts = converts;

exports.normalizeType = type => {
  if (typeof type === 'string') {
    return { type };
  }
  return type;
};
