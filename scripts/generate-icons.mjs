#!/usr/bin/env node
/**
 * Generates every app icon and splash asset from the "Coin F" design.
 *
 *   node scripts/generate-icons.mjs
 *
 * The design is a handful of rounded rectangles and circles in a 100x100
 * space, so it's rasterized here directly (with 4x4 supersampling) instead
 * of depending on an SVG renderer. No npm dependencies.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "images");

// ---- Design (100x100 units) -------------------------------------------------

export const BRAND_BACKGROUND = "#173D35";

const MINT = "#C2DDD3";
const GREEN = "#42B58B";
const GOLD = "#F2B64C";
const GOLD_DARK = "#D98E04";

/** Painted in order; later shapes cover earlier ones. */
const SHAPES = [
  { kind: "rect", x: 31, y: 24, w: 13, h: 52, r: 4, color: MINT }, // F stem
  { kind: "rect", x: 31, y: 24, w: 36, h: 13, r: 4, color: MINT }, // F top arm
  { kind: "rect", x: 31, y: 45, w: 26, h: 12, r: 4, color: GREEN }, // F middle arm
  { kind: "circle", cx: 70, cy: 66, r: 10, color: GOLD }, // coin
  { kind: "ring", cx: 70, cy: 66, r: 5.5, width: 2.2, color: GOLD_DARK, cutout: true }, // coin rim
];

/** Bounding box of the artwork, used to center it where needed. */
const ART_CENTER = { x: (31 + 80) / 2, y: (24 + 76) / 2 };

// ---- Geometry ---------------------------------------------------------------

function inside(shape, x, y) {
  switch (shape.kind) {
    case "rect": {
      if (x < shape.x || x > shape.x + shape.w || y < shape.y || y > shape.y + shape.h) return false;
      const cx = Math.min(Math.max(x, shape.x + shape.r), shape.x + shape.w - shape.r);
      const cy = Math.min(Math.max(y, shape.y + shape.r), shape.y + shape.h - shape.r);
      return (x - cx) ** 2 + (y - cy) ** 2 <= shape.r ** 2;
    }
    case "circle":
      return (x - shape.cx) ** 2 + (y - shape.cy) ** 2 <= shape.r ** 2;
    case "ring": {
      const d = Math.hypot(x - shape.cx, y - shape.cy);
      return Math.abs(d - shape.r) <= shape.width / 2;
    }
    default:
      throw new Error(`Unknown shape ${shape.kind}`);
  }
}

function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Renders the design to RGBA pixels.
 * - scale / center: artwork point `center` maps to the canvas middle, scaled by `scale`
 * - background: hex color, or null for transparent
 * - monochrome: every shape white; `cutout` shapes punch holes instead
 * - cornerRadius: optional rounded-square mask, as a fraction of the size
 */
function render(size, { scale = 1, center = { x: 50, y: 50 }, background = null, monochrome = false, cornerRadius = 0 }) {
  const SS = 4;
  const px = new Uint8Array(size * size * 4);
  const bg = background ? hex(background) : null;
  const shapes = SHAPES.map((s) => ({ ...s, rgb: monochrome ? [255, 255, 255] : hex(s.color) }));
  const maskR = cornerRadius * 100;

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // canvas position in 0..100
          const u = ((pxi + (sx + 0.5) / SS) / size) * 100;
          const v = ((py + (sy + 0.5) / SS) / size) * 100;
          if (maskR > 0 && !inside({ kind: "rect", x: 0, y: 0, w: 100, h: 100, r: maskR }, u, v)) continue;
          // artwork position
          const x = (u - 50) / scale + center.x;
          const y = (v - 50) / scale + center.y;

          let color = bg;
          for (const s of shapes) {
            if (!inside(s, x, y)) continue;
            color = monochrome && s.cutout ? bg : s.rgb;
          }
          if (color) {
            r += color[0]; g += color[1]; b += color[2]; a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + pxi) * 4;
      // Un-premultiply so edge pixels keep their true color.
      const covered = a / 255;
      px[i] = covered ? Math.round(r / covered) : 0;
      px[i + 1] = covered ? Math.round(g / covered) : 0;
      px[i + 2] = covered ? Math.round(b / covered) : 0;
      px[i + 3] = Math.round(a / n);
    }
  }
  return px;
}

// ---- PNG encoding -----------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** opaque: write RGB (no alpha channel), as App Store icons require. */
function encodePng(size, rgba, { opaque = false } = {}) {
  const channels = opaque ? 3 : 4;
  const raw = Buffer.alloc(size * (size * channels + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * channels + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = row + 1 + x * channels;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      if (!opaque) raw[dst + 3] = rgba[src + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = opaque ? 2 : 6; // RGB or RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Outputs ----------------------------------------------------------------

// Android adaptive icons keep only a centered circle 66/108 of the layer wide;
// 0.8 keeps the coin (the farthest point) inside it with some margin.
const ADAPTIVE_SCALE = 0.8;
// Splash artwork is centered and kept inside the circle Android 12+ may mask to.
const SPLASH_SCALE = 0.88;

const OUTPUTS = [
  {
    file: "icon.png",
    size: 1024,
    opaque: true,
    options: { background: BRAND_BACKGROUND },
  },
  {
    file: "android-icon-foreground.png",
    size: 1024,
    options: { scale: ADAPTIVE_SCALE },
  },
  {
    file: "android-icon-monochrome.png",
    size: 1024,
    options: { scale: ADAPTIVE_SCALE, monochrome: true },
  },
  {
    file: "splash-icon.png",
    size: 1024,
    options: { scale: SPLASH_SCALE, center: ART_CENTER },
  },
  {
    file: "favicon.png",
    size: 48,
    options: { background: BRAND_BACKGROUND, cornerRadius: 0.22 },
  },
];

for (const { file, size, opaque, options } of OUTPUTS) {
  const png = encodePng(size, render(size, options), { opaque });
  writeFileSync(join(OUT_DIR, file), png);
  console.log(`wrote assets/images/${file} (${size}x${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
