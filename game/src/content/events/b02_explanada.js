// Explanada del Umbral (CAMPANA B02, pasos 2–3 y 6–7; §5.4; §6.2): Gael espera fuera («Llegué antes. No me ha
// dejado pasar.»), Casilda bloquea el paso hasta que el Core hace brillar el dintel y entrega C009. A la salida, al
// atardecer, el Core forma el 10 % (reachMilestone 'run'), Gael lo ve y se va sin hablar, llega el «equipo de
// medición» del Consorcio (la científica sin nombre es Casia) y Casilda entrega la Libreta con la pista T01.
import { F, SPEAKER, SPRITE, GREEN, when, say, core, strip, fx, giveCell, milestone, minutesUntil } from './b02_common.js';
import { C009 } from './b02_cells.js';
import { ROOM, ROOM_VAR } from './b02_ruinas_casilda.js';
import { SCENE, EXPLANADA_DOOR, EAST_PATH } from '../maps/b02/explanada_umbral_layout.js';
import { CLUE_ARCS } from '../story/clues.js';

const C = SPEAKER.casilda;
const G = SPEAKER.gael;
/** Flag auxiliar: el trípode del Consorcio está montado durante la escena de salida. */
const TRIPOD = 'b02_tripode';
/** Pista inicial de T01 (calco de la Libreta, TABLILLAS §4.5). */
export const T01_TEXT = CLUE_ARCS.find((a) => a.id === 'T01').steps[0].text;

/** Mueve un personaje a (x, y) en L (primero horizontal) atravesando lo que haya. */
async function moveCharTo(ctx, id, x, y, { vertical = false, speed } = {}) {
  const ch = id === 'core' ? ctx.world?.core : ctx.world?.events?.find((e) => e.id === id);
  if (!ch) return;
  const h = [];
  const v = [];
  for (let i = 0; i < Math.abs(x - ch.x); i++) h.push(x > ch.x ? 'right' : 'left');
  for (let i = 0; i < Math.abs(y - ch.y); i++) v.push(y > ch.y ? 'down' : 'up');
  await ctx.move(id, vertical ? [...v, ...h] : [...h, ...v], { through: true, speed });
}

// ─── Paso 2: Gael espera fuera ───────────────────────────────────────────────────────────────────

async function gaelWaits(ctx) {
  ctx.face('gael', 'right');
  await ctx.emote('gael', '!');
  await say(ctx, G, 'Llegué antes. No me ha dejado pasar.');
  ctx.face('gael', 'left');
  ctx.setFlag(F.gaelWaits);
}

/**
 * Gael va andando de su sitio junto al dintel (SCENE.gael) a donde espera (SCENE.gaelWait) por la plaza: primero
 * hacia el este y luego hacia abajo, casillas que se pisan (la página nueva, `gael_espera`, aparece donde acaba).
 */
async function walkGaelAside(ctx) {
  const g = ctx.world?.events?.find((e) => e.id === 'gael');
  if (!g || g.erased) return;
  await moveCharTo(ctx, 'gael', SCENE.gaelWait.x, SCENE.gaelWait.y, { speed: 3 });
  ctx.face('gael', 'up');
}

// ─── Paso 3: Casilda bloquea el paso ─────────────────────────────────────────────────────────────

async function gateScene(ctx) {
  if (!ctx.flag(F.gaelWaits)) await gaelWaits(ctx);
  ctx.face('player', 'up');
  ctx.face('casilda', 'down');
  await ctx.emote('casilda', '!');
  await say(ctx, C, 'Aquí no entra nadie a hacer turismo.');
  await ctx.wait(20);
  // El Core se acerca al dintel y la ranura de la viga brilla un instante.
  const p = ctx.player;
  const beam = SCENE.beam;
  await moveCharTo(ctx, 'core', beam.x - 1, beam.y + 2, { speed: 3 });
  ctx.face('core', 'up');
  ctx.se('core_signal');
  const glow = fx(ctx, 'softLight', { x: beam.x, y: beam.y, radius: 44, color: [...GREEN], intensity: 0.9, pulse: 0.6, fadeIn: 8 });
  await ctx.flash(GREEN, 16, 90);
  await ctx.wait(40);
  glow?.remove?.(30);
  await ctx.emote('casilda', '…');
  await ctx.wait(50);
  await say(ctx, C, '…Voy contigo. Para que no te abras la cabeza.');
  await say(ctx, C, 'Toma. Esto brillaba en el patio. Lo guardé en un tarro, no sé por qué.');
  await giveCell(ctx, C009.id);
  await moveCharTo(ctx, 'core', p.x, p.y + 1, { vertical: true, speed: 4 });
  ctx.face('casilda', 'right');
  await say(ctx, C, 'Tú, espera aquí.');
  await ctx.emote('gael', '…');
  // Gael se aparta andando hasta donde esperará (antes aparecía allí de golpe al cambiar de página).
  await walkGaelAside(ctx);
  ctx.face('casilda', 'up');
  // Casilda cruza el dintel y entra por la boca de la roca (fila de debajo de la boca y un paso más: desaparece).
  await ctx.move('casilda', ['up', 'up', 'up', 'up'], { speed: 3 });
  ctx.erase('casilda');
  ctx.se('Door enter');
  ctx.setVar(ROOM_VAR, ROOM.antesala);
  ctx.setFlag(F.casildaJoined);
}

