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
  let length = 0;
  const keyMap = {};
  for (const key in map) {
    length += 8;
    const lengthObj = {
      keyLength: 0,
      valLength: 0,
    };
    if (key) {
      const keyLength = Buffer.byteLength(key);
      lengthObj.keyLength = keyLength;
      length += keyLength;
    }
    const val = map[key];
    if (val) {
      const valLength = Buffer.byteLength(val);
      lengthObj.valLength = valLength;
      length += valLength;
    }
    keyMap[key] = lengthObj;
  }
  const buf = Buffer.allocUnsafe(length);
  let offset = 0;
  for (const key in map) {
    const { keyLength, valLength } = keyMap[key];
    buf.writeInt32BE(keyLength, offset);
    offset += 4;
    if (key) {
      buf.write(key, offset, keyLength);
      offset += keyLength;
    }
    if (!valLength) {
      // https://github.com/alipay/sofa-rpc/blob/9a014c76d656a9950d231d2430c4119e1b7d73be/extension-impl/remoting-bolt/src/main/java/com/alipay/sofa/rpc/codec/bolt/SimpleMapSerializer.java#L100
      buf.writeInt32BE(map[key] == null ? -1 : 0, offset);
      offset += 4;
    } else {
      buf.writeInt32BE(valLength, offset);
      offset += 4;
      buf.write(map[key], offset, valLength);
      offset += valLength;
    }
  }
  return buf;
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
