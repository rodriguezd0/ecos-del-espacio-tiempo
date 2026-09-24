// Casa del Dintel — la casa de Casilda Roquer en Villa Zaguán (docs/CAMPANA.md §1.3, B02). Cuarenta años de
// cuidar las ruinas: cascotes etiquetados, el cuadro con su madre, el cuaderno de limpieza y el tarro vacío donde
// guardó la célula del patio (C009). Casilda está en casa tras restaurar el Pilar. Tileset 4 (Interior1).
import { ROOM_BRUSHES, houseExit, exitArrows, examineRect } from '../b01/common.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_zaguan_layout.js';
import { F, SPEAKER, SPRITE, when } from '../../events/b02_common.js';

const ENTRY = INTERIOR_ENTRIES.casa_dintel;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;

/**
 * Pista verbal de la Guardiana sobre la célula más escondida de su comarca (CAMPANA §2.2): C024, en el mirador de la
 * Ruta 1, tras la cuesta de grava (hace falta Correr, que se consigue justo al salir de las ruinas).
 */
export const CELL_HINT = Object.freeze({
  cell: 'cell_ruta_1_6',
  text: 'Otra cosa. En la Ruta 1, arriba del mirador, a veces brilla algo verde entre la grava. Yo por esa cuesta ya no subo.',
});

async function casildaTalk(ctx) {
  const say = (t) => ctx.say(t, { speaker: SPEAKER.casilda });
  const hint = !ctx.state.hasCell(CELL_HINT.cell);
  if (!ctx.selfSwitch('A')) {
    await say('Toda la vida limpiando esas piedras sin esperar nada de ellas. Ahora que han hecho algo, no sé qué hacer con la tarde.');
    await say('Si vuelves a las ruinas, límpiate las botas antes de la antesala. El barro de la explanada no sale de las losas.');
    if (hint) await say(CELL_HINT.text);
    ctx.setSelfSwitch('A', true);
    return;
  }
  await say(hint ? CELL_HINT.text : 'La Libreta era de mi madre. Cuídala mejor que yo.');
}

export default {
  id: 'casa_dintel',
  name: 'Villa Zaguán',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'PrismaVilla2',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },
  brushes: ROOM_BRUSHES,

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_calida');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('vitrina', 3, 3);
    b.stamp('cuadro', 6, 2);
    b.stamp('reloj_pared', 8, 2);
    b.stamp('cama', 9, 3);
    b.rect(null, 3, 6, 6, 3, 'alfombra_granate');
    b.stamp('mesa_comedor', 3, 6);
    b.stamp('taza', 5, 7);
    b.stamp('planta', 1, 7);
    b.stamp('planta_alta', 11, 7);
  },

  warps: houseExit(DOOR_X, MAT_Y, 'villa_zaguan', TOWN_DOORS.casa_dintel.x, TOWN_DOORS.casa_dintel.y + 1),

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    { id: 'casilda', x: 9, y: 7, when: when({ all: [F.exit] }), sprite: SPRITE.casilda, dir: 4, move: 'look', trigger: 'action', script: casildaTalk },
    ...examineRect('estanteria', 1, 5, 2, 1, 'Libros viejos sobre piedras y, entre ellos, un tarro de cristal vacío con una etiqueta a mano: «Patio».'),
    ...examineRect('vitrina', 3, 5, 2, 1, 'Cascotes caídos de las ruinas, cada uno con una etiqueta y una fecha. El más antiguo es de hace cuarenta años.'),
    ...examineRect('retrato', 6, 3, 1, 1, 'Un cuadro viejo de la explanada del Umbral. En una esquina, muy pequeña, hay una mujer con una libreta en la mano.'),
    ...[4, 5, 6].map((x) => ({
      id: `mesa_${x}`, x, y: 7, trigger: 'action', noOver: true,
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? 'Bajo la última línea del cuaderno de limpieza hay otra, escrita más grande y con prisa: «La columna ha brillado.»'
          : 'Un cuaderno de limpieza abierto por la última página: «Día 14.603. Piedras limpias. Nada nuevo.»');
      },
    })),
    ...examineRect('cama', 9, 5, 3, 1, 'Una cama estrecha, con las sábanas remetidas sin una arruga.'),
  ],
};
