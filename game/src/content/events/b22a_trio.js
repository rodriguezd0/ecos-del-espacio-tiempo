// El trío del Alma en el postgame (docs/CAMPANA.md B22; reencuentros «distintos de las pruebas» de B16), nivel 70, en
// sus alas del Santuario del Alma (mapa de B16; añadidos solo en el postgame):
//   · Uxie (Ala del Saber) — requisito: las quince Crónicas en la Libreta. «Última pregunta» sobre el propio viaje (a
//     quién ató el jugador en el Cruce; si no hay elección, qué le dijo a Mesprit): la respuesta verdadera abre el
//     combate; otra no castiga (se puede volver a responder).
//   · Mesprit (Ala del Sentir) — visible, se mueve por los espejos: en las tres salas de espejos su reflejo pasea por el
//     lado del cristal; cuando el reflejo del jugador (que se mueve invertido, como en B16) lo toca, empieza el combate.
//   · Azelf (Ala del Querer) — combate con objetos permitidos (sin el sello de la Mochila de B16).
// Capturados, desaparecen; debilitados, vuelven al descansar (rest_count). Perder cura y se les vuelve a hablar.
import { F, V, SPEAKER, SPRITE, isPostgame, legendReady, lines, eventById } from './b22a_common.js';
import { TRIO_TEXT } from './b22a_texts.js';
import { trioRequest, legendBattle } from './b22a_legends.js';
import { hasAllCampaignTablets } from '../story/tablets.js';
import { MIRROR_ROOMS, MIRROR_DIR, MIRROR_X, ROOM_W, ROOM_H, mirrorX } from './b16_mirror_logic.js';
import { SENTIR, floorTop, mirrorCell } from '../maps/b16/santuario_layout.js';
import { MESPRIT_ANSWERS } from './b16_common.js';

const ready = (key) => (s) => isPostgame(s) && legendReady(s, key);

async function trioFight(ctx, key, name) {
  ctx.cry?.(key.toUpperCase());
  await legendBattle(ctx, key, trioRequest(key), {
    name, retry: null, loseText: TRIO_TEXT.lose(name), caughtText: TRIO_TEXT.caught(name), faintedText: TRIO_TEXT.fainted(name),
  });
}

// ───────────────────────────── Uxie ─────────────────────────────

/**
 * La última pregunta de Uxie, según lo vivido (puro): { text, options: [etiquetas], answer: índice correcto } o null si
 * no hay nada que preguntar (partida sin elección del P9 ni respuesta a Mesprit).
 */
export function uxieQuestion(state) {
  const choice = String(state?.var?.(V.p9Choice, '') || '').toUpperCase();
  if (choice === 'DIALGA' || choice === 'PALKIA') {
    return { text: TRIO_TEXT.uxieQuestionCruce, options: ['Dialga', 'Palkia', TRIO_TEXT.uxieDontKnow], answer: choice === 'DIALGA' ? 0 : 1 };
  }
  const said = state?.var?.(V.mespritAnswer, null);
  const i = MESPRIT_ANSWERS.findIndex((a) => a.id === said);
  if (i >= 0) return { text: TRIO_TEXT.uxieQuestionMesprit, options: [...MESPRIT_ANSWERS.map((a) => a.text), TRIO_TEXT.uxieDontKnow], answer: i };
  return null;
}

async function uxieScript(ctx) {
  const U = SPEAKER.uxie;
  ctx.cry?.('UXIE');
  if (!hasAllCampaignTablets(ctx.state)) { await ctx.say(TRIO_TEXT.uxieNoChronicles, { speaker: U }); return; }
  await lines(ctx, U, TRIO_TEXT.uxieIntro);
  const q = uxieQuestion(ctx.state);
  if (q) {
    const i = await ctx.choice(q.options, { message: q.text, cancel: q.options.length - 1 });
    if (i !== q.answer) {
      ctx.setVar(V.uxieTries, (Number(ctx.var(V.uxieTries, 0)) || 0) + 1);
      await ctx.say(i === q.options.length - 1 ? TRIO_TEXT.uxieForgot : TRIO_TEXT.uxieWrong, { speaker: U });
      return;
    }
  }
  await lines(ctx, U, TRIO_TEXT.uxieRight);
  if (!(await ctx.confirm(TRIO_TEXT.ready('Uxie')))) return;
  await trioFight(ctx, 'uxie', 'Uxie');
}

