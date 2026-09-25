// Fondo del Mar Boreal (docs/POKEDEX_DISTRIBUCION.md §7.3: «Buceo | 52–57 | Clamperl 60, Relicanth 40 | Mar Boreal»):
// un fondo frío bajo el remolino del Mar Boreal, con la burbuja de Zygarde (Buceo, world/zygarde/dive.js). Tileset 15
// (Cueva Azul), mapa submarino como los fondos del sur. Se entra buceando desde el remolino.
import { zoneDefaults } from '../../services/zones.js';
import { FONDO } from './layout_escarcha.js';
import { MAR_BOREAL_FONDO } from '../../encounters/b15.js';
import { fondoEvents } from '../../events/b15_mar.js';

const Fd = FONDO;

export default {
  id: 'mar_boreal_fondo',
  ...zoneDefaults('mar_boreal_fondo'), // «Fondo del Mar Boreal», Emociones, fondo Sub
  tileset: 15,
  width: Fd.width,
  height: Fd.height,
  cave: true,
  start: { x: Fd.entry.x, y: Fd.entry.y, dir: Fd.entry.dir },
  dark: { amount: 0.86 },
  tone: [-60, -10, 36, 50],
  noFollower: true,
  underwater: { shallow: Fd.shallow },
  encounters: MAR_BOREAL_FONDO,
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, Fd.room.x, Fd.room.y, Fd.room.w, Fd.room.h, 'sala_gris');
    for (const [x, y] of Fd.kelp) b.stamp('matojo_cueva_gris', x, y);
    for (const [x, y] of Fd.rocks) b.stamp('roca_musgo_gris', x, y);
  },
  events: fondoEvents(),
};
