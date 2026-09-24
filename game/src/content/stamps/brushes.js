// Pintado de brushes (rellenos inteligentes) sobre un conjunto de casillas. Módulo puro.
//
//   paintBrush(brush, cells, opts?) → [{ x, y, layer, id }]
//     brush  definición de lib.brushes[name]
//     cells  [[x, y], ...] casillas que cubre el trazo (la "máscara")
//     opts   { seed?: number, width?, height?, inMask?: (x, y) => bool }
//            width/height: tamaño del mapa (fuera del mapa cuenta como "dentro", como RMXP en autotiles)
//            inMask: máscara alternativa para calcular bordes (p. ej. incluir agua ya pintada)
//
// Tipos de brush (campo `layer` opcional; por defecto el indicado):
//   { tile: id, variants?: [id], chance?: 0.3 }       relleno con variantes deterministas (capa 0)
//   { pattern: [x, y, w, h] }                          mosaico w×h del tileset original según (x mod w, y mod h) (capa 0)
//   { grid: [[id, id], [id, id]] }                     mosaico de IDs explícitos según (x mod w, y mod h) (capa 0)
//                                                      (p. ej. agua de Añil: solo 4 patrones del autotile son válidos)
//   { autotile: slot }                                 autotile 0..6 resuelto por vecinos (capa 0). OJO: el autotile
//                                                      "agua" de Añil marca los bordes con una X roja → usar `grid`.
//   { nine: [x, y], inner?: [x, y], fill?: id|0 }      borde 3×3 (+ esquinas cóncavas 2×2: NO,NE/SO,SE) (capa 1);
//                                                      fill: 0 deja vacío el centro (marcos como la orilla del agua)
//   { nine: 'ids', ids: [[tl,t,tr],[l,c,r],[bl,b,br]] } igual, con IDs explícitos (piezas no contiguas)
//   { cave: { floor, void, ring } }                    sala de cueva rectangular con paredes (ver paintCave)
//   { forest: { trees: [[x, y], ...], size: [2, 6], period: [2, 4] } }
//                                                      bosque de árboles de 2×6 apilados cada 4 filas; filas 0..3 en
//                                                      capa `layer` (2), filas 4..5 (tronco) en `trunkLayer` (1)
//   { cliff: { src: [x, y], rows: [r0, r1, face...] } } masa rocosa: 3 columnas (izq/centro/der) × filas
//                                                      (borde superior, cuerpo, cara ×n), convexa (capa 1)
//   { terrace: { rim, side, face } }                   terraza de muros finos convexa (ver paintTerrace) (capa 1)
//   { room: { wall, floor, floorShade, void, frame } } habitación interior con marco (ver paintRoom) (capas 0 y 2)
//   { line: { ids: [ini, medio..., fin] | src: [x, y, w, h], axis: 'h'|'v' } }
//                                                      línea con extremos (salientes, vallas) (capa 1)
//   { edge2: { src: [x, y], fill? } }                   borde doble 5×5 (playas: espuma + arena) (capa 1)
import { resolveAutotileId, FIRST_REGULAR_TILE } from '../../shared/autotile.js';
import { FOREST_DENSE } from './forestDense.js';
import { BEACH_CORNERS, BEACH_CORNER_SRC } from './beachCorners.js';

const tileId = (x, y) => FIRST_REGULAR_TILE + y * 8 + x;

/** Hash entero determinista de una casilla (para variantes). */
export function cellHash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function makeMask(cells, opts) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const inside = opts.inMask || ((x, y) => set.has(`${x},${y}`));
  return inside;
}

function paintTile(brush, cells, opts) {
  const layer = brush.layer ?? 0;
  const variants = brush.variants || [];
  const chance = brush.chance ?? 0.3;
  return cells.map(([x, y]) => {
    let id = brush.tile;
    if (variants.length && cellHash(x, y, opts.seed) < chance) {
      id = variants[Math.floor(cellHash(y, x, (opts.seed || 0) + 7) * variants.length)];
    }
    return { x, y, layer, id };
  });
}

function paintPattern(brush, cells) {
  const [px, py, pw, ph] = brush.pattern;
  const layer = brush.layer ?? 0;
  const mod = (a, n) => ((a % n) + n) % n;
  return cells.map(([x, y]) => ({ x, y, layer, id: tileId(px + mod(x, pw), py + mod(y, ph)) }));
}

