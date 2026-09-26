// Los tres tramos de la Calzada del Rey en el juego (docs/TABLILLAS.md T15: «estabilizar los tramos con la
// Reconstrucción auténtica en tres puntos»; reglas puras en b19_spans_logic.js):
//   · Cada piedra forzada es un evento que flota sobre el vacío (hoja b19_piedra.png) y, mientras está en pie, escribe
//     un «suelo invisible» en la capa 2 (se pisa). Al pisar otra casilla, la anterior se agrieta y cae (máscara de
//     caídas en la variable del tramo).
//   · Si el jugador se queda sin piedra delante, el tramo se hunde: una red de hexágonos lo sostiene y lo devuelve al borde (narración); el trozo
//     del Resonador vuelve a alzar las piedras (tramos reiniciables). Volver al borde también las reinicia.
//   · Con todas caídas menos la que se pisa, junto a la aguja, la aguja despierta: A → la Reconstrucción alza la Calzada
//     de verdad (parche persistente de calzada_patch.js) y el tramo queda estabilizado (flag b19_tramo_<n>).
import {
  SPAN_DEFS, cellsOf, spanDef, spanFlag, spanMaskVar, spanFootVar, isFallen, withFallen, isGoal, isStranded,
  stoneAt, inSpanBox,
} from './b19_spans_logic.js';
import { spanPatch } from '../maps/b19/calzada_patch.js';
import { PASS_TILE, VOID_BLOCK } from '../maps/b19/tiles.js';
import { F, V, OBJ, pause, placePlayer, fx } from './b19_common.js';
import { FIELD_TEXT } from '../zygarde/texts.js';

/** Variable «la aguja está lista» (el jugador está en la meta del tramo). */
export const spanReadyVar = (n) => `b19_tramo_${n}_listo`;

export const SPAN_TEXT = Object.freeze({
  needle: 'Una aguja de roca sube desde el fondo de la Sima. En su cima hay un zócalo hexagonal, gastado y agrietado.',
  needleLeft: 'Aún quedan piedras forzadas en el aire. La Calzada de verdad no encaja mientras sigan ahí.',
  needleIdle: 'La Calzada de verdad está debajo, entera. Primero hay que quitar de en medio las piedras forzadas.',
  needleReady: 'La aguja brilla en verde. Ya no queda ninguna piedra forzada en el aire.',
  ask: '¿Alzar la Calzada del Rey?',
  rebuilt: 'Las losas de la Calzada suben desde la Sima y encajan una tras otra. Esta vez, se quedan.',
  collapse: '¡La losa se parte bajo tus pies!',
  // Zygarde habla muy poco (autor, 25-09-2026): el rescate y la regla del hundimiento son narración neutra.
  collapseFirst: [
    'Una red de hexágonos verdes te sujeta sobre el vacío y te deja otra vez en el borde.',
    'Sin ninguna piedra delante, el tramo entero se hunde. Hay que empezar otra vez desde el borde.',
  ],
  collapseAgain: 'La red de hexágonos verdes te devuelve al borde.',
  reraise: 'Al volver al borde, el trozo del Resonador vuelve a alzar las piedras que habían caído.',
  readyFirst: 'La aguja de roca se enciende en verde.',
  before: 'Una aguja de roca sube desde el fondo de la Sima. Entre ella y la orilla no hay más que vacío.',
});

const PAGE_BASE = Object.freeze({ through: true, lock: false, directionFix: true, walkAnime: false });
const inFootprint = (def, x, y) => x >= def.road.x0 && x <= def.road.x1 && y >= def.road.y0 && y <= def.road.y1;

const mask = (s, n) => Number(s?.var?.(spanMaskVar(n), 0)) || 0;
const foot = (s, n) => {
  const v = s?.var?.(spanFootVar(n), -1);
  return Number.isInteger(v) ? v : -1;
};
const forcing = (s, n) => Boolean(s) && s.flag(F.p9) && !s.flag(spanFlag(n));

/** Pone el tramo como al principio (todas las piedras en pie, nadie encima). */
export function resetSpan(state, n) {
  state.setVar(spanMaskVar(n), 0);
  state.setVar(spanFootVar(n), -1);
  state.setVar(spanReadyVar(n), 0);
}

/** Al entrar en el mapa: los tramos a medias donde no está el jugador vuelven a su estado inicial. */
export function resetIdleSpans(state, px, py) {
  for (const d of SPAN_DEFS) {
    if (state.flag(spanFlag(d.n))) continue;
    if (stoneAt(d.n, px, py) >= 0) continue;
    resetSpan(state, d.n);
  }
}

// ───────────────────────────── Animaciones ─────────────────────────────

