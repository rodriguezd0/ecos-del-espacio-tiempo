// T11 · «La noche de los farolillos» en el Islote Lumbre (docs/TABLILLAS.md T11; CAMPANA B13, §2.3 C063): de noche, el
// corro de Clefairy baila sobre ocho piedras; el jugador imita la secuencia (b13_dance_logic.js) y se abre la gruta de la
// luna, donde están Lucía (la nieta de Ramón) y la Tabla Duende. De día el islote está en calma: el banco permite
// descansar hasta la noche (TABLILLAS §4.8). Si se llega sin la pista, el arco empieza igual (descubrimiento directo).
import { F, V, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, zygardeSays, isNight, byGender, findEvent, objectPage } from './b13_common.js';
import { DANCE, STEPS, danceState, danceStep, stonePitch } from './b13_dance_logic.js';
import { runRest } from '../services/inn.js';
import BAKED_PRISMA from '../stamps/baked/ExteriorPrisma.js';
import {
  STONES, RING_CENTER, MOON_ROCK, GROTTO_ENTRY, LANTERNS, ROWBOAT, TRAINER, ITEMS, BENCH,
} from '../maps/b13/lumbre_layout.js';

const SEEN = 'b13_t11_baile_visto'; // el corro ya ha enseñado el baile esta vez (se reinicia al fallar)

export const LUMBRE_TEXT = Object.freeze({
  arrivalDay: 'Cerezos en flor, farolillos apagados y un claro con un corro de piedras lisas. No se oye a nadie.',
  arrivalNight: 'Entre los cerezos se mueven luces rosadas. En el claro, un corro de Clefairy baila sin parar.',
  stoneDay: 'Una piedra lisa con una espiral grabada. Forma corro con otras siete.',
  rock: 'Una peña con una luna grabada. Por las rendijas sale un aire frío que huele a lluvia.',
  rockNight: 'La luna grabada en la peña brilla un poco. Parece esperar algo.',
  lantern: 'Un farolillo de papel colgado de un poste.',
  lanternLit: 'El farolillo está encendido. Huele a cera y a flores.',
  bench: '¿Quieres sentarte en el banco a esperar?',
  demo: 'El Clefairy del centro da una palmada. Las piedras se encienden una a una, siguiendo el baile.',
  yourTurn: 'Los Clefairy te miran. Te toca a ti.',
  wrong: 'Los Clefairy se detienen y te miran, confusos. Las piedras se apagan: el baile vuelve a empezar.',
  done: [
    'Los ocho pasos. Las piedras brillan a la vez y los Clefairy saltan de alegría.',
    'Al sur del claro, la luna grabada en la peña se ilumina… y la roca se aparta con un rumor de piedra.',
  ],
  rockOpen: 'La peña se ha apartado. Detrás, una gruta iluminada por la luna.',
  boat: 'Una barca de remos pequeña, varada en la arena. En la popa pone «LUCÍA».',
});

// ───────────────────────────── Llegada y descanso ─────────────────────────────

async function arrival(ctx) {
  ctx.setFlag(F.lumArrival);
  // Descubrimiento directo (TABLILLAS §4.2): si la pista no estaba activa, el arco empieza igual.
  const status = ctx.story.clueStatus('T11');
  if (status !== 'active' && status !== 'solved') await ctx.story.openClue('T11', { direct: true });
  if (isNight(ctx.state)) {
    await ctx.say(LUMBRE_TEXT.arrivalNight);
    await zygardeSays(ctx, 'Bailan porque algo los llama. La luna, o lo que hay debajo.');
  } else {
    await ctx.say(LUMBRE_TEXT.arrivalDay);
    await zygardeSays(ctx, 'Aquí no hay nadie ahora. Las luces bailan de noche.');
  }
}

async function benchRest(ctx) {
  const r = await runRest(ctx, { kind: 'camp', message: LUMBRE_TEXT.bench });
  ctx.requestRefresh();
  return r;
}

/**
 * Vigila el paso del día a la noche para cambiar las páginas (Clefairy, farolillos). Al llegar al islote, un baile a
 * medias (partida cargada o vuelta de la playa) empieza de cero: las piedras encendidas no se guardan en el mapa.
 */
function nightWatcher() {
  return {
    id: 'vigia_noche_lumbre', x: 0, y: 0, trigger: 'parallel',
    script: async (ctx) => {
      // El estado vive en el evento del mapa cargado (se recrea en cada entrada), no en el módulo.
      const ev = ctx.event || {};
      const now = isNight(ctx.state);
      if (ev.b13LastNight === undefined && !ctx.flag(F.lumDance) && (ctx.var(V.dance, 0) > 0 || ctx.flag(SEEN))) {
        ctx.setVar(V.dance, 0);
        ctx.setFlag(SEEN, false);
      }
      if (ev.b13LastNight !== undefined && now !== ev.b13LastNight) ctx.requestRefresh();
      ev.b13LastNight = now;
      await ctx.wait(60);
    },
  };
}

