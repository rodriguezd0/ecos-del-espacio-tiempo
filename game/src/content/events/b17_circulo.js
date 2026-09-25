// Círculo del Jardín (docs/CAMPANA.md B17 paso 3; DECISIONES X26 — opcional, de noche en Villa Alba):
//   «Mamá cuenta que los Clefairy bailan en el jardín "desde que la luna está rara". Los Clefairy pisan en secuencia seis
//   puntos hundidos; el jugador memoriza la danza y alza las piedras en ese orden con Reconstrucción. El anciano de B01:
//   "Mi abuelo decía que no había que moverlas… No dijo nada de levantarlas." El Círculo queda en pie para siempre (el
//   cartel "Donde el bosque guarda sus piedras" se vuelve literal). Mamá: "Tu abuela decía que en el jardín dormía algo.
//   Yo creía que era un cuento." Recompensa: 3 Piedras Lunares y encuentros nocturnos de Clefairy en el jardín; el
//   Círculo pasa a ser destino de Vuelo.»
// Villa Alba y la casa son mapas del Bloque 1: los eventos se añaden con una línea en cada definición (cambios mínimos y
// aditivos, todos condicionados a p8_restored). Reglas puras en b17_circulo_logic.js. Módulo puro salvo los guiones.
import {
  F, V, SPEAKER, SPRITE, OBJ, MUSIC, MOON, isNight, lines, zygardeSays, eventById, pause, frame, gameDay,
} from './b17_common.js';
import {
  CIRCLE_POINTS, DANCE_ORDER, DANCERS, CIRCLE_LANDING, raiseInOrder, raisedPoints, lineRoute,
} from './b17_circulo_logic.js';
import { CIRCLE_CLEFAIRY } from '../encounters/b17.js';
import { FIELD_TEXT } from '../zygarde/texts.js';
import { walkToPlayer } from './b01_town_path.js';

const P8 = F.p8;
const ELDER_LINE = 'Mi abuelo decía que no había que moverlas… No dijo nada de levantarlas.';
const MOM_LINE = 'Tu abuela decía que en el jardín dormía algo. Yo creía que era un cuento.';

export const CIRCLE_TEXT = Object.freeze({
  mom: [
    '¡\\PN! Qué bien que vengas. ¿Has visto cómo está el cielo?',
    'Desde que la luna está rara, los Clefairy bajan del bosque y bailan en el jardín por las noches.',
    'Siempre en el mismo sitio, alrededor de las flores de la plaza. Nunca los había visto en el pueblo.',
  ],
  momNight: '¿Quieres esperar a que se haga de noche? Te preparo algo caliente.',
  danceIntro: 'A la luz de la luna, un corro de Clefairy baila alrededor del jardín de la plaza.',
  danceStep: 'El Clefairy pisa una losa hundida y la losa brilla un instante.',
  danceEnd: 'Los Clefairy vuelven al centro y se quedan mirándote, como si esperaran algo.',
  danceZygarde: 'Seis piedras hundidas. Las pisan siempre en el mismo orden. Esperan que alguien las levante.',
  daySlab: 'Una losa hundida en la arena, con un hexágono gastado. De día nadie repara en ella.',
  nightNoDance: 'Una losa hundida con un hexágono gastado. Brilla un poco a la luz de la luna.',
  standOn: 'Estás encima de la losa.',
  wrong: 'Las piedras tiemblan… y vuelven a hundirse en la arena. Los Clefairy se miran entre ellos.',
  wrongZygarde: 'No en ese orden. Mira otra vez cómo bailan.',
  again: 'Los Clefairy vuelven a bailar, despacio.',
  risen: 'Las seis piedras quedan en pie alrededor del jardín. La luz de la luna se queda prendida en sus hexágonos.',
  sign: 'El cartel de la entrada del pueblo nunca había dicho tanta verdad: «Donde el bosque guarda sus piedras».',
  gift: 'Los Clefairy dejan algo en el centro del Círculo y se ponen a bailar otra vez.',
  zygarde: 'Estas piedras son un nudo pequeño de la red. Ya sé volver aquí volando.',
  flyNote: 'El Círculo del Jardín es ahora un destino de Vuelo.',
  standing: 'Una piedra alta con liquen y un hexágono tallado. Parece que siempre hubiera estado así.',
  clefairy: '¡Clef, clef!',
  clefairyCircle: '¡Clefairy! El Clefairy da vueltas alrededor de las piedras.',
});

