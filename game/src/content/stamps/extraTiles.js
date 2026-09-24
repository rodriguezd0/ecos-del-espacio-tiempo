// Tiles PROPIOS añadidos en filas VACÍAS de las imágenes de tileset de Añil ("overlay").
// Módulo puro (sin DOM): lo usan las definiciones de stamps, el generador y los tests.
//
// Por qué: un mapa solo puede usar un tileset y varias piezas de la campaña no existen en Añil (kit común
// de Pilar X23, zócalos hexagonales, grava, barro, arena/nieve honda, ceniza). `node tools/stamps_extra.mjs`
// dibuja estas piezas y las escribe en las filas vacías del atlas reempaquetado
// (game/assets/tilesets/<Imagen>.png) y en tilesets.json (pasabilidad, prioridad y terrain tag) de TODOS
// los tilesets que comparten la imagen (Cueva1 → 2, 12–15). Es idempotente y se ejecuta al final de
// `npm run data` (que regenera atlas y tilesets.json desde Añil).
//
// Formato de una pieza (EXTRA_PIECES):
//   w, h        tamaño en tiles
//   kind        'stamp' (por defecto) | 'nine' (3×3 + esquinas cóncavas 2×2 a su derecha: ocupa 5×3)
//               | 'pattern' (mosaico w×h) | 'line' (tira con extremos; axis 'h' | 'v')
//   layer       capa donde se coloca (stamp/brush)
//   pass        filas de caracteres: 'x' bloquea (0x0F), '.' pasable, ' ' celda vacía (sin tile)
//   prio        filas de dígitos (prioridad RMXP; por defecto 0). Regla: k = filas por encima de la base que bloquea,
//               así la pieza tapa al personaje que pasa por detrás (render/tilemapView.js: z = y·32 + k·32 + 33)
//   tag         filas de dígitos del terrain tag (3 = arena…); por defecto 0
//   desc, tags  metadatos de la biblioteca (docs/stamps.md)
//   copy        { image, src: [col, fila] }: en vez de arte propio, calca w×h tiles de otra imagen ORIGINAL de Añil
//               (piezas que un tileset hermano sí tiene, p. ej. los troncos caídos de ExteriorBosqueCeleste en Exterior1)
// EXTRA_LAYOUTS[imagen] = { row: primera fila libre, rows: filas libres, pieces: { nombre: [col, fila] } }.

const P = (w, h, props) => ({ w, h, kind: 'stamp', layer: 2, ...props });
// Calcos de suelo en la capa 2 (prioridad 0: bajo los personajes) para que se vean sobre el enlosado de la capa 1.
const floor = (w, h, props) => ({ w, h, kind: 'stamp', layer: 2, pass: Array(h).fill('.'.repeat(w)), ...props });
const nine = (props) => ({ w: 5, h: 3, kind: 'nine', layer: 1, pass: ['.....', '.....', '...  '], ...props });