// ───────────────────────────── El baile ─────────────────────────────

const dancing = (s) => isNight(s) && !s.flag(F.lumDance);

async function lightStone(ctx, i, dir, frames = 26) {
  const ev = findEvent(ctx, `piedra_corro_${i}`);
  ctx.se('PRSFX- Heal Bell', { volume: 70, pitch: stonePitch(i) });
  if (ev) ev.direction = dir;
  await ctx.wait(frames);
}

async function showDance(ctx) {
  await ctx.say(LUMBRE_TEXT.demo);
  for (let n = 0; n < STEPS; n++) {
    await lightStone(ctx, DANCE[n], 6, 28);
    const ev = findEvent(ctx, `piedra_corro_${DANCE[n]}`);
    if (ev) ev.direction = 2;
    await ctx.wait(6);
  }
  ctx.setVar(V.dance, 0);
  ctx.setFlag(SEEN);
  await ctx.say(LUMBRE_TEXT.yourTurn);
}

async function leaderTalk(ctx) {
  ctx.cry('CLEFAIRY');
  if (ctx.flag(F.lumDance)) { await ctx.say('¡Clefa! ♪'); return; }
  const i = await ctx.choice(['Mirar el baile', 'Dejarlo'], { message: 'El Clefairy del centro te mira y ladea la cabeza.', cancel: 1 });
  if (i === 0) await showDance(ctx);
}

async function danceDone(ctx) {
  ctx.bgm(MUSIC.lumbre);
  for (let i = 0; i < 8; i++) { const ev = findEvent(ctx, `piedra_corro_${i}`); if (ev) ev.direction = 4; }
  ctx.se('PRSFX- Moonlight', { volume: 80 });
  await ctx.flash([255, 220, 240], 20, 150);
  await ctx.say(LUMBRE_TEXT.done[0]);
  for (const id of ['clefairy_guia', 'clefairy_1', 'clefairy_2', 'clefairy_3', 'clefairy_4']) {
    const ev = findEvent(ctx, id);
    if (ev) ctx.jump(ev, 0, 0);
  }
  await ctx.camera.pan(MOON_ROCK.x, MOON_ROCK.y, 30);
  const rock = findEvent(ctx, 'pena_luna');
  if (rock) rock.direction = 4;
  ctx.se('PRSFX- Rock Wrecker', { volume: 60 });
  ctx.shake(3, 5, 20);
  await ctx.wait(20);
  await ctx.say(LUMBRE_TEXT.done[1]);
  ctx.setFlag(F.lumDance);
  ctx.setVar(V.dance, STEPS);
  await ctx.camera.reset(30);
  await zygardeSays(ctx, 'Ahí dentro. Una tabla. Y alguien dormido.');
}

async function stoneScript(ctx) {
  const ev = ctx.event;
  const i = ev?.def?.stone;
  if (!dancing(ctx.state) || !ctx.flag(SEEN)) return;
  const r = danceStep(danceState(ctx.var(V.dance, 0)), i);
  if (r.result === 'again') return;
  if (r.result === 'wrong') {
    ctx.se('GUI sel buzzer', { volume: 60 });
    for (let k = 0; k < 8; k++) { const s = findEvent(ctx, `piedra_corro_${k}`); if (s) s.direction = 2; }
    ctx.setVar(V.dance, 0);
    ctx.setFlag(SEEN, false);
    await ctx.emote('clefairy_guia', '?');
    await ctx.say(LUMBRE_TEXT.wrong);
    return;
  }
  ctx.setVar(V.dance, r.state.step);
  await lightStone(ctx, i, 4, 6);
  if (r.result === 'done') await danceDone(ctx);
}

function stoneEvents() {
  return STONES.map(([x, y], i) => ({
    id: `piedra_corro_${i}`, x, y, stone: i, name: 'Piedra del corro',
    pages: [
      { ...objectPage(OBJ.stone, 2), through: true, trigger: 'touch', lock: false, script: stoneScript },
      { when: (s) => Boolean(s?.flag(F.lumDance)), ...objectPage(OBJ.stone, 4), through: true },
    ],
  }));
}

