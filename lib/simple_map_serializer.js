'use strict';

// java 的实现是通过 SimpleMapSerializer 来做的，格式如下：
// +------------+-----------+--------------+-------------+
// | key length | key bytes | value length | value bytes |
// +------------+-----------+--------------+-------------+
//
// public byte[] encode(Map<String, String> map) throws CodecException {
//     if (map == null || map.isEmpty()) {
//         return null;
//     }

//     ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
//     try {
//         for (Map.Entry<String, String> entry : map.entrySet()) {
//             String key = entry.getKey();
//             String value = entry.getValue();
//             if (Strings.isNullOrEmpty(key)) {
//                 writeInt(outputStream, 0);
//             } else {
//                 writeInt(outputStream, key.length());
//                 outputStream.write(key.getBytes());
//             }
//             if (Strings.isNullOrEmpty(value)) {
//                 writeInt(outputStream, 0);
//             } else {
//                 writeInt(outputStream, value.length());
//                 outputStream.write(value.getBytes());
//             }
//         }
//         return outputStream.toByteArray();
//     } catch (IOException ex) {
//         throw new CodecException(ex.getMessage(), ex);
//     }
// }
exports.encode = map => {
  const buffers = [];
  for (const key in map) {
    const keyLengthBuffer = Buffer.alloc(4);
    if (key) {
      const keyBuffer = Buffer.from(key);
      keyLengthBuffer.writeInt32BE(keyBuffer.length);
      buffers.push(keyLengthBuffer);
      buffers.push(keyBuffer);
    } else {
      keyLengthBuffer.writeInt32BE(0);
      buffers.push(keyLengthBuffer);
    }

    const value = map[key];
    const valueLengthBuffer = Buffer.alloc(4);
    if (value) {
      const valueBuffer = Buffer.from(value);
      valueLengthBuffer.writeInt32BE(valueBuffer.length);
      buffers.push(valueLengthBuffer);
      buffers.push(valueBuffer);
    } else {
      // https://github.com/alipay/sofa-rpc/blob/9a014c76d656a9950d231d2430c4119e1b7d73be/extension-impl/remoting-bolt/src/main/java/com/alipay/sofa/rpc/codec/bolt/SimpleMapSerializer.java#L100
      valueLengthBuffer.writeInt32BE(value == null ? -1 : 0);
      buffers.push(valueLengthBuffer);
    }
  }
  return Buffer.concat(buffers);
};

exports.decode = buf => {
  if (!buf || !buf.length) {
    return null;
  }
  const length = buf.length;
  const map = {};
  let offset = 0;
  while (offset < length) {
    const keyLength = buf.readInt32BE(offset);
    offset += 4;
    const key = buf.slice(offset, offset + keyLength).toString();
    offset += keyLength;

    const valueLength = buf.readInt32BE(offset);
    offset += 4;
    let value = null;
    if (valueLength > 0) {
      value = buf.toString('utf8', offset, offset + valueLength);
      offset += valueLength;
    } else if (valueLength === 0) {
      value = '';
    }
    map[key] = value;
  }
  return map;
};
