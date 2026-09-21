import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(dir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = paint(x, y, size)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function icon(size) {
  const bg = [12, 12, 14]
  const gold = [232, 184, 109]
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const outer = size * 0.28
  const inner = size * 0.16
  const ring = size * 0.035
  return png(size, (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const d = Math.sqrt(dx * dx + dy * dy)
    if (Math.abs(d - outer) < ring) return gold
    if (d < inner) return gold
    return bg
  })
}

writeFileSync(join(dir, 'icon-180.png'), icon(180))
writeFileSync(join(dir, 'icon-192.png'), icon(192))
writeFileSync(join(dir, 'icon-512.png'), icon(512))
console.log('icons written')
