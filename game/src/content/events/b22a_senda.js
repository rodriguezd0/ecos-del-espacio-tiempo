// Senda del Lazo abierta con el Anclaje espacial (docs/CAMPANA.md §1.4: «el alto es un bucle que solo rompe el Anclaje
// espacial (postgame)»; B22 «Otros contenidos»; X16) y la Cumbre Azur hasta Columna Lanza («Vuelo y Senda del Lazo
// (post)»). En el mapa de B15 (ruta_12_senda_lazo) se añade, solo en el postgame, el nudo del tramo alto: Zygarde lo
// ancla y el tramo alto deja de devolver al borde del mirador (los eventos `tramo_alto_*` de B15 se desactivan con el
// flag b22a_lazo_anclado) y sube a la Cumbre. Todo aditivo y por condición.
import { F, OBJ, SPEAKER, SPRITE, GREEN, isPostgame, when, lines, zygardeSays, zygardeLines, pause } from './b22a_common.js';
import { SENDA_TEXT, CUMBRE_TEXT, COLUMNA_TEXT } from './b22a_texts.js';
import { useAnchor } from './b22a_anchor.js';
import { SENDA_B22A, CUMBRE, COLUMNA_B22A } from '../maps/b22a/layout.js';

const S = SENDA_B22A;
const anchored = (s) => Boolean(s?.flag(F.lazoAnclado));

// ───────────────────────────── Senda del Lazo (B15) ─────────────────────────────

async function knotScript(ctx) {
  if (anchored(ctx.state)) { await ctx.say(SENDA_TEXT.after); return; }
  await ctx.say(SENDA_TEXT.knot);
  await zygardeSays(ctx, SENDA_TEXT.knotZygarde);
  if (!(await ctx.confirm(SENDA_TEXT.ask))) return;
  const ok = await useAnchor(ctx, { onAnchor: (c) => { c.setFlag(F.lazoAnclado); c.requestRefresh?.(); } });
  if (!ok) return;
  await ctx.say(SENDA_TEXT.anchored);
  await zygardeSays(ctx, SENDA_TEXT.anchoredZygarde);
}

async function goUp(ctx) {
  if (ctx.player?.direction !== 8) return;
  await ctx.say(SENDA_TEXT.up);
  ctx.se?.('PRSFX- Teleport', { volume: 45 });
  const a = CUMBRE.arrival;
  await ctx.warp('cumbre_azur', a.x, a.y, a.dir, { fade: true, frames: 24 });
}

/** Eventos del B22a en la Senda del Lazo (solo en el postgame). */
export function sendaB22aEvents() {
  const k = S.knot;
  return [
    {
      id: 'b22a_nudo_lazo', x: k.x, y: k.y, name: 'Nudo del tramo alto',
      pages: [
        {
          when: (s) => isPostgame(s) && !anchored(s), sprite: OBJ.objetos, dir: 2, directionFix: true, walkAnime: false,
          stepAnime: true, speed: 3, shadow: false, solid: true, trigger: 'action', script: knotScript,
          glow: { name: 'softLight', radius: 70, intensity: 0.45, pulse: 0.6, color: [210, 225, 255] },
        },
        {
          when: (s) => isPostgame(s) && anchored(s), sprite: OBJ.objetos, dir: 4, directionFix: true, walkAnime: false,
          stepAnime: true, speed: 2, shadow: false, solid: true, trigger: 'action', script: knotScript,
          glow: { name: 'softLight', radius: 56, intensity: 0.35, pulse: 0.3, color: [...GREEN] },
        },
      ],
    },
    ...S.up.map((c) => ({
      id: `b22a_subida_cumbre_${c.x}`, x: c.x, y: c.y, through: true, trigger: 'touch', when: (s) => isPostgame(s) && anchored(s), script: goUp,
    })),
  ];
}

/**
 * Envoltorio aditivo de los eventos de la Senda (ruta_12_senda_lazo.js): con el nudo anclado, el tramo alto de B15 ya no
 * devuelve al mirador; y se añaden el nudo y la subida.
 */
export function b22aSendaEvents(events) {
  const out = events.map((ev) => {
    if (!String(ev.id).startsWith('tramo_alto_')) return ev;
    const orig = ev.when;
    return { ...ev, when: (s, e) => (!orig || Boolean(orig(s, e))) && !anchored(s) };
  });
  return [...out, ...sendaB22aEvents()];
}

// ───────────────────────────── Cumbre Azur ─────────────────────────────