const risen = (s, i) => raisedPoints(s.var(V.circleStep, 0)).includes(i);
const beforeCircle = (s) => Boolean(s) && s.flag(P8) && !s.flag(F.circle);
/** Mamá ya lo ha contado (o el juego ha terminado: en el postgame los Clefairy bailan igual). */
const told = (s) => Boolean(s) && (s.flag(F.momClefairy) || s.flag('game_cleared'));

// ───────────────────────────── Mamá (casa_prota_1f) ─────────────────────────────

async function momScene(ctx) {
  ctx.setFlag(F.momClefairy);
  await ctx.emote('mama', '!');
  await walkToPlayer(ctx, 'mama');
  await lines(ctx, SPEAKER.mom, CIRCLE_TEXT.mom);
  if (!isNight(ctx.state) && (await ctx.confirm(CIRCLE_TEXT.momNight, { speaker: SPEAKER.mom }))) {
    await ctx.rest({ kind: 'home', mode: 'rest', slot: 'night' });
  }
}

/** Eventos que añade la casa del protagonista (casa_prota_1f.js). */
export function b17HomeEvents() {
  // No durante el epílogo (B21): después del final los Clefairy bailan igual (ver `told`).
  return [{ id: 'b17_mama_clefairy', x: 0, y: 1, trigger: 'auto', when: (s) => Boolean(s) && s.flag(P8) && !s.flag(F.momClefairy) && !s.flag('game_cleared'), script: momScene }];
}

// ───────────────────────────── la danza ─────────────────────────────

/** Losas: gráfico de la hoja b17_piedra (fila 2 hundida · 4 hundida encendida · 6 alzada · 8 alzada con luna). */
function light(ev, on) {
  if (!ev) return;
  ev.direction = on ? 4 : 2;
  ev.stepAnime = on;
}

/** Danza de los Clefairy: el que guía pisa las seis losas en orden; las demás saltan. */
export async function dance(ctx) {
  const lead = eventById(ctx, 'clefairy_danza_0');
  const others = [eventById(ctx, 'clefairy_danza_1'), eventById(ctx, 'clefairy_danza_2')].filter(Boolean);
  if (!lead) return;
  ctx.bgm?.(MUSIC.circle, { fadeOutPrevious: 30 });
  let at = { x: lead.x, y: lead.y };
  for (const i of DANCE_ORDER) {
    const p = CIRCLE_POINTS[i];
    const route = lineRoute(at.x, at.y, p.x, p.y);
    if (route.length) await ctx.move(lead, route, { through: true, speed: 4.5 });
    at = { x: p.x, y: p.y };
    const slab = eventById(ctx, `circulo_losa_${i}`);
    light(slab, true);
    ctx.se('PRSFX- Moonlight', { volume: 55 });
    ctx.cry('CLEFAIRY');
    for (const o of others) ctx.jump(o, 0, 0);
    await pause(ctx, 28);
    light(slab, false);
  }
  const home = DANCERS[0];
  const back = lineRoute(at.x, at.y, home.x, home.y);
  if (back.length) await ctx.move(lead, back, { through: true, speed: 4.5 });
  ctx.face(lead, 2);
  for (const o of [lead, ...others]) await ctx.emote(o, '♪');
  ctx.bgm?.('town_start', { fadeOutPrevious: 40 });
}

async function firstDance(ctx) {
  ctx.setFlag(F.danceSeen);
  await pause(ctx, 20);
  await ctx.camera.pan(22, 18, 40);
  await ctx.say(CIRCLE_TEXT.danceIntro);
  await dance(ctx);
  await ctx.say(CIRCLE_TEXT.danceEnd);
  await zygardeSays(ctx, CIRCLE_TEXT.danceZygarde);
  await ctx.camera.reset(30);
}

