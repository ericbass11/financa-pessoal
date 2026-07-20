// Gera os ícones PNG do PWA sem dependências externas (usa apenas zlib nativo).
// Desenha um fundo com gradiente da marca e um glifo de gráfico de barras branco.
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

// cores da marca (brand-500 -> brand-700)
const top = [0x63, 0x66, 0xf1]
const bottom = [0x43, 0x38, 0xca]

function roundedRectAlpha(x, y, w, h, r, px, py) {
  // retorna true se o ponto (px,py) está dentro do retângulo arredondado
  if (px < x || px > x + w || py < y || py > y + h) return false
  const cx = Math.min(Math.max(px, x + r), x + w - r)
  const cy = Math.min(Math.max(py, y + r), y + h - r)
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

function drawIcon(size) {
  const data = Buffer.alloc(size * size * 4)
  const scale = size / 512
  const corner = 112 * scale

  // barras: [x, y_top, w, h, opacity] em coordenadas 512
  const bars = [
    [128, 236, 56, 128, 0.55],
    [228, 184, 56, 180, 0.8],
    [328, 132, 56, 232, 1.0],
  ].map(([bx, by, bw, bh, op]) => [bx * scale, by * scale, bw * scale, bh * scale, op])
  const barRadius = 14 * scale

  for (let y = 0; y < size; y++) {
    const t = y / (size - 1)
    const bg = [lerp(top[0], bottom[0], t), lerp(top[1], bottom[1], t), lerp(top[2], bottom[2], t)]
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const inside = roundedRectAlpha(0, 0, size - 1, size - 1, corner, x, y)
      if (!inside) {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
        data[idx + 3] = 0
        continue
      }
      let r = bg[0]
      let g = bg[1]
      let b = bg[2]
      for (const [bx, by, bw, bh, op] of bars) {
        if (roundedRectAlpha(bx, by, bw, bh, barRadius, x, y)) {
          r = lerp(r, 255, op)
          g = lerp(g, 255, op)
          b = lerp(b, 255, op)
        }
      }
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  return data
}

function crc32(buf) {
  return zlib.crc32 ? zlib.crc32(buf) >>> 0 : fallbackCrc(buf)
}

function fallbackCrc(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return (~c) >>> 0
}

function chunk(type, dataBuf) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(dataBuf.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, dataBuf])), 0)
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf])
}

function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filtro: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const outDir = path.resolve(process.argv[2] || 'public')
fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512, 180]) {
  const png = encodePng(size, drawIcon(size))
  const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}x${size}.png`
  fs.writeFileSync(path.join(outDir, name), png)
  console.log(`gerado ${name} (${png.length} bytes)`)
}
