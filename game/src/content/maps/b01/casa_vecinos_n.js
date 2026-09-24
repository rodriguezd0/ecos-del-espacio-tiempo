// Casa roja de vecinos (norte de Villa Alba). NPC con diálogos cotidianos (B01 §2, §4.2).
// El vecino es el marido de la vecina del "relámpago verde" (textos neutros, sin canon nuevo). Tileset 4.
import { ROOM_BRUSHES, houseExit, exitArrows, examineRect } from './common.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_alba_layout.js';
import { F } from '../../events/b01_town_common.js';

const ENTRY = INTERIOR_ENTRIES.casa_vecinos_n;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;

async function neighborTalk(ctx) {
  const who = { speaker: 'Vecino' };
  if (ctx.flag(F.dex)) {
    await ctx.say('Así que te vas de viaje. Villa Alba se va a quedar muy tranquila sin vosotros dos.', who);
  } else if (ctx.flag(F.starter)) {
    await ctx.say('¿Ese Pokémon es tuyo? ¡Cómo pasa el tiempo! Parece que fue ayer cuando no levantabas un palmo del suelo.', who);
  } else {
    await ctx.say('Mi mujer sigue con lo del relámpago verde. Un relámpago es un relámpago, ¿no?', who);
    await ctx.say('Aunque, ahora que lo pienso… nunca había visto uno de ese color.', who);
  }
}

export default {
  id: 'casa_vecinos_n',
  name: 'Villa Alba',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'town_start',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },
  brushes: ROOM_BRUSHES,

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_calida');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('sartenes', 1, 1);
    b.stamp('fregadero', 1, 3);
    b.stamp('nevera', 3, 3);
    b.stamp('cuadro', 5, 2);
    b.stamp('tele', 5, 3);
    b.stamp('planta', 7, 3);
    b.stamp('ventana_cortinas', 8, 2);
    b.stamp('sofa', 10, 4);
    b.rect(null, 3, 5, 7, 3, 'alfombra_granate');
    b.stamp('mesa_comedor', 4, 5);
    b.stamp('taza', 5, 6);
  },

  warps: houseExit(DOOR_X, MAT_Y, 'villa_alba', TOWN_DOORS.casa_vecinos_n.x, TOWN_DOORS.casa_vecinos_n.y + 1),

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    { id: 'vecino', x: 9, y: 6, sprite: 'vecino', dir: 4, move: 'look', trigger: 'action', script: neighborTalk },
    ...examineRect('tele', 5, 4, 2, 1, 'Un concurso de preguntas. Nadie lo está viendo.'),
    ...examineRect('fregadero', 1, 5, 2, 1, 'Platos recién fregados.'),
    ...examineRect('nevera', 3, 5, 1, 1, 'La nevera zumba tranquila.'),
  ],
};