async function replayDance(ctx) {
  ctx.cry('CLEFAIRY');
  await ctx.say(CIRCLE_TEXT.clefairy);
  await dance(ctx);
}

// ───────────────────────────── alzar las piedras ─────────────────────────────

/** Anima la subida de una losa (el evento pasa a la fila de la piedra alzada). */
async function riseAnimation(ctx, ev) {
  ctx.se('PRSFX- Stealth Rocks', { volume: 70 });
  const burst = ctx.effect?.('zygardeHexBurst', { x: ev.x, y: ev.y, mode: 'out', count: 10 });
  ev.direction = 6;
  ev.yOffset = 24;
  for (let f = 1; f <= 14; f++) { ev.yOffset = Math.round(24 * (1 - f / 14) ** 2); await pause(ctx, 1); }
  ev.yOffset = 0;
  ctx.shake(2, 5, 12);
  burst?.remove?.(14);
}

async function sinkAll(ctx) {
  ctx.se('PRSFX- Earthquake', { volume: 60 });
  ctx.shake(3, 6, 30);
  for (const i of DANCE_ORDER) {
    const ev = eventById(ctx, `circulo_losa_${i}`);
    if (!ev || ev.direction !== 6) continue;
    for (let f = 1; f <= 8; f++) { ev.yOffset = Math.round(3 * f); await pause(ctx, 1); }
    ev.yOffset = 0;
    light(ev, false); // la piedra mal alzada no cambia de página: se vuelve a dibujar hundida a mano
  }
  ctx.setVar(V.circleStep, 0);
  ctx.requestRefresh();
}

async function useSlab(ctx, i) {
  const s = ctx.state;
  if (s.flag(F.circle)) { await ctx.say(CIRCLE_TEXT.standing); return; }
  if (!isNight(s)) { await ctx.say(CIRCLE_TEXT.daySlab); return; }
  if (!s.flag(F.danceSeen)) { await ctx.say(CIRCLE_TEXT.nightNoDance); return; }
  if (!ctx.zygarde('rebuild')) { await ctx.say(FIELD_TEXT.rebuildBlocked); return; }
  const p = CIRCLE_POINTS[i];
  if (ctx.player.x === p.x && ctx.player.y === p.y) { await ctx.say(CIRCLE_TEXT.standOn); return; }
  if ((await ctx.choice(['Sí', 'No'], { message: FIELD_TEXT.rebuildAsk, cancel: 1 })) !== 0) return;
  const ev = eventById(ctx, `circulo_losa_${i}`);
  if (ev) await riseAnimation(ctx, ev);
  const r = raiseInOrder(s.var(V.circleStep, 0), i);
  if (!r.ok) {
    await pause(ctx, 20);
    await ctx.say(CIRCLE_TEXT.wrong);
    await sinkAll(ctx);
    await zygardeSays(ctx, CIRCLE_TEXT.wrongZygarde);
    await ctx.say(CIRCLE_TEXT.again);
    await dance(ctx);
    return;
  }
  ctx.setVar(V.circleStep, r.step);
  ctx.requestRefresh();
  if (r.done) await circleRaised(ctx);
}

