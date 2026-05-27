// Generate a simple PNG icon for Windows electron-builder
// Pure Node.js, no dependencies needed
const zlib = require('zlib');
const fs = require('fs');

// Create a 256x256 RGBA PNG with a gradient background
const width = 256;
const height = 256;
const rawData = Buffer.alloc((width * 4 + 1) * height); // +1 for filter byte per row

for (let y = 0; y < height; y++) {
  const rowOffset = y * (width * 4 + 1);
  rawData[rowOffset] = 0; // filter: None
  for (let x = 0; x < width; x++) {
    const idx = rowOffset + 1 + x * 4;
    // Gradient from deep blue (#0a0a2e) to purple (#1a0a3e)
    const r = Math.round(10 + (x / width) * 20);
    const g = Math.round(10 + (y / height) * 10);
    const b = Math.round(46 + ((width - x) / width) * 20);
    rawData[idx] = r;     // R
    rawData[idx + 1] = g; // G
    rawData[idx + 2] = b; // B
    rawData[idx + 3] = 255; // A
  }
}

// PNG signature
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR chunk
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return crc ^ 0xFFFFFFFF;
}

// Compress raw image data
const compressed = zlib.deflateSync(rawData, { level: 9 });

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type: RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const pngBuffer = Buffer.concat([
  signature,
  createChunk('IHDR', ihdr),
  createChunk('IDAT', compressed),
  createChunk('IEND', Buffer.alloc(0)),
]);

const outDir = __dirname + '/../public';
fs.writeFileSync(outDir + '/icon.png', pngBuffer);
console.log(`Generated: ${outDir}/icon.png (${width}x${height})`);