// ───────────────────────────── Azelf ─────────────────────────────

async function azelfScript(ctx) {
  ctx.cry?.('AZELF');
  await lines(ctx, SPEAKER.azelf, TRIO_TEXT.azelfIntro);
  if (!(await ctx.confirm(TRIO_TEXT.azelfAsk))) return;
  await trioFight(ctx, 'azelf', 'Azelf');
}

// ───────────────────────────── Mesprit en los espejos ─────────────────────────────

/** Casilla de rejilla (gx, gy) de una casilla del mapa dentro de la sala de espejos, o null. */
function toGrid(m, x, y) {
  const gx = x - m.room.x;
  const gy = y - floorTop(m.room);
  return gx >= 0 && gy >= 0 && gx < ROOM_W && gy < ROOM_H ? { gx, gy } : null;
}

/** ¿Puede estar el reflejo de Mesprit en (x, y)? Lado del reflejo de la sala `n`, sin obstáculos. Puro. */
export function mespritCellOk(m, x, y) {
  const g = toGrid(m, x, y);
  if (!g || g.gx <= MIRROR_X) return false;
  return !MIRROR_ROOMS[m.n - 1].blocked(g.gx, g.gy);
}

/** ¿Se tocan el reflejo del jugador y el de Mesprit? (misma casilla o vecinas). Pura. */
export const reflectionsTouch = (a, b) => Boolean(a && b) && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;

function placeReflection(ev, m, px, py) {
  const g = toGrid(m, px, py);
  if (!g) return;
  const c = mirrorCell(m.room, mirrorX(g.gx), g.gy);
  ev.moveTo(c.x, c.y);
  ev.direction = 8;
}

async function mespritTouched(ctx) {
  if (!ctx.flag(F.mespritEspejos)) ctx.setFlag(F.mespritEspejos);
  ctx.se?.('PRSFX- Mirror Coat');
  await ctx.flash?.([255, 190, 214], 20, 170);
  await ctx.say(TRIO_TEXT.mespritTouch);
  await trioFight(ctx, 'mesprit', 'Mesprit');
}

/**
 * Guion paralelo de cada sala de espejos (postgame): el reflejo del jugador sigue sus pasos invertido (como en B16) y,
 * si toca al reflejo de Mesprit (que pasea por el lado del cristal), empieza el combate.
 */
function mirrorMonitor(m) {
  return async (ctx) => {
    const ev = ctx.event;
    const p = ctx.player;
    if (!ev || !p) return;
    const st = ev.b22a || (ev.b22a = { inside: false, last: null, pending: null, busy: false });
    const g = toGrid(m, p.x, p.y);
    const inside = Boolean(g && g.gx < MIRROR_X);
    if (!inside) { st.inside = false; return; }
    if (!st.inside) {
      st.inside = true;
      st.last = [p.x, p.y];
      st.pending = null;
      placeReflection(ev, m, p.x, p.y);
      if (!ctx.flag('b22a_mesprit_aviso')) {
        ctx.setFlag('b22a_mesprit_aviso');
        ctx.scene?.runScript?.(async (c) => {
          await c.say(TRIO_TEXT.mespritIntro);
          await c.say(TRIO_TEXT.mespritSays, { speaker: SPEAKER.mesprit });
        }, ev, 'mesprit_aviso');
      }
      return;
    }
    const dx = p.x - st.last[0];
    const dy = p.y - st.last[1];
    if (dx || dy) {
      st.last = [p.x, p.y];
      if (Math.abs(dx) + Math.abs(dy) === 1) st.pending = MIRROR_DIR[dx === 1 ? 6 : dx === -1 ? 4 : dy === 1 ? 2 : 8];
      else { st.pending = null; placeReflection(ev, m, p.x, p.y); }
    }
    if (st.pending && !ev.busy()) {
      ev.setMoveSpeed(p.moveSpeed);
      ev.moveGeneric(st.pending);
      st.pending = null;
    }
    if (ev.busy() || st.busy || ctx.world?.scriptBusy?.()) return;
    const mes = eventById(ctx, `b22a_mesprit_espejo_${m.n}`);
    if (!mes?.page || mes.busy()) return;
    if (reflectionsTouch(ev, mes)) {
      st.busy = true;
      ctx.scene?.runScript?.(async (c) => {
        try { await mespritTouched(c); } finally { st.busy = false; }
      }, mes, `mesprit_espejo_${m.n}`);
    }
  };
}

