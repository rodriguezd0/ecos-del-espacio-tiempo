// MapBuilder: DSL determinista para construir las 3 capas RMXP de un mapa (docs/ARCHITECTURE.md §5).
// Módulo puro (sin DOM): se usa en el navegador (MapScene) y en Node (preview_map, tests).
//
// Consume la biblioteca de stamps del tileset (content/stamps, formato horneado { w, h, layers[3] }) y
// sus brushes. Los tipos simples se pintan aquí; los complejos (forest, cliff, terrace…) se delegan en
// `paintBrush` de content/stamps/brushes.js si está disponible. Todo tolera la ausencia de la biblioteca.
//
// Pinceles (brush): número (ID RMXP; 0 borra) · 'nombre' (biblioteca o `brushes` del mapa) · objeto:
//   { tile, variants?, chance? }  { pattern:[x,y,w,h] }  { grid:[[id…]…] }  { autotile: slot }
//   { autotile, patterns:[p…], pick?:'random'|'checker' }  { nine:[x,y], inner?:[x,y], fill?:id|0 }
//   { line:{ ids|src, axis } }  { forest… } { cliff… } { terrace… } (delegados)   { erase: true }
// `layer` en los métodos: número de capa o null (= capa por defecto del pincel).
import { FIRST_REGULAR_TILE, resolveAutotileId } from '../shared/autotile.js';
import { createRng, hashString } from './prng.js';

export const LAYERS = 3;
const ORIGINAL_COLUMNS = 8;

/** ID RMXP de un tile del tileset original (8 columnas) en coordenadas de tile. */
export const srcTileId = (x, y) => FIRST_REGULAR_TILE + y * ORIGINAL_COLUMNS + x;

/** Hash determinista de casilla (mismo criterio que content/stamps/brushes.js). */
export function cellHash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const DEFAULT_LAYER = { id: 0, tile: 0, pattern: 0, grid: 0, autotile: 0, autofixed: 0, nine: 1, line: 1, forest: 2, delegate: 1 };
const mod = (a, n) => ((a % n) + n) % n;

