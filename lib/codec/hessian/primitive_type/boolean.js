'use strict';

module.exports = gen => {
  gen('if (obj == null) { obj = false; }');
  gen('encoder.writeBool(obj);');
};
