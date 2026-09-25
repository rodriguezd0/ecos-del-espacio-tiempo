// Pilar Invertido — El Sumidero (docs/CAMPANA.md B12 «(c) El Sumidero»): un pozo vertical en el vacío. Islas a
// distintas alturas; cascadas invertidas (tipo `cascadaInvertida`) que suben de la boca de una isla al borde de la de
// arriba y solo se abren con su pulsador. El pulsador de la tercera está en la isla alta del oeste, de la que no se
// baja: hay que dejarse caer para volver al último poste. C053 junto a ese pulsador; la Gengarita en el rincón del
// noroeste; la sombra de Giratina cruza el vacío mayor al asomarse al borde este de la isla alta. Tileset 14, 34×48.
import { zoneDefaults } from '../../services/zones.js';
import { SUMIDERO as S } from './layout.js';
import { paintPlatform, floatingDebris, rectSet, raggedIsland, union, DISTORTION_ENV, DISTORTION_TONE } from './paint.js';
import { sumideroEvents } from '../../events/b12_sumidero.js';
import { firstFallHint } from '../../events/b12_distorsion.js';
import { F } from '../../events/b12_common.js';

const events = sumideroEvents();
const key = (x, y) => `${x},${y}`;
/**
 * Casillas que las islas irregulares no recortan: piezas del kit (base y cuerpo) y el borde este de la isla alta, el
 * mirador recto sobre el vacío mayor donde uno se asoma a ver la sombra (x 12, y 12–16).
 */
const DECOR = [[17, 39], [11, 29], [25, 27], [6, 13], [24, 10], [20, 38], [20, 39], [20, 40], [3, 29], [3, 30], [27, 11], [28, 11], [27, 12], [28, 12], [4, 14], [4, 15],
  ...[12, 13, 14, 15, 16].map((y) => [S.shadowStrip.x, y])];

export default {
  id: 'pilar_invertido_sumidero',
  ...zoneDefaults('pilar_invertido_sumidero'),
  name: 'Pilar Invertido',
  ...DISTORTION_ENV,
  width: S.width,
  height: S.height,
  tone: DISTORTION_TONE, // tinte del P6 (violeta), rebajado
  showLocation: false,
  start: { ...S.start },
  impossible: { section: 'sumidero', spawn: { ...S.start }, fallFlag: F.primeraCaidaP6, onFirstFall: firstFallHint },

  build(b) {
    // Las casillas invisibles de la sombra (media isla alta) no reservan suelo: la isla conserva su contorno.
    const reserved = new Set(events.filter((e) => !String(e.id).startsWith('b12_sombra_')).map((e) => key(e.x, e.y)));
    const paths = rectSet(...S.paths);
    const keep = union(reserved, paths, new Set(DECOR.map(([x, y]) => key(x, y))));
    const floor = union(...S.islands.map((r, i) => raggedIsland(r, { keep, seed: 97 + i * 11 })), paths);
    // Peñas en las islas grandes (no tocan pulsadores, bocas ni caminos).
    const rocks = new Set(['3,26', '4,26', '10,30', '11,30', '28,24', '29,24', '2,16', '2,17', '12,38', '12,39', '22,7', '23,7', '29,12', '29,13']
      .filter((c) => !reserved.has(c) && floor.has(c)));
    for (const c of rocks) floor.delete(c);
    paintPlatform(b, { floor, wall: rocks, reserved, seed: 97 });
    for (const [x, y] of [[17, 39], [11, 29], [25, 27], [6, 13], [24, 10]]) b.stamp('pilar_glifo', x, y);
    b.stamp('pilar_columna', 20, 38);
    b.stamp('pilar_columna_quebrada', 3, 29);
    b.stamp('pilar_arista_grande', 27, 11);
    b.stamp('pilar_arista', 4, 14);
    floatingDebris(b, [[16, 20, 3], [19, 14, 2], [8, 36, 2], [24, 34, 3], [30, 18, 2], [10, 4, 2], [18, 33, 2], [28, 40, 2]]);
  },

  events,
};
