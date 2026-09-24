// Pozo del Albo (docs/CAMPANA.md §1.4: «Pozo del Albo: Buceo»; §2.3 C085 «Fondo del pozo», etapa G): fondo de la
// Poza del Albo bajo la gran cascada, con la burbuja de Zygarde (Buceo, 50 %). Tileset 15 (Cueva Azul), mapa
// submarino (world/zygarde/dive.js). Entrada: remolino de la Poza (garganta_albo). Encuentros de Buceo 45–50.
import { zoneDefaults } from '../../services/zones.js';
import { POZO_ALBO } from '../../encounters/b04.js';
import { WHIRLPOOL, rect } from './garganta_albo_layout.js';
import { BRUSHES } from './pilar_corriente_build.js';

export const POZO_ARRIVAL = Object.freeze({ x: 6, y: 10, dir: 6 });

export default {
  id: 'pozo_albo',
  ...zoneDefaults('pozo_albo'),
  bgm: 'Emociones',
  battleback: 'Sub',
  tileset: 15,
  width: 26,
  height: 20,
  cave: true,
  start: POZO_ARRIVAL,
  dark: { amount: 0.86 },
  tone: [-60, -10, 36, 40],
  noFollower: true,
  underwater: { shallow: [[3, 8, 5, 5]] },
  encounters: POZO_ALBO,
  brushes: BRUSHES,
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 3, 4, 20, 13, 'sala_gris');
    // Salientes de roca en las esquinas y los muros: rompen el rectángulo del pozo.
    for (const r of [[3, 4, 4, 2], [18, 4, 5, 2], [3, 15, 3, 2], [19, 14, 4, 3], [11, 4, 3, 2]]) b.paint('macizo_gris', rect(...r));
    // Fondo de limo con manchas claras.
    b.paint('mancha_gris', rect(8, 9, 4, 3));
    b.paint('mancha_gris', rect(15, 11, 3, 2));
    for (const [x, y] of [[10, 6], [17, 8], [12, 13], [16, 14]]) b.stamp('roca_grande_gris', x, y);
    for (const [x, y] of [[8, 14], [15, 6], [7, 6], [21, 11]]) b.stamp('roca_musgo_gris', x, y);
    for (const [x, y] of [[6, 13], [14, 9], [19, 9]]) b.stamp('roca_peque_gris', x, y);
    b.stamp('cristales', 13, 10);
    b.stamp('gota_cristal', 4, 11);
    b.stamp('pilar_zocalo_gastado', 21, 6);
    b.stamp('pilar_zocalo_gastado', 6, 15);
  },
  events: [
    { id: 'superficie', type: 'diveSpot', surface: true, x: POZO_ARRIVAL.x, y: POZO_ARRIVAL.y, to: 'garganta_albo', tx: WHIRLPOOL.x, ty: WHIRLPOOL.y, dir: 2 },
    { id: 'respiradero', type: 'diveVent', x: 15, y: 13 },
    { id: 'cell_garganta_5', type: 'zygardeCell', x: 21, y: 8, cell: 'cell_garganta_5' },
    { id: 'perla_pozo', type: 'item', x: 12, y: 8, item: 'BIGPEARL', hidden: true },
    {
      id: 'losa_pozo', x: 21, y: 6, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Un zócalo hexagonal gastado, cubierto de algas.'); },
    },
  ],
};