async function cumbreArrival(ctx) {
  ctx.setFlag(F.cumbreLlegada);
  await pause(ctx, 12);
  await ctx.say(CUMBRE_TEXT.arrival);
  await zygardeSays(ctx, CUMBRE_TEXT.arrivalZygarde);
}

async function gateScript(ctx) {
  if (ctx.player?.direction !== 8) return;
  await ctx.say(CUMBRE_TEXT.gate);
  if (!(await ctx.confirm(CUMBRE_TEXT.gateAsk))) {
    await ctx.move('player', ['down'], { through: false });
    return;
  }
  ctx.se?.('PRSFX- Teleport', { volume: 45 });
  const a = COLUMNA_B22A.stairs;
  await ctx.warp('columna_lanza', a.x, a.y, a.dir, { fade: true, frames: 24 });
  if (!ctx.flag(F.columnaPie)) {
    ctx.setFlag(F.columnaPie);
    await pause(ctx, 16);
    await zygardeSays(ctx, COLUMNA_TEXT.onFoot);
  }
}

async function curiosaTalk(ctx) {
  if (ctx.flag('b22a_curiosa_cumbre')) { await ctx.say(CUMBRE_TEXT.curiosaAgain, { speaker: SPEAKER.curiosa }); return; }
  ctx.setFlag('b22a_curiosa_cumbre');
  await lines(ctx, SPEAKER.curiosa, CUMBRE_TEXT.curiosa);
}

/** Eventos de la Cumbre Azur. */
export function cumbreEvents() {
  const C = CUMBRE;
  const st = C.stele;
  return [
    { id: 'b22a_cumbre_llegada', x: C.arrival.x, y: C.arrival.y, through: true, trigger: 'auto', when: when({ none: [F.cumbreLlegada] }), script: cumbreArrival },
    ...C.gateCells.map((g) => ({ id: `b22a_dintel_${g.x}`, x: g.x, y: g.y, through: true, trigger: 'touch', script: gateScript })),
    {
      id: 'b22a_columna_luz_cumbre', x: C.light.x, y: C.light.y, through: true,
      glow: { name: 'softLight', radius: 200, intensity: 0.65, pulse: 0.3, color: [205, 222, 255] },
    },
    {
      id: 'b22a_curiosa_cumbre', x: C.curiosa.x, y: C.curiosa.y, name: SPEAKER.curiosa, sprite: SPRITE.curiosa, dir: C.curiosa.dir,
      move: 'look', trigger: 'action', script: curiosaTalk,
    },
    // Estela partida (placa Unown 2×2): la base bloquea; se lee desde abajo.
    ...[0, 1].map((i) => ({
      id: `b22a_estela_cumbre_${i}`, x: st.x + i, y: st.y + 1, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(CUMBRE_TEXT.stele); },
    })),
    ...C.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, ...(it.hidden ? { hidden: true } : {}) })),
  ];
}

/** Bajada de la Cumbre a la Senda (warps del borde sur, pulsando abajo). */
export function cumbreWarps() {
  const b = S.back;
  const out = [];
  for (let x = CUMBRE.south.x0; x <= CUMBRE.south.x1; x++) {
    out.push({ x, y: CUMBRE.south.y, dirTrigger: 2, to: 'ruta_12_senda_lazo', tx: b.x, ty: b.y, dir: b.dir });
  }
  return out;
}

// ───────────────────────────── Columna Lanza: los peldaños de nube ─────────────────────────────

async function stairsDown(ctx) {
  await ctx.say(COLUMNA_TEXT.stairs);
  if (!(await ctx.confirm(COLUMNA_TEXT.stairsAsk))) return;
  ctx.se?.('PRSFX- Teleport', { volume: 45 });
  const g = CUMBRE.gateCells[1];
  await ctx.warp('cumbre_azur', g.x, g.y + 1, 2, { fade: true, frames: 24 });
}

/** Peldaños de nube de Columna Lanza hacia la Cumbre (se usan pisándolos: A encima). Solo con la Senda abierta. */
export function columnaStairEvents() {
  const s = COLUMNA_B22A.stairs;
  return [{
    id: 'b22a_peldanos_nube', x: s.x, y: s.y, name: 'Peldaños de nube',
    pages: [{
      when: (st) => isPostgame(st) && anchored(st), sprite: OBJ.objetos, dir: 8, directionFix: true, walkAnime: false,
      stepAnime: true, speed: 2, shadow: false, through: true, trigger: 'action', script: stairsDown,
      glow: { name: 'softLight', radius: 48, intensity: 0.3, pulse: 0.3, color: [220, 235, 255] },
    }],
  }];
}

export { zygardeLines };
