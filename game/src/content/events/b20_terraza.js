// Terraza del Último Sello: Gael (docs/CAMPANA.md B20 y §6.2–6.4; D16):
//   · Cura al equipo con su botiquín de campo: «Siéntate. No voy a pelear contra un equipo roto. No quiero ganarte con
//     trampas ni perder con excusas.»
//   · Combate B6 OBLIGATORIO de ganar (Staraptor 70, Lucario 70, Weavile 70, Garchomp 71, Absol 71 Mega, inicial final 72;
//     CombateRival y «Ultimo Pokemon» con su último Pokémon). Si se pierde, Gael espera y vuelve a curar (bossBattle).
//   · Conversación: leen juntos el verso X; «¿"Querrá ser quien llama"? …Eso sí lo entiendo.» · «Yo pedí permiso.» · la
//     línea que depende de la respuesta a Mesprit (B16, var b16_mesprit_respuesta) · Zygarde, por primera vez ante él:
//     «Gael. No respondí contra ti.» — «Ya. Por eso es peor.» · Se va por la Senda sin llevarse nada.
import { F, V, SPRITE, SPEAKER, MUSIC, zygardeSays, pause, eventById, lines, bossBattle, strip } from './b20_common.js';
import { gaelMespritLine } from './b20_logic.js';
import { steleEvents } from './b20_senda.js';
import { TERRAZA, LINKS } from '../maps/b20/layout.js';

const G = SPEAKER.gael;
const T = TERRAZA;

export const TERRAZA_TEXT = Object.freeze({
  view: 'Una terraza de piedra dorada, colgada sobre el cielo interior. Al norte, un dintel. Delante, de espaldas, alguien mira las nubes.',
  // B19: Gael se llevó el cuaderno de Vértice («si alguien sabe leer en él el camino al Origen, es él»): llegó por su
  // cuenta. No entra en el núcleo: antes quiere medirse (eco del verso X, «despertará para medirlos»).
  meet: ['Llegué antes. Esta vez nadie me ha cerrado el paso.', 'Pero no he entrado. Antes quería medirme contigo.'],
  look: 'Gael mira a tu equipo de arriba abajo.',
  sit: ['Siéntate. No voy a pelear contra un equipo roto.', 'No quiero ganarte con trampas ni perder con excusas.'],
  kit: 'Gael abre su botiquín de campo y atiende a tu equipo sin decir nada más. Tu equipo se ha recuperado por completo.',
  ready: 'Ahora sí.',
  lost: ['Otra vez. Siéntate.'],
  lostKit: 'Gael vuelve a abrir el botiquín y atiende a tu equipo en silencio. Tu equipo se ha recuperado por completo.',
  rematch: 'Cuando quieras.',
  won: '…Bien.',
  come: 'Ven. Hay algo escrito.',
  verse1: '¿«Querrá ser quien llama»? …Eso sí lo entiendo.',
  verse2: 'Yo pedí permiso.',
  said: (t) => `Le repites lo que le dijiste a Mesprit: «${t}»`,
  zygarde: 'Gael. No respondí contra ti.', // canónica (CAMPANA B20)
  gaelZ: 'Ya. Por eso es peor.',
  leaves: 'Gael se da la vuelta y baja por la pasarela, hacia la Senda. No se lleva nada.',
  block: 'Primero, esto.',
  doorway: 'Bajo el dintel, la oscuridad huele a piedra caliente. Ahí abajo late algo.',
});

const healed = (s) => Boolean(s?.flag(F.gaelHeal));
const won = (s) => Boolean(s?.flag(F.gaelB6));
const gone = (s) => Boolean(s?.flag(F.gaelGone));

async function battle(ctx) {
  ctx.setFlag(F.gaelHeal);
  const outcome = await bossBattle(ctx, { trainer: 'b20_gael_b6', rules: { canRun: false, canCatch: false } }, null, {
    loseText: TERRAZA_TEXT.lost, speaker: G,
    onLose: (c) => { c.setVar(V.gaelTries, Number(c.var(V.gaelTries, 0)) + 1); },
  });
  if (outcome !== 'win') {
    await ctx.say(TERRAZA_TEXT.lostKit);
    return;
  }
  ctx.setFlag(F.gaelB6);
  ctx.bgm(MUSIC.terrace, { fadeOutPrevious: 30 });
  await lines(ctx, G, [TERRAZA_TEXT.won]);
  await talkScene(ctx);
}

async function meetScene(ctx) {
  const g = eventById(ctx, 'gael');
  await ctx.say(TERRAZA_TEXT.view);
  await ctx.movePlayerTo(T.battleStand.x, T.battleStand.y, { through: false });
  ctx.face('player', 'up');
  if (g) ctx.face(g, 'down');
  await pause(ctx, 16);
  await lines(ctx, G, TERRAZA_TEXT.meet);
  await ctx.say(TERRAZA_TEXT.look);
  await lines(ctx, G, TERRAZA_TEXT.sit);
  ctx.me('heal');
  ctx.heal();
  ctx.scene?.refreshFollower?.();
  await ctx.say(TERRAZA_TEXT.kit);
  await lines(ctx, G, [TERRAZA_TEXT.ready]);
  await battle(ctx);
}

