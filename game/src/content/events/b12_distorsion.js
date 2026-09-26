// Mundo Distorsión, espacios comunes del Pilar Invertido (docs/CAMPANA.md B12): la explanada interior (llegada por el
// aljibe, encuentros de «Pilar Invertido», el portal a La Cara Vuelta y, tras restaurar, la «Respuesta» de Zygarde:
// «Aquí lo empujé. Tres noches.») y La Mirada (puentes que solo existen mientras se miran). Portales entre secciones.
import { F, EXT, OBJ, ANCHOR_ART, MUSIC, VIOLET, when, zygardeSays, pause } from './b12_common.js';
import { VESTIBULO, MIRADA, SUMIDERO, MONTE, segment } from '../maps/b12/layout.js';
import { roomEntry, firstFallHint } from './b12_cara.js';
import { isVoidCell } from '../../world/impossible/logic.js';

export const DIST_TEXT = Object.freeze({
  anchor: 'Un poste de piedra con un anillo tallado. Al tocarlo, el aire a su alrededor se queda quieto. Si caes, volverás aquí.',
  aljibe: 'Muy arriba, un círculo de luz violeta: el aljibe, visto desde el otro lado.',
  climbBack: '¿Subes por el aljibe de vuelta al Monte?',
  placa: 'Una estela partida en dos. Los glifos de una mitad están del derecho; los de la otra, del revés.',
  claws: 'Tres surcos largos y vidriosos en la piedra. Aquí algo enorme se resistió a que lo empujaran.',
  portal: 'Una grieta violeta en el aire. Al otro lado, más piedra flotando.',
});

export { firstFallHint };

/** Portal de paso entre secciones (grieta violeta): al tocarlo, fundido y a `to`. */
export function portalEvent(id, x, y, to, { flag = null, when: cond = null, text = null } = {}) {
  return {
    id, x, y, sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, through: true, shadow: false,
    trigger: 'touch', when: cond || undefined,
    glow: { name: 'softLight', radius: 56, intensity: 0.55, pulse: 0.5, color: [190, 120, 255] },
    script: async (ctx) => {
      if (flag) ctx.setFlag(flag);
      if (text) await ctx.say(text);
      ctx.se('PRSFX- Teleport', { volume: 60 });
      await ctx.warp(to.map, to.x, to.y, to.dir ?? 2, { fade: true, frames: 20 });
    },
  };
}

// ───────────────────────────── La explanada interior ─────────────────────────────

async function interiorArrival(ctx) {
  ctx.setFlag(F.interiorVisto);
  await pause(ctx, 30); // Zygarde habla muy poco (autor, 25-09-2026)
}

/**
 * Zygarde se pone al lado del jugador, cara a cara (el 50 % es alto: detrás, tapaba al jugador en la escena). Solo a
 * una casilla de piedra vecina; si no hay ninguna, se queda donde está.
 */
async function stageZygardeBeside(ctx) {
  const c = ctx.world?.core;
  const p = ctx.player;
  const gm = ctx.world?.map;
  if (!c?.visible || !p || !gm || typeof ctx.move !== 'function') return;
  const side = [[1, 'left', 'right'], [-1, 'right', 'left']].find(([dx]) => gm.valid(p.x + dx, p.y) && !isVoidCell(gm, p.x + dx, p.y)
    && !(ctx.world.events || []).some((e) => !e.erased && !e.through && e.x === p.x + dx && e.y === p.y));
  if (!side) return;
  const [dx, coreFaces, playerFaces] = side;
  const route = [];
  for (let x = c.x; x < p.x + dx; x++) route.push('right');
  for (let x = c.x; x > p.x + dx; x--) route.push('left');
  for (let y = c.y; y > p.y; y--) route.push('up');
  for (let y = c.y; y < p.y; y++) route.push('down');
  if (route.length > 4) return; // lejos (no acaba de llegar detrás): mejor no cruzar la plaza
  if (route.length) await ctx.move('core', route, { through: true, speed: 3 });
  ctx.face?.('core', coreFaces);
  ctx.face?.('player', playerFaces);
}

/** Respuesta de Zygarde al volver, ya restaurado el Pilar (CAMPANA B12 «Respuesta»). */
async function respuestaScene(ctx) {
  ctx.setFlag(F.respuestaP6);
  await pause(ctx, 30);
  try {
    await stageZygardeBeside(ctx);
  } catch (err) {
    console.warn('[b12] Respuesta: colocar a Zygarde', err);
  }
  // Biblia P-03/P-04: la batalla acaba en la tercera noche y SOLO entonces Zygarde pierde la cohesión; N3 fue
  // arrastrado al aljibe y se fundió con el sello para taponar la brecha (CAMPANA §2.4).
  // Zygarde habla muy poco (autor, 25-09-2026): solo la línea canónica.
  await zygardeSays(ctx, 'Aquí lo empujé. Tres noches.');
}

