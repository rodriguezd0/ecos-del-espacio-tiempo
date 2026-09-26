// Ala del Querer — Azelf, la voluntad (docs/CAMPANA.md B16; D17; reglas puras en b16_wind_logic.js):
//   · Pasillo del viento: si el jugador se detiene fuera de una repisa, el viento de Azelf lo devuelve a la última
//     repisa que pisó (sin castigo). C099 en la repisa de arriba.
//   · Cámara de Azelf: combate contra Azelf nivel 58 SIN OBJETOS DE LA MOCHILA (la interfaz explica el sello antes y el
//     motor lo impone: rules.sealedBag), con estadísticas normales, sin equipo a 1 PS ni transformaciones. Al perder se
//     cura el equipo y se reintenta al momento. Premio: la Hebra del Querer.
import { F, V, SPEAKER, SPRITE, OBJ, TRIO_COLORS, lines } from './b16_common.js';
import { STILL_FRAMES, isFloor, isLedge, corridorPath, CORRIDOR_ROWS } from './b16_wind_logic.js';
import { QUERER, PATIO, floorTop, windCell } from '../maps/b16/santuario_layout.js';
import { AZELF_TRIAL } from '../encounters/b16.js';
import { bossBattle } from '../common/bossBattle.js';

const Wd = QUERER.wind;
const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });

export const QUERER_TEXT = Object.freeze({
  intro: 'Un pasillo en zigzag entre canales de luz azul. El aire empuja hacia atrás, hacia la entrada.',
  azelfIntro: 'Aquí no se descansa más que en las losas claras. Quien se para, vuelve atrás. Quien quiere, sigue.',
  pushed: 'El viento de Azelf te devuelve a la última losa clara.',
  seal: 'Azelf extiende una luz azul sobre tu Mochila: queda sellada durante el combate. No podrás usar ningún objeto.',
  sealRule: 'En este combate no se pueden usar objetos de la Mochila. Tus Pokémon lucharán con lo que llevan.',
  retry: 'Azelf espera, flotando. No se ha movido.',
});

// ─────────────────────────────── Pasillo del viento (evento paralelo) ───────────────────────────────

const local = (x, y) => ({ gx: x - Wd.room.x, gy: y - floorTop(Wd.room) });

async function pushBack(ctx, from, to) {
  const path = corridorPath(from.gx, from.gy, to.gx, to.gy);
  if (!path || !path.length) return;
  ctx.se('PRSFX- Gust');
  const gust = ctx.effect?.('softLight', { x: ctx.player.x, y: ctx.player.y, radius: 40, color: [...TRIO_COLORS.querer], intensity: 0.5, fadeIn: 4 });
  const face = ctx.player.direction;
  await ctx.move('player', ['direction_fix_on', ...path.map((d) => DIR_NAME[d]), 'direction_fix_off'], { through: true, speed: 5 });
  ctx.face('player', face);
  gust?.remove?.(20);
  if (!ctx.flag(F.windHint)) {
    ctx.setFlag(F.windHint);
    await ctx.say(QUERER_TEXT.pushed);
  }
}

/** Guion paralelo del pasillo: cuenta los fotogramas parado fuera de una repisa y empuja a la última. */
async function windMonitor(ctx) {
  const ev = ctx.event;
  const p = ctx.player;
  const st = ev.b16 || (ev.b16 = { ledge: null, still: 0, last: null });
  const { gx, gy } = local(p.x, p.y);
  if (!isFloor(gx, gy) || gy < 0 || gx < 0 || gy >= CORRIDOR_ROWS.length) { st.ledge = null; st.still = 0; return; }
  if (!st.ledge) st.ledge = { gx: Wd.entry.x - Wd.room.x, gy: Wd.entry.y - floorTop(Wd.room) };
  if (isLedge(gx, gy)) {
    st.ledge = { gx, gy };
    st.still = 0;
    if (gy === 0 && !ctx.flag(F.wind)) ctx.setFlag(F.wind);
    return;
  }
  const moved = !st.last || st.last[0] !== p.x || st.last[1] !== p.y;
  st.last = [p.x, p.y];
  const busy = ctx.world?.scriptBusy?.() && !ev.b16.pushing;
  if (moved || p.busy() || busy) { st.still = 0; return; }
  st.still += 1;
  if (st.still < STILL_FRAMES || st.pushing) return;
  st.pushing = true;
  st.still = 0;
  const to = st.ledge;
  ctx.scene?.runScript?.(async (c) => {
    try { await pushBack(c, { gx, gy }, to); } finally { st.pushing = false; st.last = null; }
  }, ev, 'viento_azelf');
}

