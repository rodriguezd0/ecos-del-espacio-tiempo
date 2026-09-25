// Pilar Invertido — La Mirada (docs/CAMPANA.md B12 «(b) La Mirada»): islotes de piedra sobre el vacío unidos por
// puentes que solo existen mientras el jugador los mira (a ≤ 4 casillas en la dirección de avance; tipo de evento
// `puenteMirada`, world/impossible/field.js). Girar encima de un puente hace caer y volver al Ancla: hay que
// planificar la ruta girando solo sobre islotes. Ruta: I0 → I1 (Ancla del ojo) → P1 → I2 (Ancla) → P2 → I5 (salida).
// Desvíos opcionales: islote norte (objeto) y el del sureste (objeto). Tileset 14, 30×26, sin encuentros.
import { zoneDefaults } from '../../services/zones.js';
import { MIRADA as M } from './layout.js';
import { paintPlatform, floatingDebris, raggedIsland, union, DISTORTION_ENV, DISTORTION_TONE } from './paint.js';
import { miradaEvents, firstFallHint } from '../../events/b12_distorsion.js';
import { F } from '../../events/b12_common.js';

const events = miradaEvents();
const key = (x, y) => `${x},${y}`;

export default {
  id: 'pilar_invertido_mirada',
  ...zoneDefaults('pilar_invertido_mirada'),
  name: 'Pilar Invertido',
  ...DISTORTION_ENV,
  width: M.width,
  height: M.height,
  tone: DISTORTION_TONE, // tinte del P6 (violeta), rebajado
  showLocation: false,
  start: { ...M.start },
  impossible: { section: 'mirada', spawn: { ...M.start }, reach: 4, fallFlag: F.primeraCaidaP6, onFirstFall: firstFallHint },

  build(b) {
    const reserved = new Set(events.map((e) => key(e.x, e.y)));
    const keep = union(reserved, new Set(['27,3', '21,5', '20,5']));
    const floor = union(...M.islands.map((r, i) => raggedIsland(r, { keep, seed: 83 + i * 5 })));
    paintPlatform(b, { floor, reserved, seed: 83, decals: 0.1 });
    // Glifos del ojo en los islotes de giro y columnas partidas en las islas grandes.
    for (const [x, y] of [[15, 15], [15, 5], [21, 11]]) b.stamp('pilar_glifo_2', x, y);
    b.stamp('pilar_columna_quebrada', 4, 13);
    b.stamp('pilar_columna_quebrada', 27, 2);
    b.stamp('pilar_arista', 16, 9);
    floatingDebris(b, [[9, 2, 2], [10, 21, 3], [25, 12, 2], [1, 10, 2], [18, 22, 2], [27, 20, 2]]);
  },

  events,
};