/** El Círculo en pie: el anciano, Mamá, las Piedras Lunares y el Vuelo. */
async function circleRaised(ctx) {
  ctx.setFlag(F.circle);
  ctx.requestRefresh();
  ctx.se('PRSFX- Moonlight');
  await ctx.flash([...MOON], 30, 200);
  const glow = ctx.effect?.('softLight', { x: 22.5, y: 18, radius: 130, color: [...MOON], intensity: 0.6, pulse: 0.3, fadeIn: 30 });
  await ctx.say(CIRCLE_TEXT.risen);
  const dancers = [0, 1, 2].map((n) => eventById(ctx, `clefairy_danza_${n}`)).filter(Boolean);
  for (const d of dancers) ctx.jump(d, 0, 0);
  // El anciano de B01 se acerca desde su piedra (y vuelve a ella al final de la escena).
  const elder = eventById(ctx, 'anciano');
  const elderHome = elder ? { x: elder.x, y: elder.y, dir: elder.direction } : null;
  if (elder) {
    const { stageRoute } = await import('./b07_path.js');
    const route = stageRoute(ctx, elder, ctx.player.x - 1, ctx.player.y);
    if (route?.length) await ctx.move(elder, route.slice(0, 30), { through: false, speed: 3.5 });
    ctx.turnToPlayer(elder);
    ctx.face('player', ctx.directionTo(ctx.player, elder));
  }
  await ctx.say(ELDER_LINE, { speaker: SPEAKER.elder });
  // Mamá sale de casa.
  const mom = ctx.world.spawnEvent?.({ id: 'mama_circulo', x: 10, y: 26, sprite: SPRITE.mom, dir: 2 });
  if (mom) {
    const { stageRoute } = await import('./b07_path.js');
    const route = stageRoute(ctx, mom, ctx.player.x, ctx.player.y + 1);
    if (route?.length) await ctx.move(mom, route.slice(0, 40), { through: false, speed: 3.5 });
    ctx.turnToPlayer(mom);
    ctx.face('player', ctx.directionTo(ctx.player, mom));
  }
  await ctx.say(MOM_LINE, { speaker: SPEAKER.mom });
  await ctx.say(CIRCLE_TEXT.sign);
  await ctx.say(CIRCLE_TEXT.gift);
  await ctx.giveItem('MOONSTONE', 3);
  ctx.setFlag(F.moonStones);
  await zygardeSays(ctx, CIRCLE_TEXT.zygarde);
  ctx.se('Mining item get');
  await ctx.say(CIRCLE_TEXT.flyNote);
  glow?.remove?.(60);
  await ctx.fade('out', 12);
  if (mom) ctx.world.removeEvent?.(mom); // Mamá vuelve a casa
  if (elder && elderHome) { // el anciano, a su piedra con liquen
    elder.moveTo(elderHome.x, elderHome.y);
    elder.direction = elderHome.dir;
  }
  await pause(ctx, 6);
  await ctx.fade('in', 12);
  ctx.bgm?.('town_start', { fadeOutPrevious: 40 });
}

// ───────────────────────────── eventos de Villa Alba ─────────────────────────────

const sayStanding = async (ctx) => { await ctx.say(CIRCLE_TEXT.standing); };

/**
 * Cada losa son dos eventos en la misma casilla: el dibujo (`circulo_losa_i`, siempre atravesable: la danza y las
 * animaciones lo mueven) y el disparador sin gráfico (`circulo_piedra_i`). Hundida se pisa y se usa mirándola de frente
 * (noOver: un evento atravesable con gráfico solo se activaría estando encima); alzada es sólida.
 */
function slabEvents() {
  const sunk = (i) => (s) => beforeCircle(s) && !risen(s, i);
  const up = (i) => (s) => beforeCircle(s) && risen(s, i);
  const circle = (s) => Boolean(s?.flag(F.circle));
  const art = CIRCLE_POINTS.map((p, i) => ({
    id: `circulo_losa_${i}`, x: p.x, y: p.y, name: 'Losa',
    pages: [
      { when: sunk(i), sprite: OBJ.stone, ...frame(0), through: true },
      { when: up(i), sprite: OBJ.stone, ...frame(8), through: true },
      { when: circle, sprite: OBJ.stone, ...frame(8), through: true },
      { when: (s) => circle(s) && isNight(s), sprite: OBJ.stone, ...frame(12), stepAnime: true, speed: 2, through: true },
    ],
  }));
  const use = CIRCLE_POINTS.map((p, i) => ({
    id: `circulo_piedra_${i}`, x: p.x, y: p.y, name: 'Losa',
    pages: [
      { when: sunk(i), noOver: true, trigger: 'action', script: (ctx) => useSlab(ctx, i) },
      { when: up(i), solid: true, trigger: 'action', script: sayStanding },
      { when: circle, solid: true, trigger: 'action', script: sayStanding },
    ],
  }));
  return [...art, ...use];
}

