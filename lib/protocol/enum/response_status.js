'use strict';

exports.SUCCESS = 0x0000; // Ok
exports.ERROR = 0x0001; // Error caught
exports.SERVER_EXCEPTION = 0x0002; // Exception caught
exports.UNKNOWN = 0x0003; // Unknown...
exports.SERVER_THREADPOOL_BUSY = 0x0004; // Process thread pool busy
exports.ERROR_COMM = 0x0005; // Error of communication
exports.NO_PROCESSOR = 0x0006; // No processor find
exports.TIMEOUT = 0x0007; // Timeout
exports.CLIENT_SEND_ERROR = 0x0008; // Send failed
exports.CODEC_EXCEPTION = 0x0009; // Exception in encode or decode
exports.CONNECTION_CLOSED = 0x0010; // Connection closed.
