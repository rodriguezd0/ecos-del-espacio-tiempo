// Construcción del Mar del Sur (MapBuilder + Exterior1): mar abierto con bancos de arena y espuma, farallones de roca,
// escollos, islas de basalto, veleros fondeados y la barrera de rocas del Arrecife del Eco al suroeste. Las
// boyas-farolillo, las aves y los personajes son eventos (content/events/b13_mar.js). Módulo puro.
import { W, H, SANDBARS, STACKS, BASALT, ROCKS, BOATS } from './mar_layout.js';
import { rect, paintBeaches, sealBeaches } from './paint.js';

/** Hierba de playa, guijarros y matas sobre los bancos (decorado pisable o de borde). */
const DECOR = Object.freeze([
  ['brotes', 5, 15], ['brotes', 7, 17], ['brotes', 88, 10], ['brotes', 91, 11], ['brotes', 45, 23], ['brotes', 120, 38],
  ['brotes', 135, 15], ['brotes', 183, 38], ['guijarros', 53, 36], ['guijarros', 123, 18], ['guijarros', 165, 41],
  ['brotes', 169, 37], ['guijarros', 60, 46], ['brotes', 178, 17], ['guijarros', 160, 10],
]);

/** Escollos en racimo (formas irregulares) además de las rocas sueltas. */
const REEFS = Object.freeze([
  [[0, 0], [1, 0], [1, 1], [3, 1], [2, 2]],
  [[0, 0], [2, 0], [1, 1], [0, 2]],
  [[0, 0], [1, 1], [2, 1], [3, 0]],
]);
const REEF_SPOTS = Object.freeze([[24, 44, 0], [88, 30, 1], [140, 32, 2], [112, 42, 0], [72, 36, 2], [150, 44, 1], [36, 26, 1]]);

export function buildMar(b) {
  b.fill(0, 'agua');
  const sand = [...SANDBARS, ...STACKS].flatMap((s) => rect(s.x, s.y, s.w, s.h));
  const holed = paintBeaches(b, sand);
  for (const s of STACKS) b.paint('acantilado', rect(s.x + 2, s.y + 1, s.w - 4, s.h - 3));
  for (const [x, y] of ROCKS) b.stamp('roca_agua', x, y);
  for (const [x, y, k] of REEF_SPOTS) for (const [dx, dy] of REEFS[k]) b.stamp('roca_agua', x + dx, y + dy);
  for (const [x, y] of BASALT) b.stamp('roca_grande', x, y);
  for (const [s, x, y] of BOATS) b.stamp(s, x, y);
  for (const [s, x, y] of DECOR) b.stamp(s, x, y);
  sealBeaches(b, holed);
}

export { W, H };