// ─── Pasos 6–7: salida al atardecer ──────────────────────────────────────────────────────────────

/** Lleva el reloj de juego al atardecer (sin retroceder: avanza hasta las 18:30 si no es ya tarde). */
export function toDusk(state) {
  const h = state.hour;
  if (h >= 18 && h < 20) return 0;
  const m = minutesUntil(state, 18, 30);
  state.advanceMinutes(m);
  return m;
}

async function tenPercent(ctx) {
  const c = ctx.world?.core;
  ctx.se('core_signal');
  const cells = c ? fx(ctx, 'zygardeHexBurst', { x: c.x, y: c.y, mode: 'in', count: 30 }) : null;
  await ctx.wait(40);
  cells?.remove?.(20);
  return milestone(ctx, 'run');
}

async function gaelLeaves(ctx) {
  ctx.face('gael_espera', 'up');
  await ctx.emote('gael_espera', '…');
  await ctx.wait(30);
  await moveCharTo(ctx, 'gael_espera', EAST_PATH.x1, EAST_PATH.y1, { vertical: true, speed: 4 });
  ctx.erase('gael_espera');
  ctx.setFlag(F.gaelLeft);
}

async function consortium(ctx) {
  const team = SCENE.genesis;
  await Promise.all(team.map((t) => moveCharTo(ctx, t.id, t.stop.x, t.stop.y, { speed: 3.5 })));
  ctx.setFlag(TRIPOD);
  for (const t of team) ctx.face(t.id, 'left');
  await say(ctx, SPEAKER.tecnico, 'Lecturas de campo. Serán solo unos minutos.');
  await ctx.emote('cientifica', '!');
  ctx.face('cientifica', 'left');
  const kid = ctx.state.player?.gender === 'F' ? 'una niña' : 'un niño';
  await say(ctx, SPEAKER.casia, `Qué interesante: responde a ${kid} y no a cuarenta años de cuidados.`);
  await ctx.wait(20);
  await moveCharTo(ctx, 'casilda_salida', SCENE.casildaExit.x + 1, SCENE.casildaExit.y + 2, { speed: 3 });
  ctx.face('casilda_salida', 'right');
  await say(ctx, C, 'Aquí se mide con los ojos. Fuera.');
  await say(ctx, SPEAKER.casia, 'Como prefiera. Los datos no se van a ninguna parte.');
  ctx.setFlag(TRIPOD, false);
  await Promise.all(team.map((t) => moveCharTo(ctx, t.id, t.x, t.y, { speed: 4 })));
  for (const t of team) ctx.erase(t.id);
}

async function notebook(ctx) {
  ctx.turnToPlayer('casilda_salida');
  await say(ctx, C, 'Toma. Mi madre apuntaba aquí lo que decían las piedras. Yo nunca le hice caso.');
  await ctx.giveItem('CLUENOTEBOOK');
  await ctx.say('Entre las páginas de la Libreta hay un calco a lápiz de una inscripción:');
  await ctx.say(T01_TEXT);
  ctx.setFlag(F.notebook);
  await ctx.story.openClue('T01');
  await say(ctx, C, 'Ese calco es letra suya. Si resulta que significa algo, ya me lo contarás.');
  await say(ctx, C, 'Me voy a casa. Si necesitas algo, ya sabes dónde vivo.');
  await moveCharTo(ctx, 'casilda_salida', EAST_PATH.x1, EAST_PATH.y0 + 1, { vertical: true, speed: 3.5 });
  ctx.erase('casilda_salida');
}

/**
 * La escena ocurre al pie del dintel. Si el jugador llega a la explanada por otro lado (p. ej. tras usar la Cuerda
 * Huida en el Núcleo y volver andando desde Zaguán), se le lleva allí con un fundido para que lo vea todo.
 */
