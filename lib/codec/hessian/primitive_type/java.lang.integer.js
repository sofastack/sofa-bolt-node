'use strict';

module.exports = gen => {
  gen('if (obj == null) { return encoder.writeNull(); }');
  gen('encoder.writeInt(obj);');
};
