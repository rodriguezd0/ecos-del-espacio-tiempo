// Mesa de los Vientos (docs/CAMPANA.md §1.3: «Comunidad aislada sobre una mesa rocosa», 40×40, tileset 1, solo por
// Vuelo, cuidadores de Altaria que curan, BGM viento; TABLILLAS T14). FUENTE ÚNICA de coordenadas. Módulo puro.
//   · Una mesa de roca por encima de las nubes (el mar de nubes de Exterior1 rodea la meseta y bloquea).
//   · Explanada de llegada al sur (punto de Vuelo), caserío de los cuidadores con la cabaña de Aurora, corral de los
//     Altaria, prados de hierba alta (encuentros), molinos de viento.
//   · El rebaño disperso (T14, «tres encuentros visibles»): un Altaria en el prado del oeste (a pie), otro en el Alto de
//     la Mesa (se sube por una pared con vetas: Trepar) y otro en la Aguja del Viento (Reconstrucción: dos zócalos).
//   · En el Alto, la roca del deseo (reservada para el postgame, CAMPANA §8).
export const W = 40;
export const H = 40;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

/** Rectángulo inclusivo con esquinas redondeadas (radio r) → casillas. */
export function roundRect(x0, y0, x1, y1, r = 0) {
  const out = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
      const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
      if (r > 0 && dx * dx + dy * dy > r * r) continue;
      out.push([x, y]);
    }
  }
  return out;
}

/** La mesa (tierra pisable): meseta principal y la Aguja del Viento, separadas por nubes. */
export const MESA = Object.freeze({ x0: 2, y0: 4, x1: 31, y1: 34, r: 4 });
export const AGUJA = Object.freeze({ x0: 34, y0: 13, x1: 38, y1: 21, r: 1 });
/** Hueco de nubes entre la meseta y la Aguja (Reconstrucción) y sus zócalos (en el borde de la meseta). */
export const AGUJA_GAP = Object.freeze({
  cells: Object.freeze([[32, 16], [33, 16], [32, 17], [33, 17]]),
  sockets: Object.freeze([P(31, 16, 6), P(31, 17, 6)]),
});

/** Alto de la Mesa: terraza de muros finos (cara sur y 9–11); se sube por la pared con vetas. */
export const ALTO = Object.freeze({ x0: 11, y0: 4, x1: 25, y1: 11 });
export const CLIMB = Object.freeze({ up: P(18, 11, 8), top: Object.freeze([18, 8]), down: P(18, 9, 2), bottom: Object.freeze([18, 12]) });
export const WISH_ROCK = Object.freeze({ x: 21, y: 5 }); // roca del deseo (roca_grande 2×2)

/** Explanada de llegada (estrado de losas 6×6) y punto de Vuelo. */
export const LANDING = Object.freeze({ x: 15, y: 27 });
export const FLY_POINT = P(17, 31, 8);

/** Caserío: cabaña de Aurora y casa de los cuidadores. */
export const BUILDINGS = Object.freeze({
  aurora: Object.freeze({ stamp: 'cabana_turquesa', x: 3, y: 21, door: Object.freeze({ x: 5, y: 27 }) }),
  cuidadores: Object.freeze({ stamp: 'casa_turquesa_chimenea', x: 23, y: 22, door: Object.freeze({ x: 25, y: 28 }) }),
});
export const INTERIOR_ENTRY = Object.freeze({ mesa_vientos_casa: P(6, 9, 8) });

/** Corral de los Altaria (valla blanca con la puerta al sur). */
export const CORRAL = Object.freeze({
  x0: 20, y0: 12, x1: 28, y1: 18,
  gate: Object.freeze({ x0: 23, x1: 24, y: 18 }),
  roost: Object.freeze([P(22, 14, 6), P(25, 13, 2), P(27, 16, 4)]), // donde se posan los tres recuperados
  flock: Object.freeze([P(21, 16, 6), P(24, 15, 2), P(26, 14, 4)]), // los que nunca se fueron (Swablu y Altaria)
});

/** Hierba alta (encuentros de la Mesa): prado del oeste, prado del sureste y la franja del Alto. [x0, y0, x1, y1] */
export const GRASS = Object.freeze([
  Object.freeze([3, 12, 9, 18]), Object.freeze([24, 31, 28, 32]), Object.freeze([13, 5, 16, 7]),
]);

/** Caminos de tierra [x0, y0, x1, y1] (un solo trazo). */
export const PATHS = Object.freeze([
  Object.freeze([17, 13, 18, 26]), Object.freeze([10, 20, 30, 21]), Object.freeze([13, 12, 20, 13]),
  Object.freeze([5, 28, 14, 29]), Object.freeze([21, 29, 26, 30]), Object.freeze([29, 12, 30, 19]), Object.freeze([10, 14, 11, 19]),
]);

/** El rebaño disperso: tres Altaria (T14). */
export const HERD_SPOTS = Object.freeze([
  P(6, 15, 2), // 1 · prado del oeste (a pie)
  P(36, 17, 4), // 2 · Aguja del Viento (Reconstrucción)
  P(19, 6, 2), // 3 · el Alto (Trepar)
]);

/** Cuidadores y detalles. */
export const SPOTS = Object.freeze({
  brisa: P(24, 19, 2), // jefa de los cuidadores, a la puerta del corral
  cefiro: P(6, 28, 4), // cuidador anciano, junto a la cabaña de Aurora
  nube: P(13, 24, 6), // cuidador joven con su Swablu
  nubeSwablu: P(14, 24, 4),
  sign: Object.freeze({ x: 21, y: 31 }),
  bell: Object.freeze({ x: 21, y: 24 }),
});

/** Molinos de viento (molino 2×4). */
export const MILLS = Object.freeze([[4, 7], [27, 5], [30, 22], [4, 29]]);

/** Objetos de la Mesa. */
export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_mesa_1', x: 37, y: 20, item: 'STARPIECE' }), // Aguja
  Object.freeze({ id: 'objeto_mesa_2', x: 24, y: 6, item: 'PPUP' }), // Alto
  Object.freeze({ id: 'objeto_mesa_3', x: 3, y: 19, item: 'SHARPBEAK', hidden: true }),
  Object.freeze({ id: 'objeto_mesa_4', x: 27, y: 33, item: 'ULTRABALL', count: 2 }),
]);