/** La conversación del verso X y la despedida (§6.4). */
async function talkScene(ctx) {
  const g = eventById(ctx, 'gael');
  await lines(ctx, G, [TERRAZA_TEXT.come]);
  if (g) {
    const s = T.gaelStele;
    await ctx.move(g, stepsTo(g, s.x, s.y), { through: true });
    ctx.face(g, 'up');
  }
  await ctx.movePlayerTo(T.steleStand.x, T.steleStand.y, { through: true });
  ctx.face('player', 'up');
  await pause(ctx, 10);
  await ctx.story.revealVerse(10);
  await lines(ctx, G, [TERRAZA_TEXT.verse1]);
  await pause(ctx, 20);
  if (g) ctx.face(g, 'left');
  ctx.face('player', 'right');
  await lines(ctx, G, [TERRAZA_TEXT.verse2]);
  const m = gaelMespritLine(ctx.state);
  if (m) {
    await ctx.say(TERRAZA_TEXT.said(m.said));
    await lines(ctx, G, [m.gael]);
  }
  await pause(ctx, 20);
  await zygardeSays(ctx, TERRAZA_TEXT.zygarde);
  if (g) await ctx.emote(g, '…');
  await lines(ctx, G, [TERRAZA_TEXT.gaelZ]);
  ctx.setFlag(F.gaelTalk);
  await pause(ctx, 20);
  await ctx.say(TERRAZA_TEXT.leaves);
  if (g) await ctx.move(g, [{ speed: 3 }, ...leaveRoute(g)], { through: true });
  ctx.setFlag(F.gaelGone);
  ctx.requestRefresh();
}

/**
 * Salida de Gael por la pasarela del sur sin pisar el vacío ni cruzar al jugador: baja a la fila libre bajo la estela,
 * va hasta la columna de la pasarela y baja por ella; se desvanece en los últimos pasos.
 */
function leaveRoute(ev) {
  const lane = T.gaelStele.y + 2;
  const out = [];
  let { x, y } = ev;
  while (y < lane) { out.push('down'); y += 1; }
  while (x > T.bridge.x0) { out.push('left'); x -= 1; }
  while (x < T.bridge.x0) { out.push('right'); x += 1; }
  const fade = 3;
  while (y < T.bridge.y1) {
    out.push('down');
    y += 1;
    if (y > T.bridge.y1 - fade) out.push({ opacity: Math.round((255 * (T.bridge.y1 - y)) / fade) });
  }
  return out;
}

/** Ruta en L (primero en vertical, luego en horizontal) de un evento a (x, y). */
function stepsTo(ev, x, y) {
  const out = [];
  let cy = ev.y;
  let cx = ev.x;
  while (cy < y) { out.push('down'); cy += 1; }
  while (cy > y) { out.push('up'); cy -= 1; }
  while (cx < x) { out.push('right'); cx += 1; }
  while (cx > x) { out.push('left'); cx -= 1; }
  return out;
}

function gaelEvent() {
  const base = { sprite: SPRITE.gael, solid: true, trigger: 'action' };
  return {
    id: 'gael', x: T.gael.x, y: T.gael.y, name: 'Gael',
    pages: [
      { ...base, when: (s) => !healed(s), dir: 8, script: meetScene },
      { ...base, when: (s) => healed(s) && !won(s), dir: 2, script: async (ctx) => { ctx.turnToPlayer('this'); await lines(ctx, G, [TERRAZA_TEXT.rematch]); await battle(ctx); } },
      { ...base, when: (s) => won(s) && !gone(s), dir: 2, script: talkScene },
      { when: gone, through: true },
    ],
  };
}

/** Warps de la Terraza: el hueco bajo el dintel (núcleo) y la pasarela del sur (Cielo Interior). */
export function terrazaWarps() {
  const n = LINKS.terrazaToNucleo;
  const c = LINKS.terrazaToCielo;
  return [
    { x: T.door.x, y: T.door.y, to: n.map, tx: n.x, ty: n.y, dir: n.dir },
    { x: T.back.x, y: T.back.y, to: c.map, tx: c.x, ty: c.y, dir: c.dir, dirTrigger: 2 },
  ];
}

function doorEvents() {
  const block = async (ctx) => { await lines(ctx, G, [TERRAZA_TEXT.block]); };
  return [
    ...[11, 12, 13].map((x) => ({ id: `terraza_paso_${x}`, x, y: T.door.y + 2, pages: [{ when: (s) => !won(s), solid: true, trigger: 'action', noOver: true, script: block }] })),
    {
      id: 'terraza_umbral', x: T.door.x, y: T.door.y + 1,
      pages: [{ when: (s) => won(s) && !s.flag('b20_umbral_visto'), through: true, trigger: 'touch', script: async (ctx) => { ctx.setFlag('b20_umbral_visto'); await ctx.say(TERRAZA_TEXT.doorway); } }],
    },
  ];
}

export function terrazaEvents() {
  return [
    gaelEvent(),
    ...strip('terraza_encuentro', T.meet, { when: (s) => !healed(s), script: meetScene }),
    ...doorEvents(),
    ...steleEvents('terraza_estela', T.stele, ['Una estela con glifos Unown. Es el décimo verso.'], async (ctx) => { await ctx.story.revealVerse(10); }),
  ];
}

export { LINKS };