function paintAutotile(brush, cells, opts) {
  const layer = brush.layer ?? 0;
  const inside = makeMask(cells, opts);
  const w = opts.width ?? Infinity;
  const h = opts.height ?? Infinity;
  const getSlot = (x, y) => (inside(x, y) ? brush.autotile : -1);
  // resolveAutotileId recorta al mapa (bordes = mismo slot); sin tamaño conocido usa un rango amplio.
  const W = Number.isFinite(w) ? w : 1 << 20;
  const H = Number.isFinite(h) ? h : 1 << 20;
  return cells.map(([x, y]) => ({ x, y, layer, id: resolveAutotileId(getSlot, x, y, W, H) }));
}

function paintGrid(brush, cells) {
  const g = brush.grid;
  const layer = brush.layer ?? 0;
  const mod = (a, n) => ((a % n) + n) % n;
  return cells.map(([x, y]) => {
    const row = g[mod(y, g.length)];
    return { x, y, layer, id: row[mod(x, row.length)] };
  });
}

function paintNine(brush, cells, opts) {
  const [nx, ny] = Array.isArray(brush.nine) ? brush.nine : [0, 0];
  const ids = brush.nine === 'ids' ? brush.ids : null; // { nine: 'ids', ids: [[tl,t,tr],[l,c,r],[bl,b,br]] }
  const layer = brush.layer ?? 1;
  const inside = makeMask(cells, opts);
  const out = [];
  for (const [x, y] of cells) {
    const n = inside(x, y - 1); const s = inside(x, y + 1);
    const w = inside(x - 1, y); const e = inside(x + 1, y);
    const row = !n ? 0 : (!s ? 2 : 1);
    const col = !w ? 0 : (!e ? 2 : 1);
    let id = ids ? ids[row][col] : tileId(nx + col, ny + row);
    if (row === 1 && col === 1) {
      const [ix, iy] = brush.inner || [];
      if (brush.inner && !inside(x - 1, y - 1)) id = tileId(ix, iy);
      else if (brush.inner && !inside(x + 1, y - 1)) id = tileId(ix + 1, iy);
      else if (brush.inner && !inside(x - 1, y + 1)) id = tileId(ix, iy + 1);
      else if (brush.inner && !inside(x + 1, y + 1)) id = tileId(ix + 1, iy + 1);
      else if (brush.fill !== undefined) id = brush.fill; // fill: 0 → deja la celda sin tocar
    }
    if (id) out.push({ x, y, layer, id });
  }
  return out;
}

/** Tile vacío y bloqueante (prioridad 0) presente en todos los tilesets exteriores de Añil (1, 3, 5, 6, 7, 9). */
const FOREST_BLOCKER_TILE = 503;

/**
 * Bosque: árboles de size[0]×size[1] anclados en rejilla period[0]×period[1]. Las columnas se alinean con el
 * mínimo x del trazo; las filas se alinean para que el tronco del árbol inferior acabe en la última fila
 * de cada par de columnas. Solo se dibujan las celdas dentro de la máscara.
 */
