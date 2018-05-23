'use strict';

const Base = require('./rpc_cmd');

class HeartbeatCommand extends Base {
  get timeout() {
    return this.obj.timeout || 3000;
  }

  serializeClazz() {}

  serializeHeader() {}

  serializeContent() {}
}

module.exports = HeartbeatCommand;