export const EXTRA_PIECES = {
  // ─── Kit común de Pilar (X23): piedra neutra; el tinte lo pone el mapa (content/stamps/pilar.js) ───
  pilar_monolito: P(2, 3, { pass: ['..', '..', 'xx'], prio: ['22', '11', '00'], tags: ['pilar', 'vestigio'], desc: 'Monolito de piedra con tres hexágonos tallados (2×3; la base bloquea)' }),
  pilar_columna: P(1, 3, { pass: ['.', '.', 'x'], prio: ['2', '1', '0'], tags: ['pilar', 'vestigio'], desc: 'Columna entera con capitel (1×3)' }),
  pilar_columna_quebrada: P(1, 2, { pass: ['.', 'x'], prio: ['1', '0'], tags: ['pilar', 'vestigio'], desc: 'Columna quebrada con cascotes (1×2)' }),
  pilar_dintel: P(5, 4, {
    pass: ['.....', '.....', 'x   x', 'x   x'], prio: ['33333', '22222', '0   0', '0   0'],
    tags: ['pilar', 'vestigio', 'puerta'], desc: 'Dintel: dos pilares y viga con banda de hexágonos (5×4; se pasa por debajo, hueco de 3)',
  }),
  pilar_placa_unown: P(2, 2, { pass: ['..', 'xx'], prio: ['11', '00'], tags: ['pilar', 'cartel'], desc: 'Estela con glifos Unown (2×2; evento de lectura encima)' }),
  pilar_glifo: floor(1, 1, { tags: ['pilar', 'suelo'], desc: 'Glifo Unown grabado en el suelo' }),
  pilar_glifo_2: floor(1, 1, { tags: ['pilar', 'suelo'], desc: 'Glifo Unown grabado en el suelo (variante)' }),
  pilar_pedestal: P(1, 2, { pass: ['.', 'x'], prio: ['1', '0'], tags: ['pilar', 'fragmento'], desc: 'Pedestal hexagonal con hueco para el Fragmento (1×2)' }),
  pilar_escalinata: floor(3, 3, { tags: ['pilar', 'escalera'], desc: 'Escalinata de piedra (sube hacia el norte, 3×3, pasable)' }),
  pilar_escalinata_ancha: floor(5, 3, { tags: ['pilar', 'escalera'], desc: 'Escalinata ancha de piedra (5×3, pasable)' }),
  pilar_camara_nucleo: floor(5, 5, { pass: [' ... ', '.....', '.....', '.....', ' ... '], tags: ['pilar', 'nucleo', 'suelo'], desc: 'Cámara de núcleo: gran hexágono grabado con radios y zócalo central (5×5, calco de suelo)' }),
  pilar_zocalo: floor(1, 1, { tags: ['pilar', 'zocalo', 'reconstruccion'], desc: 'Zócalo hexagonal de piedra (Reconstrucción)' }),
  pilar_zocalo_gastado: floor(1, 1, { tags: ['pilar', 'zocalo', 'reconstruccion'], desc: 'Zócalo hexagonal gastado y agrietado (borde de un vacío)' }),
  pilar_zocalo_vivo: floor(1, 1, { tags: ['pilar', 'zocalo', 'reconstruccion'], desc: 'Zócalo hexagonal con brillo verde (tramo reconstruido o activo)' }),
  pilar_losa_eco: floor(2, 2, { tags: ['pilar', 'eco', 'suelo'], desc: 'Losa de eco: anillos concéntricos grabados (2×2, pisable)' }),
  pilar_arista: P(1, 2, { pass: ['.', 'x'], prio: ['1', '0'], tags: ['pilar', 'cristal'], desc: 'Arista violeta: cristal afilado (1×2)' }),
  pilar_arista_grande: P(2, 2, { pass: ['..', 'xx'], prio: ['11', '00'], tags: ['pilar', 'cristal'], desc: 'Grupo de aristas violetas (2×2)' }),
  pilar_manantial: P(3, 3, { pass: ['xxx', 'xxx', 'xxx'], tags: ['pilar', 'agua'], desc: 'Manantial: pila circular de piedra con surtidor (3×3, bloquea)' }),
  pilar_canal: { w: 3, h: 1, kind: 'line', axis: 'h', layer: 2, pass: ['xxx'], tags: ['pilar', 'agua'], desc: 'Canal de resonancia horizontal (agua luminosa en un surco; bloquea)' },
  pilar_canal_v: { w: 1, h: 3, kind: 'line', axis: 'v', layer: 2, pass: ['x', 'x', 'x'], tags: ['pilar', 'agua'], desc: 'Canal de resonancia vertical' },
  pilar_enlosado: nine({ tags: ['pilar', 'suelo'], desc: 'Enlosado antiguo con bordillo (nine): suelo de sala de Pilar sobre la roca' }),

  // ─── Terrenos de barrera (CAMPANA §1.1): se pintan con brush nine en la capa 1 ───────────────────
  grava: nine({ desc: 'Cuesta de grava suelta con marcas de derrape (Correr)' }),
  barro: nine({ desc: 'Barro con huellas hundidas (Terreno complicado)' }),
  arena_honda: nine({ tag: ['33333', '33333', '333  '], desc: 'Arena profunda con huellas hundidas (Terreno complicado)' }),
  nieve_honda: nine({ desc: 'Nieve honda con huellas hundidas (Terreno complicado)' }),
  ceniza_honda: nine({ tag: ['33333', '33333', '333  '], desc: 'Ceniza profunda con huellas (Terreno complicado en las Dunas de Ceniza)' }),
  ceniza: { w: 2, h: 2, kind: 'pattern', layer: 0, pass: ['..', '..'], tag: ['33', '33'], desc: 'Suelo de ceniza gris con ondas de viento (mosaico 2×2)' },

  // ─── Calcos de otra imagen de Añil (`copy`: esquina [col, fila] en la imagen original; mismo w×h) ───────────
  // Exterior1 no trae troncos caídos (sus filas 198–200 están vacías): se copian los de ExteriorBosqueCeleste.
  tronco_caido_h: P(3, 1, { pass: ['xxx'], copy: { image: 'ExteriorBosqueCeleste', src: [4, 198] }, tags: ['decoracion'], desc: 'Tronco caído horizontal (3×1)' }),
  tronco_caido_v: P(1, 3, { pass: ['x', 'x', 'x'], copy: { image: 'ExteriorBosqueCeleste', src: [7, 198] }, tags: ['decoracion'], desc: 'Tronco caído vertical (1×3)' }),
};

