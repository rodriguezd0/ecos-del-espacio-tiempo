// Tiles del Mundo Distorsión (Pilar Invertido, B12; PROVISIONAL D30): islas flotantes de piedra violácea con su cara
// de roca colgando sobre el vacío, bloques de roca, bloques de «cara vuelta» con vetas violetas (paredes que son
// suelo en el gemelo girado), vetas de arista y detalles de suelo. Cueva1 (tilesets 2 y 12–15) no trae nada parecido.
// Los tiles van AL FINAL del atlas Cueva1 (tras `tileCount`, alineados a filas de 8 columnas de la disposición
// original para que los pinceles `nine` y `line` funcionen con coordenadas [col, fila]), con su pasabilidad en
// tilesets.json (base en `distortion.base`) para todos los tilesets de esa imagen, y el mapa nombre → [col, fila]
// se escribe en game/src/content/stamps/distortion.js. Idempotente. Se ejecuta en `npm run data` tras beach_corners.
// Uso: node tools/distortion_tiles.mjs [--check] [--preview]   (hoja: tools/cache/stamps/extra/distortion.png)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { ATLAS_COLUMNS, TILE, FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';
import { readTile, writeTile, ensureHeight } from './lib/atlas_tiles.mjs';
import { Img, hex, preview } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = path.join(ROOT, 'game', 'data', 'tilesets.json');
const ATLAS_DIR = path.join(ROOT, 'game', 'assets', 'tilesets');
const OUT_MODULE = path.join(ROOT, 'game', 'src', 'content', 'stamps', 'distortion.js');
const SHEET = path.join(ROOT, 'tools', 'cache', 'stamps', 'extra', 'distortion.png');
const IMAGE = 'Cueva1';
const CHECK = process.argv.includes('--check');
const N = 16; // píxeles de arte por tile (se amplía ×2)
const BLOCK = 0x0f;

// ───────────────────────────── paleta ─────────────────────────────

const C = {
  out: '#1A1628', lip: '#2E2A46', rimHi: '#A8A2D0', rimMid: '#7C77A6',
  slab: ['#5F5A7C', '#666184', '#58537A', '#625C82'], slabHi: '#78739C', mortar: '#443F60', mortarDk: '#383352', speck: '#7E88A4', glint: '#C49AF6',
  face: ['#3B3656', '#332E4C', '#2A2641', '#221E36'], faceHi: '#4E4970', faceCrack: '#1C182C', crystal: '#B27CF2', crystalHi: '#E6CCFF',
  rockTop: ['#4E4A6A', '#54506F', '#484464'], rockHi: '#6A6690', rockSide: ['#35304D', '#2D2944', '#26223A'], rockCrack: '#1E1A30',
  veinTop: ['#463E6C', '#4B4372', '#41396A'], vein: '#9C5EE6', veinHi: '#DCB8FF', veinDk: '#5E3496',
};
const H = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, Array.isArray(v) ? v.map(hex) : hex(v)]));

// PRNG determinista por tile
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ───────────────────────────── forma de un tile de nine ─────────────────────────────

const R = 4; // radio de las esquinas convexas (px de arte)
/**
 * Distancia al borde de la forma y normal hacia dentro para el píxel (x, y) de un tile de nine.
 * kind: { col, row } convexo (0..2) o { inner: 'NW'|'NE'|'SW'|'SE' } cóncavo. → { inside, d, nx, ny }
 */
function shapeAt(kind, x, y) {
  const px = x + 0.5;
  const py = y + 0.5;
  if (kind.inner) {
    const cx = kind.inner.includes('W') ? 0 : N;
    const cy = kind.inner.includes('N') ? 0 : N;
    const dx = px - cx;
    const dy = py - cy;
    const d = Math.hypot(dx, dy) - 0.8;
    return { inside: true, d, nx: dx / (Math.hypot(dx, dy) || 1), ny: dy / (Math.hypot(dx, dy) || 1) };
  }
  const { col, row } = kind;
  const edges = [];
  if (col === 0) edges.push({ d: px, nx: 1, ny: 0 });
  if (col === 2) edges.push({ d: N - px, nx: -1, ny: 0 });
  if (row === 0) edges.push({ d: py, nx: 0, ny: 1 });
  if (row === 2) edges.push({ d: N - py, nx: 0, ny: -1 });
  if (!edges.length) return { inside: true, d: 99, nx: 0, ny: 0 };
  // esquina convexa redondeada
  if (edges.length === 2) {
    const ex = edges.find((e) => e.nx);
    const ey = edges.find((e) => e.ny);
    if (ex.d < R && ey.d < R) {
      const dx = R - ex.d;
      const dy = R - ey.d;
      const dist = Math.hypot(dx, dy);
      const len = dist || 1;
      return { inside: dist <= R, d: R - dist, nx: (ex.nx * dx) / len, ny: (ey.ny * dy) / len };
    }
  }
  const e = edges.reduce((a, b) => (b.d < a.d ? b : a));
  return { inside: e.d >= 0, d: e.d, nx: e.nx, ny: e.ny };
}

