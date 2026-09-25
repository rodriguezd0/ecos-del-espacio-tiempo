// Captura voluntaria de Zygarde (docs/CAMPANA.md B21 §2; D21; biblia §10.7: consentimiento, no apropiación).
// Al llegar a lo alto de Columna Lanza, antes de tocar la Flauta: «Antes de despertarlo… llévame contigo. No como parte
// del camino. Como parte del combate.» «Sí» / «Todavía no» (la escena espera: Zygarde vuelve a preguntar al acercarse
// a Arceus). La Honor Ball (PREMIERBALL) no se lanza: Zygarde se acerca y la toca. Entra en Forma Completa, nivel 70,
// con Agrupamiento, Mil Flechas, Mil Temblores, Fuerza Telúrica y Danza Dragón. Con el equipo lleno, el Arca abre un
// menú obligatorio (sin cancelar) para enviar a un Pokémon al PC. Las capacidades de campo no dependen de dónde esté.
import { createPokemon, displayName } from '../../battle/core/pokemon.js';
import { F, SPRITE, GREEN, zygardeSays, pause } from './b21_common.js';
import { ZYGARDE_TEXT } from './b21_texts.js';

export const ZYGARDE_LEVEL = 70;
/** Forma de ZYGARDE en species.json para la Forma Completa (content/zygarde/thresholds.js FORMS.complete). */
export const ZYGARDE_COMPLETE_FORM = 2;
/** Mil Flechas, Mil Temblores, Fuerza Telúrica (COREENFORCER; «Núcleo Castigo» en los datos de Añil) y Danza Dragón. */
export const ZYGARDE_MOVES = Object.freeze(['THOUSANDARROWS', 'THOUSANDWAVES', 'COREENFORCER', 'DRAGONDANCE']);
const PARTY_MAX = 6;

/** El Zygarde que entra en el equipo (Pokémon serializable). */
export function createTeamZygarde(db, state, { rng } = {}) {
  return createPokemon(db, 'ZYGARDE', ZYGARDE_LEVEL, {
    form: ZYGARDE_COMPLETE_FORM, ability: 'POWERCONSTRUCT', moves: [...ZYGARDE_MOVES], ball: 'PREMIERBALL',
    shiny: false, rng, ot: { name: state.player.name, id: state.player.id }, metMap: 'columna_lanza', obtainedMode: 'caught',
  });
}

/**
 * Menú obligatorio del Arca con el equipo lleno: elegir a quién enviar al PC (sin cancelar). Devuelve true si hay
 * sitio (ya lo había o se envió a alguien) y false si no queda sitio en ninguna caja.
 */
export async function makeRoomWithArca(ctx) {
  const st = ctx.state;
  if (st.party.length < PARTY_MAX) return true;
  const boxesFull = (st.data.boxes || []).every((box) => box.every(Boolean));
  if (boxesFull) {
    await ctx.say(ZYGARDE_TEXT.noRoom);
    return false;
  }
  await ctx.say(ZYGARDE_TEXT.full);
  for (let guard = 0; guard < 50; guard++) {
    const idx = await ctx.ui.openParty({ mode: 'select', message: ZYGARDE_TEXT.pick });
    if (!Number.isInteger(idx) || idx < 0 || idx >= st.party.length) {
      await ctx.say(ZYGARDE_TEXT.mustPick);
      continue;
    }
    const pk = st.party[idx];
    try {
      const where = st.depositPokemon(idx, 0);
      ctx.se?.('pc_close');
      await ctx.say(ZYGARDE_TEXT.sent(displayName(ctx.db, pk), st.boxName?.(where.box) ?? `Caja ${where.box + 1}`));
      return true;
    } catch (err) {
      await ctx.say(err.message || ZYGARDE_TEXT.mustPick);
    }
  }
  return st.party.length < PARTY_MAX;
}

/** Aparece o se desvanece un personaje de escena en `frames` fotogramas. */
async function fade(ctx, ch, from, to, frames = 16) {
  if (!ch) return;
  for (let f = 0; f <= frames; f++) {
    ch.opacity = Math.round(from + ((to - from) * f) / frames);
    await pause(ctx, 1);
  }
}

