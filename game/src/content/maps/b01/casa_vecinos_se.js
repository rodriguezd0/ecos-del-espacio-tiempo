// Casa verde de vecinos (sudeste de Villa Alba): la madre del niño que admira a Gael y su Lillipup.
// Diálogos cotidianos y neutros (B01 §2, §4.2). Tileset 4 (Interior1).
import { houseExit, exitArrows, examineRect } from './common.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_alba_layout.js';
import { F } from '../../events/b01_town_common.js';

const ENTRY = INTERIOR_ENTRIES.casa_vecinos_se;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;

async function motherTalk(ctx) {
  const who = { speaker: 'Vecina' };
  if (ctx.flag(F.dex)) {
    await ctx.say('Si vas por la Ruta 1, cuidado con la hierba alta. Estos días los Pokémon salvajes andan inquietos.', who);
  } else if (ctx.flag(F.starter)) {
    await ctx.say('¡Tu primer Pokémon! Cuando mi hijo lo vea, no va a hablar de otra cosa en una semana.', who);
  } else {
    await ctx.say('Si ves a mi hijo por ahí, dile que vuelva a comer. Se pasa el día detrás de Gael.', who);
  }
}

async function petTalk(ctx) {
  ctx.cry('LILLIPUP');
  await ctx.emote(ctx.event, '♪');
  await ctx.say('Lillipup: ¡Lil, lillii!');
}

export default {
  id: 'casa_vecinos_se',
  name: 'Villa Alba',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'town_start',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('ventana_cortinas', 3, 2);
    b.stamp('tele', 5, 3);
    b.stamp('planta', 7, 3);
    b.stamp('nevera', 8, 3);
    b.stamp('sartenes', 9, 1);
    b.stamp('fregadero', 9, 3);
    b.rect(null, 1, 6, 7, 3, 'alfombra_lila');
    b.stamp('mesa_comedor', 2, 6);
    b.stamp('taza', 4, 7);
    b.stamp('planta_alta', 11, 7);
  },

  warps: houseExit(DOOR_X, MAT_Y, 'villa_alba', TOWN_DOORS.casa_vecinos_se.x, TOWN_DOORS.casa_vecinos_se.y + 1),

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    { id: 'vecina_se', x: 9, y: 7, sprite: 'mujer1', dir: 4, move: 'look', trigger: 'action', script: motherTalk },
    { id: 'lillipup', x: 8, y: 6, sprite: 'follower:LILLIPUP:0:0', dir: 2, move: { wander: 1 }, freq: 2, stepAnime: true, trigger: 'action', script: petTalk },
    ...examineRect('libros', 1, 5, 2, 1, 'Cuentos infantiles y un libro de Pokémon muy manoseado.'),
    ...examineRect('tele', 5, 4, 2, 1, 'Dibujos animados de Pokémon. El volumen está altísimo.'),
    ...examineRect('fregadero', 9, 5, 2, 1, 'La comida está a medio preparar.'),
  ],
};
