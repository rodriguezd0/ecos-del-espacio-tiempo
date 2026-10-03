// Pilar Invertido — la explanada interior (docs/CAMPANA.md B12): al otro lado del aljibe, el reflejo de la explanada
// del prólogo flotando en el Mundo Distorsión, con las cicatrices de las tres noches en que Zygarde empujó a Giratina
// de vuelta. Rellano de llegada bajo el aljibe, plaza con columnas y estela partida, islote del portal hacia La Cara
// Vuelta. Piso 1 del P6, sin encuentros (X36). Tileset 14, 40×34.
// Tras restaurar, el portal del núcleo trae aquí y Zygarde da su «Respuesta».
import { zoneDefaults } from '../../services/zones.js';
import { VESTIBULO as V, P6_VERTICAL as P } from './layout.js';
import { paintPlatform, floatingDebris, rectSet, rockSet, raggedIsland, union, DISTORTION_ENV, DISTORTION_TONE } from './paint.js';
import { vestibuloEvents, firstFallHint } from '../../events/b12_distorsion.js';
import { F } from '../../events/b12_common.js';
import { paintStair } from './vertical_build.js';

const events = vestibuloEvents();
const key = (x, y) => `${x},${y}`;

export default {
  id: 'pilar_invertido',
  ...zoneDefaults('pilar_invertido'),
  name: 'Pilar Invertido · piso 1',
  pillar: { id: 'P6', floor: 1 },
  ...DISTORTION_ENV,
  width: V.width,
  height: V.height,
  tone: DISTORTION_TONE, // tinte del P6 (violeta), rebajado
  start: { ...V.arrival },
  impossible: { section: 'vestibulo', spawn: { ...V.arrival }, fallFlag: F.primeraCaidaP6, onFirstFall: firstFallHint },

  build(b) {
    const reserved = new Set(events.map((e) => key(e.x, e.y)));
    const decor = [...V.columns, ...V.columns.map(([x, y]) => [x, y - 1]), ...V.broken, ...V.monoliths.flatMap(([x, y]) => [[x, y], [x + 1, y]]),
      [V.placa.x, V.placa.y + 1], [V.placa.x + 1, V.placa.y + 1], [30, 22], [31, 22], [8, 14]];
    const keep = union(reserved, rectSet(V.neck, V.eastPath), new Set(decor.map(([x, y]) => key(x, y))),
      ...V.enlosado.map((r) => rectSet({ x0: r.x, y0: r.y, x1: r.x + r.w - 1, y1: r.y + r.h - 1 })));
    const floor = union(
      raggedIsland(V.landing, { keep, seed: 61 }), raggedIsland(V.plaza, { keep, seed: 67, bites: 0.1 }),
      rectSet(V.neck, V.eastPath, V.portalIsle),
    );
    const rocks = new Set([...rockSet(V.rocks)].filter((c) => floor.has(c)));
    for (const c of rocks) floor.delete(c);
    paintPlatform(b, { floor, wall: rocks, reserved, seed: 61 });
    // Losas antiguas de la explanada (del revés): tres enlosados como las losas del prólogo.
    for (const r of V.enlosado) b.rect(1, r.x, r.y, r.w, r.h, 'pilar_enlosado');
    for (const [x, y] of V.columns) b.stamp('pilar_columna', x, y - 2);
    for (const [x, y] of V.broken) b.stamp('pilar_columna_quebrada', x, y - 1);
    for (const [x, y] of V.monoliths) b.stamp('pilar_monolito', x, y - 2);
    b.stamp('pilar_placa_unown', V.placa.x, V.placa.y);
    for (const [x, y] of [[16, 6], [23, 8], [12, 21], [28, 13], [37, 20]]) b.stamp('pilar_glifo', x, y);
    b.stamp('pilar_arista_grande', 30, 21);
    b.stamp('pilar_arista', 6, 14); // junto al monolito, sin pisarlo
    floatingDebris(b, [[3, 4, 2], [30, 3, 3], [2, 28, 2], [26, 29, 3], [12, 29, 2], [36, 8, 2]]);
    paintStair(b, P.baseUp);
  },

  events,
};