/** Clefairy: de noche; el guía en el centro, cuatro bailando alrededor (atraviesan: no cierran el corro). */
function clefairyEvents() {
  const c = RING_CENTER;
  const square = (dx, dy) => ({ route: [dx > 0 ? 'down' : 'up', dy > 0 ? 'left' : 'right', dx > 0 ? 'up' : 'down', dy > 0 ? 'right' : 'left'], repeat: true });
  const dancers = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy], k) => ({
    id: `clefairy_${k + 1}`, x: c.x + dx, y: c.y + dy, name: 'Clefairy',
    pages: [
      { through: true },
      { when: (s) => isNight(s), sprite: k % 2 ? SPRITE.cleffa : SPRITE.clefairy, dir: 2, move: square(dx, dy), through: true, stepAnime: true, speed: 3, trigger: 'action', script: async (ctx) => { ctx.cry(k % 2 ? 'CLEFFA' : 'CLEFAIRY'); await ctx.say('¡Clef! ♪'); } },
    ],
  }));
  return [
    {
      id: 'clefairy_guia', x: c.x, y: c.y, name: 'Clefairy',
      pages: [
        { through: true },
        { when: (s) => isNight(s), sprite: SPRITE.clefairy, dir: 2, move: 'look', stepAnime: true, solid: true, trigger: 'action', script: leaderTalk },
      ],
    },
    ...dancers,
  ];
}

// ───────────────────────────── Peña, farolillos, barca ─────────────────────────────

async function enterGrotto(ctx) {
  await ctx.warp('lumbre_gruta', GROTTO_ENTRY.x, GROTTO_ENTRY.y, 8, { fade: true });
}

function rockEvents() {
  const r = MOON_ROCK;
  const open = (s) => Boolean(s?.flag(F.lumDance));
  const closedText = async (ctx) => { await ctx.say(isNight(ctx.state) ? LUMBRE_TEXT.rockNight : LUMBRE_TEXT.rock); };
  return [
    {
      id: 'pena_luna', x: r.x, y: r.y, name: 'Peña de la luna',
      pages: [
        { ...objectPage(OBJ.moonRock, 2), solid: true, trigger: 'action', script: closedText },
        { when: open, ...objectPage(OBJ.moonRock, 6, { stepAnime: true }), through: true, trigger: 'touch', script: enterGrotto },
      ],
    },
    ...[r.x - 1, r.x + 1].map((x) => ({
      id: `pena_luna_${x}`, x, y: r.y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(ctx.flag(F.lumDance) ? LUMBRE_TEXT.rockOpen : LUMBRE_TEXT.rock); },
    })),
    // El cuerpo de la peña (el sprite ocupa 3×3): la boca da a la playa del sur y por detrás no se pasa.
    ...[r.y - 2, r.y - 1].flatMap((y) => [r.x - 1, r.x, r.x + 1].map((x) => ({
      id: `pena_luna_cuerpo_${x}_${y}`, x, y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { if (ctx.flag(F.lumDance)) await ctx.say(LUMBRE_TEXT.rockOpen); else await closedText(ctx); },
    }))),
  ];
}

function lanternEvents() {
  const lit = (s) => isNight(s) || Boolean(s?.flag(F.lumFeast));
  return LANTERNS.map(([x, y], i) => ({
    id: `farolillo_${i}`, x, y, name: 'Farolillo',
    pages: [
      { ...objectPage(OBJ.lantern, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(LUMBRE_TEXT.lantern); } },
      { when: lit, ...objectPage(OBJ.lantern, 4, { stepAnime: true }), solid: true, light: { radius: 60, intensity: 0.8 }, trigger: 'action', script: async (ctx) => { await ctx.say(LUMBRE_TEXT.lanternLit); } },
    ],
  }));
}

/** Tiles de un stamp horneado de ExteriorPrisma como parche [[x, y, capa, id]…] (0 = borrar). */
function stampPatch(name, x0, y0, erase = false) {
  const st = BAKED_PRISMA.stamps?.[name];
  if (!st) return [];
  const out = [];
  st.layers.forEach((grid, layer) => {
    if (!grid) return;
    for (let j = 0; j < st.h; j++) for (let i = 0; i < st.w; i++) {
      const id = grid[i + j * st.w];
      if (id) out.push([x0 + i, y0 + j, layer, erase ? 0 : id]);
    }
  });
  return out;
}

function rowboatEvent() {
  return {
    id: 'barca_lucia', x: ROWBOAT.x + 1, y: ROWBOAT.y, name: 'Barca de remos',
    pages: [
      { patch: stampPatch('bote_remos', ROWBOAT.x, ROWBOAT.y), solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(LUMBRE_TEXT.boat); } },
      { when: (s) => Boolean(s?.flag(F.lumLucia)), patch: stampPatch('bote_remos', ROWBOAT.x, ROWBOAT.y, true), through: true },
    ],
  };
}

