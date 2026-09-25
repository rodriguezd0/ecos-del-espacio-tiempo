// Taller del Rey (docs/CAMPANA.md B19 «calzada_rey (1 + 2)»: el interior de la Peña, tileset 2 Cueva1; TABLILLAS.md
// T15 «La última tabla está donde el rey trabajó»). 19×15. Coordenadas: taller_layout.js · eventos:
// content/events/b19_taller.js. Se entra empujando contra la boca del taller en la Peña (calzada_rey).
import { zoneDefaults } from '../../services/zones.js';
import { W, H, FLOOR, ENTRY, DOOR, SLABS } from './taller_layout.js';
import { PENA } from './calzada_layout.js';
import { tallerEvents } from '../../events/b19_taller.js';
import { MUSIC } from '../../events/b19_common.js';

const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

export default {
  id: 'calzada_taller',
  ...zoneDefaults('calzada_taller'),
  name: 'Taller del Rey',
  tileset: 2,
  width: W,
  height: H,
  outdoor: false,
  cave: true,
  bgm: MUSIC.taller,
  battleback: 'Cueva',
  tone: [18, 8, -6, 0],
  start: { x: ENTRY.x, y: ENTRY.y, dir: ENTRY.dir },
  // La claridad de la salida está sobre tiles no pisables: el warp salta al empujar contra ella.
  warps: [{ x: DOOR.x, y: DOOR.y, to: 'calzada_rey', tx: PENA.workshop.arrive.x, ty: PENA.workshop.arrive.y, dir: 2 }],

  build(b) {
    const F = FLOOR;
    b.fill(null, 'vacio');
    b.rect(null, F.x0, F.y0, F.x1 - F.x0 + 1, F.y1 - F.y0 + 1, 'sala');
    b.stamp('salida_luz_sur', DOOR.x - 1, F.y1);
    // Enlosado bajo la zona de trabajo, polvo de piedra y cascotes de tallar.
    b.paint('pilar_enlosado', rect(SLABS.x0, SLABS.y0, SLABS.x1, SLABS.y1));
    b.rect(null, 12, 7, 3, 3, 'mancha');
    b.rect(null, 4, 9, 4, 3, 'mancha');
    b.stamp('pilar_glifo', 9, 6);
    b.stamp('pilar_zocalo_gastado', 8, 5);
    b.stamp('pilar_zocalo', 10, 5);
    b.stamp('pilar_columna_quebrada', 3, 11);
    b.stamp('pilar_columna_quebrada', 15, 5);
    b.stamp('escombros', 12, 10); // lascas de piedra de tallar
    b.stamp('tronco_h', 5, 10); // vigas para apuntalar
    for (const [x, y] of [[7, 11], [11, 11]]) b.stamp('roca_peque', x, y);
    b.stamp('musgo_rocas', 5, 12);
    for (const x of [5, 13]) b.stamp('antorcha', x, 1);
  },

  events: tallerEvents(),
};
