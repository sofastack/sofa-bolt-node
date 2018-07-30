'use strict';

const compile = require('sofa-hessian-node').compile;
const builtInClassMap = require('./builtin_class_map');

const encodeRpcServerExceptionMap = {
  hessian2: compile({
    type: 'com.alipay.remoting.rpc.exception.RpcServerException',
  }, '2.0', builtInClassMap),
};

exports.encode = (target, encoder) => {
  const codecType = target.codecType;
  const err = target.obj;

  const detailMessage = err.name + ': ' + err.message;
  const stackTrace = [];

  const lines = err.stack.match(/ at .+$/gm);
  if (lines) {
    // Error: foo
    // at repl:1:11
    // at REPLServer.defaultEval (repl.js:262:27)
    // at bound (domain.js:287:14)
    // at REPLServer.runBound [as eval] (domain.js:300:12)
    // at REPLServer.<anonymous> (repl.js:431:12)
    // at emitOne (events.js:82:20)
    // at REPLServer.emit (events.js:169:7)
    // at REPLServer.Interface._onLine (readline.js:211:10)
    // at REPLServer.Interface._line (readline.js:550:8)
    // at REPLServer.Interface._ttyWrite (readline.js:827:14)
    for (const line of lines) {
      const splits = line.replace(' at ', '').split('(');
      if (splits.length < 2) {
        splits.push(splits[0]);
        splits[0] = '<anonymous>.<anonymous>';
      }
      const declaring = splits[0];
      const lastIndexDot = declaring.lastIndexOf('.');
      const declaringClass = declaring.substring(0, lastIndexDot) || '<unknow>';
      const methodName = declaring.substring(lastIndexDot + 1).trim();

      const fileSplits = splits[1].split(':');
      const fileName = fileSplits[0].replace(')', '');
      const lineNumber = parseInt(fileSplits[1]) || 0;
      stackTrace.push({
        declaringClass,
        methodName,
        fileName,
        lineNumber,
      });
    }
  }

  encodeRpcServerExceptionMap[codecType]({
    detailMessage,
    stackTrace,
    cause: null,
  }, encoder);
};

exports.decode = decoder => {
  return decoder.readObject();
};
