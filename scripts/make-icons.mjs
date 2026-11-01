// Generates the PNG app icons (iOS needs PNG touch icons) with no dependencies.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, pixel) {
  const row = size * 3 + 1;
  const raw = Buffer.alloc(size * row);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel((x + 0.5) / size, (y + 0.5) / size);
      const i = y * row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const teal = [15, 118, 110];
const white = [255, 255, 255];
const amber = [245, 158, 11];
const roundRect = (u, v, x0, y0, x1, y1, r) => {
  const dx = Math.max(x0 + r - u, 0, u - (x1 - r));
  const dy = Math.max(y0 + r - v, 0, v - (y1 - r));
  return u >= x0 && u <= x1 && v >= y0 && v <= y1 && dx * dx + dy * dy <= r * r;
};
const nearSegment = (u, v, ax, ay, bx, by, w) => {
  const t = Math.max(0, Math.min(1, ((u - ax) * (bx - ax) + (v - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return (u - ax - t * (bx - ax)) ** 2 + (v - ay - t * (by - ay)) ** 2 <= w * w;
};

// A receipt with a "paid" tick, centred inside the maskable safe zone.
const icon = (u, v) => {
  if ((u - 0.66) ** 2 + (v - 0.68) ** 2 <= 0.12 ** 2) {
    const tick = nearSegment(u, v, 0.6, 0.68, 0.645, 0.725, 0.018) || nearSegment(u, v, 0.645, 0.725, 0.72, 0.635, 0.018);
    return tick ? white : amber;
  }
  if (roundRect(u, v, 0.3, 0.22, 0.7, 0.78, 0.04)) {
    const line = (y0, x1) => roundRect(u, v, 0.37, y0, x1, y0 + 0.035, 0.017);
    return line(0.32, 0.63) || line(0.42, 0.63) || line(0.52, 0.5) ? teal : white;
  }
  return teal;
};

const out = new URL("../public/icons/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const size of [180, 192, 512]) writeFileSync(new URL(`icon-${size}.png`, out), png(size, icon));
console.log("icons written to public/icons");