// Posiciones [col, fila] relativas a la primera fila libre de cada imagen (filas vacías en Añil).
const KIT = {
  pilar_dintel: [0, 0], pilar_monolito: [5, 0], pilar_columna: [7, 0],
  pilar_zocalo: [5, 3], pilar_zocalo_gastado: [6, 3], pilar_zocalo_vivo: [7, 3],
  pilar_camara_nucleo: [0, 4], pilar_columna_quebrada: [5, 4], pilar_arista: [6, 4], pilar_pedestal: [7, 4],
  pilar_arista_grande: [5, 6], pilar_glifo: [7, 6], pilar_glifo_2: [7, 7],
  pilar_losa_eco: [5, 8], pilar_canal_v: [7, 8],
  pilar_escalinata_ancha: [0, 9], pilar_placa_unown: [5, 10],
  pilar_enlosado: [0, 12], pilar_manantial: [5, 12],
  pilar_escalinata: [0, 15], pilar_canal: [3, 15],
};

// Subconjunto exterior del kit (explanadas de Pilar y Sima) + terrenos de barrera.
const EXTERIOR_KIT = {
  grava: [0, 0], pilar_zocalo: [5, 0], pilar_zocalo_gastado: [6, 0], pilar_zocalo_vivo: [7, 0],
  pilar_monolito: [5, 1], pilar_columna: [7, 1],
  pilar_dintel: [0, 3], pilar_columna_quebrada: [5, 4], pilar_pedestal: [6, 4], pilar_arista: [7, 4],
  pilar_placa_unown: [5, 6], pilar_glifo: [7, 6], pilar_glifo_2: [7, 7],
  pilar_losa_eco: [0, 7],
};

export const EXTRA_LAYOUTS = {
  Cueva1: { row: 624, rows: 27, pieces: KIT },
  InteriorTorre: { row: 593, rows: 32, pieces: KIT },
  InteriorLiga: { row: 593, rows: 32, pieces: KIT },
  ExteriorBosqueCeleste: { row: 699, rows: 15, pieces: EXTERIOR_KIT },
  Exterior1: { row: 718, rows: 12, pieces: { ...EXTERIOR_KIT, nieve_honda: [0, 9], tronco_caido_h: [2, 7], tronco_caido_v: [5, 8] } },
  Exterior2: {
    row: 641, rows: 6,
    pieces: { grava: [0, 0], pilar_zocalo: [5, 0], pilar_zocalo_gastado: [6, 0], pilar_zocalo_vivo: [7, 0], barro: [0, 3] },
  },
  Exterior3: {
    row: 687, rows: 14,
    pieces: { grava: [0, 0], pilar_zocalo: [5, 0], pilar_zocalo_gastado: [6, 0], pilar_zocalo_vivo: [7, 0], barro: [0, 3], arena_honda: [0, 6], ceniza: [5, 1] },
  },
  ExteriorSafari: {
    row: 672, rows: 29,
    pieces: { ceniza: [0, 0], barro: [0, 2], arena_honda: [0, 5], ceniza_honda: [0, 8], grava: [0, 11], pilar_zocalo: [5, 0], pilar_zocalo_gastado: [6, 0] },
  },
};

/**
 * Correcciones de terrain tag en tiles de Añil (no del overlay) que la campaña necesita: en ExteriorSafari la
 * orilla y la playa sobre el agua bloquean sin tag de agua (la Zona Safari no dejaba surfear), así que ni se
 * pisan ni se navegan. Se les da Water (7) como en Exterior1 para las lagunas con Nadar de la Ruta 14 y la
 * Marisma. Solo se tocan las celdas bloqueadas (0x0F) del rectángulo [col0, col1] × [row0, row1].
 */
export const TERRAIN_PATCHES = {
  ExteriorSafari: [
    { what: 'orilla', cols: [0, 4], rows: [433, 435], terrain: 7 },
    { what: 'playa', cols: [0, 4], rows: [366, 370], terrain: 7 },
  ],
};

const FIRST_REGULAR_TILE = 384;