function dancerEvents() {
  const dancing = (s) => beforeCircle(s) && told(s) && isNight(s);
  return DANCERS.map((d, n) => ({
    id: `clefairy_danza_${n}`, x: d.x, y: d.y, name: 'Clefairy',
    pages: [{
      when: dancing, sprite: SPRITE.clefairy, dir: d.dir, move: 'still', stepAnime: true, speed: 3, trigger: 'action',
      script: n === 0 ? replayDance : async (ctx) => { ctx.cry('CLEFAIRY'); await ctx.say(CIRCLE_TEXT.clefairy); },
    }],
  }));
}

/** Clefairy del Círculo ya alzado: de noche, uno por día de juego cada uno (encuentros nocturnos del jardín). */
function circleClefairyEvents() {
  const spots = [DANCERS[0], { x: 18, y: 16, dir: 6 }, { x: 27, y: 20, dir: 4 }];
  return spots.map((d, n) => ({
    id: `clefairy_circulo_${n}`, x: d.x, y: d.y, name: 'Clefairy',
    pages: [{
      when: (s) => Boolean(s?.flag(F.circle)) && isNight(s) && Number(s.var(V.clefairyDay(n), -1)) < gameDay(s),
      sprite: SPRITE.clefairy, dir: d.dir, move: { wander: 1 }, stepAnime: true, speed: 3, freq: 2, trigger: 'touch',
      script: async (ctx) => {
        ctx.cry('CLEFAIRY');
        await ctx.say(CIRCLE_TEXT.clefairyCircle);
        const { species, min, max } = CIRCLE_CLEFAIRY;
        const level = min + Math.floor(Math.random() * (max - min + 1));
        ctx.setVar(V.clefairyDay(n), gameDay(ctx.state));
        await ctx.wildBattle({ species, level });
        ctx.requestRefresh();
      },
    }],
  }));
}

/** Refresca las páginas cuando cambia el día y la noche (losas iluminadas, Clefairy). */
function nightWatcher() {
  return {
    id: 'b17_reloj_circulo', x: 0, y: 1, trigger: 'parallel', when: (s) => Boolean(s?.flag(P8)),
    script: async (ctx) => {
      const night = isNight(ctx.state);
      if (ctx.event.lastNight !== undefined && ctx.event.lastNight !== night) ctx.requestRefresh();
      ctx.event.lastNight = night;
      await ctx.wait(60);
    },
  };
}

/** Primera noche con Mamá avisada: la danza empieza sola al entrar en el pueblo. */
function firstDanceEvent() {
  return {
    id: 'b17_primera_danza', x: 1, y: 1, trigger: 'auto',
    when: (s) => beforeCircle(s) && told(s) && !s.flag(F.danceSeen) && isNight(s),
    script: firstDance,
  };
}

/** Eventos que añade Villa Alba (villa_alba.js, una línea). */
export function b17VillaAlbaEvents() {
  return [...slabEvents(), ...dancerEvents(), ...circleClefairyEvents(), nightWatcher(), firstDanceEvent()];
}

/**
 * Destinos de aterrizaje del Vuelo en Villa Alba (world/zygarde/actions.js#flyWithZygarde lee `flyLandings` de la
 * definición del mapa): con el Círculo en pie, el jugador elige entre la puerta de casa y el Círculo.
 */
export function villaAlbaLandings(state, home) {
  if (!state?.flag(F.circle)) return null;
  return [
    { label: 'Villa Alba', x: home.x, y: home.y, dir: home.dir ?? 2 },
    { label: 'Círculo del Jardín', x: CIRCLE_LANDING.x, y: CIRCLE_LANDING.y, dir: CIRCLE_LANDING.dir },
  ];
}
