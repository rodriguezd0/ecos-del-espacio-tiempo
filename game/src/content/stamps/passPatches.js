// Correcciones de PASABILIDAD de tiles de Añil que pidió el creador (docs/stamps.md «Pasabilidad de la decoración»).
// Las aplica `node tools/stamps_extra.mjs` en game/data/tilesets.json (también tras `npm run data`) y las comprueba
// con --check y en tests/map_rules.test.mjs.
//   · Rocas: la parte de arriba de una roca BLOQUEA (antes se pasaba por detrás y el personaje «flotaba» encima).
//   · Flores y matas decorativas: se pisan (0x40 = arbusto: tapa los pies como la hierba), como las flores sueltas.
// Pasajes RMXP: 0x0f bloquea en las cuatro direcciones, 0 libre, 0x40 libre con efecto arbusto. La prioridad no cambia.

export const PASS = { block: 0x0f, free: 0, bush: 0x40 };

const CAVE_VARIANT_ROWS = [0, 97, 194, 302, 402, 501]; // variantes de Cueva1 (content/stamps/Cueva1.js VARIANTS)
const LUPINOS = [
  { what: 'lupinos (flores altas)', rect: [0, 36, 3, 1], passage: PASS.free },
  { what: 'lupinos (base)', rect: [0, 37, 3, 1], passage: PASS.bush },
];

/** Por imagen: rectángulos [col, fila, ancho, alto] del tileset original y el pasaje que se les da. */
export const PASSAGE_PATCHES = {
  ExteriorBosqueCeleste: [
    { what: 'roca_turquesa (cima)', rect: [6, 46, 2, 1], passage: PASS.block },
    { what: 'roca_gris', rect: [5, 15, 2, 1], passage: PASS.block },
    { what: 'cristal_grande (cima)', rect: [2, 195, 2, 1], passage: PASS.block },
    ...LUPINOS,
  ],
  Exterior1: [{ what: 'roca_grande (cima)', rect: [6, 46, 2, 1], passage: PASS.block }, ...LUPINOS],
  Exterior2: [...LUPINOS],
  Exterior3: [...LUPINOS],
  ExteriorPrisma: [...LUPINOS],
  // `mata` (3,68) sigue bloqueando: la Ruta 14 la usa como seto de la Reserva interior (barrera de historia).
  ExteriorSafari: [{ what: 'roca_grande (cima)', rect: [6, 46, 2, 1], passage: PASS.block }],
};

/**
 * Rocas de cueva (Cueva1) con la cima transitable: NO se corrigen todavía. Los puzles de la Cámara de los Contrapesos
 * (B08), la Cueva del Tizón (B13) y la Gruta Escarcha (B15) cuentan la cima de la roca como suelo (su lógica casilla a
 * casilla y sus tests); cambiarla exige rehacer esos trazados. Para aplicarla: añadir `Cueva1: CAVE_ROCK_TOPS`.
 */
export const CAVE_ROCK_TOPS = CAVE_VARIANT_ROWS.flatMap((r) => [
  { what: `roca_grande (cima, fila ${r})`, rect: [6, r + 16, 2, 1], passage: PASS.block },
  { what: `roca_peque (cima, fila ${r})`, rect: [5, r + 17, 1, 1], passage: PASS.block },
]);

/** Autotiles por NOMBRE (tilesets.json → autotiles[slot]): las 48 variantes del autotile reciben el pasaje. */
export const AUTOTILE_PASSAGE_PATCHES = [
  { what: 'flor amarilla alta (base)', autotile: 'florAmarillaGrande', passage: PASS.bush },
  { what: 'flor lila alta (base)', autotile: 'florLilaGrande', passage: PASS.bush },
];

const FIRST_REGULAR_TILE = 384;
const AUTOTILE_IDS = 48;

/** Celdas a corregir de un tileset de tilesets.json → [{ id, passage, what }]. */
export function passPatchCells(tileset) {
  const out = [];
  for (const p of PASSAGE_PATCHES[tileset.image] || []) {
    const [c0, r0, w, h] = p.rect;
    for (let r = r0; r < r0 + h; r++) {
      for (let c = c0; c < c0 + w; c++) out.push({ id: FIRST_REGULAR_TILE + r * 8 + c, passage: p.passage, what: p.what });
    }
  }
  (tileset.autotiles || []).forEach((name, slot) => {
    const p = AUTOTILE_PASSAGE_PATCHES.find((q) => q.autotile === name);
    if (!p) return;
    const base = AUTOTILE_IDS * (slot + 1);
    for (let k = 0; k < AUTOTILE_IDS; k++) out.push({ id: base + k, passage: p.passage, what: p.what });
  });
  return out;
}
