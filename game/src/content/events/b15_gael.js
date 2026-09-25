// Observatorio Boreal y su terraza (docs/CAMPANA.md B15 y §6: «Gael, combate B5 y entrega de N5, en el Observatorio
// Boreal: "Si me ganas, es tuyo. Si no… también. Pero quiero saberlo." Usa Mega Absol con un aro negro de piedra violeta
// (prototipo de Genesis: acto de captación). Tras el combate, le da N5: "A mí no me habla. Nunca me ha hablado." Zygarde,
// a Gael, por primera vez: "Gracias, Gael." Gael no contesta y se va.»). El combate B5 continúa la historia aunque se
// pierda (§2.6, §6.1): helper común bossBattle sin casilla de reintento. La llamada de Alerce («Ese aro no es de ninguna
// tienda.») llega al salir al pueblo (content/events/b15_boreal.js). Coordenadas en content/maps/b15/layout_boreal.js.
import { grantCore } from '../../world/zygarde/scenes.js';
import { F, SPEAKER, SPRITE, OBJ, MUSIC, bossBattle, zygardeSays, lines, byGender, pause, when, fx, placePlayer } from './b15_common.js';
import { OBSERVATORIO, TERRAZA } from '../maps/b15/layout_boreal.js';
import { b15CellEvents } from './b15_cells.js';

const G = { speaker: SPEAKER.gael };

export const GAEL_TEXT = Object.freeze({
  late: 'Llegas tarde. …O yo he llegado pronto. Da igual.',
  found: 'Cayó aquí, al norte. Se quedó atrapado en ese hielo raro. Cuando el hielo se fue, lo encontré en la ladera.',
  talked: 'Llevo días hablándole.',
  nothing: 'Nada.',
  zygarde: 'Es parte de mí. Lo oigo muy débil, como desde el fondo del hielo.',
  challenge: 'Si me ganas, es tuyo. Si no… también. Pero quiero saberlo.',
  ring: 'Gael se sube la manga del abrigo. En la muñeca lleva un aro negro con una piedra violeta engastada.',
  won: 'Lo quería saber. Ya lo sé.',
  lost: '…No cambia nada. Es tuyo igual.',
  give: 'Toma.',
  merge: 'El quinto núcleo se funde con el Core. Por un momento, las vetas verdes brillan hasta la punta.',
  deaf: 'A mí no me habla. Nunca me ha hablado.',
  thanks: 'Gracias, Gael.',
  after: 'Gael no contesta. Se da la vuelta y baja la escalera sin mirar atrás.',
  telescope: 'El telescopio de la azotea apunta a la Cumbre Azur. La columna de luz se ve fina como un hilo tensado.',
  telescopeIn: 'El gran telescopio del Observatorio. Por el ocular, las estrellas del norte tiemblan como si las mirara a través del agua.',
});

export const OBS_TEXT = Object.freeze({
  directora: [
    (s) => `${byGender(s, 'Bienvenido', 'Bienvenida')} al Observatorio Boreal. Medimos las auroras desde hace cien años. Este invierno, además, medimos esa columna de luz de la Cumbre Azur.`,
    'La Fundación Meridiano nos donó un espectrógrafo nuevo el mes pasado. Vinieron dos veces a calibrarlo. Muy amables.',
    'La segunda vez estuvieron mucho rato en la terraza, hablando con el chico que sube cada noche.',
  ],
  directoraAfter: 'El chico de la terraza se ha ido. Dejó una nota en el libro de visitas: «Gracias por el telescopio». Nada más.',
  astronomo: [
    'Las estrellas tiemblan. No es el telescopio: lo he comprobado tres veces.',
    'Y los atardeceres duran dos horas. En cien años de registros no hay nada parecido.',
  ],
});

// ───────────────────────────── Observatorio ─────────────────────────────

export function observatorioEvents() {
  const O = OBSERVATORIO;
  return [
    {
      id: 'directora_observatorio', x: O.directora.x, y: O.directora.y, name: SPEAKER.directora,
      pages: [
        { sprite: SPRITE.directora, dir: O.directora.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.directora, OBS_TEXT.directora) },
        { when: when({ all: [F.gaelB5] }), sprite: SPRITE.directora, dir: O.directora.dir, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(OBS_TEXT.directoraAfter, { speaker: SPEAKER.directora }); } },
      ],
    },
    {
      id: 'astronomo_observatorio', x: O.astronomo.x, y: O.astronomo.y, name: SPEAKER.astronomo, sprite: SPRITE.astronomo, dir: O.astronomo.dir, move: 'look',
      trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.astronomo, OBS_TEXT.astronomo),
    },
    {
      id: 'telescopio_observatorio', x: O.telescopio.x, y: O.telescopio.y, name: 'Telescopio', sprite: OBJ.telescope, dir: 2, directionFix: true,
      walkAnime: false, stepAnime: true, speed: 1, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(GAEL_TEXT.telescopeIn); },
    },
  ];
}

