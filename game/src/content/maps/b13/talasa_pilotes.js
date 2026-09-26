// Pilotes de la Estación Talasa (docs/CAMPANA.md §2.3: C087 «Estación Talasa · Pilotes», etapa G, Buceo): el fondo
// bajo la plataforma, con las mismas coordenadas que la superficie (estacion_talasa): se baja por el remolino de la
// dársena y se emerge en el punto equivalente (dársena o mar abierto del norte). Bosque de pilotes de hormigón con
// algas, respiradero y la célula. Tileset 15 (Cueva Azul), mapa submarino. Encuentros de Buceo (48–54).
import { TALASA_PILOTES } from '../../encounters/b13.js';
import { DIVE } from './talasa_layout.js';

export const PILOTES = Object.freeze({
  width: 40, height: 40,
  room: { x: 1, y: 1, w: 38, h: 38 },
  shallow: [[15, 17, 10, 13]], // la dársena (agua abierta encima: no gasta resonancia)
  surfaceAreas: [[15, 17, 10, 13], [4, 5, 32, 4]], // dársena y mar abierto al norte de la plataforma
  vent: { x: 29, y: 34 },
  vent2: { x: 8, y: 14 },
  cell: { key: 'cell_talasa_3', x: 31, y: 31 },
  pillars: [], // se calculan abajo
  kelp: [[7, 19], [12, 29], [27, 14], [33, 22], [17, 35], [6, 34], [36, 14]], // (entre los pilotes, sin pisarlos)
  items: [{ id: 'objeto_pilotes_1', x: 5, y: 26, item: 'BIGPEARL', hidden: true }, { id: 'objeto_pilotes_2', x: 34, y: 27, item: 'REVIVE' }],
});

/** Pilotes (roca 2×3) en rejilla bajo las cubiertas, fuera de la dársena y de los pasos. */
function pillarSpots() {
  const out = [];
  for (let y = 11; y <= 33; y += 5) {
    for (let x = 5; x <= 33; x += 5) {
      const inPool = x + 1 >= 15 && x <= 24 && y + 2 >= 17 && y <= 29;
      const nearKey = [PILOTES.vent, PILOTES.vent2, PILOTES.cell].some((p) => Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 3);
      if (!inPool && !nearKey) out.push([x, y]);
    }
  }
  return out;
}
const PILLARS = pillarSpots();

export default {
  id: 'talasa_pilotes',
  name: 'Estación Talasa',
  bgm: 'Emociones',
  battleback: 'Sub',
  tileset: 15,
  width: PILOTES.width,
  height: PILOTES.height,
  cave: true,
  start: { x: DIVE.x, y: DIVE.y, dir: 2 },
  dark: { amount: 0.86 },
  tone: [-50, -8, 28, 34],
  noFollower: true,
  // Superficie: estacion_talasa con las mismas coordenadas (world/zygarde/dive.js#surfacePoint).
  underwater: { shallow: PILOTES.shallow, surface: { map: 'estacion_talasa', dx: 0, dy: 0, areas: PILOTES.surfaceAreas } },
  encounters: TALASA_PILOTES,
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, PILOTES.room.x, PILOTES.room.y, PILOTES.room.w, PILOTES.room.h, 'sala_gris');
    for (const [x, y] of PILLARS) b.stamp('roca_grande_gris', x, y);
    for (const [x, y] of PILOTES.kelp) b.stamp('matojo_cueva_gris', x, y);
    for (const [x, y] of [[12, 8], [28, 8], [22, 32], [3, 30]]) b.stamp('roca_peque_gris', x, y);
  },
  events: [
    { id: 'superficie_darsena', type: 'diveSpot', surface: true, x: DIVE.x, y: DIVE.y },
    { id: 'respiradero_pilotes', type: 'diveVent', x: PILOTES.vent.x, y: PILOTES.vent.y },
    { id: 'respiradero_pilotes_2', type: 'diveVent', x: PILOTES.vent2.x, y: PILOTES.vent2.y, kind: 'bolsa' },
    { id: PILOTES.cell.key, type: 'zygardeCell', x: PILOTES.cell.x, y: PILOTES.cell.y, cell: PILOTES.cell.key },
    ...PILOTES.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    {
      id: 'pilote_rotulo', x: 10, y: 13, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Un pilote de hormigón cubierto de percebes. Alguien ha pintado encima: «T-14 · no amarrar».'); },
    },
  ],
};

export { PILLARS };
