'use strict';

module.exports = gen => {
  gen('if (obj == null) { obj = 0; }');
  gen('encoder.writeDouble(obj);');
};
