// Eventos de las caras que giran (docs/CAMPANA.md B22: «Fijar tres "caras" con el Anclaje»). Reglas puras en
// b22a_faces_logic.js. Cada cara es:
//   · nueve eventos-casilla (centro y dos por brazo): mientras gira, el dibujo es solo un reflejo sobre el vacío (sprite
//     translúcido que mueve el rotor; la casilla sigue siendo vacío y quien la pisa cae al último poste, sin daño);
//     anclada, las casillas de su dibujo llevan la losa (sprite) y un tile transparente y pasable en la capa 1 (dejan de
//     ser vacío: world/impossible/logic.js#isVoidCell) y las demás vuelven al vacío (parches de página, persistentes);
//   · un rotor (evento paralelo de una sola página) que cuenta fotogramas y enseña la orientación del momento;
//   · postes con el nudo tallado en las islas de al lado: con A, la losa se detiene un instante y Zygarde la ancla tal
//     como está (useAnchor → spatialAnchor), o la suelta si ya estaba anclada.
import { OBJ, pause, eventById } from './b22a_common.js';
import { DIST_TEXT } from './b22a_texts.js';
import { useAnchor } from './b22a_anchor.js';
import {
  faceCells, cellInPattern, anchoredOf, faceVar, rotorPhase, rotorWarning, orientationText,
} from './b22a_faces_logic.js';

/** Tile transparente y pasable de Cueva1 (tileset 14; el mismo que usa B20 como «suelo invisible»). */
export const FACE_PASS_TILE = 405;
/** Opacidad del reflejo de la losa (y la del parpadeo antes de girar). */
const GHOST = 170;
const GHOST_WARN = 80;

export const cellEventId = (face, c) => `b22a_cara_${face.id}_${c.key}`;
export const rotorEventId = (face) => `b22a_rotor_${face.id}`;

function cellEvent(face, c) {
  const center = c.side === null;
  const free = (s) => anchoredOf(s, face) === null;
  const inside = (s) => { const o = anchoredOf(s, face); return o !== null && cellInPattern(face, c, o); };
  const outside = (s) => { const o = anchoredOf(s, face); return o !== null && !cellInPattern(face, c, o); };
  const base = { directionFix: true, walkAnime: false, through: true, shadow: false };
  return {
    id: cellEventId(face, c), x: c.x, y: c.y, name: 'Losa',
    pages: [
      // Gira libre: reflejo (el rotor decide qué casillas se ven); la casilla es vacío.
      { ...base, when: free, sprite: OBJ.cara, dir: center ? 8 : 2, stepAnime: true, speed: 2, opacity: 0, patch: [[c.x, c.y, 1, 0]] },
      // Anclada sin esta casilla en el dibujo: vacío.
      { ...base, when: outside, patch: [[c.x, c.y, 1, 0]] },
      // Anclada con esta casilla en el dibujo: losa firme.
      { ...base, when: inside, sprite: OBJ.cara, dir: center ? 6 : 4, stepAnime: true, speed: 1, patch: [[c.x, c.y, 1, FACE_PASS_TILE]] },
    ],
  };
}

/**
 * Guion paralelo del rotor: cada fotograma avanza la cuenta (salvo mientras un poste la sujeta) y enseña el reflejo de
 * la orientación del momento; en los últimos fotogramas de cada orientación el reflejo parpadea. Anclada, no hace nada
 * (las páginas de las casillas ya pintan la losa). Una sola página: el motor no reinicia paralelos al cambiar de página.
 */
