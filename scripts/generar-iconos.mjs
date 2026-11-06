// Genera icon-192.png e icon-512.png (barra con discos, naranja sobre negro) sin dependencias.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
function crc32(buf) { let c, crc = -1; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; crc = (crc >>> 8) ^ c } return (crc ^ -1) >>> 0 }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]) }
function png(size) {
  const s = size / 512, rects = [[96,216,40,80],[376,216,40,80],[144,186,44,140],[324,186,44,140],[188,244,136,24]]
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) { const inR = rects.some(([rx,ry,rw,rh]) => x >= rx*s && x < (rx+rw)*s && y >= ry*s && y < (ry+rh)*s)
      const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = inR ? 255 : 10; raw[o+1] = inR ? 107 : 10; raw[o+2] = inR ? 0 : 10; raw[o+3] = 255 } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
writeFileSync('public/icon-192.png', png(192)); writeFileSync('public/icon-512.png', png(512)); console.log('Íconos generados')
