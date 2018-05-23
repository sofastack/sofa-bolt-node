'use strict';

module.exports = {
  'java.lang.Throwable': {
    detailMessage: {
      type: 'java.lang.String',
    },
    stackTrace: {
      type: 'java.lang.StackTraceElement',
      isArray: true,
      arrayDepth: 1,
    },
    cause: {
      type: 'java.lang.Throwable',
    },
  },
  'java.lang.StackTraceElement': {
    declaringClass: {
      type: 'java.lang.String',
    },
    methodName: {
      type: 'java.lang.String',
    },
    fileName: {
      type: 'java.lang.String',
    },
    lineNumber: { type: 'int' },
  },
  'com.alipay.remoting.rpc.exception.RpcServerException': {
    detailMessage: {
      type: 'java.lang.String',
    },
    stackTrace: {
      type: 'java.lang.StackTraceElement',
      isArray: true,
      arrayDepth: 1,
    },
    cause: {
      type: 'java.lang.Throwable',
    },
  },
  'com.alipay.sofa.rpc.core.request.SofaRequest': {
    methodName: {
      type: 'java.lang.String',
    },
    methodArgSigs: {
      type: 'java.lang.String',
      isArray: true,
      arrayDepth: 1,
    },
    targetServiceUniqueName: {
      type: 'java.lang.String',
    },
    targetAppName: {
      type: 'java.lang.String',
    },
    requestProps: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.Object' },
      ],
    },
  },
  'com.alipay.sofa.rpc.core.response.SofaResponse': {
    isError: {
      type: 'boolean',
    },
    errorMsg: {
      type: 'java.lang.String',
    },
    appResponse: {
      type: 'java.lang.Object',
    },
    responseProps: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.String' },
      ],
    },
  },
};