function mirrorEvents(m) {
  const logic = MIRROR_ROOMS[m.n - 1];
  const target = mirrorCell(m.room, ...logic.target);
  const start = mirrorCell(m.room, ...logic.reflection);
  // Solo con la sala resuelta en B16 (su reflejo ya no está): en una partida real del postgame, siempre.
  const on = (s) => ready('mesprit')(s) && s.flag(`b16_sentir_espejo_${m.n}`);
  const monitor = mirrorMonitor(m);
  return [
    {
      id: `b22a_reflejo_${m.n}`, x: start.x, y: start.y, name: 'Reflejo',
      pages: [
        { when: (s) => on(s) && s.player.gender !== 'F', sprite: SPRITE.protagonistM, dir: 8, opacity: 170, trigger: 'parallel', script: monitor, lock: false },
        { when: (s) => on(s) && s.player.gender === 'F', sprite: SPRITE.protagonistF, dir: 8, opacity: 170, trigger: 'parallel', script: monitor, lock: false },
      ],
    },
    {
      id: `b22a_mesprit_espejo_${m.n}`, x: target.x, y: target.y, name: 'Mesprit',
      pages: [{
        when: on, sprite: SPRITE.mesprit, dir: 2, opacity: 210, through: true, stepAnime: true, move: { wander: 3 }, freq: 3, speed: 3,
        restrictTo: (x, y) => mespritCellOk(m, x, y),
        glow: { name: 'softLight', radius: 34, intensity: 0.5, pulse: 0.6, color: [255, 150, 196] },
      }],
    },
  ];
}

// ───────────────────────────── envoltorio del mapa ─────────────────────────────

/** Páginas añadidas a Uxie, Mesprit y Azelf de B16 (postgame): el reencuentro, o su ausencia. */
function trioPages(id) {
  const empty = { when: (s) => isPostgame(s) };
  if (id === 'uxie') return [empty, { when: ready('uxie'), sprite: SPRITE.uxie, dir: 2, move: 'still', stepAnime: true, solid: true, trigger: 'action', script: uxieScript }];
  if (id === 'azelf') return [empty, { when: ready('azelf'), sprite: SPRITE.azelf, dir: 2, move: 'still', stepAnime: true, solid: true, trigger: 'action', script: azelfScript }];
  if (id === 'mesprit') return [empty]; // en el postgame, Mesprit está en los espejos
  return [];
}

/** Envoltorio aditivo de los eventos del Santuario del Alma (santuario_alma.js). Fuera del postgame nada cambia. */
export function b22aSantuarioEvents(events) {
  const out = events.map((ev) => {
    if (!['uxie', 'mesprit', 'azelf'].includes(ev.id) || !Array.isArray(ev.pages)) return ev;
    return { ...ev, pages: [...ev.pages, ...trioPages(ev.id)] };
  });
  return [...out, ...SENTIR.mirrors.flatMap(mirrorEvents)];
}