function paintForest(brush, cells, opts) {
  const f = brush.forest;
  const [tw, th] = f.size || [2, 6];
  const [pxp, pyp] = f.period || [2, 4];
  const crownRows = f.crownRows ?? pyp;
  const layer = brush.layer ?? 2;
  const trunkLayer = brush.trunkLayer ?? 1;
  const inside = makeMask(cells, opts);
  const minX = Math.min(...cells.map((c) => c[0]));
  const byCol = new Map();
  for (const [x, y] of cells) {
    const ax = minX + Math.floor((x - minX) / pxp) * pxp;
    const cur = byCol.get(ax) || { top: Infinity, bottom: -Infinity };
    byCol.set(ax, { top: Math.min(cur.top, y), bottom: Math.max(cur.bottom, y) });
  }
  // Variantes «bosque denso» (tools/forest_dense.mjs): mismas piezas sin el césped en sombra entre árboles.
  const denseMap = FOREST_DENSE[opts.tileset] || null;
  const dense = (id) => (denseMap && denseMap[id]) || id;
  const out = [];
  for (const [ax, { top, bottom }] of byCol) {
    let hasBelow = false; // se recorre de abajo arriba: ¿hay un árbol dibujado justo debajo de este?
    for (let ay = bottom - th + 1; ay + th - 1 >= top; ay -= pyp) {
      // Un árbol cuya copa empieza por encima del borde del bosque (dentro del mapa) no se dibuja: solo se
      // verían sus filas de tronco con césped detrás de las puntas de la primera fila de copas ("árboles
      // cortados"). Sus casillas de tronco conservan el bloqueo con un tile invisible (las puntas de copa son
      // transitables y dejarían un pasillo por el borde). Si la copa sale por el borde superior del mapa sí
      // se dibuja (el bosque continúa fuera).
      if (ay + crownRows - 1 < top && ay >= 0) {
        const blocker = f.blocker ?? FOREST_BLOCKER_TILE;
        for (let dy = crownRows; dy < th; dy++) {
          for (let dx = 0; dx < tw; dx++) {
            if (inside(ax + dx, ay + dy)) out.push({ x: ax + dx, y: ay + dy, layer: trunkLayer, id: blocker });
          }
        }
        continue;
      }
      // por defecto un mismo tipo de árbol por columna (las copas apiladas encajan); mix: 'tree' varía por árbol
      const h = f.mix === 'tree' ? cellHash(ax, ay, opts.seed) : cellHash(ax, 0, opts.seed);
      const tree = f.trees[Math.floor(h * f.trees.length)];
      for (let dy = 0; dy < th; dy++) {
        // Filas intermedias de la copa: variante densa (sin la franja de césped entre los dos árboles de la
        // unidad). Si otro árbol queda debajo, sus puntas tapan el tronco de este: en esas filas se pinta el
        // follaje bajo de la copa (denso) en vez del tronco con césped. Sin árbol debajo, la base conserva su
        // tronco y su sombra sobre el suelo (borde inferior del bosque).
        const trunkRow = dy >= crownRows;
        let srcRow = dy;
        if (trunkRow && hasBelow) srcRow = Math.max(0, crownRows - 1 + (dy - crownRows));
        const useDense = dy > 0 && (!trunkRow || hasBelow);
        for (let dx = 0; dx < tw; dx++) {
          const x = ax + dx; const y = ay + dy;
          if (!inside(x, y)) continue;
          const id = tileId(tree[0] + dx, tree[1] + srcRow);
          out.push({ x, y, layer: trunkRow ? trunkLayer : layer, id: useDense ? dense(id) : id });
        }
      }
      hasBelow = true;
    }
  }
  return out;
}

/**
 * Masa rocosa convexa. Filas desde src: [borde superior, cuerpo, cara × faceRows]. Columnas: `width`
 * (3 por defecto): 0 = borde izquierdo, width-1 = borde derecho, las intermedias alternan según x.
 */
function paintCliff(brush, cells, opts) {
  const c = brush.cliff;
  const [sx, sy] = c.src;
  const faceRows = c.faceRows ?? 3;
  const width = c.width ?? 3;
  // filas del tileset: [borde, cuerpo, cara1..caraN] (por defecto consecutivas desde src)
  const rows = c.rows || Array.from({ length: 2 + faceRows }, (_, i) => sy + i);
  const mids = Math.max(1, width - 2);
  const layer = brush.layer ?? 1;
  const inside = makeMask(cells, opts);
  const out = [];
  for (const [x, y] of cells) {
    let below = 0;
    while (below < faceRows && inside(x, y + below + 1)) below++;
    let row;
    if (below < faceRows) row = 2 + (faceRows - 1 - below);
    else row = inside(x, y - 1) ? 1 : 0;
    const w = inside(x - 1, y); const e = inside(x + 1, y);
    let col;
    if (!w && e) col = 0;
    else if (!e && w) col = width - 1;
    else col = 1 + (((x % mids) + mids) % mids);
    const id = tileId(sx + col, rows[row]);
    if (!(c.skipBody && row === 1 && col > 0 && col < width - 1)) out.push({ x, y, layer, id });
  }
  return out;
}

/**
 * Terraza de muros finos (estilo Exterior1 de Añil), convexa. Clases de columna: w0/w1 (dos columnas del
 * borde oeste), mid, e1/e0 (dos del borde este). Filas: rim (borde norte), side (laterales, ciclan por y),
 * face (3 filas de cara sur). El interior queda sin tocar (se ve el césped de la capa 0).
 */
