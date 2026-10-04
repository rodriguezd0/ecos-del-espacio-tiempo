// Arceus en Columna Lanza (docs/CAMPANA.md B21 §3–5; D22, D23; TABLILLAS §4.7):
//   · Despertar: el jugador toca la Flauta Azur (con Zygarde ya en el equipo) y Arceus despierta «para medir».
//   · Combate en tres fases con el sistema de fases de jefe (reglas en b21_arceus_logic.js). Derrota: «Reintentar fase»
//     (equipo y objetos como al empezar esa fase) o «Retirarse» (antecámara con el equipo curado); la fase alcanzada
//     se guarda en la variable b21_arceus_fase y, al volver, Arceus la retoma con todos sus PS.
//   · Resolución: Terrax, Terror y Legendaria (las dieciocho), la confirmación de la profecía, el eje que no se eligió
//     en el P9 reparado y el fin de la crisis (game_cleared). Arceus capturado → arceus_caught; debilitado en la fase 3
//     → sigue en Columna Lanza para el postgame (CAMPANA §8.1, B22).
import { F, V, SPEAKER, MUSIC, GOLD, pause, placePlayer, eventById } from './b21_common.js';
import { FLUTE_TEXT, PHASE_TEXT, BATTLE_TEXT, RESOLUTION_TEXT, ZYGARDE_TEXT } from './b21_texts.js';
import { arceusRequest, reachedPhase, clampPhase, stateSnapshot } from './b21_arceus_logic.js';
import { syncBag } from '../../battle/scene/results.js';
import { COLUMNA, SOCKETS, ARCEUS_SOCKET_KS, COLUMNA_PANORAMA } from '../maps/b21/layout.js';
import { zygardeQuestion } from './b21_zygarde.js';
import { ARCEUS_TABLETS } from '../story/tablets.js';

const FLUTE_ITEM = 'AZUREFLUTE';

/** ¿Lleva la Flauta Azur? (objeto clave de B20; el flag b20_flute sirve de respaldo). */
export const hasFlute = (state) => Boolean(state?.hasKeyItem?.(FLUTE_ITEM) || state?.flag?.(F.fluteB20));

/** Fase guardada (0 Tierra · 1 Fantasma · 2 Normal). */
export const savedPhase = (state) => clampPhase(state.var(V.phase, 0));

/** Devuelve el equipo y la mochila a una instantánea (Reintentar fase). */
export function restoreSnapshot(state, snap) {
  if (!snap?.party?.length) return false;
  state.setParty(JSON.parse(JSON.stringify(snap.party)));
  syncBag(state, snap.bag || {});
  return true;
}

/** Brillo de un zócalo (efecto softLight dorado); se retira solo tras `frames`. */
function socketFlash(ctx, s, frames = 60) {
  const h = ctx.effect?.('softLight', { x: s.x, y: s.y, radius: 44, intensity: 0.8, pulse: 0.5, color: [...GOLD], fadeIn: 8 });
  if (h) setTimeout(() => h.remove?.(20), Math.max(100, frames * 16));
  return h;
}

// ─────────────────────────────── Despertar ───────────────────────────────

/** Arceus dormido: con Zygarde en el equipo y la Flauta, «¿Tocar la Flauta Azur?» y despertar. */
export async function arceusAltar(ctx) {
  if (ctx.flag(F.arceusDone)) return;
  if (ctx.flag(F.arceusAwake)) {
    await awakeArceus(ctx);
    return;
  }
  await ctx.say(FLUTE_TEXT.sleeping);
  if (!ctx.flag(F.zygardeJoined)) {
    await ctx.say(ZYGARDE_TEXT.beforeFlute);
    if (!(await zygardeQuestion(ctx))) return;
  }
  if (!hasFlute(ctx.state)) {
    await ctx.say(FLUTE_TEXT.noFlute);
    return;
  }
  if (!(await ctx.confirm(FLUTE_TEXT.ask))) return;
  await fluteScene(ctx);
  await fightArceus(ctx);
}