/** La piedra `i` del tramo se agrieta y cae a la Sima (visual con un evento temporal; ~10 fotogramas). */
async function dropStone(ctx, n, i) {
  const s = cellsOf(n).stones[i];
  const world = ctx.world;
  ctx.se?.('Rock Smash', { volume: 55 });
  if (!s || typeof world?.spawnEvent !== 'function') return;
  const ev = world.spawnEvent({ id: `__cae_${n}_${i}`, x: s.x, y: s.y, sprite: OBJ.stone, dir: 4, through: true, directionFix: true, walkAnime: false });
  if (!ev) return;
  ev.lockPattern = true;
  for (let f = 0; f < 10; f++) {
    ev.pattern = Math.min(3, Math.floor(f / 2.5));
    ev.yOffset = -Math.round(f * f * 0.5);
    ev.opacity = Math.round(255 * (1 - f / 10));
    await ctx.wait(1);
  }
  world.removeEvent(ev);
}

/**
 * La Reconstrucción alza la Calzada de verdad: las losas suben por filas desde la orilla (varias a la vez) con
 * hexágonos verdes y quedan escritas en el mapa (la página «estabilizado» de la aguja las vuelve a aplicar al cargar).
 */
export async function raiseCalzada(ctx, tiles) {
  const world = ctx.world;
  ctx.se?.('PRSFX- Stealth Rocks');
  const glow = fx(ctx, 'zygardeRebuild', { tiles });
  ctx.shake?.(3, 5, 30);
  await ctx.flash?.([120, 255, 150], 14, 90);
  const rows = [];
  for (let i = 0; i < tiles.length; i += 3) rows.push(tiles.slice(i, i + 3));
  for (const row of rows) {
    const rising = [];
    for (const [x, y, layer, id] of row) {
      if (id >= 384 && typeof world?.spawnEvent === 'function') {
        const stone = world.spawnEvent({ id: `__losa_${x}_${y}`, x, y, tileId: id, through: true });
        if (stone) { stone.yOffset = 22; stone.opacity = 0; rising.push([stone, x, y, layer, id]); continue; }
      }
      ctx.setTile(x, y, layer, id);
    }
    const burst = rising.length ? fx(ctx, 'zygardeHexBurst', { x: row[1]?.[0] ?? row[0][0], y: row[0][1], mode: 'out', count: 6 }) : null;
    for (let f = 1; f <= 8; f++) {
      const k = f / 8;
      for (const [stone] of rising) { stone.yOffset = Math.round(22 * (1 - k) * (1 - k)); stone.opacity = Math.min(255, Math.round(255 * k * 1.4)); }
      await ctx.wait(1);
    }
    for (const [stone, x, y, layer, id] of rising) { ctx.setTile(x, y, layer, id); world.removeEvent(stone); }
    burst?.remove?.(10);
    ctx.se?.('Rock Smash', { volume: 35 });
    await ctx.wait(2);
  }
  glow?.remove?.(30);
}

// ───────────────────────────── Guiones ─────────────────────────────

/** Se hunde el tramo: Zygarde sostiene al jugador y lo devuelve al borde; el Resonador vuelve a alzar las piedras. */
async function collapse(ctx, n) {
  const f = foot(ctx.state, n);
  ctx.shake?.(5, 8, 20);
  if (f >= 0) await dropStone(ctx, n, f);
  await ctx.say(SPAN_TEXT.collapse);
  ctx.se?.('core_signal', { volume: 60 });
  await ctx.fade('out', 16, [40, 110, 60]);
  resetSpan(ctx.state, n);
  ctx.setVar(V.collapses, (Number(ctx.var(V.collapses, 0)) || 0) + 1);
  ctx.requestRefresh?.();
  await placePlayer(ctx, spanDef(n).start);
  await pause(ctx, 8);
  await ctx.fade('in', 16);
  if (!ctx.flag(F.firstCollapse)) {
    ctx.setFlag(F.firstCollapse);
    for (const t of SPAN_TEXT.collapseFirst) await ctx.say(t);
  } else {
    await ctx.say(SPAN_TEXT.collapseAgain);
  }
}

/** Al pisar la piedra `i`: cae la anterior; se comprueba si el jugador ha quedado sin salida o en la meta. */
export async function onStone(ctx, n, i) {
  const st = ctx.state;
  if (!forcing(st, n)) return;
  const prev = foot(st, n);
  let m = mask(st, n);
  if (prev === i) return;
  if (prev >= 0) {
    m = withFallen(m, prev);
    st.setVar(spanMaskVar(n), m);
    ctx.requestRefresh?.();
    await dropStone(ctx, n, prev);
  }
  st.setVar(spanFootVar(n), i);
  const { x, y } = ctx.player;
  if (isGoal(n, m, x, y)) {
    st.setVar(spanReadyVar(n), 1);
    ctx.requestRefresh?.();
    ctx.se?.('core_signal', { volume: 70 });
    await ctx.say(SPAN_TEXT.readyFirst);
    return;
  }
  if (isStranded(n, m, x, y)) await collapse(ctx, n);
}