function paintTerrace(brush, cells, opts) {
  const t = brush.terrace;
  const layer = brush.layer ?? 1;
  const faceRows = t.face.mid.length;
  const inside = makeMask(cells, opts);
  const out = [];
  const pick = (arr, y) => (Array.isArray(arr) ? arr[((y % arr.length) + arr.length) % arr.length] : arr);
  for (const [x, y] of cells) {
    let cls = 'mid';
    if (!inside(x - 1, y)) cls = 'w0';
    else if (!inside(x + 1, y)) cls = 'e0';
    else if (!inside(x - 2, y)) cls = 'w1';
    else if (!inside(x + 2, y)) cls = 'e1';
    let below = 0;
    while (below < faceRows && inside(x, y + below + 1)) below++;
    let id = 0;
    if (below < faceRows) id = t.face[cls][faceRows - 1 - below];
    else if (!inside(x, y - 1)) id = t.rim[cls];
    else if (cls !== 'mid') id = pick(t.side[cls], y);
    if (id) out.push({ x, y, layer, id });
  }
  return out;
}

/**
 * Habitación interior (estilo Interior1 de Añil) sobre el rectángulo envolvente de `cells` (paredes + suelo).
 * Capa 0: paredes (wall: filas [izq, centro, der]) y suelo (floorShade en la primera fila y la columna izquierda).
 * Capa 2: marco alrededor (1 casilla fuera a izquierda, derecha y arriba; abajo la fila inferior del suelo lleva
 * las esquinas y la fila siguiente el borde). Las celdas del marco reciben `void` en la capa 0.
 * La puerta se abre colocando encima el stamp de salida correspondiente.
 */
function paintRoom(brush, cells) {
  const r = brush.room;
  const f = r.frame;
  const xs = cells.map((c) => c[0]); const ys = cells.map((c) => c[1]);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  const y0 = Math.min(...ys); const y1 = Math.max(...ys);
  const wallRows = r.wall.length;
  const out = [];
  const put = (x, y, layer, id) => { if (id) out.push({ x, y, layer, id }); };
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const col = x === x0 ? 0 : (x === x1 ? 2 : 1);
      if (y - y0 < wallRows) put(x, y, 0, r.wall[y - y0][col]);
      else put(x, y, 0, (y === y0 + wallRows || x === x0) ? r.floorShade : r.floor);
    }
  }
  // marco (capa 2) y vacío bajo él (capa 0)
  for (let x = x0 - 1; x <= x1 + 1; x++) { put(x, y0 - 1, 0, r.void); put(x, y1 + 1, 0, r.void); }
  for (let y = y0; y <= y1; y++) { put(x0 - 1, y, 0, r.void); put(x1 + 1, y, 0, r.void); }
  put(x0 - 1, y0 - 1, 2, f.tl); put(x1 + 1, y0 - 1, 2, f.tr);
  for (let x = x0; x <= x1; x++) put(x, y0 - 1, 2, f.t);
  for (let y = y0; y < y1; y++) { put(x0 - 1, y, 2, f.l); put(x1 + 1, y, 2, f.r); }
  put(x0 - 1, y1, 2, f.bl[0]); put(x0, y1, 2, f.bl[1]);
  put(x1, y1, 2, f.br[0]); put(x1 + 1, y1, 2, f.br[1]);
  put(x0 - 1, y1 + 1, 2, f.bl2[0]); put(x0, y1 + 1, 2, f.bl2[1]);
  put(x1, y1 + 1, 2, f.br2[0]); put(x1 + 1, y1 + 1, 2, f.br2[1]);
  for (let x = x0 + 1; x < x1; x++) put(x, y1 + 1, 2, f.b);
  return out;
}

/**
 * Sala de cueva rectangular (estilo Cueva1 de Añil). `cells` = suelo transitable (se usa su rectángulo envolvente).
 * ring: esquina sup-izq del bloque de paredes de 8 columnas × 7 filas del tileset: filas 0..3 pared norte
 * (cara alta), 4..5 laterales (alternan), 6 pared sur; columnas 0..2 izquierda, 3..4 centro (alternan),
 * 5..7 derecha. Las paredes ocupan 3 casillas a cada lado, 4 filas arriba y 1 abajo (capa 1). Capa 0: suelo
 * (`floor` = [x, y, w, h] mosaico) bajo el suelo y el borde interior de las paredes; `void` en el resto.
 */
