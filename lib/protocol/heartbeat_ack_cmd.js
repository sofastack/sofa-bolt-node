'use strict';

const Base = require('./rpc_cmd');
const ResponseStatus = require('./enum/response_status');

class HeartbeatAckCommand extends Base {
  get responseStatus() {
    return ResponseStatus.SUCCESS;
  }

  serializeClazz() {}

  serializeHeader() {}

  serializeContent() {}
}

module.exports = HeartbeatAckCommand;
