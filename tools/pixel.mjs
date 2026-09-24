// Biblioteca de pixel art para Node (pngjs): imágenes RGBA, paletas, matrices de caracteres,
// espejado, capas, contorno automático, hojas 4×4 y vistas previas ampliadas.
//
// Uso como CLI (herramientas de inspección):
//   node tools/pixel.mjs zoom <entrada.png> <salida.png> [escala=4] [--grid=64]
//   node tools/pixel.mjs crop <entrada.png> <salida.png> x y w h [escala=1]
//   node tools/pixel.mjs palette <entrada.png>           → lista de colores con recuento
//   node tools/pixel.mjs bbox <hoja.png> <frameW> <frameH> → caja opaca de cada frame
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

// ───────────────────────────── Colores ─────────────────────────────

/** '#RRGGBB' | '#RRGGBBAA' → [r, g, b, a]. */
export function hex(color) {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(String(color).trim());
  if (!m) throw new Error(`Color no válido: ${color}`);
  const n = parseInt(m[1], 16);
  const a = m[2] ? parseInt(m[2], 16) : 255;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

export function toHex([r, g, b, a = 255]) {
  const h = (v) => v.toString(16).padStart(2, '0').toUpperCase();
  return `#${h(r)}${h(g)}${h(b)}${a === 255 ? '' : h(a)}`;
}

/** Mezcla lineal de dos colores hex (t = 0 → a, 1 → b). */
export function mix(a, b, t) {
  const ca = hex(a);
  const cb = hex(b);
  return toHex(ca.map((v, i) => Math.round(v + (cb[i] - v) * t)));
}

// ───────────────────────────── Imagen ─────────────────────────────

export class Img {
  constructor(w, h, data = null) {
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) throw new Error(`Tamaño no válido ${w}×${h}`);
    this.w = w;
    this.h = h;
    this.data = data || new Uint8ClampedArray(w * h * 4);
  }

  static load(file) {
    const png = PNG.sync.read(fs.readFileSync(file));
    return new Img(png.width, png.height, new Uint8ClampedArray(png.data));
  }

  save(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const png = new PNG({ width: this.w, height: this.h });
    png.data = Buffer.from(this.data);
    fs.writeFileSync(file, PNG.sync.write(png));
    return file;
  }

  clone() {
    return new Img(this.w, this.h, new Uint8ClampedArray(this.data));
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x, y) {
    if (!this.inside(x, y)) return [0, 0, 0, 0];
    const i = (y * this.w + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  alpha(x, y) {
    return this.inside(x, y) ? this.data[(y * this.w + x) * 4 + 3] : 0;
  }

  set(x, y, rgba) {
    if (!this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = rgba[0];
    this.data[i + 1] = rgba[1];
    this.data[i + 2] = rgba[2];
    this.data[i + 3] = rgba[3] === undefined ? 255 : rgba[3];
  }

  fill(rgba) {
    for (let i = 0; i < this.w * this.h; i++) this.data.set(rgba, i * 4);
    return this;
  }

  /** Copia `src` en (dx, dy). Solo píxeles opacos (alpha > 0) salvo `{ replace: true }`. */
  blit(src, dx = 0, dy = 0, { replace = false } = {}) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.get(x, y);
        if (c[3] === 0 && !replace) continue;
        this.set(x + dx, y + dy, c);
      }
    }
    return this;
  }

  crop(x, y, w, h) {
    const out = new Img(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.set(i, j, this.get(x + i, y + j));
    return out;
  }

  /** Espejo horizontal (nueva imagen). */
  mirrorX() {
    const out = new Img(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) out.set(this.w - 1 - x, y, this.get(x, y));
    return out;
  }

  /** Ampliación entera por vecino más próximo (nueva imagen). */
  scale(n) {
    if (!Number.isInteger(n) || n < 1) throw new Error(`Escala entera requerida: ${n}`);
    const out = new Img(this.w * n, this.h * n);
    for (let y = 0; y < out.h; y++) {
      for (let x = 0; x < out.w; x++) {
        const si = (Math.floor(y / n) * this.w + Math.floor(x / n)) * 4;
        const di = (y * out.w + x) * 4;
        out.data[di] = this.data[si];
        out.data[di + 1] = this.data[si + 1];
        out.data[di + 2] = this.data[si + 2];
        out.data[di + 3] = this.data[si + 3];
      }
    }
    return out;
  }

  /** Sustituye colores exactos: { '#RRGGBB': '#RRGGBB' }. */
  replaceColors(map) {
    const pairs = Object.entries(map).map(([a, b]) => [hex(a), hex(b)]);
    const out = this.clone();
    for (let i = 0; i < out.data.length; i += 4) {
      if (out.data[i + 3] === 0) continue;
      for (const [from, to] of pairs) {
        if (out.data[i] === from[0] && out.data[i + 1] === from[1] && out.data[i + 2] === from[2]) {
          out.data.set(to, i);
          break;
        }
      }
    }
    return out;
  }

  /** Caja opaca mínima { x, y, w, h } o null si está vacía. */
  bbox() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) === 0) continue;
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  /** Colores distintos → recuento, ordenados de más a menos usados. */
  colors() {
    const counts = new Map();
    for (let i = 0; i < this.data.length; i += 4) {
      if (this.data[i + 3] === 0) continue;
      const key = toHex([this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]]);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }
}

// ───────────────────────── Matrices de caracteres ─────────────────────────

/**
 * Dibuja una matriz de caracteres con una paleta { char: '#RRGGBB' }.
 * '.' y ' ' son transparentes. Las filas pueden tener longitudes distintas.
 */
