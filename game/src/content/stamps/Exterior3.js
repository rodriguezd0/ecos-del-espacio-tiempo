// Stamps y brushes del tileset 5 (Exterior3), derivados de ExteriorBosqueCeleste.
// Solo las piezas idénticas píxel a píxel (node tools/stamps_compat.mjs 7 5) más las revisadas a ojo con
// `preview_stamps ExteriorBosqueCeleste --as=5` (acantilado marrón, valla vertical, hierba y flores).
// PENDIENTE: los edificios propios de Exterior3 y su orilla de agua.
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';
import { SHARED_STAMPS as SHARED_EXT2, SHARED_BRUSHES, EXTRA_BRUSHES } from './Exterior2.js';

// Igual que Exterior2 salvo la fuente grande, que en Exterior3 cambia.
const SHARED_STAMPS = SHARED_EXT2.filter((n) => n !== 'fuente_grande');

export default deriveLibrary(base, {
  tileset: 5,
  image: 'Exterior3',
  stamps: { include: SHARED_STAMPS },
  brushes: { include: SHARED_BRUSHES, add: EXTRA_BRUSHES },
});