export class MapBuilder {
  /**
   * @param {object} opts
   *   width, height, tileset, id (semilla), seed?
   *   library?: { stamps, brushes }  biblioteca del tileset (puede faltar)
   *   stamps?, brushes?: definiciones del mapa (prioridad sobre la biblioteca)
   *   fallback?: { stamps, brushes } solo se usan si la biblioteca no tiene ese nombre
   *   paintBrush?: (brush, cells, opts) => [{x,y,layer,id}]  pintor de content/stamps/brushes.js
   *   isEmpty?: (tileId) => bool  tiles totalmente transparentes (no se copian desde stamps `src`)
   *   anilMap?: (mapId) => { width, height, layers } para stamps `from` sin hornear (solo Node)
   *   warn?: (msg) => void
   */
  constructor(opts) {
    const { width, height } = opts;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error(`MapBuilder: tamaño de mapa inválido ${width}x${height}`);
    }
    this.width = width;
    this.height = height;
    this.tileset = opts.tileset;
    this.layers = Array.from({ length: LAYERS }, () => new Uint16Array(width * height));
    this.autoSlots = Array.from({ length: LAYERS }, () => new Int8Array(width * height).fill(-1));
    this.seed = opts.seed ?? hashString(opts.id || 'mapa');
    this.rng = createRng(this.seed);
    this.library = opts.library || { stamps: {}, brushes: {} };
    this.own = { stamps: opts.stamps || {}, brushes: opts.brushes || {} };
    this.fallback = { stamps: opts.fallback?.stamps || {}, brushes: opts.fallback?.brushes || {} };
    this.painter = opts.paintBrush || null;
    this.isEmpty = opts.isEmpty || (() => false);
    this.anilMap = opts.anilMap || null;
    this.warn = opts.warn || ((m) => console.warn(m));
    this.warned = new Set();
    this.markers = [];
    this.stampsPlaced = [];
  }

  warnOnce(msg) {
    if (this.warned.has(msg)) return;
    this.warned.add(msg);
    this.warn(msg);
  }

  // ---------------------------------------------------------------- utilidades
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  get(layer, x, y) { return this.inBounds(x, y) ? this.layers[layer][x + y * this.width] : 0; }

  /** Escribe un ID crudo. */
  set(layer, x, y, id) {
    checkLayer(layer);
    if (!this.inBounds(x, y)) return this;
    const i = x + y * this.width;
    this.layers[layer][i] = id;
    this.autoSlots[layer][i] = -1;
    return this;
  }

  findStamp(name) {
    return this.own.stamps[name] || this.library.stamps?.[name] || this.fallback.stamps[name] || null;
  }
  findBrush(name) {
    return this.own.brushes[name] || this.library.brushes?.[name] || this.fallback.brushes[name] || null;
  }
  hasStamp(name) { return Boolean(this.findStamp(name)); }
  hasBrush(name) { return Boolean(this.findBrush(name)); }

  /** Normaliza un pincel a { kind, def }. Devuelve null (con aviso) si no existe. */
  resolveBrush(brush) {
    if (brush === null || brush === undefined) throw new Error('MapBuilder: pincel vacío');
    if (typeof brush === 'number') return { kind: 'id', def: { id: brush } };
    if (typeof brush === 'string') {
      const def = this.findBrush(brush);
      if (!def) { this.warnOnce(`MapBuilder: pincel "${brush}" no disponible; se omite`); return null; }
      return this.resolveBrush(def);
    }
    if (brush.erase) return { kind: 'id', def: { id: 0 } };
    if (brush.autotile !== undefined) return { kind: brush.patterns?.length ? 'autofixed' : 'autotile', def: brush };
    for (const k of ['tile', 'pattern', 'grid', 'nine', 'line']) if (brush[k] !== undefined) return { kind: k, def: brush };
    if (brush.forest || brush.cliff || brush.terrace || brush.room || brush.cave) return { kind: 'delegate', def: brush };
    throw new Error(`MapBuilder: pincel no reconocido ${JSON.stringify(brush)}`);
  }

  // ---------------------------------------------------------------- pintado por celdas
  /**
   * Pinta un conjunto de celdas con un pincel. `layer` (número) fuerza la capa; null usa la del pincel.
   * `mask` opcional (x,y)=>bool para calcular bordes (nine/line) con una máscara mayor que las celdas.
   */
  paint(brush, cells, { layer = null, mask = null } = {}) {
    const b = this.resolveBrush(brush);
    if (!b || !cells.length) return this;
    const L = layer ?? b.def.layer ?? DEFAULT_LAYER[b.kind];
    checkLayer(L);
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    const inside = mask || ((x, y) => set.has(`${x},${y}`) || !this.inBounds(x, y));
    switch (b.kind) {
      case 'id':
        for (const [x, y] of cells) this.set(L, x, y, b.def.id);
        break;
      case 'tile': {
        const variants = b.def.variants || [];
        const chance = b.def.chance ?? 0.3;
        for (const [x, y] of cells) {
          let id = b.def.tile;
          if (variants.length && cellHash(x, y, this.seed) < chance) id = variants[Math.floor(cellHash(y, x, this.seed + 7) * variants.length)];
          this.set(L, x, y, id);
        }
        break;
      }
      case 'pattern': {
        const [px, py, pw, ph] = b.def.pattern;
        for (const [x, y] of cells) this.set(L, x, y, srcTileId(px + mod(x, pw), py + mod(y, ph)));
        break;
      }
      case 'grid': {
        const g = b.def.grid;
        for (const [x, y] of cells) { const row = g[mod(y, g.length)]; this.set(L, x, y, row[mod(x, row.length)]); }
        break;
      }
      case 'autotile':
        for (const [x, y] of cells) {
          if (!this.inBounds(x, y)) continue;
          const i = x + y * this.width;
          this.layers[L][i] = 48 * (b.def.autotile + 1);
          this.autoSlots[L][i] = b.def.autotile;
        }
        break;
      case 'autofixed': {
        const ps = b.def.patterns;
        for (const [x, y] of cells) {
          const p = b.def.pick === 'checker' ? ps[(mod(x, 2) + 2 * mod(y, 2)) % ps.length] : ps[Math.floor(cellHash(x, y, this.seed) * ps.length)];
          this.set(L, x, y, 48 * (b.def.autotile + 1) + p);
        }
        break;
      }
      case 'nine':
        for (const [x, y] of cells) {
          const id = nineId(b.def, x, y, inside);
          if (id) this.set(L, x, y, id);
        }
        break;
      case 'line':
        for (const [x, y] of cells) this.set(L, x, y, lineId(b.def.line, x, y, inside));
        break;
      default:
        this.delegate(b.def, cells, layer);
        break;
    }
    return this;
  }

  delegate(def, cells, layer) {
    if (!this.painter && def.forest) { this.paintForest(def, cells); return; }
    if (!this.painter) {
      this.warnOnce(`MapBuilder: pincel complejo ${Object.keys(def).join('/')} requiere content/stamps/brushes.js; se omite`);
      return;
    }
    const writes = this.painter(def, cells, { seed: this.seed, width: this.width, height: this.height });
    for (const w of writes) this.set(layer ?? w.layer, w.x, w.y, w.id);
  }

  /**
   * Respaldo nativo del brush `forest` (misma semántica que content/stamps/brushes.js): árboles de
   * size[0]×size[1] en rejilla period, copas en `layer` y troncos en `trunkLayer` para que la pasabilidad
   * de los troncos solapados se conserve.
   */
  paintForest(def, cells) {
    const f = def.forest;
    const [tw, th] = f.size || [2, 6];
    const [pxp, pyp] = f.period || [2, 4];
    const crownRows = f.crownRows ?? pyp;
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    const minX = Math.min(...cells.map((c) => c[0]));
    const cols = new Map();
    for (const [x, y] of cells) {
      const ax = minX + Math.floor((x - minX) / pxp) * pxp;
      const cur = cols.get(ax) || { top: Infinity, bottom: -Infinity };
      cols.set(ax, { top: Math.min(cur.top, y), bottom: Math.max(cur.bottom, y) });
    }
    for (const [ax, { top, bottom }] of cols) {
      for (let ay = bottom - th + 1; ay + th - 1 >= top; ay -= pyp) {
        const tree = f.trees[Math.floor(cellHash(ax, ay, this.seed) * f.trees.length)];
        for (let dy = 0; dy < th; dy++) {
          for (let dx = 0; dx < tw; dx++) {
            const x = ax + dx; const y = ay + dy;
            if (!set.has(`${x},${y}`)) continue;
            this.set(dy < crownRows ? (def.layer ?? 2) : (def.trunkLayer ?? 1), x, y, srcTileId(tree[0] + dx, tree[1] + dy));
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- operaciones
  fill(layer, brush) { return this.rect(layer, 0, 0, this.width, this.height, brush); }
  rect(layer, x, y, w, h, brush) { return this.paint(brush, rectCells(x, y, w, h), { layer }); }
  tile(layer, x, y, brush) { return this.paint(brush, [[x, y]], { layer }); }
  autotile(layer, x, y, w, h, slot) { return this.rect(layer, x, y, w, h, { autotile: slot }); }
  erase(layer, x, y, w = 1, h = 1) { return this.rect(layer, x, y, w, h, 0); }
  /** Rectángulo con conjunto 3×3 (esquinas, bordes y centro). */
  patch(layer, x, y, w, h, brush) { return this.rect(layer, x, y, w, h, brush); }

  /** Forma libre: `cells` = [[x,y]…] o predicado (x,y) => bool. */
  blob(layer, cells, brush) {
    const list = typeof cells === 'function' ? this.cellsWhere(cells) : cells;
    return this.paint(brush, list, { layer });
  }

  cellsWhere(pred) {
    const out = [];
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) if (pred(x, y, this)) out.push([x, y]);
    return out;
  }

  /** Esparce un pincel (densidad 0..1, PRNG sembrado). opts: { onlyIf(x,y), avoid(x,y), spacing } */
  scatter(layer, x, y, w, h, brush, density = 0.1, opts = {}) {
    const placed = [];
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (this.rng() >= density) continue;
        if (opts.onlyIf && !opts.onlyIf(xx, yy, this)) continue;
        if (opts.avoid && opts.avoid(xx, yy, this)) continue;
        if (opts.spacing && placed.some(([px, py]) => Math.abs(px - xx) < opts.spacing && Math.abs(py - yy) < opts.spacing)) continue;
        this.paint(brush, [[xx, yy]], { layer });
        placed.push([xx, yy]);
      }
    }
    return this;
  }

  /** Esparce un stamp sin solaparse. opts: { spacing, onlyIf(x,y), avoid(x,y), tries } */
  scatterStamps(name, x, y, w, h, count, opts = {}) {
    const def = this.findStamp(name);
    if (!def) { this.warnOnce(`MapBuilder: stamp "${name}" no disponible (scatterStamps omitido)`); return this; }
    const size = stampSize(def);
    const spots = [];
    const sp = opts.spacing ?? 0;
    const tries = opts.tries ?? count * 25;
    for (let t = 0; t < tries && spots.length < count; t++) {
      const sx = x + Math.floor(this.rng() * Math.max(1, w - size.w + 1));
      const sy = y + Math.floor(this.rng() * Math.max(1, h - size.h + 1));
      if (spots.some(([px, py]) => sx < px + size.w + sp && px < sx + size.w + sp && sy < py + size.h + sp && py < sy + size.h + sp)) continue;
      if (opts.onlyIf && !opts.onlyIf(sx, sy, this)) continue;
      if (opts.avoid && opts.avoid(sx, sy, this)) continue;
      spots.push([sx, sy]);
    }
    spots.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const [sx, sy] of spots) this.stamp(name, sx, sy);
    return this;
  }

  /** Camino ortogonal por puntos [[x,y],…] con anchura (esquina sup-izq del trazo). */
  path(layer, points, brush, opts = {}) {
    return this.paint(brush, pathCells(points, opts.width ?? 1).concat(opts.extra || []), { layer });
  }

  line(layer, x0, y0, x1, y1, brush, width = 1) {
    return this.path(layer, [[x0, y0], [x1, y1]], brush, { width });
  }

  // ---------------------------------------------------------------- stamps
  /**
   * Coloca un stamp con su esquina superior izquierda en (x,y). Formatos:
   *   horneado { w, h, layers:[grid|null ×3] } · { src:[x,y,w,h], layer } · { tiles:{w,h,layers} }
   *   · { data:{w,h,layers} } · { from:{map,x,y,w,h,layers} } (requiere anilMap).
   * opts: { layer } fuerza la capa. Devuelve { name, x, y, w, h, door } o null si no existe.
   */
  stamp(nameOrDef, x, y, opts = {}) {
    const def = typeof nameOrDef === 'string' ? this.findStamp(nameOrDef) : nameOrDef;
    const name = typeof nameOrDef === 'string' ? nameOrDef : (def?.name || 'stamp');
    if (!def) { this.warnOnce(`MapBuilder: stamp "${name}" no disponible; se omite`); return null; }
    const grids = this.stampGrids(def, name);
    if (!grids) return null;
    for (let l = 0; l < LAYERS; l++) {
      const g = grids.layers[l];
      if (!g) continue;
      const dst = opts.layer ?? l;
      for (let j = 0; j < grids.h; j++) {
        for (let i = 0; i < grids.w; i++) {
          const id = g[i + j * grids.w];
          if (id) this.set(dst, x + i, y + j, id);
        }
      }
    }
    const info = { name, x, y, w: grids.w, h: grids.h, door: def.door ? { x: x + def.door[0], y: y + def.door[1] } : null };
    this.stampsPlaced.push(info);
    if (info.door) this.mark('door', info.door.x, info.door.y, { stamp: name });
    return info;
  }

  /** Rejillas por capa de un stamp en cualquiera de sus formatos. */
  stampGrids(def, name) {
    if (Array.isArray(def.layers) && def.w) return { w: def.w, h: def.h, layers: def.layers };
    const data = def.tiles || def.data;
    if (data) return { w: data.w, h: data.h, layers: data.layers };
    if (def.src) {
      const [sx, sy, w, h] = def.src;
      const layer = def.layer ?? 1;
      const grid = new Array(w * h).fill(0);
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const id = srcTileId(sx + i, sy + j);
          if (this.isEmpty(id)) continue;
          if (def.skip?.some(([dx, dy]) => dx === i && dy === j)) continue;
          grid[i + j * w] = id;
        }
      }
      const layers = [null, null, null];
      layers[layer] = grid;
      return { w, h, layers };
    }
    if (def.from) return this.extractFrom(def.from, def.skip, name);
    this.warnOnce(`MapBuilder: stamp "${name}" sin datos (src/from/tiles); se omite`);
    return null;
  }

  extractFrom(from, skip, name) {
    const src = this.anilMap ? this.anilMap(from.map) : null;
    if (!src) {
      this.warnOnce(`MapBuilder: stamp "${name}" (from mapa ${from.map}) sin hornear y sin mapas de Añil; se omite`);
      return null;
    }
    const layers = [null, null, null];
    for (const l of from.layers || [0, 1, 2]) {
      const out = new Array(from.w * from.h).fill(0);
      for (let j = 0; j < from.h; j++) {
        for (let i = 0; i < from.w; i++) {
          if (skip?.some(([dx, dy]) => dx === i && dy === j)) continue;
          out[i + j * from.w] = src.layers[l]?.[(from.x + i) + (from.y + j) * src.width] || 0;
        }
      }
      layers[l] = out;
    }
    return { w: from.w, h: from.h, layers };
  }

  /** Marcadores con nombre (puertas de stamps, puntos de interés). */
  mark(kind, x, y, data = {}) {
    this.markers.push({ kind, x, y, ...data });
    return this;
  }

  // ---------------------------------------------------------------- resultado
  /** Resuelve autotiles por vecinos (mismo slot y capa; bordes = iguales) y devuelve el mapa. */
  build() {
    for (let layer = 0; layer < LAYERS; layer++) {
      const slots = this.autoSlots[layer];
      const getSlot = (x, y) => slots[x + y * this.width];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (getSlot(x, y) < 0) continue;
          this.layers[layer][x + y * this.width] = resolveAutotileId(getSlot, x, y, this.width, this.height);
        }
      }
    }
    return {
      width: this.width,
      height: this.height,
      tileset: this.tileset,
      layers: this.layers,
      markers: this.markers.slice(),
      stamps: this.stampsPlaced.slice(),
    };
  }
}