function rotorScript(face) {
  const cells = faceCells(face);
  return async (ctx) => {
    const ev = ctx.event;
    if (!ev) return;
    const st = ev.b22a || (ev.b22a = { t: 0, phase: 0, hold: false, cells: null });
    if (!st.cells) st.cells = cells.map((c) => ({ c, ev: ctx.world?.events?.find((e) => e.id === cellEventId(face, c)) || null }));
    if (anchoredOf(ctx.state, face) !== null) return;
    if (!st.hold) st.t += 1;
    const phase = rotorPhase(st.t);
    if (phase !== st.phase) {
      st.phase = phase;
      const p = ctx.player;
      if (p && Math.abs(p.x - face.cx) + Math.abs(p.y - face.cy) <= 7) ctx.se?.('PRSFX- Ominous Wind', { volume: 25 });
    }
    const blink = !st.hold && rotorWarning(st.t) && Math.floor(st.t / 4) % 2 === 0;
    for (const { c, ev: ce } of st.cells) {
      if (!ce || !ce.page) continue;
      ce.opacity = cellInPattern(face, c, phase) ? (blink ? GHOST_WARN : GHOST) : 0;
    }
  };
}

function rotorEvent(face) {
  return { id: rotorEventId(face), x: face.cx, y: face.cy, name: 'Rotor', through: true, pages: [{ trigger: 'parallel', lock: false, script: rotorScript(face) }] };
}

/** Orientación que enseña ahora el rotor de la cara (0 si no hay rotor vivo). */
export function currentPhase(ctx, face) {
  return eventById(ctx, rotorEventId(face))?.b22a?.phase ?? 0;
}

/** Sujeta (o suelta) el giro del rotor mientras se decide. */
function hold(ctx, face, on) {
  const r = eventById(ctx, rotorEventId(face));
  if (r?.b22a) r.b22a.hold = on;
}

/**
 * Poste del nudo: libre → la losa se detiene en la orientación que enseña y se pregunta si anclarla así (Anclaje
 * espacial); anclada → se puede soltar. `onChange(ctx)` se llama tras anclar o soltar (p. ej. el corazón).
 */
export async function postScript(ctx, face, { onChange = null } = {}) {
  const cur = anchoredOf(ctx.state, face);
  if (cur === null) {
    const phase = currentPhase(ctx, face);
    hold(ctx, face, true);
    try {
      ctx.se?.('PRSFX- Ally Switch', { volume: 50 });
      await ctx.say(DIST_TEXT.post);
      const i = await ctx.choice([...DIST_TEXT.postChoices], { message: DIST_TEXT.postAsk(orientationText(face, phase)), cancel: 1 });
      if (i !== 0) return false;
      const ok = await useAnchor(ctx, { onAnchor: (c) => { c.setVar(faceVar(face.id), phase); c.requestRefresh?.(); } });
      if (ok && typeof onChange === 'function') await onChange(ctx);
      return ok;
    } finally {
      hold(ctx, face, false);
    }
  }
  const i = await ctx.choice([...DIST_TEXT.releaseChoices], { message: DIST_TEXT.anchoredPost(orientationText(face, cur)), cancel: 1 });
  if (i !== 0) return false;
  ctx.se?.('PRSFX- Teleport', { volume: 40 });
  await ctx.flash?.([200, 150, 255], 10, 90);
  ctx.setVar(faceVar(face.id), null);
  ctx.requestRefresh?.();
  await pause(ctx, 6);
  await ctx.say(DIST_TEXT.released);
  if (typeof onChange === 'function') await onChange(ctx);
  return true;
}

/** Poste sólido del nudo de una cara (se usa mirándolo). Encendido mientras su cara está anclada. */
export function postEvent(face, post, index, opts = {}) {
  const script = (ctx) => postScript(ctx, face, opts);
  const base = { sprite: OBJ.poste, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script };
  return {
    id: `b22a_poste_${face.id}_${index}`, x: post.x, y: post.y, name: 'Poste del nudo',
    pages: [
      { ...base, dir: 2 },
      { ...base, when: (s) => anchoredOf(s, face) !== null, dir: 4, stepAnime: true, speed: 2, light: { radius: 48, intensity: 0.6 } },
    ],
  };
}

/** Todos los eventos de una cara: casillas, rotor y postes. */
export function faceEvents(face, posts = [], opts = {}) {
  return [
    ...faceCells(face).map((c) => cellEvent(face, c)),
    rotorEvent(face),
    ...posts.filter((p) => p.face === face.id).map((p, i) => postEvent(face, p, i, opts)),
  ];
}