// ───────────────────────────── Terraza: Gael B5 y N5 ─────────────────────────────

async function gaelScene(ctx) {
  if (ctx.flag(F.gaelB5)) return;
  ctx.setFlag(F.gaelMet);
  const T = TERRAZA;
  ctx.bgm?.(MUSIC.tension, { fadeOutPrevious: 30 });
  await ctx.fade('out', 12);
  await placePlayer(ctx, T.duel);
  await ctx.fade('in', 12);
  ctx.face('gael_terraza', 'up');
  await pause(ctx, 20);
  await ctx.say(GAEL_TEXT.late, G);
  ctx.face('gael_terraza', 'down');
  await ctx.say(GAEL_TEXT.found, G);
  await ctx.say(GAEL_TEXT.talked, G);
  await pause(ctx, 30);
  await ctx.say(GAEL_TEXT.nothing, G);
  await zygardeSays(ctx, GAEL_TEXT.zygarde);
  await ctx.say(GAEL_TEXT.challenge, G);
  await ctx.say(GAEL_TEXT.ring);
  const outcome = await bossBattle(ctx, { trainer: 'b15_gael_b5' }, null);
  const won = outcome === 'win';
  if (won) ctx.setFlag(F.gaelWon);
  ctx.bgm?.(MUSIC.boreal, { fadeOutPrevious: 30 });
  await ctx.say(won ? GAEL_TEXT.won : GAEL_TEXT.lost, G);
  await ctx.say(GAEL_TEXT.give, G);
  // El núcleo flota hasta el Core y se funde con él.
  const core = ctx.world?.events?.find((e) => e.id === 'nucleo_n5');
  if (core) await ctx.move(core, ['down'], { through: true, speed: 2 });
  const at = core ? { x: core.x, y: core.y } : ctx.player;
  const burst = fx(ctx, 'zygardeHexBurst', { x: at.x, y: at.y, mode: 'in', count: 26 });
  ctx.se?.('core_signal', { volume: 70 });
  await ctx.flash([185, 255, 102], 18, 150);
  ctx.setFlag(F.n5);
  ctx.setFlag(F.gaelB5);
  ctx.requestRefresh();
  await grantCore(ctx, 'N5', { scenes: false });
  burst?.remove?.(20);
  await ctx.say(GAEL_TEXT.merge);
  await ctx.say(GAEL_TEXT.deaf, G);
  await pause(ctx, 20);
  await zygardeSays(ctx, GAEL_TEXT.thanks);
  await ctx.emote('gael_terraza', '…');
  await pause(ctx, 40);
  await ctx.say(GAEL_TEXT.after);
  const g = ctx.world?.events?.find((e) => e.id === 'gael_terraza');
  if (g) {
    const route = [];
    for (let x = g.x; x < T.stairs.x; x++) route.push('right');
    for (let y = g.y; y < T.stairs.y - 1; y++) route.push('down');
    await ctx.move('gael_terraza', route, { through: true, speed: 3.5 });
    ctx.erase('gael_terraza');
  }
}

export function terrazaEvents() {
  const T = TERRAZA;
  const before = when({ none: [F.gaelB5] });
  return [
    { id: 'gael_escena', x: T.entry.x, y: T.entry.y + 1, through: true, pages: [{ when: before, trigger: 'auto', script: gaelScene }] },
    { id: 'gael_terraza', x: T.gael.x, y: T.gael.y, name: SPEAKER.gael, pages: [{ when: before, sprite: SPRITE.gael, dir: T.gael.dir, trigger: 'action', script: gaelScene }] },
    { id: 'nucleo_n5', x: T.core.x, y: T.core.y, name: 'Núcleo', pages: [{ when: when({ none: [F.n5] }), sprite: SPRITE.core, dir: 2, opacity: 150, stepAnime: false, walkAnime: false, through: true }] },
    {
      id: 'telescopio_terraza', x: T.telescope.x, y: T.telescope.y, name: 'Telescopio', sprite: OBJ.telescope, dir: 2, directionFix: true,
      walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(GAEL_TEXT.telescope); },
    },
    { id: 'flecha_escalera', x: T.stairs.x, y: T.stairs.y, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false },
    ...b15CellEvents('boreal_observatorio_terraza'),
  ];
}
