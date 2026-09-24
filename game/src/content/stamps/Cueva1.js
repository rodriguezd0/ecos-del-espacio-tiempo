// Stamps y brushes del tileset 2 (Cueva1) — cuevas, túneles y el primer Pilar de Axis.
// Formato: docs/ARCHITECTURE.md §5 y docs/stamps.md. Tras editar: node tools/stamps_bake.mjs Cueva1
// y revisar la hoja: node tools/preview_stamps.mjs Cueva1
// Los tilesets 12–15 (Cueva Hielo/Volcán/Morada/Azul) usan la misma imagen: estos IDs valen también allí
// (solo cambia el autotile 6: agua → hielo, lava, agua morada o azul).
//
// La imagen repite el mismo bloque de piezas en varias paletas (VARIANTES, desplazadas en filas):
//   filas +0..2 suelo 3×3 · +3..7 estanque · +16..18 rocas · +19..25 paredes · +31..44 bocas/salidas
// Flujo típico: brush `vacio` en todo el mapa → `sala[_variante]` sobre el rectángulo de suelo (añade paredes
// alrededor) → bocas de salida encima de las paredes → rocas, agua y detalles.
// Colocación de bocas sobre una sala con suelo x0..x1, y0..y1 (door = casilla del warp):
//   boca_norte / salida_luz_norte: (x, y0 - 4)  · salida_luz_sur: (x, y1)  ·  boca_oeste: (x0 - 3, y)  ·  boca_este: (x1, y)
const VARIANTS = {
  '': { row: 0, desc: 'tierra y musgo verde' },
  _hielo: { row: 194, desc: 'suelo gris azulado y paredes azules' },
  _volcan: { row: 302, desc: 'suelo rojizo y paredes moradas' },
  _gris: { row: 402, desc: 'suelo gris y musgo verde' },
  _morada: { row: 501, desc: 'suelo morado y paredes oscuras' },
};

const BOULDER = (dx, dy) => [[dx, dy, 2], [dx + 1, dy, 2], [dx, dy + 1, 2], [dx + 1, dy + 1, 2], [dx, dy + 2, 2], [dx + 1, dy + 2, 2]];

function variantStamps() {
  const out = {};
  for (const [suf, v] of Object.entries(VARIANTS)) {
    const r = v.row;
    const tag = suf ? suf.slice(1) : 'tierra';
    out[`roca_grande${suf}`] = { src: [6, r + 16, 2, 3], layer: 2, solid: true, tags: ['roca', tag], desc: `Roca grande (${v.desc})` };
    out[`boca_norte${suf}`] = { src: [4, r + 33, 3, 4], layer: 2, door: [1, 2], tags: ['salida', tag], desc: `Boca oscura en la pared norte (${v.desc}); colocar en (x, y0-4)` };
    out[`salida_luz_sur${suf}`] = { src: [0, r + 31, 3, 2], layer: 2, door: [1, 1], tags: ['salida', tag], desc: `Claridad de salida en la pared sur (${v.desc}); colocar en (x, y1)` };
  }
  return out;
}

function variantBrushes() {
  const out = {};
  for (const [suf, v] of Object.entries(VARIANTS)) {
    const r = v.row;
    out[`suelo${suf}`] = { pattern: [0, r, 3, 3], layer: 0, desc: `Suelo de cueva: ${v.desc}` };
    out[`sala${suf}`] = { cave: { floor: [0, r, 3, 3], void: 403, ring: [0, r + 19] }, desc: `Sala rectangular (${v.desc}): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo)` };
  }
  return out;
}