/**
 * Escena de la Honor Ball: la bola en la mano del jugador (sin lanzarla), Zygarde Completo se acerca y la toca,
 * la bola se abre en luz verde y se cierra con él dentro.
 */
async function honorBallScene(ctx) {
  const p = ctx.player;
  ctx.face('player', 'down');
  // Zygarde Completo (arte de B16) sustituye al compañero de campo durante la escena; los seguidores se apartan.
  const core = ctx.world.core;
  const followers = (ctx.world.followers || []).filter(Boolean);
  if (core) core.opacity = 0;
  for (const f of followers) f.opacity = 0;
  // La bola, sostenida ante el jugador (casilla de delante, a la altura de las manos): no se lanza.
  const ball = ctx.world.spawnEvent?.({
    id: '__honor_ball', x: p.x, y: p.y + 1, sprite: SPRITE.objects, dir: 2, through: true, alwaysOnTop: true,
    stepAnime: true, directionFix: true, walkAnime: false, shadow: false,
  });
  if (ball) ball.yOffset = -24;
  await ctx.say(ZYGARDE_TEXT.ball);
  // Zygarde Completo llega por la izquierda.
  const giant = ctx.world.spawnEvent?.({
    id: '__zygarde_completo', x: p.x - 3, y: p.y + 1, sprite: SPRITE.zygardeComplete, dir: 2,
    through: true, stepAnime: true, directionFix: true, shadow: false,
  });
  if (giant) giant.opacity = 0;
  await fade(ctx, giant, 0, 255);
  await ctx.say(ZYGARDE_TEXT.touch);
  if (giant) await ctx.move(giant, ['right', 'right'], { speed: 3 });
  if (ball) ball.direction = 6; // abierta, con luz verde
  ctx.cry?.('ZYGARDE', ZYGARDE_COMPLETE_FORM);
  const burst = ball ? ctx.effect?.('zygardeHexBurst', { x: ball.x, y: ball.y, mode: 'in', count: 30, spread: 2.4 }) : null;
  await ctx.flash?.([...GREEN], 24, 200);
  await fade(ctx, giant, 255, 0);
  if (giant) ctx.world.removeEvent?.(giant);
  if (ball) {
    ball.direction = 2;
    await pause(ctx, 24);
    ctx.world.removeEvent?.(ball);
  }
  burst?.remove?.(20);
  if (core) core.opacity = 255;
  for (const f of followers) f.opacity = 255;
}

/** Zygarde entra en el equipo (tras hacer sitio). → true si se unió. */
export async function captureZygarde(ctx) {
  if (ctx.flag(F.zygardeJoined)) return true;
  if (!(await makeRoomWithArca(ctx))) return false;
  await honorBallScene(ctx);
  const pk = createTeamZygarde(ctx.db, ctx.state);
  const r = ctx.state.addPokemon(pk);
  if (r.where === 'none') {
    await ctx.say(ZYGARDE_TEXT.noRoom);
    return false;
  }
  ctx.me?.('capture');
  await ctx.say(ZYGARDE_TEXT.joined);
  ctx.setFlag(F.zygardeJoined);
  ctx.scene?.refreshFollower?.();
  await zygardeSays(ctx, ZYGARDE_TEXT.after);
  await ctx.say(ZYGARDE_TEXT.reorder);
  return true;
}

/** La pregunta de Zygarde (primera vez y cada vez que se le vuelve a hablar). → true si se unió. */
export async function zygardeQuestion(ctx) {
  if (ctx.flag(F.zygardeJoined)) return true;
  ctx.setFlag(F.zygardeAsked);
  const core = ctx.world?.core;
  if (core?.visible && ctx.player) core.turnToward?.(ctx.player);
  ctx.se?.('core_signal', { volume: 55 });
  await ctx.say(ZYGARDE_TEXT.ask, { telepathy: true });
  const pick = await ctx.choice([...ZYGARDE_TEXT.choices], { cancel: 1 });
  if (pick !== 0) {
    await zygardeSays(ctx, ZYGARDE_TEXT.later);
    return false;
  }
  return captureZygarde(ctx);
}
