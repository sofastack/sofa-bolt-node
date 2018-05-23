'use strict';

module.exports = {
  'com.test.service.ctx.UniformContextHeaders': {
    invokeId: {
      type: 'java.lang.String',
    },
    serviceUniqueName: {
      type: 'java.lang.String',
    },
    read: {
      type: 'boolean',
      defaultValue: false,
    },
    idempotent: {
      type: 'boolean',
      defaultValue: false,
    },
    batch: {
      type: 'boolean',
      defaultValue: false,
    },
    version: {
      type: 'java.lang.String',
    },
    counter: {
      type: 'java.util.concurrent.atomic.AtomicLong',
    },
    ipGroup: {
      type: 'java.lang.String',
    },
    caller: {
      type: 'com.test.service.ctx.Caller',
    },
    callee: {
      type: 'com.test.service.ctx.Callee',
    },
    webInfo: {
      type: 'com.test.service.ctx.WebUniformContextInfo',
    },
    serviceProperies: {
      type: 'java.util.Properties',
      isMap: true,
      generic: [
        { type: 'java.lang.Object' },
        { type: 'java.lang.Object' },
      ],
    },
    protocol: {
      type: 'java.lang.String',
    },
    invokeType: {
      type: 'java.lang.String',
    },
    from_msg: {
      type: 'boolean',
      defaultValue: false,
    },
  },
  'java.util.concurrent.atomic.AtomicLong': {
    value: {
      type: 'long',
      defaultValue: '0',
    },
  },
  'com.test.service.ctx.Caller': {
    ip: {
      type: 'java.lang.String',
    },
    hostName: {
      type: 'java.lang.String',
    },
    appName: {
      type: 'java.lang.String',
    },
    requestTime: {
      type: 'java.lang.String',
    },
  },
  'com.test.service.ctx.Callee': {
    sid: {
      type: 'java.lang.String',
    },
    timeout: {
      type: 'java.lang.String',
    },
    version: {
      type: 'java.lang.String',
    },
  },
  'com.test.service.ctx.WebUniformContextInfo': {
    pageUrl: {
      type: 'java.lang.String',
    },
    uid: {
      type: 'java.lang.String',
    },
    jsessionId: {
      type: 'java.lang.String',
    },
    pageParams: {
      type: 'java.lang.String',
    },
    ipGroup: {
      type: 'java.lang.String',
    },
    from_msg: {
      type: 'boolean',
      defaultValue: false,
    },
    business_type_id: {
      type: 'java.lang.String',
    },
    extend_props: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.Object' },
      ],
    },
  },

  'com.alipay.test.TestObj': {
    staticField: {
      type: 'java.lang.String',
      isStatic: true,
    },
    transientField: {
      type: 'java.lang.String',
      isTransient: true,
    },
    b: {
      type: 'boolean',
      defaultValue: false,
    },
    testObj2: {
      type: 'com.alipay.test.sub.TestObj2',
    },
    name: {
      type: 'java.lang.String',
    },
    field: {
      type: 'java.lang.String',
    },
    testEnum: {
      type: 'com.alipay.test.TestEnum',
      isEnum: true,
    },
    testEnum2: {
      type: 'com.alipay.test.TestEnum',
      isArray: true,
      arrayDepth: 1,
      isEnum: true,
    },
    bs: {
      type: 'byte',
      isArray: true,
      arrayDepth: 1,
    },
    list1: {
      type: 'java.util.List',
      generic: [
        { isEnum: true, type: 'com.alipay.test.TestEnum' },
      ],
    },
    list2: {
      type: 'java.util.List',
      generic: [
        { type: 'java.lang.Integer' },
      ],
    },
    list3: {
      type: 'java.util.List',
      generic: [
        { type: 'com.alipay.test.sub.TestObj2' },
      ],
    },
    list4: {
      type: 'java.util.List',
      generic: [
        { type: 'java.lang.String' },
      ],
    },
    list5: {
      type: 'java.util.List',
      generic: [
        { isArray: true, type: 'byte' },
      ],
    },
    map1: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.Long' },
        { isEnum: true, type: 'com.alipay.test.TestEnum' },
      ],
    },
    map2: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.Integer' },
        { type: 'java.lang.Integer' },
      ],
    },
    map3: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.Boolean' },
        { type: 'com.alipay.test.sub.TestObj2' },
      ],
    },
    map4: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.String' },
      ],
    },
    map5: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { isArray: true, type: 'byte' },
      ],
    },
  },
  'com.alipay.test.sub.TestObj2': {
    name: {
      type: 'java.lang.String',
    },
    transientField: {
      type: 'java.lang.String',
      isTransient: true,
    },
    finalField: {
      type: 'java.lang.String',
      defaultValue: 'xxx',
    },
    staticField: {
      type: 'java.lang.String',
      isStatic: true,
    },
  },
};
