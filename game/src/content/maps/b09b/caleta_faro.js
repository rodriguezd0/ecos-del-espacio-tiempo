// Faro Sonda de Caleta Sonda (docs/CAMPANA.md §1.3 y B09 paso 5): el farero Ramón abre la pista T11 «La noche de los
// farolillos» (TABLILLAS T11: «En el islote bailan luces desde que la luna está rara.»), que espera en cola hasta tener
// Nadar. La segunda pista (su nieta Lucía) y la pista del P7 las da en B13/B14. Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './caleta_layout.js';
import { F, SPEAKER, SPRITE, lines, zygardeSays, examine } from '../../events/b09b_common.js';
import { ZYGARDE_LINES } from '../../story/clues.js';

const E = INTERIOR_ENTRIES.caleta_faro;
const OUT = BUILDINGS.faro.door;

export const RAMON_TEXT = Object.freeze({
  intro: [
    'Adelante. Esto es el Faro Sonda. Soy Ramón: cuarenta años encendiendo esta luz.',
    'Desde aquí arriba se ve todo el mar del oeste. Y últimamente se ven cosas que no tocan.',
    'En el islote bailan luces desde que la luna está rara.',
  ],
  after: [
    'Las luces del islote siguen ahí, noche tras noche. Mi nieta dice que son Clefairy bailando.',
    'Para llegar hay que cruzar a nado un buen trecho. Si algún día puedes, avísame.',
  ],
});

async function ramonTalk(ctx) {
  if (ctx.flag(F.t11)) { await lines(ctx, SPEAKER.ramon, RAMON_TEXT.after); return; }
  await lines(ctx, SPEAKER.ramon, RAMON_TEXT.intro);
  const status = await ctx.story.openClue('T11');
  ctx.setFlag(F.t11);
  if (status === 'queued' && !ctx.state.zygardeAbility('swim')) await zygardeSays(ctx, ZYGARDE_LINES.swim);
}

export default {
  id: 'caleta_faro',
  name: 'Caleta Sonda',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'Azul Tema',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('estanteria_roja', 1, 2);
    b.stamp('mesa_comedor', 6, 5);
    b.stamp('cama_individual', 9, 2);
    b.stamp('ventana_cortinas', 4, 1);
    b.stamp('reloj_pared', 7, 1);
    b.stamp('planta', 1, 8);
  },

  warps: exitWarps(E.x, E.y, { map: 'caleta_sonda', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    { id: 'ramon', x: 4, y: 5, name: SPEAKER.ramon, sprite: SPRITE.ramon, dir: 2, move: 'look', script: ramonTalk },
    examine('libro_faro', 2, 3,'El libro del faro. La última anotación: «Luces en el islote. Otra vez. Sin barcas cerca».', { solid: true }),
    examine('catalejo_sonda', 5, 3, 'Por la ventana se ve el islote de enfrente. De día, solo árboles en flor.', { solid: true }),
  ],
};