export function fromRows(rows, palette, { w = null, h = null } = {}) {
  const width = w || Math.max(...rows.map((r) => r.length));
  const height = h || rows.length;
  const img = new Img(width, height);
  const cache = {};
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      if (!(ch in palette)) throw new Error(`Carácter "${ch}" sin color en la paleta (fila ${y}: "${row}")`);
      cache[ch] = cache[ch] || hex(palette[ch]);
      img.set(x, y, cache[ch]);
    });
  });
  return img;
}

/** Superpone capas [{ img, x, y }] (o Img) sobre un lienzo w×h. */
export function compose(w, h, layers) {
  const out = new Img(w, h);
  for (const layer of layers) {
    if (!layer) continue;
    if (layer instanceof Img) out.blit(layer, 0, 0);
    else out.blit(layer.img, layer.x || 0, layer.y || 0);
  }
  return out;
}

/**
 * Añade contorno de 1 px de `color` alrededor de los píxeles opacos (4-vecinos).
 * No toca píxeles ya opacos.
 */
export function outline(img, color) {
  const c = hex(color);
  const out = img.clone();
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.alpha(x, y)) continue;
      if (img.alpha(x - 1, y) || img.alpha(x + 1, y) || img.alpha(x, y - 1) || img.alpha(x, y + 1)) out.set(x, y, c);
    }
  }
  return out;
}

/** Píxeles opacos aislados (sin ningún vecino opaco en 8 direcciones): lista [[x,y]]. */
export function strayPixels(img) {
  const list = [];
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (!img.alpha(x, y)) continue;
      let n = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && img.alpha(x + i, y + j)) n += 1;
      if (n === 0) list.push([x, y]);
    }
  }
  return list;
}

// ───────────────────────────── Hojas ─────────────────────────────

/** frames[fila][col] (Img de frameW×frameH) → hoja. */
export function sheet(frames, frameW, frameH) {
  const rows = frames.length;
  const cols = Math.max(...frames.map((r) => r.length));
  const out = new Img(cols * frameW, rows * frameH);
  frames.forEach((row, r) => row.forEach((f, c) => {
    if (!f) return;
    if (f.w !== frameW || f.h !== frameH) throw new Error(`Frame ${r},${c} mide ${f.w}×${f.h}, se esperaba ${frameW}×${frameH}`);
    out.blit(f, c * frameW, r * frameH);
  }));
  return out;
}

/** Divide una hoja en frames[fila][col]. */
export function splitSheet(img, frameW, frameH) {
  const frames = [];
  for (let r = 0; r < Math.floor(img.h / frameH); r++) {
    const row = [];
    for (let c = 0; c < Math.floor(img.w / frameW); c++) row.push(img.crop(c * frameW, r * frameH, frameW, frameH));
    frames.push(row);
  }
  return frames;
}

/**
 * Vista previa: amplía ×scale sobre un fondo (color o damero) y dibuja rejilla cada `grid` px de origen.
 */
export function preview(img, { scale = 4, bg = 'checker', grid = 0, gridColor = '#FF00FF80' } = {}) {
  const base = new Img(img.w, img.h);
  const a = hex('#C8D0D8');
  const b = hex('#E8ECF0');
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (bg === 'checker') base.set(x, y, ((x >> 2) + (y >> 2)) % 2 ? a : b);
      else base.set(x, y, hex(bg));
    }
  }
  base.blit(img);
  const out = base.scale(scale);
  if (grid > 0) {
    const gc = hex(gridColor);
    const blend = (x, y) => {
      const c = out.get(x, y);
      const t = gc[3] / 255;
      out.set(x, y, [0, 1, 2].map((i) => Math.round(c[i] * (1 - t) + gc[i] * t)).concat(255));
    };
    for (let x = 0; x < out.w; x += grid * scale) for (let y = 0; y < out.h; y++) blend(x, y);
    for (let y = 0; y < out.h; y += grid * scale) for (let x = 0; x < out.w; x++) blend(x, y);
  }
  return out;
}

// ───────────────────────────── CLI ─────────────────────────────

function cli(argv) {
  const [cmd, ...rest] = argv;
  const flags = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  }));
  const args = rest.filter((a) => !a.startsWith('--'));
  switch (cmd) {
    case 'zoom': {
      const [inp, out, s = '4'] = args;
      const img = Img.load(inp);
      preview(img, { scale: Number(s), grid: Number(flags.grid || 0), bg: flags.bg || 'checker' }).save(out);
      console.log(`${out} (${img.w}×${img.h} ×${s})`);
      break;
    }
    case 'crop': {
      const [inp, out, x, y, w, h, s = '1'] = args;
      const img = Img.load(inp).crop(Number(x), Number(y), Number(w), Number(h));
      preview(img, { scale: Number(s), bg: flags.bg || 'checker' }).save(out);
      console.log(out);
      break;
    }
    case 'palette': {
      for (const [c, n] of Img.load(args[0]).colors()) console.log(`${c}\t${n}`);
      break;
    }
    case 'bbox': {
      const [inp, fw, fh] = args;
      const frames = splitSheet(Img.load(inp), Number(fw), Number(fh));
      frames.forEach((row, r) => console.log(`fila ${r}: ${row.map((f) => JSON.stringify(f.bbox())).join(' ')}`));
      break;
    }
    default:
      console.log('Comandos: zoom | crop | palette | bbox (ver cabecera de tools/pixel.mjs)');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    cli(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  }
}