export function lumbreEvents() {
  return [
    { id: 'llegada_lumbre', x: 0, y: 0, trigger: 'auto', when: when({ none: [F.lumArrival] }), script: arrival },
    nightWatcher(),
    ...stoneEvents(),
    ...clefairyEvents(),
    ...rockEvents(),
    ...lanternEvents(),
    rowboatEvent(),
    { id: 'banco_descanso', x: BENCH.x + 1, y: BENCH.y, solid: true, noOver: true, trigger: 'action', script: benchRest },
    {
      id: TRAINER.id, type: 'trainer', trainer: TRAINER.trainer, name: TRAINER.name, sprite: 'anil:dama',
      x: TRAINER.x, y: TRAINER.y, dir: TRAINER.dir, sight: TRAINER.sight,
      intro: '¿Has venido a ver los cerezos? Yo también. Pero antes, un combate.',
      after: 'Dicen que el islote se llamaba así por los faroles que encendían los pescadores. Ahora los encienden los Clefairy.',
    },
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
  ];
}

// ───────────────────────────── Gruta de la Luna ─────────────────────────────

export const GRUTA_TEXT = Object.freeze({
  first: 'Un rayo de luna entra por una grieta del techo y cae sobre un estanque quieto. Junto al agua, una niña dormida.',
  plate: 'Sobre un pedestal de piedra, una losa rosada brilla con la luz de la luna.',
  pedestal: 'El pedestal está vacío. En la piedra hay un hueco con la forma de la tabla.',
});

async function luciaTalk(ctx) {
  if (ctx.flag(F.lumLucia)) return;
  const lucia = findEvent(ctx, 'lucia');
  if (lucia) { lucia.direction = 2; await ctx.emote(lucia, '…'); ctx.turnToPlayer(lucia); }
  const night = isNight(ctx.state);
  await lines(ctx, SPEAKER.lucia, [
    night ? '¿Eh…? ¿Ya es de noche otra vez?' : '¿Eh…? ¿Ya es de día? ¿Cuánto he dormido?',
    '¿Quién eres? ¿Te manda mi abuelo? ¿Ramón, el del faro?',
    'Seguí a los Clefairy en la barca. Bailaban en corro y me dejaron entrar. No podía parar: cada vez que paraba, se apagaba una luz.',
    'Luego vinieron aquí dentro y la piedra se cerró. Me quedé dormida mirando esa losa.',
  ]);
  await lines(ctx, SPEAKER.lucia, [
    `Gracias por abrir. De verdad. Qué valiente, entrar aquí ${byGender(ctx.state, 'solo', 'sola')}${night ? ' de noche' : ''}…`,
    'Tengo que volver ya. Dejé la barca en la playa. El abuelo estará subiéndose por las paredes.',
  ]);
  ctx.setFlag(F.lumLucia);
  if (lucia) {
    await ctx.move(lucia, ['right', 'right', 'down', 'down'], { through: true, speed: 4 });
    ctx.erase('lucia');
  }
  if (!ctx.flag(F.lumPlate)) await zygardeSays(ctx, 'La tabla del pedestal. No la dejes aquí.');
}

async function plateTalk(ctx) {
  if (ctx.flag(F.lumPlate)) { await ctx.say(GRUTA_TEXT.pedestal); return; }
  await ctx.say(GRUTA_TEXT.plate);
  await zygardeSays(ctx, 'La escribieron los que guardaban. Los Clefairy solo la cuidaban.');
  ctx.setFlag(F.lumPlate);
  await ctx.story.giveTablet('PIXIEPLATE');
}

async function grottoFirst(ctx) {
  ctx.setFlag('b13_t11_gruta_vista');
  await ctx.say(GRUTA_TEXT.first);
}

export function grutaEvents(G) {
  return [
    { id: 'gruta_primera', x: 0, y: 0, trigger: 'auto', when: when({ none: ['b13_t11_gruta_vista'] }), script: grottoFirst },
    { id: 'rayo_luna', x: G.moonbeam.x, y: G.moonbeam.y, through: true, light: { radius: 96, intensity: 1 } },
    {
      id: 'lucia', x: G.lucia.x, y: G.lucia.y, name: SPEAKER.lucia,
      pages: [
        { when: when({ none: [F.lumLucia] }), sprite: SPRITE.lucia, dir: G.lucia.dir, solid: true, trigger: 'action', script: luciaTalk },
        { when: when({ all: [F.lumLucia] }), through: true },
      ],
    },
    {
      id: 'pedestal_tabla', x: G.pedestal.x, y: G.pedestal.y, name: 'Pedestal',
      pages: [
        { ...objectPage(OBJ.plate, 2, { stepAnime: true }), solid: true, light: { radius: 48, intensity: 0.8 }, trigger: 'action', script: plateTalk },
        { when: when({ all: [F.lumPlate] }), solid: true, trigger: 'action', script: plateTalk },
      ],
    },
  ];
}
