// Bosque de algas de Caleta Sonda (docs/CAMPANA.md §2.3: C086, etapa G «Bosque de algas»): fondo bajo el remolino de la
// caleta, con la burbuja de Zygarde (Buceo, world/zygarde/dive.js). Tileset 15 (Cueva Azul), mapa submarino. Encuentros
// de Buceo del Fondo del Mar del Sur (48–54). Se entra buceando desde el remolino de Caleta Sonda.
import { zoneDefaults } from '../../services/zones.js';
import { CALETA_ALGAS } from '../../encounters/b09b.js';
import { W, H, ALGAS_ENTRY, SURFACE, ROOM, SHALLOW, VENT, CELL, KELP, ROCKS, ITEMS } from './caleta_algas_layout.js';

export default {
  id: 'caleta_algas',
  ...zoneDefaults('caleta_algas'),
  name: 'Caleta Sonda',
  bgm: 'Emociones',
  battleback: 'Sub',
  tileset: 15,
  width: W,
  height: H,
  cave: true,
  start: ALGAS_ENTRY,
  dark: { amount: 0.84 },
  tone: [-54, -6, 30, 36],
  noFollower: true,
  underwater: { shallow: SHALLOW },
  encounters: CALETA_ALGAS,
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, ROOM.x, ROOM.y, ROOM.w, ROOM.h, 'sala_gris');
    for (const [x, y] of KELP) b.stamp('matojo_cueva_gris', x, y);
    for (const [x, y] of ROCKS) b.stamp('roca_musgo_gris', x, y);
    b.stamp('roca_grande_gris', 23, 13);
    b.stamp('roca_peque_gris', 12, 14);
  },
  events: [
    { id: 'superficie', type: 'diveSpot', surface: true, x: ALGAS_ENTRY.x, y: ALGAS_ENTRY.y, to: SURFACE.map, tx: SURFACE.x, ty: SURFACE.y, dir: SURFACE.dir },
    { id: 'respiradero', type: 'diveVent', x: VENT.x, y: VENT.y },
    { id: 'cell_caleta_2', type: 'zygardeCell', x: CELL.x, y: CELL.y, cell: 'cell_caleta_2' },
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    {
      id: 'algas_brillo', x: 11, y: 8, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Largas cintas de algas se mecen con la corriente. Entre ellas nadan peces diminutos.'); },
    },
  ],
};