async function aljibeBack(ctx) {
  await ctx.say(DIST_TEXT.aljibe);
  const i = await ctx.choice(['Sí', 'No'], { message: DIST_TEXT.climbBack, cancel: 1 });
  if (i !== 0) return;
  ctx.se('PRSFX- Teleport', { volume: 70 });
  const scene = ctx.scene;
  try {
    if (scene?.fx?.rotateTo) {
      ctx.fade('out', 36, [...VIOLET].map((c) => Math.round(c * 0.3)));
      await scene.fx.rotateTo(-Math.PI, 36, 0.7);
    } else if (ctx.fade) await ctx.fade('out', 24);
    const r = MONTE.returnSpot;
    await ctx.warp('montana_portal', r.x, r.y, r.dir, { fade: false });
    ctx.bgm(MUSIC.monte, { fadeOutPrevious: 30 });
  } finally {
    // Pase lo que pase, la pantalla no se queda girada ni a oscuras.
    scene?.fx?.rotateTo?.(0, 0, 1);
    if (ctx.fade) await ctx.fade('in', 30);
  }
}

const deco = (id, [x, y], sprite, dir, text, solid = false) => ({
  id, x, y, sprite, dir, directionFix: true, walkAnime: false, through: !solid, solid, shadow: false, trigger: 'action',
  script: async (ctx) => { await ctx.say(text); },
});

export function vestibuloEvents() {
  const V = VESTIBULO;
  const cara = roomEntry('cara_1');
  return [
    { id: 'b12_llegada_interior', x: V.arrival.x, y: V.arrival.y, through: true, trigger: 'auto', when: when({ none: [F.interiorVisto] }), script: interiorArrival },
    { id: 'b12_respuesta', x: V.returnArrival.x, y: V.returnArrival.y, through: true, trigger: 'auto', when: when({ all: [EXT.restored], none: [F.respuestaP6] }), script: respuestaScene },
    {
      id: 'b12_aljibe_desde_abajo', x: V.aljibe.x, y: V.aljibe.y, sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true,
      solid: true, shadow: false, trigger: 'action', glow: { name: 'softLight', radius: 96, intensity: 0.6, pulse: 0.4, color: [...VIOLET] }, script: aljibeBack,
    },
    { id: 'b12_ancla_explanada', type: 'ancla', x: V.anchor.x, y: V.anchor.y, text: DIST_TEXT.anchor, firstFlag: F.primeraAnclaP6 },
    portalEvent('b12_portal_cara', V.portalCara.x, V.portalCara.y, cara),
    ...V.claws.map((p, i) => deco(`b12_zarpazo_interior_${i}`, p, OBJ.monte, 6, DIST_TEXT.claws)),
    { id: 'b12_placa_interior', x: V.placa.x, y: V.placa.y + 1, trigger: 'action', solid: false, through: true, noOver: true, script: async (ctx) => { await ctx.say(DIST_TEXT.placa); } },
    { id: 'b12_placa_interior_2', x: V.placa.x + 1, y: V.placa.y + 1, trigger: 'action', solid: false, through: true, noOver: true, script: async (ctx) => { await ctx.say(DIST_TEXT.placa); } },
    ...V.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1 })),
  ];
}

// ───────────────────────────── La Mirada ─────────────────────────────

async function miradaArrival(ctx) {
  ctx.setFlag(F.miradaVista);
  await pause(ctx, 16); // Zygarde habla muy poco (autor, 25-09-2026)
}

/** Casillas de puente de La Mirada (todas las de los segmentos de MIRADA.bridges). */
export function miradaBridgeCells() {
  return MIRADA.bridges.flatMap((b) => segment(b.from, b.to).map(([x, y]) => ({ id: b.id, x, y })));
}

export function miradaEvents() {
  const M = MIRADA;
  const sumidero = { map: 'pilar_invertido_sumidero', ...SUMIDERO.start };
  return [
    { id: 'b12_llegada_mirada', x: M.start.x, y: M.start.y, through: true, trigger: 'auto', when: when({ none: [F.miradaVista] }), script: miradaArrival },
    ...miradaBridgeCells().map((c, i) => ({ id: `b12_puente_${c.id}_${i}`, type: 'puenteMirada', x: c.x, y: c.y })),
    ...M.anchors.map((a) => ({ id: `b12_${a.id}`, type: 'ancla', x: a.x, y: a.y, sprite: a.symbol ? ANCHOR_ART[a.symbol] : undefined, text: DIST_TEXT.anchor, firstFlag: F.primeraAnclaP6 })),
    portalEvent('b12_portal_sumidero', M.exit.x, M.exit.y, sumidero, { flag: F.miradaHecha }),
    ...M.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1 })),
  ];
}
