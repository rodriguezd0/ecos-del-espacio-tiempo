// Stamps y brushes del tileset 5 (Exterior3), derivados de ExteriorBosqueCeleste.
// Solo las piezas idénticas píxel a píxel (node tools/stamps_compat.mjs 7 5) más las revisadas a ojo con
// `preview_stamps ExteriorBosqueCeleste --as=5` (acantilado marrón, valla vertical, hierba y flores).
// Propias (ciudad minera, estación, rascacielos, cañón): exterior23_extras.js · terrenos: overlay.
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';
import { SHARED_STAMPS as SHARED_EXT2, SHARED_BRUSHES, EXTRA_BRUSHES } from './Exterior2.js';
import { COMMON, EXT3 } from './exterior23_extras.js';
import { extraDefs } from './extraTiles.js';

// Igual que Exterior2 salvo la fuente grande, que en Exterior3 cambia.
const SHARED_STAMPS = SHARED_EXT2.filter((n) => n !== 'fuente_grande');
const { adoquin: _a, ...BRUSHES } = EXTRA_BRUSHES;
const KIT = extraDefs('Exterior3'); // grava, barro, arena honda, ceniza y zócalos (tiles propios del overlay)

export default deriveLibrary(base, {
  tileset: 5,
  image: 'Exterior3',
  stamps: { include: SHARED_STAMPS, add: { ...COMMON, ...EXT3, ...KIT.stamps } },
  brushes: {
    include: SHARED_BRUSHES,
    add: {
      ...BRUSHES,
      calzada: { nine: [5, 559], layer: 0, desc: 'Calzada de asfalto con bordillo (avenidas de ciudad grande; rectangular)' },
      ...KIT.brushes,
    },
  },
});