const KINDS = [
  ...[0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => ({ name: `c${col}r${row}`, kind: { col, row }, at: [col, row] }))),
  { name: 'inNW', kind: { inner: 'NW' }, at: [3, 0] }, { name: 'inNE', kind: { inner: 'NE' }, at: [4, 0] },
  { name: 'inSW', kind: { inner: 'SW' }, at: [3, 1] }, { name: 'inSE', kind: { inner: 'SE' }, at: [4, 1] },
];

// ───────────────────────────── texturas ─────────────────────────────

/**
 * Piedra agrietada PERIÓDICA (Voronoi en un toro de 16 px): cualquier tile que la use encaja con sus vecinos, así
 * que bordes, esquinas y centro de un mismo pincel forman una superficie continua. → { cell, edge } del píxel.
 */
function voronoi(points, x, y) {
  let d1 = Infinity;
  let d2 = Infinity;
  let cell = 0;
  points.forEach(([px, py], i) => {
    for (const ox of [-N, 0, N]) {
      for (const oy of [-N, 0, N]) {
        const d = Math.hypot(x + 0.5 - (px + ox), y + 0.5 - (py + oy));
        if (d < d1) { d2 = d1; d1 = d; cell = i; } else if (d < d2) d2 = d;
      }
    }
  });
  return { cell, edge: d2 - d1 };
}

const STONE_PTS = [[3, 3], [11, 2], [7, 8], [14, 10], [2, 12], [9, 14]];
const ROCK_PTS = [[4, 4], [12, 5], [7, 12], [15, 14]];

/** Color de la piedra de la isla en el píxel (x, y) del tile (textura periódica). */
function stoneColor(x, y) {
  const v = voronoi(STONE_PTS, x, y);
  if (v.edge < 1.1) return H.mortar;
  // bisel: el píxel justo debajo de una grieta se aclara, el de encima se oscurece
  const below = voronoi(STONE_PTS, x, (y + N - 1) % N);
  if (below.edge < 1.1) return H.slabHi;
  const above = voronoi(STONE_PTS, x, (y + 1) % N);
  if (above.edge < 1.1) return H.mortarDk;
  const base = H.slab[v.cell % H.slab.length];
  const h = ((x * 73 + y * 151 + v.cell * 17) % 97) / 97;
  if (h < 0.04) return H.speck;
  return base;
}

function rimColor(s, { hi, mid, lip }) {
  if (s.ny > 0.45) return hi;
  if (s.ny < -0.45) return lip;
  return mid;
}

/** Tile de isla (suelo): textura de piedra, reborde claro arriba, labio oscuro abajo y contorno. */
function paintIslandTile(kind) {
  const img = new Img(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const s = shapeAt(kind, x, y);
      if (!s.inside) continue;
      let c;
      if (s.d < 1) c = H.out;
      else if (s.d < 2.6) c = rimColor(s, { hi: H.rimHi, mid: H.rimMid, lip: H.lip });
      else if (s.d < 3.6 && s.ny < -0.45) c = H.lip;
      else c = stoneColor(x, y);
      img.set(x, y, c);
    }
  }
  return img;
}