/** Escena de la Flauta: melodía, los zócalos se encienden, Arceus despierta y habla (D22). */
export async function fluteScene(ctx) {
  const arceus = eventById(ctx, 'b21_arceus');
  ctx.face('player', 'up');
  await ctx.say(FLUTE_TEXT.play);
  ctx.bgm(MUSIC.flute, { fadeOutPrevious: 20 });
  await pause(ctx, 60);
  await ctx.say(FLUTE_TEXT.felt);
  for (const s of SOCKETS) {
    if (ARCEUS_SOCKET_KS.includes(s.k)) continue;
    socketFlash(ctx, s, 90);
    ctx.se?.('Anim/Saint7', { volume: 40 });
    await pause(ctx, 6);
  }
  await pause(ctx, 40);
  const glow = ctx.effect?.('softLight', { x: COLUMNA.arceus.x, y: COLUMNA.arceus.y - 1, radius: 150, intensity: 0.9, pulse: 0.3, color: [...GOLD], fadeIn: 40 });
  ctx.shake(4, 5, 60);
  await ctx.flash([255, 246, 214], 30, 230);
  ctx.setFlag(F.arceusAwake);
  if (arceus) { arceus.opacity = 255; }
  ctx.cry?.('ARCEUS');
  await pause(ctx, 40);
  for (const line of FLUTE_TEXT.wake) await ctx.say(line, { speaker: SPEAKER.arceus });
  glow?.remove?.(60);
}

/** Arceus despierto (tras «Retirarse» o al cargar partida): vuelve a medir desde la fase guardada. */
async function awakeArceus(ctx) {
  await ctx.say(FLUTE_TEXT.awake);
  if (!(await ctx.confirm(FLUTE_TEXT.resume))) return;
  await fightArceus(ctx);
}

// ─────────────────────────────── Combate ───────────────────────────────

/**
 * Combate por fases con reintento. Devuelve 'win' | 'caught' | 'retreat'. La fase alcanzada queda en b21_arceus_fase.
 */
export async function fightArceus(ctx) {
  const st = ctx.state;
  for (let guard = 0; guard < 99; guard++) {
    const start = savedPhase(st);
    const session = { snapshots: { [start]: stateSnapshot(st) } };
    await ctx.say(PHASE_TEXT[start].question, { speaker: SPEAKER.arceus });
    const request = arceusRequest({ db: ctx.db, startPhase: start, session });
    let result;
    try {
      result = await ctx.scene.startBattle(request);
    } catch (err) {
      console.error('[b21] combate de Arceus', err);
      result = { outcome: 'forfeit', error: err };
    }
    const reached = reachedPhase(start, result);
    st.setVar(V.phase, reached);
    st.setVar(V.tries, (st.var(V.tries, 0) || 0) + 1);
    if (result.outcome === 'caught') {
      ctx.setFlag(F.arceusCaught);
      ctx.setFlag(F.arceusDone);
      return 'caught';
    }
    if (result.outcome === 'win') {
      ctx.setFlag(F.arceusFainted);
      ctx.setFlag(F.arceusDone);
      return 'win';
    }
    // Derrota (o fallo del combate): la fase alcanzada se guarda; se elige reintentar o retirarse.
    if (result.error) await ctx.say(BATTLE_TEXT.error);
    const pick = await ctx.choice([...BATTLE_TEXT.options], { message: BATTLE_TEXT.lost, cancel: null });
    if (pick === 0) {
      const snap = session.snapshots[reached] || session.snapshots[start];
      if (!restoreSnapshot(st, snap)) ctx.heal();
      await ctx.say(BATTLE_TEXT.retry);
      continue;
    }
    await retreat(ctx, reached);
    return 'retreat';
  }
  await retreat(ctx, savedPhase(st));
  return 'retreat';
}

