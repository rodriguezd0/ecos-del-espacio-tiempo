// Columna Lanza en el postgame (docs/CAMPANA.md B22; mapa de B21, añadidos solo con el postgame):
//   · El legendario que NO se eligió en el P9, en su plataforma (Dialga al oeste, Palkia al este): requisito, el elegido
//     en el equipo y el orbe que dejó el no elegido (B18). «Rugido, temblor y aparición. Nv 75». Si el elegido no se
//     capturó, el hexágono lo recuerda: primero se captura en la Cámara del Cruce (B18 lo hace reaparecer al descansar).
//   · Arceus, si no se capturó: vuelve a medir tras descansar después del final (solo la fase Normal, nv 75, captura por
//     debajo del 50 %). La página se añade al evento de B21 (b21_arceus); capturado, la cima queda vacía.
//   · El nodo de la antecámara abre la Red de Convergencia (b22a_red.js) y los peldaños de nube bajan a la Cumbre Azur.
import { F, V, SPRITE, OBJ, GOLD, isPostgame, arceusReady, legendReady, zygardeSays, pause, eventById, fadeEvent } from './b22a_common.js';
import { COLUMNA_TEXT } from './b22a_texts.js';
import { COLUMNA_B22A } from '../maps/b22a/layout.js';
import { OTHER, NAMES, ORB_OF_UNCHOSEN, ORB_NAMES, unchosenRequest, arceusRematchRequest, legendBattle } from './b22a_legends.js';
import { columnaNodePage } from './b22a_red.js';
import { columnaStairEvents } from './b22a_senda.js';

const COLORS = Object.freeze({ DIALGA: [118, 172, 255], PALKIA: [222, 128, 255] });

/** Elección del P9 (el elegido) o null. Puro. */
export function p9Choice(state) {
  const v = String(state?.var?.(V.p9Choice, '') || '').toUpperCase();
  return v === 'DIALGA' || v === 'PALKIA' ? v : null;
}

/**
 * Estado de la plataforma del no elegido. Puro. → 'none' (sin elección) | 'noOrb' | 'notCaught' (el elegido sigue en
 * la Cámara) | 'notInParty' | 'ready' | 'resting' | 'caught'.
 */
export function platformState(state) {
  const choice = p9Choice(state);
  if (!choice) return 'none';
  if (state.flag(F.otroCaught)) return 'caught';
  if (!state.hasItem?.(ORB_OF_UNCHOSEN[choice])) return 'noOrb';
  if (state.var(V.p9Caught, false) !== true && !(state.party || []).some((p) => p.species === choice)) return 'notCaught';
  if (!(state.party || []).some((p) => p.species === choice && !p.egg)) return 'notInParty';
  return legendReady(state, 'otro') ? 'ready' : 'resting';
}

// ───────────────────────────── el no elegido ─────────────────────────────

async function unchosenFight(ctx, choice) {
  const other = OTHER[choice];
  const n = NAMES[other];
  if (!(await ctx.confirm(COLUMNA_TEXT.ready(n)))) return;
  ctx.cry?.(other);
  await legendBattle(ctx, 'otro', unchosenRequest(choice), {
    name: n, retry: null, loseText: COLUMNA_TEXT.lose,
    caughtText: COLUMNA_TEXT.caught(n), faintedText: COLUMNA_TEXT.fainted(n),
  });
}

/** Rugido, temblor y aparición (CAMPANA B22) y combate. */
async function summonScene(ctx, choice, ev) {
  const other = OTHER[choice];
  const orb = ORB_NAMES[ORB_OF_UNCHOSEN[choice]];
  await ctx.say(COLUMNA_TEXT.summon(NAMES[choice], orb));
  ctx.cry?.(choice);
  await pause(ctx, 20);
  ctx.se?.(other === 'DIALGA' ? 'PRSFX- Roar of Time' : 'PRSFX- Spacial Rend', { volume: 75 });
  ctx.shake?.(6, 7, 40);
  await ctx.say(COLUMNA_TEXT.roar);
  await ctx.flash?.(COLORS[other], 24, 200);
  ctx.setFlag(F.otroVisto);
  ctx.requestRefresh?.();
  await pause(ctx, 4);
  const legend = eventById(ctx, `b22a_no_elegido_${other.toLowerCase()}`) || ev;
  if (legend && legend !== ev) { legend.opacity = 0; await fadeEvent(ctx, legend, 255, 24); }
  ctx.cry?.(other);
  await ctx.say(COLUMNA_TEXT.appear(NAMES[other]));
  await zygardeSays(ctx, COLUMNA_TEXT.zygarde);
  await unchosenFight(ctx, choice);
}