/** Variante del centro de la isla con un detalle propio (brillo, glifo gastado, grieta mayor). */
function paintIslandVariant(v) {
  const img = paintIslandTile({ col: 1, row: 1 });
  if (v === 1) for (const [x, y] of [[12, 3], [4, 11]]) { img.set(x, y, H.glint); img.set(x + 1, y + 1, H.crystal); }
  if (v === 2) for (const [x, y] of [[5, 5], [6, 4], [9, 4], [10, 5], [10, 9], [9, 10], [6, 10], [5, 9]]) img.set(x, y, H.speck);
  if (v === 3) for (const [x, y] of [[2, 3], [3, 4], [4, 5], [5, 5], [6, 6], [7, 7], [8, 7], [9, 8], [10, 9], [11, 10], [7, 8], [6, 9]]) img.set(x, y, H.mortarDk);
  return img;
}

/** Bloque de roca ('#') o de cara vuelta (paredes que son suelo en el gemelo). */
function paintRockTile(kind, { veined = false } = {}) {
  const img = new Img(N, N);
  const tops = veined ? H.veinTop : H.rockTop;
  const front = kind.row === 2 && !kind.inner; // fila inferior: la cara frontal del bloque
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const s = shapeAt(kind, x, y);
      if (!s.inside) continue;
      let c;
      if (s.d < 1) c = H.rockCrack;
      else if (front && y >= 5) {
        // cara vertical: estratos (o, en la cara vuelta, las losas del suelo vistas de canto con juntas que brillan)
        const band = Math.min(H.rockSide.length - 1, Math.floor((y - 5) / 4));
        c = H.rockSide[band];
        if (veined) {
          if (x % 8 === 3) c = y % 2 ? H.veinHi : H.vein;
          else if (x % 8 === 4) c = H.veinDk;
        } else if ((x * 5 + y * 7) % 13 === 0) c = H.rockCrack;
        if (s.d < 2) c = H.rockCrack;
      } else if (s.d < 2.4) {
        c = rimColor(s, { hi: veined ? H.veinHi : H.rockHi, mid: tops[0], lip: H.rockSide[0] });
      } else if (veined) {
        // la piedra del suelo girada 90°: juntas verticales que laten en violeta
        const st = stoneColor(y, x);
        if (st === H.mortar) c = (x * 3 + y) % 4 === 0 ? H.vein : H.veinDk;
        else if (st === H.mortarDk) c = H.veinDk;
        else if (st === H.slabHi) c = tops[1];
        else c = tops[(x + 2 * y) % tops.length];
      } else {
        const v = voronoi(ROCK_PTS, x, y);
        c = v.edge < 1.2 ? H.rockCrack : tops[v.cell % tops.length];
        if (voronoi(ROCK_PTS, x, (y + N - 1) % N).edge < 1.2 && v.edge >= 1.2) c = H.rockHi;
      }
      img.set(x, y, c);
    }
  }
  return img;
}

/** Cara de roca que cuelga bajo el borde sur de una isla (capa 2, sobre el vacío). part: 'L' | 'M' | 'R' */
function paintFace(part, seed = 3) {
  const img = new Img(N, N);
  const rand = rng(seed);
  const depth = [];
  for (let x = 0; x < N; x++) depth.push(11 + Math.floor(rand() * 4) + (x % 5 === 2 ? 1 : 0));
  for (let x = 0; x < N; x++) {
    let inset = 0;
    if (part === 'L') inset = Math.max(0, 6 - x);
    if (part === 'R') inset = Math.max(0, x - (N - 7));
    const bottom = depth[x] - inset;
    for (let y = 0; y < bottom; y++) {
      const band = Math.min(H.face.length - 1, Math.floor((y * H.face.length) / 15));
      let c = H.face[band];
      if (y === 0) c = H.lip;
      else if (y === 1) c = H.faceHi;
      if ((x * 7 + y * 3) % 13 === 0 && y > 2) c = H.faceCrack;
      if (y === bottom - 1 || (part === 'L' && x === inset) || (part === 'R' && x === N - 1 - inset)) c = H.faceCrack;
      img.set(x, y, c);
    }
  }
  // cristales violetas incrustados
  const spots = part === 'M' ? [[4, 6], [11, 8]] : part === 'L' ? [[10, 6]] : [[5, 7]];
  for (const [cx, cy] of spots) {
    img.set(cx, cy, H.crystal); img.set(cx, cy + 1, H.crystal); img.set(cx + 1, cy + 1, H.crystalHi); img.set(cx, cy + 2, H.crystal); img.set(cx - 1, cy + 2, H.veinDk);
  }
  return img;
}

