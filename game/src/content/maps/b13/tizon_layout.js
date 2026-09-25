// Coordenadas del Volcán Tizón (docs/CAMPANA.md §1.4: cono volcánico, «el caserío de la forja ocupa la ladera»,
// tileset 5 + 13, MansionQuemada, fondo Volcan; TABLILLAS T12). Primer mapa de los tres (ladera; después la Cueva del
// Tizón y el cráter). Al oeste, el Mar del Sur (su borde este: la x 0 de aquí cae junto a su x 189). Módulo puro.
//   Playa al oeste · caserío de la forja abajo (sur) · dos terrazas de ceniza con hierba que suben hacia el norte ·
//   la bocamina de las galerías de la forja arriba (Cueva del Tizón) · el flanco del volcán al este.
export const W = 40;
export const H = 50;

/** Borde oeste: conexión simétrica con el Mar del Sur (misma fila 0). */
export const SEA_LINK = Object.freeze({ to: 'mar_del_sur', offset: 0 });

/** Terrazas (pincel `terraza`: la cara son las 3 últimas filas) y escaleras sobre la cara. */
export const LEVEL1 = Object.freeze({ x: 10, y: 14, w: 26, h: 18, stairs: { x: 20, y: 29 } }); // arriba y 14–28, cara 29–31
export const LEVEL2 = Object.freeze({ x: 13, y: -3, w: 20, h: 19, stairs: { x: 20, y: 13 } }); // arriba y 0–12, cara 13–15
/** Caserío (suelo de ceniza y caminos), playa y mar. */
export const VILLAGE = Object.freeze({ x: 10, y: 32, w: 26, h: 12 });
/** Playas: la del oeste (x 6–9) y la del sur (y 44–45), con espuma hacia el mar. */
export const BEACHES = Object.freeze([[6, 12, 4, 34], [10, 44, 25, 2]]);
export const SEA = Object.freeze([[0, 0, 6, 50], [6, 46, 34, 4], [6, 0, 4, 12]]);
/** Flancos del volcán (pincel `acantilado`): este y noroeste. */
export const FLANKS = Object.freeze([[35, 0, 5, 46], [6, 0, 7, 12]]);
/**
 * Borde de la cima del flanco noroeste (x 7–11, y 1–8): el pincel deja la cima pisable y da al mar, así que se cierra
 * con bloqueos invisibles para que nadie trepe al acantilado desde el agua (tests/b13_reach.test.mjs).
 */
export const MESA_EDGE = Object.freeze([
  ...Array.from({ length: 8 }, (_, i) => [7, 1 + i]),
  ...[8, 9, 10, 11].flatMap((x) => [[x, 1], [x, 8]]),
]);

/** Bocamina de las galerías de la forja (entrada a la Cueva del Tizón). */
export const MINE = Object.freeze({ x: 20, y: 2, door: { x: 21, y: 4 }, to: 'tizon_cueva', arrive: { x: 30, y: 46, dir: 8 } });
export const MINE_FRONT = Object.freeze({ x: 21, y: 6, dir: 2 }); // llegada al salir de la cueva

/** Edificios del caserío. */
export const BUILDINGS = Object.freeze({
  brasa: { stamp: 'cabana_roja', x: 11, y: 33, door: { x: 14, y: 38 }, to: 'tizon_casa' },
  cupula: { stamp: 'casa_cupula', x: 29, y: 34, door: { x: 31, y: 38 }, to: null },
  almacen: { stamp: 'granero_verde', x: 24, y: 38, door: { x: 26, y: 43 }, to: null },
});
export const HOUSE_ENTRY = Object.freeze({ x: 6, y: 9 });

/** Patio de la forja: la fragua (evento 3×2), yunques, Brasa y la célula C067 «Forja fría». */
export const FORGE = Object.freeze({
  fragua: { x: 21, y: 35 }, // se dibuja 96×64 anclada en esta casilla (ocupa x 20–22, y 34–35)
  anvils: [[18, 36], [24, 36]],
  brasa: { x: 21, y: 37, dir: 2 },
  cell: { key: 'cell_tizon_1', x: 23, y: 34 },
  stack: { x: 17, y: 33 },
});

export const NPCS = Object.freeze({
  smith: { x: 27, y: 36, dir: 4 },
  smithF: { x: 12, y: 43, dir: 6 },
  apprentice: { x: 19, y: 42, dir: 8 },
  fisher: { x: 8, y: 30, dir: 4 },
});

export const TRAINERS = Object.freeze([
  { id: 'montanero_blas', trainer: 'b13_montanero_blas', name: 'Montañero Blas', sprite: 'anil:montanero', x: 13, y: 20, dir: 6, sight: 4 },
  { id: 'excursionista_carmen', trainer: 'b13_excursionista_carmen', name: 'Excursionista Carmen', sprite: 'anil:excursionista_f', x: 31, y: 24, dir: 4, sight: 4 },
  { id: 'tecnico_perforacion', trainer: 'b13_tecnico_perforacion', name: 'Técnico Iñaki', sprite: 'genesis_tecnico', x: 23, y: 7, dir: 4, sight: 3 },
]);

/** Hierba alta (encuentros de la ladera). */
export const GRASS = Object.freeze([[11, 16, 5, 3], [27, 16, 6, 4], [15, 23, 5, 4], [15, 5, 4, 4], [26, 3, 5, 5], [30, 25, 4, 3]]);

export const ITEMS = Object.freeze([
  { id: 'objeto_tizon_1', x: 33, y: 21, item: 'HEATROCK', hidden: true },
  { id: 'objeto_tizon_2', x: 30, y: 2, item: 'STARPIECE' },
  { id: 'objeto_tizon_3', x: 33, y: 43, item: 'LAVACOOKIE' },
  { id: 'objeto_tizon_4', x: 7, y: 41, item: 'SHOALSHELL', hidden: true },
]);

export const START = Object.freeze({ x: 9, y: 36, dir: 6 });
