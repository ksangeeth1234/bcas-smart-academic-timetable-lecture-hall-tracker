import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Simple PNG encoder using uncompressed/deflated raw scanlines
  // Each scanline starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Let's create a subtle circular vignette or border for branding
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width / 2;
      
      let curR = r;
      let curG = g;
      let curB = b;
      let alpha = 255;
      
      // Center logo badge motif
      if (dist < radius * 0.45) {
        // Center white circle
        curR = 255;
        curG = 255;
        curB = 255;
        // Inner clock or red dot
        if (dist < radius * 0.15) {
          curR = 214;
          curG = 40;
          curB = 40; // Red #D62828
        }
      } else if (dist < radius * 0.48) {
        curR = 214;
        curG = 40;
        curB = 40; // Red ring
      } else if (dist > radius - 8) {
        // Slight border
        curR = Math.max(0, r - 30);
        curG = Math.max(0, g - 30);
        curB = Math.max(0, b - 30);
      }
      
      rawData[pxOffset] = curR;
      rawData[pxOffset + 1] = curG;
      rawData[pxOffset + 2] = curB;
      rawData[pxOffset + 3] = alpha;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Helper to write chunk
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const table = (() => {
    const c = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let t = i;
      for (let k = 0; k < 8; k++) {
        t = (t & 1) ? (0xedb88320 ^ (t >>> 1)) : (t >>> 1);
      }
      c[i] = t;
    }
    return c;
  })();

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', deflated);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate PWA icons with BCAS Navy Blue (#102A56 -> 16, 42, 86)
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, 16, 42, 86));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, 16, 42, 86));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 16, 42, 86));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, 16, 42, 86));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPng(32, 32, 16, 42, 86));

console.log('PWA icons created successfully in public/');
