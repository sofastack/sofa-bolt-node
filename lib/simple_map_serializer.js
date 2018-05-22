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
      valueLengthBuffer.writeInt32BE(0);
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
    const value = buf.toString('utf8', offset, offset + valueLength);
    offset += valueLength;

    map[key] = value;
  }
  return map;
};