/** Al volver a la orilla del tramo: cae la piedra de la que se viene y, si faltaba alguna, se vuelven a alzar. */
export async function onEdge(ctx, n) {
  const st = ctx.state;
  if (!forcing(st, n)) return;
  const prev = foot(st, n);
  let m = mask(st, n);
  if (prev >= 0) {
    m = withFallen(m, prev);
    await dropStone(ctx, n, prev);
  }
  st.setVar(spanFootVar(n), -1);
  if (!m) return;
  resetSpan(st, n);
  ctx.requestRefresh?.();
  ctx.se?.('PRSFX- Stealth Rocks', { volume: 50 });
  await ctx.flash?.([200, 120, 255], 10, 70);
  await ctx.say(SPAN_TEXT.reraise);
}

/** A ante la aguja: si el tramo está en su meta, la Reconstrucción alza la Calzada de verdad. */
export async function useNeedle(ctx, n, onRebuilt = null) {
  const st = ctx.state;
  const { x, y } = ctx.player;
  const m = mask(st, n);
  if (!isGoal(n, m, x, y)) {
    await ctx.say(SPAN_TEXT.needle);
    await ctx.say(foot(st, n) >= 0 || m ? SPAN_TEXT.needleLeft : SPAN_TEXT.needleIdle);
    return false;
  }
  await ctx.say(SPAN_TEXT.needleReady);
  if (!ctx.zygarde('rebuild')) { await ctx.say(FIELD_TEXT.rebuildBlocked); return false; }
  if ((await ctx.choice(['Sí', 'No'], { message: SPAN_TEXT.ask, cancel: 1 })) !== 0) return false;
  await raiseCalzada(ctx, spanPatch(n));
  ctx.setFlag(spanFlag(n));
  resetSpan(st, n);
  ctx.requestRefresh?.();
  await ctx.say(SPAN_TEXT.rebuilt);
  if (typeof onRebuilt === 'function') await onRebuilt(ctx, n);
  return true;
}

// ───────────────────────────── Eventos ─────────────────────────────

function stoneEvents(n) {
  const def = spanDef(n);
  return cellsOf(n).stones.map((s) => {
    const inside = inFootprint(def, s.x, s.y);
    return {
      id: `tramo_${n}_piedra_${s.i}`, x: s.x, y: s.y, name: 'Piedra forzada',
      pages: [
        { ...PAGE_BASE, when: (st) => forcing(st, n) && isFallen(mask(st, n), s.i), patch: [[s.x, s.y, 2, VOID_BLOCK]] },
        {
          ...PAGE_BASE, when: (st) => forcing(st, n) && !isFallen(mask(st, n), s.i),
          sprite: OBJ.stone, dir: 2, stepAnime: true, speed: 2, pattern: s.i % 4, shadow: false,
          patch: [[s.x, s.y, 2, PASS_TILE]], trigger: 'touch', script: (ctx) => onStone(ctx, n, s.i),
        },
        { ...PAGE_BASE, when: (st) => Boolean(st?.flag(spanFlag(n))), ...(inside ? {} : { patch: [[s.x, s.y, 2, VOID_BLOCK]] }) },
      ],
    };
  });
}

function edgeEvents(n) {
  return spanDef(n).near.map(([x, y], k) => ({
    id: `tramo_${n}_borde_${k}`, x, y,
    pages: [{ ...PAGE_BASE, when: (st) => forcing(st, n), trigger: 'touch', script: (ctx) => onEdge(ctx, n) }],
  }));
}

function needleEvent(n, onRebuilt) {
  const p = cellsOf(n).pinnacle;
  const base = { sprite: OBJ.needle, directionFix: true, walkAnime: false, solid: true, noOver: true, shadow: false, trigger: 'action' };
  const ready = (st) => Number(st?.var?.(spanReadyVar(n), 0)) === 1;
  return {
    id: `tramo_${n}_aguja`, x: p.x, y: p.y, name: 'Aguja de la Calzada',
    pages: [
      { ...base, when: (st) => Boolean(st) && !st.flag(F.p9) && !st.flag(spanFlag(n)), dir: 2, script: async (ctx) => { await ctx.say(SPAN_TEXT.before); } },
      { ...base, when: (st) => forcing(st, n) && !ready(st), dir: 2, script: (ctx) => useNeedle(ctx, n, onRebuilt) },
      { ...base, when: (st) => forcing(st, n) && ready(st), dir: 4, stepAnime: true, speed: 3, light: { radius: 56, intensity: 0.8 }, script: (ctx) => useNeedle(ctx, n, onRebuilt) },
      { when: (st) => Boolean(st?.flag(spanFlag(n))), through: true, patch: spanPatch(n) },
    ],
  };
}

/** Todos los eventos de los tres tramos. `onRebuilt(ctx, n)` = escena del bloque tras alzar cada tramo. */
export function spanEvents({ onRebuilt = null } = {}) {
  return SPAN_DEFS.flatMap((d) => [...stoneEvents(d.n), ...edgeEvents(d.n), needleEvent(d.n, onRebuilt)]);
}

export { inSpanBox };
