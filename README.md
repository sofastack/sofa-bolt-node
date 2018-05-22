# sofa-bolt-node
[Bolt](https://github.com/alipay/sofa-bolt) 协议 Nodejs 实现版本

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/sofa-bolt-node.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sofa-bolt-node
[travis-image]: https://img.shields.io/travis/alipay/sofa-bolt-node.svg?style=flat-square
[travis-url]: https://travis-ci.org/alipay/sofa-bolt-node
[codecov-image]: https://codecov.io/gh/alipay/sofa-bolt-node/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/alipay/sofa-bolt-node
[david-image]: https://img.shields.io/david/alipay/sofa-bolt-node.svg?style=flat-square
[david-url]: https://david-dm.org/alipay/sofa-bolt-node
[snyk-image]: https://snyk.io/test/npm/sofa-bolt-node/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/sofa-bolt-node
[download-image]: https://img.shields.io/npm/dm/sofa-bolt-node.svg?style=flat-square
[download-url]: https://npmjs.org/package/sofa-bolt-node


## 一、简介
SOFABoltNode 是 [SOFABolt](https://github.com/alipay/sofa-bolt) 的 Nodejs 实现，它包含了 Bolt 通讯层协议框架，以及 RPC 应用层协议定制。和 Java 版本略有不同的是，它并不包含基础通讯功能（连接管理、心跳、自动重连等等），这些功能会放到专门的 RPC 模块里实现。


## 二、Bolt 通信层协议设计

Bolt 协议是一个标准的通讯层协议，目前包含两个大版本，定义如下：

__V1 版本__
```
Request command protocol for v1
0     1     2           4           6           8          10           12          14         16
+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
|proto| type| cmdcode   |ver2 |   requestId           |codec|        timeout        |  classLen |
+-----------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+
|headerLen  | contentLen            |                             ... ...                       |
+-----------+-----------+-----------+                                                                                               +
|               className + header  + content  bytes                                            |
+                                                                                               +
|                               ... ...                                                         |
+-----------------------------------------------------------------------------------------------+

Response command protocol for v1
0     1     2     3     4           6           8          10           12          14         16
+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
|proto| type| cmdcode   |ver2 |   requestId           |codec|respstatus |  classLen |headerLen  |
+-----------+-----------+-----------+-----------+-----------+-----------+-----------+-----------+
| contentLen            |                  ... ...                                              |
+-----------------------+                                                                       +
|                          header  + content  bytes                                             |
+                                                                                               +
|                               ... ...                                                         |
+-----------------------------------------------------------------------------------------------+
```

__V2 版本__
```
Request command protocol for v2
0     1     2           4           6           8          10     11     12          14         16
+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+------+-----+-----+-----+-----+
|proto| ver1|type | cmdcode   |ver2 |   requestId           |codec|switch|   timeout             |
+-----------+-----------+-----------+-----------+-----------+------------+-----------+-----------+
|classLen   |headerLen  |contentLen             |           ...                                  |
+-----------+-----------+-----------+-----------+                                                +
|               className + header  + content  bytes                                             |
+                                                                                                +
|                               ... ...                                  | CRC32(optional)       |
+------------------------------------------------------------------------------------------------+

Response command protocol for v2
0     1     2     3     4           6           8          10     11    12          14          16
+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+------+-----+-----+-----+-----+
|proto| ver1| type| cmdcode   |ver2 |   requestId           |codec|switch|respstatus |  classLen |
+-----------+-----------+-----------+-----------+-----------+------------+-----------+-----------+
|headerLen  | contentLen            |                      ...                                   |
+-----------------------------------+                                                            +
|               className + header  + content  bytes                                             |
+                                                                                                +
|                               ... ...                                  | CRC32(optional)       |
+------------------------------------------------------------------------------------------------+
```

V2 相比 V1 版本，主要两点改进：
1. 增加了协议版本号（ver1）
2. 协议层面支持了数据包的 CRC32 校验（后面详细介绍）

主要字段介绍：

- __proto:__ 协议标识位，bolt v1 是 0x01，bolt v2 是 0x02
- __ver1:__ bolt 协议版本，从 v2 开始 proto 不会再变，升级只变这个版本号
- __type:__ request/response/request oneway
- __cmdcode:__ request/response/heartbeat，和 type 有交叉
- __ver2:__ 应用层协议的版本（暂时没用）
- __requestId:__ 数据包唯一标识 id
- __codec:__ body 序列化方式，目前支持 hessian/hessian2/protobuf
- __switch:__ 是否开启 crc32 校验
- __headerLen:__ 自定义头部长度
- __contentLen:__ 内容长度
- __CRC32:__ 整个数据包通过计算出的 crc32 值（ver1 > 1 时支持）

## 三、功能介绍

### 基本 RPC 调用功能

客户端示例

```js
'use strict';

const net = require('net');
const pump = require('pump');
const protocol = require('sofa-bolt-node');

const options = {
  sentReqs: new Map(),
};
const socket = net.connect(12200, '127.0.0.1');
const encoder = protocol.encoder(options);
const decoder = protocol.decoder(options);

socket.once('connect', () => {
  console.log('connected');
});
socket.once('close', () => {
  console.log('close');
});
socket.once('error', err => {
  console.log(err);
});

// 流式 API
pump(encoder, socket, decoder, err => {
  console.log(err);
});

// 监听 response / heartbeat_acl
decoder.on('response', res => {
  console.log(res);
});
decoder.on('heartbeat_ack', res => {
  console.log(res);
});

// 发送 RPC 请求
encoder.writeRequest(1, {
  args: [{
    $class: 'java.lang.String',
    $: 'peter',
  }],
  serverSignature: 'com.alipay.sofa.rpc.quickstart.HelloService:1.0',
  methodName: 'sayHello',
  timeout: 3000,
});

// 发送心跳包
encoder.writeHeartbeat(2, { clientUrl: 'xxx' });
```

服务端示例

```js
'use strict';

const net = require('net');
const pump = require('pump');
const protocol = require('sofa-bolt-node');

const server = net.createServer(socket => {
  const options = {
    sentReqs: new Map(),
  };
  const encoder = protocol.encoder(options);
  const decoder = protocol.decoder(options);
  pump(encoder, socket, decoder, err => {
    console.log(err);
  });

  decoder.on('request', req => {
    console.log(req);
    encoder.writeResponse(req, {
      isError: false,
      appResponse: {
        $class: 'java.lang.String',
        $: `hello ${req.data.args[0]} !`,
      },
    });
  });
  decoder.on('heartbeat', hb => {
    console.log(hb);
    encoder.writeHeartbeatAck(hb);
  });
});

server.listen(12200);
```

### 多种序列化方式支持

目前推荐的序列化方式是 protobuf，因为它跨语言性做得比较好。在蚂蚁内部其实我们主要使用的是 hessian 序列化，后面我们会陆续开源关于它的一系列最佳实践，尽请期待。下面我们演示一个 pb 的 demo

通过 *.proto 文件定义接口
```proto
syntax = "proto3";

package com.alipay.sofa.rpc.test;

// 可选
option java_multiple_files = false;

service ProtoService {
  rpc echoObj (EchoRequest) returns (EchoResponse) {}
}

message EchoRequest {
  string name = 1;
  Group group = 2;
}

message EchoResponse {
  int32 code = 1;
  string message = 2;
}

enum Group {
  A = 0;
  B = 1;
}
```

客户端使用 protobuf
```js
'use strict';

const net = require('net');
const path = require('path');
const pump = require('pump');
const protocol = require('sofa-bolt-node');
const protobuf = require('antpb');

// 存放 *.proto 文件的目录，加载 proto
const protoPath = path.join(__dirname, 'proto');
const proto = protobuf.loadAll(protoPath);

// 将 proto 作为参数传入 encoder/decoder
const sentReqs = new Map();
const encoder = protocol.encoder({ sentReqs, proto });
const decoder = protocol.decoder({ sentReqs, proto });

const socket = net.connect(12200, '127.0.0.1');
socket.once('connect', () => {
  console.log('connected');
});
socket.once('close', () => {
  console.log('close');
});
socket.once('error', err => {
  console.log(err);
});
pump(encoder, socket, decoder, err => {
  console.log(err);
});

// 指定序列化方式为 protobuf
encoder.codecType = 'protobuf';

const req = {
  serverSignature: 'com.alipay.sofa.rpc.test.ProtoService:1.0',
  methodName: 'echoObj',
  args: [{
    name: 'peter',
    group: 'B',
  }],
  timeout: 3000,
};

decoder.on('response', res => {
  console.log(res.data.appResponse);
});

// 记录请求、发送请求
sentReqs.set(1, { req });
encoder.writeRequest(1, req);
```

服务端使用 protobuf
```js
'use strict';

const net = require('net');
const path = require('path');
const pump = require('pump');
const protocol = require('sofa-bolt-node');
const protobuf = require('antpb');

const protoPath = path.join(__dirname, 'proto');
const proto = protobuf.loadAll(protoPath);

const server = net.createServer(socket => {
  const options = {
    sentReqs: new Map(),
    proto,
  };
  const encoder = protocol.encoder(options);
  const decoder = protocol.decoder(options);
  pump(encoder, socket, decoder, err => {
    console.log(err);
  });

  decoder.on('request', req => {
    const reqData = req.data.args[0].toObject({ enums: String });;
    encoder.writeResponse(req, {
      isError: false,
      appResponse: {
        code: 200,
        message: 'hello ' + reqData.name + ', you are in ' + reqData.group,
      },
    });
  });

  decoder.on('heartbeat', hb => {
    console.log(hb);
    encoder.writeHeartbeatAck(hb);
  });
});

server.listen(12200);
```

### CRC32 校验

RPC 在网络传输过程中可能会遇到各种各样奇葩的问题，导致二进制被篡改，如果这个接口是和钱有关的，就可能导致资损，所以 Bolt 协议层面引入了一个校验功能，当开启时会在整个数据包后面额外传输 4 个 bytes 是数据包计算出来的 CRC32 值，接收端收到数据包以后先在本地重新计算 CRC32 值然后和附带的值比对，一致继续处理，不一致则直接报错

该功能由客户端开启，但是开启之前一般有一个协商的过程，服务端通过协商告诉客户端它支持 crc32 校验

```js
'use strict';

const net = require('net');
const pump = require('pump');
const protocol = require('sofa-bolt-node');

const options = {
  sentReqs: new Map(),
};

const socket = net.connect(12200, '127.0.0.1');
const encoder = protocol.encoder(options);
const decoder = protocol.decoder(options);
pump(encoder, socket, decoder);

// 客户端开启 crc 校验
encoder.protocolType = 'bolt2'; // v2 版本以上才支持 crc 校验
encoder.boltVersion = 2;
encoder.crcEnable = true;

// 发送
encoder.writeRequest(1, {
  args: [{
    $class: 'java.lang.String',
    $: 'peter',
  }],
  serverSignature: 'com.alipay.sofa.rpc.quickstart.HelloService:1.0',
  methodName: 'sayHello',
  timeout: 3000,
});
```

## 四、用户接口

### 全局接口
- `encoder(options)` 创建一个 ProtocolEncoder
  - @param {Map} sentReqs - 用于存储发送出去的请求
  - @param {Map} [classCache] - 类定义缓存
  - @param {Object} [classMap] - hessian 序列化的类型定义
  - @param {Object} [proto] - protobuf 序列化的接口定义
  - @param {Url} [address] - TCP socket 地址
  - @param {String} [codecType] - 序列化方式
- `decoder(options)` 创建一个 ProtocolDecoder
  - @param {Map} sentReqs - 用于存储发送出去的请求
  - @param {Map} [classCache] - 类定义缓存
  - @param {Object} [classMap] - hessian 序列化的类型定义
  - @param {Object} [proto] - protobuf 序列化的接口定义
- `setOptions(options)` 设置一些全局的参数

### ProtocolEncoder 接口
- `protocolType` 设置协议，bolt/bolt2
- `codecType` 设置序列化方式，hessian/hessian2/protobuf
- `boltVersion` 设置 bolt 的版本
- `crcEnable` 是否开启 crc 校验
- `writeRequest(id, req, [callback])` 发送请求
  - @param {Number} id - 数据包唯一标识
  - @parma {Object} req - 请求对象
    - @param {String} serverSignature - 服务的唯一标识
    - @param {String} methodName - 方法名
    - @param {Array} args - 参数列表
    - @param {Number} timeout - 超时时间
    - @param {Object} requestProps - 额外传递的 kv 参数
- `writeResponse(req, res, [callback])` 发送响应
  - @param {Object} req - 请求对象，有请求才有响应
  - @parma {Object} res - 响应对象
    - @param {Boolean} isError - 是否成功
    - @param {String} errorMsg - 异常信息，isError=false 的话为 null
    - @param {Object} appResponse - 响应对象
    - @param {Object} responseProps - 额外传递的 kv 参数
- `writeHeartbeat(id, hb, [callback])` 发送心跳请求
  - @param {Number} id - 数据包唯一标识
  - @parma {Object} hb - 心跳对象
    - @param {String} clientUrl - 客户端 url
- `writeHeartbeatAck(hb, [callback])` 发送心跳响应
  - @parma {Object} hb - 心跳对象

## 五、接口设计思想

从上面的介绍和接口定义看，我们对协议的实现核心就是 Encoder 和 Decoder 两个类，并且采用了 Nodejs 里[流（Stream）](https://nodejs.org/api/stream.html)的风格

```
+---------+  pipe  +---------+  pipe  +---------+    response
| Encoder |  --->  | Socket  |  --->  | Decoder |    ...
+---------+        +---------+        +---------+
                      |  ^
                      |  |
                      |  |
                      v  |
+---------+  pipe  +---------+  pipe  +---------+    request
| Encoder |  --->  | Socket  |  --->  | Decoder |    ...
+---------+        +---------+        +---------+
```

所有的协议细节，数据的切分都封装在 Encoder/Decoder 两个类中，并且提供标准的 API，所以以后我们要替换其他的通讯层协议（比如：dubbo），那么只需要直接替换就好了

## 六、如何贡献

请告知我们可以为你做些什么，不过在此之前，请检查一下是否有已经[存在的Bug或者意见](https://github.com/alipay/sofa-bolt-node/issues)。

如果你是一个代码贡献者，请参考[代码贡献规范](https://github.com/eggjs/egg/blob/master/CONTRIBUTING.zh-CN.md)。

## 七、开源协议

[MIT](https://github.com/alipay/sofa-bolt-node/blob/master/LICENSE)
