import { withB22bEvents } from '../../events/b22b_maps.js';
// Segundo piso del Pilar del Impulso: la Sala de las Campanas completa el puzzle de las Galerías del Soplo.
// El ASCII y las posiciones del viento/célula se conservan; la antigua cámara central ahora contiene la subida.
import { CAMPANAS, walkCells, marksInMap } from '../../events/b06_wind_rooms.js';
import { anilloEvents } from '../../events/b06_anillo.js';
import { pilarTone } from '../../stamps/pilar.js';
import { ANILLO, P3_VERTICAL } from './layout.js';

const S = ANILLO.sala;
const walk = walkCells(CAMPANAS, S.ox, S.oy);
const walkKeys = new Set(walk.map(([x, y]) => `${x},${y}`));
const [[sx, sy]] = marksInMap(CAMPANAS, 'S', S.ox, S.oy);
const [cx, cy] = CAMPANAS.pedestal.at;

export default {
  id: 'anillo_vientos', name: 'Pilar del Impulso · Campanas',
  tileset: 2, width: ANILLO.width, height: ANILLO.height,
  cave: true, pillar: { id: 'P3', floor: 2 },
  bgm: 'viento', battleback: 'Acantilado', tone: pilarTone('P3', 0.45),
  start: { x: sx, y: sy, dir: 2 },
  build(b) {
    b.fill(0, 'vacio');
    b.paint('suelo_gris', walk, { layer: 0 });
    b.paint('pilar_enlosado', walk);
    b.stamp('pilar_escalinata', S.ox + cx - 1, S.oy + cy - 1);
    b.stamp('pilar_columna', S.ox + 5, S.oy + 2);
    b.stamp('pilar_columna', S.ox + 13, S.oy + 2);
    for (const [x, y] of [[3, 9], [15, 9], [7, 1]]) b.stamp('pilar_glifo', S.ox + x, S.oy + y);
    b.stamp('pilar_losa_eco', S.ox + 15, S.oy + 11);
  },
  onEnter: async (ctx) => {
    // Una partida antigua podía estar guardada en el campamento exterior que ocupaba este mismo mapa.
    if (ctx.player && !walkKeys.has(`${ctx.player.x},${ctx.player.y}`)) {
      await ctx.warp('anillo_vientos_base', P3_VERTICAL.entry.x, P3_VERTICAL.entry.y, 8);
    }
  },
  events: withB22bEvents('anillo_vientos', anilloEvents()),
};
