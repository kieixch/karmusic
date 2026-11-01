import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

const ACCENT = [200, 255, 77];
const INK = [8, 9, 10];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function segmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function renderPng(size) {
  const rowLength = size * 4 + 1;
  const raw = Buffer.alloc(rowLength * size);
  const center = size / 2;
  const circleRadius = size * 0.31;
  const black = size * 0.052;

  const segments = [
    [size * 0.405, size * 0.31, size * 0.405, size * 0.69],
    [size * 0.405, size * 0.5, size * 0.625, size * 0.31],
    [size * 0.405, size * 0.5, size * 0.625, size * 0.69],
  ];

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * rowLength;
    raw[rowStart] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const distance = Math.hypot(dx, dy);
      const glow = Math.max(0, 1 - distance / (size * 0.55));
      let r = INK[0] + glow * 10;
      let g = INK[1] + glow * 14;
      let b = INK[2] + glow * 8;

      const insideCircle = distance <= circleRadius;
      if (insideCircle) {
        const edge = Math.min(1, circleRadius - distance);
        const mix = Math.min(1, edge / 2);
        r = r * (1 - mix) + ACCENT[0] * mix;
        g = g * (1 - mix) + ACCENT[1] * mix;
        b = b * (1 - mix) + ACCENT[2] * mix;
      }

      if (insideCircle) {
        let kDistance = Infinity;
        for (const [x1, y1, x2, y2] of segments) {
          kDistance = Math.min(kDistance, segmentDistance(x, y, x1, y1, x2, y2));
        }
        if (kDistance <= black) {
          const mix = Math.min(1, (black - kDistance) / 2);
          r = r * (1 - mix) + INK[0] * mix;
          g = g * (1 - mix) + INK[1] * mix;
          b = b * (1 - mix) + INK[2] * mix;
        }
      }

      raw[offset] = Math.round(r);
      raw[offset + 1] = Math.round(g);
      raw[offset + 2] = Math.round(b);
      raw[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="KarMusic">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0" stop-color="#14170f"/>
      <stop offset="1" stop-color="#08090a"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#glow)"/>
  <circle cx="256" cy="256" r="159" fill="#c8ff4d"/>
  <g stroke="#08090a" stroke-width="54" stroke-linecap="round">
    <path d="M207 159v194"/>
    <path d="M207 256l112-97"/>
    <path d="M207 256l112 97"/>
  </g>
</svg>`;

writeFileSync(join(iconsDir, "icon.svg"), svg);
for (const size of [192, 512]) {
  writeFileSync(join(iconsDir, `icon-${size}.png`), renderPng(size));
}
console.log("Generated icon.svg, icon-192.png and icon-512.png");