function windEvents() {
  const out = [{
    id: 'viento_azelf', x: Wd.room.x, y: Wd.room.y,
    pages: [{ trigger: 'parallel', script: windMonitor, lock: false }],
  }, {
    id: 'querer_intro', x: Wd.entry.x, y: Wd.entry.y,
    pages: [{
      when: (s) => !s.flag('b16_querer_intro'), trigger: 'auto',
      script: async (ctx) => {
        ctx.setFlag('b16_querer_intro');
        await ctx.say(QUERER_TEXT.intro);
        await ctx.say(QUERER_TEXT.azelfIntro, { speaker: SPEAKER.azelf });
      },
    }],
  }];
  // Ráfagas visibles a lo largo de los carriles (decorado: soplan hacia la entrada)
  const gusts = [[2, 2, 6], [6, 4, 4], [3, 6, 6], [5, 8, 4], [2, 10, 6], [6, 12, 4], [4, 14, 6]];
  gusts.forEach(([gx, gy, dir], i) => {
    const c = windCell(gx, gy);
    out.push({ id: `rafaga_azelf_${i}`, x: c.x, y: c.y, sprite: OBJ.gust, dir, through: true, stepAnime: true, directionFix: true, opacity: 160 });
  });
  out.push({ id: 'celula_alma_3', type: 'zygardeCell', cell: 'cell_alma_3', x: QUERER.wind.cell.x, y: QUERER.wind.cell.y });
  return out;
}

// ─────────────────────────────── Azelf ───────────────────────────────

/** Petición del combate de Azelf (pura: la prueban los tests). */
export function azelfRequest() {
  return {
    type: 'wild',
    wild: { ...AZELF_TRIAL, moves: [...AZELF_TRIAL.moves], shiny: false },
    bgm: 'Legendario',
    rules: {
      canRun: false,
      canCatch: false,
      catchReason: 'Azelf no se deja atrapar: esto es una prueba, no una caza.',
      sealedBag: 'El sello de Azelf no deja abrir la Mochila.',
    },
  };
}

async function azelfBattle(ctx) {
  const A = SPEAKER.azelf;
  ctx.cry('AZELF');
  if (!ctx.flag(F.azelfWarned)) {
    await lines(ctx, A, [
      'Has llegado sin pararte. Bien. Querer es eso.',
      'Ahora, sin ayudas. Solo tú y los que te acompañan.',
    ]);
    ctx.se('PRSFX- Psych Up');
    await ctx.flash([...TRIO_COLORS.querer], 16, 140);
    await ctx.say(QUERER_TEXT.seal);
    await ctx.say(QUERER_TEXT.sealRule);
    ctx.setFlag(F.azelfWarned);
  }
  for (;;) {
    if (!(await ctx.confirm('¿Empezar el combate contra Azelf?'))) return;
    const outcome = await bossBattle(ctx, azelfRequest(), null, {
      onLose: (c) => c.setVar(V.azelfTries, c.var(V.azelfTries, 0) + 1),
      loseText: QUERER_TEXT.retry,
    });
    if (outcome === 'win' || outcome === 'caught') break;
    // Reintento inmediato: el equipo ya está curado (bossBattle); se vuelve a preguntar.
  }
  ctx.setFlag(F.azelf);
  await lines(ctx, A, [
    'Querías llegar, y has llegado. Aunque doliera.',
    'Toma. Sin querer, lo que se sabe y lo que se siente se quedan quietos.',
  ]);
  ctx.se('PRSFX- Heal Bell');
  await ctx.flash([...TRIO_COLORS.querer], 16, 160);
  await ctx.giveItem('WILLTHREAD', 1);
  ctx.setFlag(F.querer); // Zygarde habla muy poco (autor, 25-09-2026).
}

function azelfEvents() {
  const Az = QUERER.azelf.azelf;
  return [{
    id: 'azelf', x: Az.x, y: Az.y, name: SPEAKER.azelf,
    pages: [{
      sprite: SPRITE.azelf, dir: Az.dir, stepAnime: true, solid: true, move: 'still',
      script: async (ctx) => {
        if (ctx.flag(F.querer)) { await ctx.say('Lo que se quiere de verdad no se detiene. Solo descansa.', { speaker: SPEAKER.azelf }); return; }
        await azelfBattle(ctx);
      },
    }],
  }];
}

export function quererEvents() {
  return [...windEvents(), ...azelfEvents()];
}

/** Warps del ala: salida del pasillo, puerta de arriba y vuelta de la cámara de Azelf. */
export function quererWarps() {
  const front = PATIO.gates.querer.front;
  const a = QUERER.azelf.entry.arrive;
  return [
    { x: Wd.exitBelow.x, y: Wd.exitBelow.y, dirTrigger: 2, to: 'santuario_alma', tx: front.x, ty: front.y, dir: 2 },
    { x: Wd.gate.warp.x, y: Wd.gate.warp.y, to: 'santuario_alma', tx: a.x, ty: a.y, dir: 8 },
    // la cámara de Azelf baja directamente al patio (no hay que volver a cruzar el viento)
    ...QUERER.azelf.entry.exits.map((e) => ({ x: e.x, y: e.y, dirTrigger: 2, to: 'santuario_alma', tx: front.x, ty: front.y, dir: 2 })),
  ];
}