function paintCave(brush, cells) {
  const c = brush.cave;
  const [rx, ry] = c.ring;
  const [fx, fy, fw, fh] = c.floor;
  const xs = cells.map((p) => p[0]); const ys = cells.map((p) => p[1]);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  const y0 = Math.min(...ys); const y1 = Math.max(...ys);
  const mod = (a, n) => ((a % n) + n) % n;
  const colOf = (x) => {
    if (x < x0) return x - (x0 - 3);
    if (x > x1) return 5 + (x - x1 - 1);
    return 3 + mod(x - x0, 2);
  };
  const out = [];
  for (let y = y0 - 4; y <= y1 + 1; y++) {
    for (let x = x0 - 3; x <= x1 + 3; x++) {
      const nearFloor = x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1;
      out.push({ x, y, layer: 0, id: nearFloor ? tileId(fx + mod(x, fw), fy + mod(y, fh)) : c.void });
      let row = -1;
      if (y < y0) row = y - (y0 - 4);
      else if (y > y1) row = 6;
      else if (x < x0 || x > x1) row = 4 + mod(y - y0, 2);
      if (row >= 0) out.push({ x, y, layer: 1, id: tileId(rx + colOf(x), ry + row) });
    }
  }
  return out;
}

/**
 * Línea con extremos: `ids` = [inicio, medio..., fin] (o `src` = tira w×1 para 'h' / 1×h para 'v' del tileset).
 * Una celda sin vecino anterior usa el inicio, sin vecino siguiente el fin; las demás ciclan los medios.
 */
function paintLine(brush, cells, opts) {
  const { src, ids: explicit, axis = 'h' } = brush.line;
  let ids = explicit;
  if (!ids) {
    const [sx, sy, sw, sh] = src;
    const len = axis === 'h' ? sw : sh;
    ids = Array.from({ length: len }, (_, k) => (axis === 'h' ? tileId(sx + k, sy) : tileId(sx, sy + k)));
  }
  const layer = brush.layer ?? 1;
  const inside = makeMask(cells, opts);
  const mids = Math.max(1, ids.length - 2);
  return cells.map(([x, y]) => {
    const prev = axis === 'h' ? inside(x - 1, y) : inside(x, y - 1);
    const next = axis === 'h' ? inside(x + 1, y) : inside(x, y + 1);
    let k;
    if (!prev) k = 0;
    else if (!next) k = ids.length - 1;
    else k = ids.length <= 2 ? 0 : 1 + ((((axis === 'h' ? x : y) % mids) + mids) % mids);
    return { x, y, layer, id: ids[k] };
  });
}

/** Esquinas cóncavas generadas (tools/beach_corners.mjs) para este pincel y tileset, o null. */
function concaveCorners(brush, opts) {
  const [sx, sy] = brush.edge2.src;
  if (sx !== BEACH_CORNER_SRC[0] || sy !== BEACH_CORNER_SRC[1]) return null;
  return BEACH_CORNERS[opts.tileset] || null;
}

/**
 * Casilla «centro» junto a una esquina cóncava: busca el agua en diagonal a 1–2 casillas (con las ortogonales dentro)
 * y devuelve el tile del bloque 2×2 generado para esa orientación, o null.
 */
function concaveCornerTile(corners, inside, x, y) {
  let best = null;
  for (const key of Object.keys(corners)) {
    const [qx, qy] = key.split(',').map(Number);
    for (let j = 1; j <= 2; j++) {
      for (let i = 1; i <= 2; i++) {
        if (inside(x + qx * i, y + qy * j)) continue;
        if (!best || i + j < best.i + best.j) best = { key, i, j };
      }
    }
  }
  return best ? corners[best.key][(best.i - 1) + 2 * (best.j - 1)] : null;
}

/**
 * Borde doble (playas de Añil: espuma + arena mojada): bloque 5×5 desde `src`. Columnas 0–1 borde oeste
 * (exterior, interior), 2 centro, 3–4 borde este (interior, exterior); filas igual (0–1 norte, 2 centro,
 * 3–4 sur). Las esquinas cóncavas usan los tiles generados por tools/beach_corners.mjs (si existen para el
 * tileset; si no, el centro). `fill: 0` deja el centro vacío.
 */