async function platformScript(ctx) {
  const st = platformState(ctx.state);
  const choice = p9Choice(ctx.state);
  if (st === 'none') { await ctx.say(COLUMNA_TEXT.platformCold); return; }
  if (st === 'caught') { await ctx.say(COLUMNA_TEXT.platformEmpty); return; }
  const orb = ORB_NAMES[ORB_OF_UNCHOSEN[choice]];
  if (st === 'noOrb') { await ctx.say(COLUMNA_TEXT.platformNoOrb); return; }
  if (st === 'notCaught' || st === 'notInParty') {
    await ctx.say(COLUMNA_TEXT.platformNoChosen(NAMES[choice], orb));
    await ctx.say(st === 'notCaught' ? COLUMNA_TEXT.platformHintCruce(NAMES[choice]) : COLUMNA_TEXT.platformHintCaught(NAMES[choice]));
    return;
  }
  if (st === 'resting') { await ctx.say(COLUMNA_TEXT.platformCold); return; }
  if (!ctx.flag(F.otroVisto)) { await summonScene(ctx, choice, ctx.event); return; }
  await unchosenFight(ctx, choice);
}

/** Hexágono de la plataforma (se usa mirándolo) y el no elegido encima cuando está en su sitio. */
function platformEvents() {
  const out = [];
  for (const chosen of ['DIALGA', 'PALKIA']) {
    const other = OTHER[chosen];
    const at = COLUMNA_B22A.platform[other];
    const mine = (s) => isPostgame(s) && p9Choice(s) === chosen;
    out.push({
      id: `b22a_plataforma_${other.toLowerCase()}`, x: at.x, y: at.y, name: 'Plataforma',
      pages: [
        {
          when: mine, sprite: OBJ.objetos, dir: 6, directionFix: true, walkAnime: false, stepAnime: true, speed: 1, shadow: false,
          solid: true, trigger: 'action', script: platformScript,
          glow: { name: 'softLight', radius: 44, intensity: 0.3, pulse: 0.4, color: [...COLORS[other]] },
        },
        // Con el no elegido encima, el hexágono lo lleva su evento (mismo guion).
        { when: (s) => mine(s) && s.flag(F.otroVisto) && platformState(s) === 'ready', solid: true, trigger: 'action', script: platformScript },
      ],
    });
    out.push({
      id: `b22a_no_elegido_${other.toLowerCase()}`, x: at.x, y: at.y, name: NAMES[other],
      pages: [{
        when: (s) => mine(s) && s.flag(F.otroVisto) && platformState(s) === 'ready',
        sprite: SPRITE[other.toLowerCase()], dir: 2, stepAnime: true, speed: 2, directionFix: true, through: true,
        light: { radius: 80, intensity: 0.8 },
      }],
    });
  }
  return out;
}

// ───────────────────────────── Arceus ─────────────────────────────

async function arceusRematch(ctx) {
  await ctx.say(COLUMNA_TEXT.arceusReady);
  ctx.cry?.('ARCEUS');
  await ctx.say(COLUMNA_TEXT.arceusQuestion, { speaker: 'Arceus' });
  await ctx.say(COLUMNA_TEXT.arceusRule);
  if (!(await ctx.confirm(COLUMNA_TEXT.arceusAsk))) return;
  const glow = ctx.effect?.('softLight', { x: 14, y: 7, radius: 120, intensity: 0.7, pulse: 0.3, color: [...GOLD], fadeIn: 20 });
  await pause(ctx, 20);
  glow?.remove?.(20);
  await legendBattle(ctx, 'arceus', arceusRematchRequest(ctx.db), {
    retry: null, loseText: COLUMNA_TEXT.arceusLose,
    caughtText: COLUMNA_TEXT.arceusCaught, faintedText: COLUMNA_TEXT.arceusFainted,
  });
}

/**
 * Páginas añadidas al evento de Arceus de B21: tras descansar después del final vuelve a medir; capturado (en el final o
 * aquí), la cima queda vacía. Mientras espera el descanso manda la página de vigilia de B21.
 */
export function arceusPages() {
  return [
    { when: arceusReady, sprite: 'ARCEUS', dir: 2, directionFix: true, walkAnime: false, stepAnime: true, trigger: 'action', script: arceusRematch },
    { when: (s) => isPostgame(s) && s.flag(F.arceusCaught) },
  ];
}

// ───────────────────────────── envoltorio del mapa ─────────────────────────────

/**
 * Envoltorio aditivo de los eventos de Columna Lanza (columna_lanza.js): páginas nuevas para Arceus y para el nodo (la
 * Red) y los eventos del postgame (plataformas del no elegido y peldaños de nube). Fuera del postgame nada cambia.
 */
export function b22aColumnaEvents(events) {
  const out = events.map((ev) => {
    if (ev.id === 'b21_arceus' && Array.isArray(ev.pages)) return { ...ev, pages: [...ev.pages, ...arceusPages()] };
    if (ev.id === 'b21_nodo_columna' && Array.isArray(ev.pages)) return { ...ev, pages: [...ev.pages, columnaNodePage()] };
    return ev;
  });
  return [...out, ...platformEvents(), ...columnaStairEvents()];
}
