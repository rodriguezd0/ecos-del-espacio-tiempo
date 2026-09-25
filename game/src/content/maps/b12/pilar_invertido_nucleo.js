// Pilar Invertido — núcleo (docs/CAMPANA.md B12 «Núcleo»): plataforma hexagonal suspendida con el sello de la brecha,
// donde N3 quedó fundido para taponarla. Tres Anclas con los símbolos de las tres secciones; al tocarlas en el orden
// del camino, el sello se vuelve a formar sin N3 (content/events/b12_nucleo.js). Tileset 14, 33×31, sin encuentros.
import { zoneDefaults } from '../../services/zones.js';
import { NUCLEO as N } from './layout.js';
import { paintPlatform, floatingDebris, rectSet, DISTORTION_ENV, DISTORTION_TONE } from './paint.js';
import { nucleoEvents } from '../../events/b12_nucleo.js';
import { firstFallHint } from '../../events/b12_distorsion.js';
import { F } from '../../events/b12_common.js';

const events = nucleoEvents();
const key = (x, y) => `${x},${y}`;

/** Plataforma de esquinas recortadas (octógono) más el paso de entrada. */
function platformCells() {
  const P = N.platform;
  const out = rectSet(P, N.entryPath);
  for (const [cx, cy, sx, sy] of [[P.x0, P.y0, 1, 1], [P.x1, P.y0, -1, 1], [P.x0, P.y1, 1, -1], [P.x1, P.y1, -1, -1]]) {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3 - j; i++) out.delete(key(cx + i * sx, cy + j * sy));
  }
  return out;
}

export default {
  id: 'pilar_invertido_nucleo',
  ...zoneDefaults('pilar_invertido_nucleo'),
  name: 'Pilar Invertido',
  ...DISTORTION_ENV,
  width: N.width,
  height: N.height,
  tone: DISTORTION_TONE, // tinte del P6 (violeta), rebajado
  showLocation: false,
  start: { ...N.arrival },
  impossible: { section: 'nucleo', spawn: { ...N.arrival }, fallFlag: F.primeraCaidaP6, onFirstFall: firstFallHint },

  build(b) {
    const floor = platformCells();
    const reserved = new Set(events.map((e) => key(e.x, e.y)));
    paintPlatform(b, { floor, reserved, seed: 113, decals: 0.04 });
    // Enlosado ceremonial alrededor del sello y cámara del núcleo grabada en el suelo.
    b.rect(1, 12, 10, 9, 8, 'pilar_enlosado');
    for (const [x, y] of N.columns) b.stamp('pilar_columna', x, y - 2);
    for (const [x, y] of [[13, 19], [19, 19], [16, 20]]) b.stamp('pilar_glifo', x, y);
    floatingDebris(b, [[2, 4, 2], [27, 5, 3], [3, 24, 3], [26, 26, 2], [14, 2, 2]]);
  },

  events,
};