/** IDs candidatos de las correcciones de terrain de una imagen → [{ id, terrain, what }]. */
export function terrainPatchCells(image) {
  const out = [];
  for (const p of TERRAIN_PATCHES[image] || []) {
    for (let r = p.rows[0]; r <= p.rows[1]; r++) {
      for (let c = p.cols[0]; c <= p.cols[1]; c++) out.push({ id: FIRST_REGULAR_TILE + r * 8 + c, terrain: p.terrain, what: p.what });
    }
  }
  return out;
}
const tid = (col, row) => FIRST_REGULAR_TILE + row * 8 + col;

/** Celdas [dx, dy] con tile de una pieza (según `pass`; ' ' = sin tile). */
export function pieceCells(piece) {
  const out = [];
  for (let dy = 0; dy < piece.h; dy++) {
    for (let dx = 0; dx < piece.w; dx++) if ((piece.pass[dy] || '')[dx] !== ' ') out.push([dx, dy]);
  }
  return out;
}

const charAt = (rows, dx, dy, def = '0') => ((rows && rows[dy] && rows[dy][dx]) || def);

/** Propiedades RMXP de una celda de pieza → { passage, priority, terrain }. */
export function cellProps(piece, dx, dy) {
  const p = charAt(piece.pass, dx, dy, '.');
  return {
    passage: p === 'x' ? 0x0f : 0,
    priority: Number(charAt(piece.prio, dx, dy)),
    terrain: Number(charAt(piece.tag, dx, dy)),
  };
}

/** Lista plana de tiles extra de una imagen → [{ id, name, dx, dy, col, row, passage, priority, terrain }]. */
export function extraTiles(image) {
  const layout = EXTRA_LAYOUTS[image];
  if (!layout) return [];
  const out = [];
  for (const [name, [c, r]] of Object.entries(layout.pieces)) {
    const piece = EXTRA_PIECES[name];
    if (!piece) throw new Error(`extraTiles: pieza desconocida "${name}" en ${image}`);
    for (const [dx, dy] of pieceCells(piece)) {
      const col = c + dx; const row = layout.row + r + dy;
      out.push({ id: tid(col, row), name, dx, dy, col, row, ...cellProps(piece, dx, dy) });
    }
  }
  return out;
}

/** Comprueba que el layout de una imagen no se solapa ni se sale de sus filas libres. */
export function validateLayout(image) {
  const layout = EXTRA_LAYOUTS[image];
  const used = new Map();
  for (const [name, [c, r]] of Object.entries(layout.pieces)) {
    const piece = EXTRA_PIECES[name];
    if (!piece) throw new Error(`${image}: pieza desconocida "${name}"`);
    for (let dy = 0; dy < piece.h; dy++) {
      for (let dx = 0; dx < piece.w; dx++) {
        const col = c + dx; const row = r + dy;
        if (col < 0 || col > 7 || row < 0 || row >= layout.rows) throw new Error(`${image}: "${name}" se sale del hueco (${col},${row})`);
        const k = `${col},${row}`;
        if (used.has(k)) throw new Error(`${image}: "${name}" se solapa con "${used.get(k)}" en ${k}`);
        used.set(k, name);
      }
    }
  }
  return true;
}

/**
 * Stamps y brushes de la biblioteca de `image` generados desde el overlay. Llevan `extra: true` para que
 * las bibliotecas derivadas (derive.js) no los hereden con IDs de otra imagen.
 */
export function extraDefs(image) {
  const layout = EXTRA_LAYOUTS[image];
  const stamps = {}; const brushes = {};
  if (!layout) return { stamps, brushes };
  for (const [name, [c, r]] of Object.entries(layout.pieces)) {
    const p = EXTRA_PIECES[name];
    const col = c; const row = layout.row + r;
    const meta = { desc: p.desc, extra: true };
    if (p.kind === 'nine') {
      brushes[name] = { nine: [col, row], inner: [col + 3, row], layer: p.layer, ...meta };
    } else if (p.kind === 'pattern') {
      brushes[name] = { pattern: [col, row, p.w, p.h], layer: p.layer, ...meta };
    } else if (p.kind === 'line') {
      brushes[name] = { line: { src: [col, row, p.w, p.h], axis: p.axis }, layer: p.layer, ...meta };
    } else {
      const grid = [];
      for (let dy = 0; dy < p.h; dy++) {
        for (let dx = 0; dx < p.w; dx++) grid.push((p.pass[dy] || '')[dx] === ' ' ? 0 : tid(col + dx, row + dy));
      }
      const layers = [null, null, null];
      layers[p.layer] = grid;
      const solid = p.pass.some((s) => s.includes('x'));
      stamps[name] = { tiles: { w: p.w, h: p.h, layers }, solid, tags: [...(p.tags || [])], ...meta };
    }
  }
  return { stamps, brushes };
}
