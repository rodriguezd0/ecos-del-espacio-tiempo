// Gruta de la Luna, bajo el Islote Lumbre (TABLILLAS T11: «Se abre la gruta de la luna, donde están Lucía y la Tablilla»;
// CAMPANA §2.3 C063 «Islote Lumbre · Gruta de la luna»). Sala de cueva morada (tileset 14) con un estanque bajo el rayo
// de luna que entra por el techo, el pedestal de la Tabla Duende y Lucía dormida. Eventos: b13_lumbre.js (grutaEvents).
import { GROTTO as G, MOON_ROCK_FRONT as OUT } from './lumbre_layout.js';
import { grutaEvents } from '../../events/b13_lumbre.js';

export default {
  id: 'lumbre_gruta',
  name: 'Gruta de la Luna',
  bgm: 'Pokeflauta',
  battleback: 'Cueva',
  tileset: 14,
  width: G.width,
  height: G.height,
  cave: true,
  dark: { amount: 0.72 },
  tone: [-10, -14, 26, 10],
  start: { x: G.exit.x, y: G.exit.y - 1, dir: 8 },
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, G.room.x, G.room.y, G.room.w, G.room.h, 'sala_morada');
    b.stamp('salida_luz_sur_morada', G.exit.x - 1, G.room.y + G.room.h - 1);
    b.rect(null, G.pool.x, G.pool.y, G.pool.w, G.pool.h, 'estanque_morada');
    b.stamp('pilar_pedestal', G.pedestal.x, G.pedestal.y - 1);
    b.stamp('matojo_cueva_morada', 3, 4);
    b.stamp('roca_peque_morada', 13, 4);
    b.stamp('roca_musgo_morada', 12, 11);
    b.stamp('roca_peque_morada', 3, 10);
  },
  // Se sale por la boca de la peña, que da a la playa del sur del islote.
  warps: [{ x: G.exit.x, y: G.exit.y + 1, to: 'islote_lumbre', tx: OUT.x, ty: OUT.y, dir: OUT.dir }],
  events: [
    ...grutaEvents(G),
    { id: G.cell.key, type: 'zygardeCell', x: G.cell.x, y: G.cell.y, cell: G.cell.key },
  ],
};
