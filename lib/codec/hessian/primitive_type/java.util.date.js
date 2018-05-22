'use strict';

module.exports = gen => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('if (typeof obj === \'string\') { obj = new Date(obj); }');
  gen('encoder.writeDate(obj);');
};