/** «Retirarse»: fundido, equipo curado y la antecámara; Arceus espera en la fase guardada. */
export async function retreat(ctx, phase) {
  await ctx.fade('out', 20);
  ctx.heal();
  placePlayer(ctx, COLUMNA.retreat.x, COLUMNA.retreat.y, COLUMNA.retreat.dir);
  ctx.bgm(MUSIC.columna, { fadeOutPrevious: 20 });
  await pause(ctx, 10);
  await ctx.fade('in', 20);
  await ctx.say(BATTLE_TEXT.retreat);
  await ctx.say(BATTLE_TEXT.retreatWait(PHASE_TEXT[clampPhase(phase)].type));
}

// ─────────────────────────────── Resolución ───────────────────────────────

/** Las tres Tablillas de Arceus, una a una, con su zócalo encendiéndose. */
async function giveArceusTablets(ctx) {
  for (const t of ARCEUS_TABLETS) {
    const k = ARCEUS_SOCKET_KS[ARCEUS_TABLETS.indexOf(t)];
    const s = SOCKETS.find((x) => x.k === k);
    await ctx.story.giveTablet(t.id);
    if (s) socketFlash(ctx, s, 120);
    ctx.requestRefresh?.();
    await pause(ctx, 12);
  }
  ctx.setFlag(F.tabletsComplete);
  ctx.se?.('Anim/Saint9');
  for (const s of SOCKETS) socketFlash(ctx, s, 150);
  await ctx.flash([255, 240, 190], 20, 160);
  await ctx.say(RESOLUTION_TEXT.tablets);
}

/** El eje que no se eligió en el P9 queda reparado (var p9_choice de B18). */
async function repairAxis(ctx) {
  const choice = String(ctx.state.var(V.p9Choice, '') || '').toUpperCase();
  const text = RESOLUTION_TEXT.axis[choice] || RESOLUTION_TEXT.axis.none;
  const color = choice === 'DIALGA' ? [255, 170, 210] : choice === 'PALKIA' ? [150, 190, 255] : [220, 220, 255];
  ctx.se?.('Anim/Saint3');
  await ctx.flash(color, 30, 180);
  await ctx.say(text);
  ctx.setFlag(F.axisRepaired);
}

/** Fin de la crisis: game_cleared (cielo restablecido), panorama de cielo abierto y Anclaje (postgame). */
async function clearSky(ctx) {
  const { reachMilestone } = await import('../../world/zygarde/scenes.js');
  ctx.shake(3, 4, 40);
  await ctx.flash([255, 255, 255], 36, 255);
  ctx.setFlag(F.gameCleared);
  ctx.story?.setCrisisPhase?.(null);
  await reachMilestone(ctx, 'anchor', { scenes: false, sayMissing: false });
  try {
    await ctx.scene?.panorama?.set?.(COLUMNA_PANORAMA.calm);
  } catch (err) {
    console.warn('[b21] panorama del cielo', err);
  }
  await ctx.say(RESOLUTION_TEXT.sky);
}

/** Resolución completa tras el combate (auto; se reanuda si se interrumpe). */
export async function resolutionScene(ctx) {
  ctx.bgm(MUSIC.resolution, { fadeOutPrevious: 30 });
  const caught = ctx.flag(F.arceusCaught);
  await pause(ctx, 20);
  await ctx.say(caught ? RESOLUTION_TEXT.caught : RESOLUTION_TEXT.fainted);
  if (!ctx.flag(F.tabletsComplete)) await giveArceusTablets(ctx);
  const glow = ctx.effect?.('softLight', { x: COLUMNA.arceus.x, y: COLUMNA.arceus.y - 1, radius: 160, intensity: 0.8, pulse: 0.2, color: [...GOLD], fadeIn: 30 });
  await pause(ctx, 30);
  await ctx.say(RESOLUTION_TEXT.confirm(ctx.state), { speaker: SPEAKER.arceus });
  await ctx.story.revealVerse('confirmation');
  if (!ctx.flag(F.axisRepaired)) await repairAxis(ctx);
  glow?.remove?.(60);
  if (!ctx.flag(F.gameCleared)) await clearSky(ctx);
  if (!caught) await ctx.say(RESOLUTION_TEXT.stays);
  ctx.setFlag(F.finalResolved);
}