function paintEdge2(brush, cells, opts) {
  const { src: [sx, sy], fill } = brush.edge2;
  const layer = brush.layer ?? 1;
  const inside = makeMask(cells, opts);
  const corners = fill === undefined ? concaveCorners(brush, opts) : null;
  // 1 = la vecina ya está fuera; 2 = fuera a dos casillas; 3 = dentro al menos dos casillas
  const dist = (x, y, dx, dy) => { let d = 1; while (d <= 2 && inside(x + dx * d, y + dy * d)) d++; return d; };
  const out = [];
  for (const [x, y] of cells) {
    const dn = dist(x, y, 0, -1); const ds = dist(x, y, 0, 1);
    const dw = dist(x, y, -1, 0); const de = dist(x, y, 1, 0);
    const row = dn <= 2 ? dn - 1 : ds <= 2 ? 5 - ds : 2;
    const col = dw <= 2 ? dw - 1 : de <= 2 ? 5 - de : 2;
    const center = row === 2 && col === 2;
    const corner = center && corners ? concaveCornerTile(corners, inside, x, y) : null;
    const id = corner || (center && fill !== undefined ? fill : tileId(sx + col, sy + row));
    if (id) out.push({ x, y, layer, id });
  }
  return out;
}

const PAINTERS = {
  tile: paintTile, pattern: paintPattern, grid: paintGrid, autotile: paintAutotile, nine: paintNine,
  forest: paintForest, cliff: paintCliff, terrace: paintTerrace, room: paintRoom, cave: paintCave, line: paintLine,
  edge2: paintEdge2,
};

/** Tipo de un brush (clave principal de su definición). */
export function brushKind(brush) {
  const kind = Object.keys(PAINTERS).find((k) => brush && brush[k] !== undefined);
  if (!kind) throw new Error(`Brush sin tipo reconocido: ${JSON.stringify(brush)}`);
  return kind;
}

/** Devuelve las escrituras de tiles de un trazo de brush sobre `cells`. */
export function paintBrush(brush, cells, opts = {}) {
  if (!Array.isArray(cells)) throw new Error('paintBrush: cells debe ser un array de [x, y]');
  if (!cells.length) return [];
  return PAINTERS[brushKind(brush)](brush, cells, opts);
}

/** Casillas de un rectángulo (utilidad para trazos). */
export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/**
 * Máscara de demostración de un brush para hojas de contacto y visores: { w, h, cells } (celdas relativas a una
 * caja w×h con margen para bordes y marcos).
 */
export function brushDemo(brush) {
  const kind = brushKind(brush);
  if (brush.demo) return { w: brush.demo.w, h: brush.demo.h, cells: brush.demo.cells || rectCells(1, 1, brush.demo.w - 2, brush.demo.h - 2) };
  if (kind === 'forest') return { w: 8, h: 11, cells: rectCells(1, 1, 6, 10) };
  if (kind === 'cliff') return { w: 8, h: 8, cells: rectCells(1, 1, 6, 6) };
  if (kind === 'terrace') return { w: 9, h: 9, cells: rectCells(1, 1, 7, 7) };
  if (kind === 'room') return { w: 13, h: 12, cells: rectCells(2, 2, 9, 8) };
  if (kind === 'cave') return { w: 16, h: 12, cells: rectCells(4, 5, 8, 5) };
  if (kind === 'edge2') return { w: 10, h: 9, cells: rectCells(1, 1, 8, 7) };
  if (kind === 'line') {
    return brush.line.axis === 'v' ? { w: 3, h: 7, cells: rectCells(1, 1, 1, 5) } : { w: 8, h: 3, cells: rectCells(1, 1, 6, 1) };
  }
  if (kind === 'nine' || kind === 'autotile') {
    // rectángulo con una muesca (esquinas cóncavas) y una península
    const cells = rectCells(1, 1, 6, 4).filter(([x, y]) => !(x >= 5 && y === 1));
    cells.push([2, 5], [3, 5], [2, 6], [3, 6]);
    return { w: 8, h: 8, cells };
  }
  return { w: 6, h: 4, cells: rectCells(1, 1, 4, 2) };
}