/** Veta violeta de arista (calco con transparencia sobre el suelo). */
function paintVein() {
  const img = new Img(N, N);
  const main = [[1, 14], [2, 13], [3, 12], [4, 12], [5, 11], [6, 10], [7, 9], [8, 8], [9, 7], [10, 6], [11, 5], [12, 4], [13, 3], [14, 2]];
  const branch = [[7, 9], [6, 8], [5, 7], [9, 7], [10, 8], [11, 8]];
  const glow = (x, y, c) => { if (img.inside(x, y) && !img.alpha(x, y)) img.set(x, y, c); };
  for (const [x, y] of [...main, ...branch]) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) glow(x + dx, y + dy, [94, 52, 150, 150]);
  }
  for (const [x, y] of branch) img.set(x, y, H.vein);
  for (const [x, y] of main) img.set(x, y, (x + y) % 4 === 0 ? H.veinHi : H.vein);
  // hexágono tenue en el centro
  for (const [x, y] of [[7, 6], [9, 6], [6, 8], [10, 8], [7, 10], [9, 10]]) img.set(x, y, H.veinHi);
  return img;
}

/** Detalles de suelo (calcos): grieta, glifo gastado, guijarros. */
function paintDecal(kind) {
  const img = new Img(N, N);
  if (kind === 'grieta') {
    for (const [x, y] of [[2, 4], [3, 5], [4, 5], [5, 6], [6, 7], [7, 7], [8, 8], [9, 9], [10, 9], [11, 10], [6, 8], [5, 9], [12, 11]]) img.set(x, y, H.mortarDk);
  } else if (kind === 'glifo') {
    for (const [x, y] of [[6, 4], [7, 4], [8, 4], [9, 4], [5, 5], [10, 5], [5, 6], [10, 6], [5, 9], [10, 9], [5, 10], [10, 10], [6, 11], [7, 11], [8, 11], [9, 11], [7, 7], [8, 8]]) img.set(x, y, [150, 110, 220, 170]);
  } else {
    for (const [x, y, c] of [[3, 10, H.speck], [4, 10, H.mortar], [9, 4, H.speck], [10, 5, H.mortar], [12, 12, H.speck], [6, 13, H.rimMid], [7, 13, H.mortar]]) img.set(x, y, c);
  }
  return img;
}

// ───────────────────────────── disposición (8 columnas) ─────────────────────────────

/** Piezas: nombre → { at: [col, fila], w, h, tiles: Img[fila][col], pass: 'x'/'.' por celda } */
function pieces() {
  const out = {};
  const nine = (name, at, paint) => {
    const tiles = [[], [], []];
    const pass = ['.....', '.....', '...  '];
    for (const k of KINDS) tiles[k.at[1]][k.at[0]] = paint(k.kind, k.at);
    out[name] = { kind: 'nine', at, w: 5, h: 3, tiles, pass };
  };
  nine('dist_isla', [0, 0], (kind) => paintIslandTile(kind));
  nine('dist_roca', [0, 3], (kind) => paintRockTile(kind));
  nine('dist_vuelta', [0, 6], (kind) => paintRockTile(kind, { veined: true }));
  for (const n of ['dist_roca', 'dist_vuelta']) out[n].pass = ['xxxxx', 'xxxxx', 'xxx  '];
  out.dist_cara = { kind: 'line', at: [5, 0], w: 3, h: 1, tiles: [[paintFace('L', 5), paintFace('M', 6), paintFace('R', 7)]], pass: ['...'] };
  out.dist_losas = { kind: 'tiles', at: [5, 1], w: 3, h: 1, tiles: [[1, 2, 3].map((v) => paintIslandVariant(v))], pass: ['...'] };
  out.dist_veta = { kind: 'tiles', at: [5, 2], w: 1, h: 1, tiles: [[paintVein()]], pass: ['.'] };
  out.dist_detalles = { kind: 'tiles', at: [5, 3], w: 3, h: 1, tiles: [['grieta', 'glifo', 'guijarros'].map(paintDecal)], pass: ['...'] };
  return out;
}

const ROWS = 9;

// ───────────────────────────── aplicación ─────────────────────────────

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const users = Object.values(db.tilesets).filter((ts) => ts && ts.image === IMAGE);
if (!users.length) throw new Error(`distortion_tiles: ningún tileset usa ${IMAGE}`);
const first = users[0];
const base = first.distortion?.base ?? Math.ceil(Math.max(...users.map((u) => u.tileCount)) / 8) * 8;
const row0 = base / 8;
const P = pieces();