export default {
  tileset: 2,
  image: 'Cueva1',
  preview: { ground: 'suelo' },
  stamps: {
    // ─── Salas completas probadas (Cueva Perdida de Añil) ───────────────────────────────────
    sala_cruz: {
      from: { map: 200, x: 2, y: 2, w: 20, h: 18, layers: [0, 1, 2] },
      skip: [...BOULDER(5, 3), ...BOULDER(12, 12), ...BOULDER(5, 14)],
      door: [9, 17], exits: { n: [9, 3], o: [1, 10], e: [17, 10], s: [9, 17] },
      tags: ['sala'], desc: 'Sala de cueva en cruz con 4 salidas (norte: boca oscura, oeste/este: túneles, sur: luz exterior)',
    },

    // ─── Bocas y salidas (capa 2, sobre las paredes; door = casilla del warp) ─────────────────
    ...variantStamps(),
    salida_luz_norte: { src: [0, 33, 3, 4], layer: 2, door: [1, 2], tags: ['salida'], desc: 'Salida iluminada en la pared norte (al exterior); colocar en (x, y0-4)' },
    boca_oeste: { src: [0, 41, 4, 4], layer: 2, door: [2, 2], tags: ['salida'], desc: 'Túnel oscuro en la pared oeste; colocar en (x0-3, y)' },
    boca_este: { src: [4, 41, 4, 4], layer: 2, door: [1, 2], tags: ['salida'], desc: 'Túnel oscuro en la pared este; colocar en (x1, y)' },
    salida_luz_oeste: { src: [0, 37, 4, 4], layer: 2, door: [2, 2], tags: ['salida'], desc: 'Salida iluminada en la pared oeste; colocar en (x0-3, y)' },
    salida_luz_este: { src: [4, 37, 4, 4], layer: 2, door: [1, 2], tags: ['salida'], desc: 'Salida iluminada en la pared este; colocar en (x1, y)' },
    escalera_mano: { src: [2, 602, 1, 2], layer: 2, door: [0, 1], tags: ['salida', 'escalera'], desc: 'Escalera de mano de madera (subir a otro nivel)' },
    agujero: { src: [0, 602, 2, 2], layer: 1, door: [0, 1], tags: ['salida'], desc: 'Agujero en el suelo con reborde (bajar a otro nivel)' },

    // ─── Rocas y obstáculos ─────────────────────────────────────────────────────────────────
    roca_peque: { src: [5, 17, 1, 2], layer: 2, solid: true, tags: ['roca'], desc: 'Roca pequeña rojiza' },
    roca_musgo: { src: [4, 14, 2, 2], layer: 2, solid: true, tags: ['roca'], desc: 'Roca redonda con musgo (2×2)' },
    matojo_cueva: { src: [4, 12, 2, 2], layer: 2, solid: true, tags: ['roca'], desc: 'Mata de roca y musgo oscuro (2×2)' },
    roca_nevada: { src: [4, 298, 3, 2], layer: 2, solid: true, tags: ['roca', 'hielo'], desc: 'Roca con nieve (3×2)' },
    cristales: { src: [0, 599, 6, 2], layer: 2, solid: true, tags: ['roca', 'cristal'], desc: 'Grupo de cristales turquesa (6×2)' },
    gota_cristal: { src: [6, 599, 1, 2], layer: 2, solid: true, tags: ['cristal'], desc: 'Cristal azul en forma de gota' },
    tronco_h: { src: [0, 17, 3, 1], layer: 2, solid: true, tags: ['madera'], desc: 'Tronco/viga horizontal (3×1)' },
    tronco_v: { src: [3, 16, 2, 3], layer: 2, solid: true, tags: ['madera'], desc: 'Raíz/tronco vertical (2×3)' },
    pepita: { src: [6, 27, 1, 1], layer: 2, tags: ['decoracion'], desc: 'Piedra dorada (decorativa)' },
    charco: { src: [6, 14, 1, 1], layer: 1, tags: ['agua'], desc: 'Charco pequeño' },
    mancha_tierra: { src: [3, 0, 2, 1], layer: 1, tags: ['suelo'], desc: 'Mancha de tierra en el suelo' },
    cartel: { src: [3, 9, 1, 1], layer: 2, solid: true, tags: ['cartel'], desc: 'Cartel de madera' },
    carteles_dobles: { src: [0, 88, 4, 2], layer: 2, solid: true, tags: ['cartel'], desc: 'Dos tablones de madera (4×2)' },
    paso_rejilla: { src: [0, 45, 8, 3], layer: 2, solid: true, tags: ['madera', 'vestigio'], desc: 'Paso con rejilla de madera entre rocas (8×3)' },
    santuario: { src: [0, 606, 5, 8], layer: 2, door: [2, 5], solid: true, tags: ['vestigio'], desc: 'Santuario de tejado negro y pórtico rojo (5×8, sombra incluida)' },
    antorcha: { tiles: { w: 1, h: 2, layers: [null, null, [304, 328]] }, solid: true, tags: ['luz'], desc: 'Antorcha animada de pared (autotile 5)' },
    chorro_agua: { tiles: { w: 2, h: 2, layers: [null, null, [142, 190, 238, 286]] }, tags: ['agua'], desc: 'Chorro de agua animado que brota de la roca (autotiles 1–4)' },
  },

  brushes: {
    vacio: { tile: 403, layer: 0, desc: 'Negro de roca maciza (fuera de las salas)' },
    ...variantBrushes(),
    agua: { autotile: 6, layer: 0, desc: 'Agua de cueva (autotile 6; en tilesets 12–15 es hielo, lava, agua morada/azul)' },
    estanque: { nine: 'ids', ids: [[408, 409, 415], [416, 417, 423], [440, 441, 447]], layer: 1, desc: 'Estanque rectangular con marco de roca (agua fija)' },
    saliente: { line: { ids: [467, 473, 468] }, layer: 1, desc: 'Saliente de cueva (ledge): se salta hacia el sur' },
  },
};