/** Pieza de un conjunto 3×3 (+ esquinas cóncavas NO,NE / SO,SE) según la máscara. */
export function nineId(def, x, y, inside) {
  const [nx, ny] = def.nine;
  const n = inside(x, y - 1); const s = inside(x, y + 1);
  const w = inside(x - 1, y); const e = inside(x + 1, y);
  const row = !n ? 0 : (!s ? 2 : 1);
  const col = !w ? 0 : (!e ? 2 : 1);
  if (row === 1 && col === 1) {
    if (def.inner) {
      const [ix, iy] = def.inner;
      if (!inside(x - 1, y - 1)) return srcTileId(ix, iy);
      if (!inside(x + 1, y - 1)) return srcTileId(ix + 1, iy);
      if (!inside(x - 1, y + 1)) return srcTileId(ix, iy + 1);
      if (!inside(x + 1, y + 1)) return srcTileId(ix + 1, iy + 1);
    }
    if (def.fill !== undefined) return def.fill;
  }
  return srcTileId(nx + col, ny + row);
}

/** Pieza de una línea con extremos (salientes, vallas). */
export function lineId(line, x, y, inside) {
  const axis = line.axis || 'h';
  let ids = line.ids;
  if (!ids) {
    const [sx, sy, sw, sh] = line.src;
    const len = axis === 'h' ? sw : sh;
    ids = Array.from({ length: len }, (_, k) => (axis === 'h' ? srcTileId(sx + k, sy) : srcTileId(sx, sy + k)));
  }
  const prev = axis === 'h' ? inside(x - 1, y) : inside(x, y - 1);
  const next = axis === 'h' ? inside(x + 1, y) : inside(x, y + 1);
  const mids = Math.max(1, ids.length - 2);
  if (!prev) return ids[0];
  if (!next) return ids[ids.length - 1];
  return ids.length <= 2 ? ids[0] : ids[1 + mod(axis === 'h' ? x : y, mids)];
}

function checkLayer(layer) {
  if (!Number.isInteger(layer) || layer < 0 || layer >= LAYERS) throw new Error(`MapBuilder: capa inválida ${layer}`);
}

export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

export function stampSize(def) {
  if (def.w) return { w: def.w, h: def.h };
  if (def.src) return { w: def.src[2], h: def.src[3] };
  const d = def.tiles || def.data || def.from;
  return d ? { w: d.w, h: d.h } : { w: 1, h: 1 };
}

/** Celdas de un trazo ortogonal por puntos (cada tramo: primero horizontal, luego vertical). */
export function pathCells(points, width = 1) {
  const out = new Map();
  const add = (x, y) => {
    for (let dy = 0; dy < width; dy++) for (let dx = 0; dx < width; dx++) out.set(`${x + dx},${y + dy}`, [x + dx, y + dy]);
  };
  if (points.length === 1) add(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    let x = x0; let y = y0;
    add(x, y);
    while (x !== x1) { x += Math.sign(x1 - x0); add(x, y); }
    while (y !== y1) { y += Math.sign(y1 - y0); add(x, y); }
  }
  return [...out.values()];
}