const file = path.join(ATLAS_DIR, `${IMAGE}.png`);
let png = PNG.sync.read(fs.readFileSync(file));
png = ensureHeight(png, Math.ceil((base + ROWS * 8) / ATLAS_COLUMNS));
let pending = false;
const ids = {};
const props = new Map();
for (const [name, p] of Object.entries(P)) {
  ids[name] = [p.at[0], row0 + p.at[1]];
  for (let r = 0; r < p.h; r++) {
    for (let c = 0; c < p.w; c++) {
      const art = p.tiles[r]?.[c];
      if (!art || (p.pass[r] || '')[c] === ' ') continue;
      const id = FIRST_REGULAR_TILE + (row0 + p.at[1] + r) * 8 + p.at[0] + c;
      const big = art.scale(2);
      const data = Buffer.from(big.data);
      if (!readTile(png, id).equals(data)) {
        pending = true;
        if (!CHECK) writeTile(png, id, data);
      }
      props.set(id, { passage: (p.pass[r] || '')[c] === 'x' ? BLOCK : 0 });
    }
  }
}
for (const ts of users) {
  const before = JSON.stringify([ts.tileCount, ts.distortion]);
  const end = base + ROWS * 8;
  // Rellena huecos anteriores (null en JSON) y fija las propiedades de las piezas.
  for (let id = FIRST_REGULAR_TILE + ts.tileCount; id < FIRST_REGULAR_TILE + end; id++) {
    const pr = props.get(id) || { passage: 0 };
    if (ts.passages[id] !== pr.passage || ts.priorities[id] !== 0 || ts.terrainTags[id] !== 0) pending = true;
    ts.passages[id] = pr.passage;
    ts.priorities[id] = 0;
    ts.terrainTags[id] = 0;
  }
  for (const [id, pr] of props) {
    if (ts.passages[id] !== pr.passage) pending = true;
    ts.passages[id] = pr.passage;
    ts.priorities[id] = 0;
    ts.terrainTags[id] = 0;
  }
  ts.tileCount = Math.max(ts.tileCount, end);
  ts.atlasHeight = png.height;
  ts.distortion = { base, row: row0, rows: ROWS };
  if (JSON.stringify([ts.tileCount, ts.distortion]) !== before) pending = true;
}

const moduleText = `// GENERADO por tools/distortion_tiles.mjs — no editar a mano.
// Tiles del Mundo Distorsión (B12) al final del atlas ${IMAGE} (tilesets ${users.map((u) => u.id).join(', ')}): [columna, fila] de la
// disposición original de 8 columnas (id = 384 + fila·8 + columna). Los pinceles de content/maps/b12/paint.js los usan.
export const DISTORTION_ROW = ${row0};
export const DISTORTION_TILES = ${JSON.stringify(ids)};
`;
const moduleStale = !fs.existsSync(OUT_MODULE) || fs.readFileSync(OUT_MODULE, 'utf8') !== moduleText;

function writeSheet() {
  const sheetImg = new Img(8 * N, ROWS * N);
  for (const p of Object.values(P)) {
    for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) if (p.tiles[r]?.[c]) sheetImg.blit(p.tiles[r][c], (p.at[0] + c) * N, (p.at[1] + r) * N);
  }
  preview(sheetImg, { scale: 4, bg: '#101018', grid: N }).save(SHEET);
  console.log(`hoja → ${path.relative(ROOT, SHEET)}`);
}

if (CHECK) {
  if (pending || moduleStale) {
    console.error('Los tiles del Mundo Distorsión no están al día: ejecuta node tools/distortion_tiles.mjs');
    process.exitCode = 1;
  } else console.log('Tiles del Mundo Distorsión al día.');
} else {
  fs.writeFileSync(file, PNG.sync.write(png));
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
  fs.writeFileSync(OUT_MODULE, moduleText);
  console.log(`${IMAGE}: ${props.size} tiles del Mundo Distorsión desde la fila ${row0} (índice ${base}) → tilesets ${users.map((u) => u.id).join(', ')}`);
  if (process.argv.includes('--preview')) writeSheet();
}