async function toRuinMouth(ctx) {
  const p = ctx.player;
  const out = EXPLANADA_DOOR.out;
  if (!p || typeof p.moveTo !== 'function') return;
  if (Math.abs(p.x - out.x) + Math.abs(p.y - out.y) <= 2) return;
  await ctx.fade('out', 16);
  p.moveTo(out.x, out.y);
  p.direction = out.dir;
  try {
    const { placeChainBehind } = await import('../../world/follower.js');
    placeChainBehind(p, ctx.world?.followers);
  } catch (err) {
    console.warn('[b02] No se pudo recolocar a los seguidores', err);
  }
  await ctx.fade('in', 16);
}

async function exitScene(ctx) {
  await toRuinMouth(ctx);
  toDusk(ctx.state);
  ctx.requestRefresh();
  ctx.face('player', 'down');
  await ctx.wait(30);
  await ctx.say('El sol ya cae sobre la explanada.');
  if (!ctx.flag(F.gaelLeft)) ctx.face('gael_espera', 'up');
  await tenPercent(ctx);
  if (!ctx.flag(F.gaelLeft)) await gaelLeaves(ctx);
  await consortium(ctx);
  await notebook(ctx);
  ctx.setVar(ROOM_VAR, ROOM.fuera);
  ctx.setFlag(F.exit);
}

// ─── Eventos ─────────────────────────────────────────────────────────────────────────────────────

function genesisEvents() {
  const present = when({ all: [F.nucleo], none: [F.exit] });
  const sprites = { cientifica: SPRITE.casia, tecnico_a: SPRITE.tecnico, tecnico_b: SPRITE.tecnica };
  return [
    ...SCENE.genesis.map((t) => ({ id: t.id, x: t.x, y: t.y, when: present, sprite: sprites[t.id], dir: 4, through: true, trigger: 'action', script: async () => {} })),
    { id: 'tripode_consorcio', x: 21, y: 14, when: when({ all: [TRIPOD] }), sprite: SPRITE.tripod, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true },
  ];
}

export function explanadaEvents() {
  const beforeJoin = when({ all: [F.leftTown], none: [F.casildaJoined] });
  return [
    {
      id: 'casilda', x: SCENE.casilda.x, y: SCENE.casilda.y, when: when({ none: [F.casildaJoined] }), sprite: SPRITE.casilda,
      dir: SCENE.casilda.dir, move: 'still', trigger: 'action', script: gateScene,
    },
    ...strip('paso_dintel', SCENE.gateStrip, { when: beforeJoin, script: gateScene }),
    {
      id: 'gael', x: SCENE.gael.x, y: SCENE.gael.y, when: beforeJoin, sprite: SPRITE.gael, dir: SCENE.gael.dir, move: 'still',
      trigger: 'action', script: async (ctx) => { await say(ctx, G, 'Llegué antes. No me ha dejado pasar.'); ctx.setFlag(F.gaelWaits); },
    },
    ...strip('llega_gael', SCENE.gaelStrip, { when: when({ all: [F.leftTown], none: [F.gaelWaits, F.casildaJoined] }), script: gaelWaits }),
    {
      id: 'gael_espera', x: SCENE.gaelWait.x, y: SCENE.gaelWait.y, when: when({ all: [F.casildaJoined], none: [F.gaelLeft] }),
      sprite: SPRITE.gael, dir: SCENE.gaelWait.dir, move: 'still', trigger: 'action',
      script: async (ctx) => { await say(ctx, G, 'Me ha dicho que espere. Así que espero.'); },
    },
    {
      id: 'casilda_salida', x: SCENE.casildaExit.x, y: SCENE.casildaExit.y, when: when({ all: [F.nucleo], none: [F.exit] }),
      sprite: SPRITE.casilda, dir: SCENE.casildaExit.dir, move: 'still', trigger: 'action', script: async () => {},
    },
    { id: 'escena_salida', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.nucleo], none: [F.exit] }), script: exitScene },
    ...genesisEvents(),
    { id: 'cartel_ruinas', type: 'sign', x: 27, y: 12, text: 'RUINAS DEL DINTEL\nPilar del Umbral. Se ruega respeto.', skin: 'sign hgss dir' },
    { id: 'estela_explanada', type: 'sign', x: 24, y: 12, text: 'Una estela con glifos antiguos, gastados por la lluvia. Nadie ha escrito debajo ninguna traducción.' },
    { id: 'repelente_explanada', type: 'item', x: 4, y: 25, item: 'REPEL' },
    { id: 'pocion_explanada', type: 'item', x: 27, y: 20, item: 'POTION', hidden: true },
  ];
}

export { EXPLANADA_DOOR, core };
