// Senda del Origen, tramos 1–3 (docs/CAMPANA.md B20):
//   1 · Umbral — dinteles giratorios y cuesta de grava (Correr): la grava solo se sube montado en el 10 %; arriba, tres
//       piedras giratorias (reglas y arte de B02) que se orientan según la inscripción abren la losa del dintel.
//   2 · Corriente — estanques y compuerta (Nadar): el mando está en un islote; al abrir la compuerta el estanque se
//       vacía por el dique y su fondo lleva a la salida.
//   3 · Impulso — ráfagas con veleta (Embestida): la veleta del canal está tapada por una roca agrietada; girada dos
//       veces, el canal sopla hacia el norte y sube al jugador por encima de la cinta de ráfagas fuertes.
import { F, V, OBJ, GOLD, zygardeLines, pause, examine, frame, when, strip } from './b20_common.js';
import { STONES, stoneDirOf, nextDir, STONE_DIR_NAME, ROTATION, WIND_ROOM } from './b20_logic.js';
import { steleEvents } from './b20_senda.js';
import { T1, T2, T3, INNER } from '../maps/b20/layout.js';
import { gustEvents, vaneEvents, vaneVar } from './b06_wind.js';
import { zygardeArea } from '../../world/zygarde/eventTypes.js';

// ───────────────────────────── Tramo 1 ─────────────────────────────

export const T1_TEXT = Object.freeze({
  inscription: [
    'Una estela con glifos Unown. La Clave Glífica los lee sin esfuerzo:',
    '«El primero mira al alba. El segundo, al agua que no se va. El tercero, a quien entra.»',
  ],
  stoneIntro: 'Una piedra redonda sobre un zócalo, con una ranura tallada. Gira sobre su eje.',
  notches: { 1: 'En el zócalo hay grabada una sola muesca.', 2: 'En el zócalo hay grabadas dos muescas.', 3: 'En el zócalo hay grabadas tres muescas.' },
  lit: 'La ranura se enciende con una luz dorada.',
  already: 'La piedra ya no gira. Su ranura sigue encendida.',
  slab: 'Una losa cierra el paso bajo el dintel. No se mueve ni un palmo.',
  slabOpen: 'Con un roce de piedra contra piedra, la losa se hunde en el suelo.',
  crystal: 'Un cristal clavado en la roca del este. Brilla como si al otro lado amaneciera.',
  pool: 'Un estanque quieto. El agua no entra ni sale: no se va a ninguna parte.',
});

const stoneKey = (st) => V.stone(st.id);
const stoneLit = (st) => `b20_t1_piedra_${st.id}_viva`;
const lit = (s, st) => Boolean(s?.flag(stoneLit(st)));

async function turnStone(ctx, st) {
  if (lit(ctx.state, st)) { await ctx.say(T1_TEXT.already); return; }
  if (!ctx.selfSwitch('B')) {
    await ctx.say(T1_TEXT.stoneIntro);
    await ctx.say(T1_TEXT.notches[st.n]);
    ctx.setSelfSwitch('B', true);
  }
  const dir = nextDir(stoneDirOf(ctx.var(stoneKey(st), 8)));
  ctx.se('Strength push');
  ctx.setVar(stoneKey(st), dir);
  ctx.requestRefresh();
  await pause(ctx, 14);
  if (dir !== st.answer) return;
  ctx.setFlag(stoneLit(st));
  ctx.se('Mining ping');
  const glow = ctx.effect?.('softLight', { x: st.x, y: st.y, radius: 40, color: [...GOLD], intensity: 0.8, pulse: 0.4, fadeIn: 10 });
  await ctx.flash(GOLD, 10, 70);
  await ctx.say(T1_TEXT.lit);
  glow?.remove?.(30);
  if (STONES.every((s) => lit(ctx.state, s)) && !ctx.flag(F.t1Slab)) await openSlab(ctx);
}

async function openSlab(ctx) {
  await pause(ctx, 16);
  await ctx.camera?.pan?.(T1.slab.x, T1.slab.y - 1, 30);
  ctx.se('PRSFX- Earthquake');
  await ctx.shake(3, 6, 30);
  ctx.se('Door slide');
  const ev = ctx.world?.events?.find((e) => e.id === 't1_losa');
  if (ev) for (let i = 0; i <= 16; i++) { ev.opacity = Math.max(0, 255 - i * 16); await pause(ctx, 3); }
  ctx.setFlag(F.t1Slab);
  await ctx.say(T1_TEXT.slabOpen);
  await ctx.camera?.reset?.(24);
}

function stoneEvent(st) {
  const unlit = ROTATION.map((dir) => ({
    when: (s) => !lit(s, st) && stoneDirOf(s.var(stoneKey(st), 8)) === dir,
    sprite: OBJ.stone, dir, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
    script: (ctx) => turnStone(ctx, st),
  }));
  const on = {
    when: (s) => lit(s, st), sprite: OBJ.stoneLit, dir: st.answer, directionFix: true, walkAnime: false, stepAnime: true,
    speed: 2, solid: true, trigger: 'action', light: { radius: 44, intensity: 0.7 }, script: (ctx) => turnStone(ctx, st),
  };
  return { id: `t1_piedra_${st.id}`, x: st.x, y: st.y, name: `Piedra ${st.n}`, pages: [...unlit, on] };
}

function slabEvents() {
  const closed = when({ none: [F.t1Slab] });
  const say = async (ctx) => { await ctx.say(T1_TEXT.slab); };
  return [
    {
      id: 't1_losa', x: T1.slab.x, y: T1.slab.y,
      pages: [{ when: closed, sprite: OBJ.slab, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: say }],
    },
    ...T1.slab.blockers.map(([x, y], i) => ({ id: `t1_losa_${i}`, x, y, pages: [{ when: closed, solid: true, trigger: 'action', noOver: true, script: say }] })),
  ];
}

export function tramo1Events() {
  return [
    ...STONES.map(stoneEvent),
    ...slabEvents(),
    ...steleEvents('t1_estela', T1.stele, T1_TEXT.inscription),
    {
      id: 't1_cristal', x: T1.crystal.x, y: T1.crystal.y + 1, trigger: 'action', solid: true, noOver: true,
      glow: { name: 'softLight', radius: 70, intensity: 0.8, pulse: 0.3, color: [255, 236, 190] },
      script: async (ctx) => { await ctx.say(T1_TEXT.crystal); },
    },
    examine('t1_estanque', T1.pool.x + T1.pool.w - 1, T1.pool.y + T1.pool.h - 1, T1_TEXT.pool),
    ...zygardeArea('gravelSlope', 't1_grava', 8, 10, 9, 2),
    { id: 't1_objeto', type: 'item', x: T1.item.x, y: T1.item.y, item: T1.item.item, count: T1.item.count },
  ];
}

export const stoneFlag = stoneLit;

// ───────────────────────────── Tramo 2 ─────────────────────────────

export const T2_TEXT = Object.freeze({
  stele: ['Una estela con glifos Unown:', '«Donde el agua se queda, el camino duerme. Déjala ir y el fondo será puerta.»'],
  gate: 'Una compuerta de piedra y bronce cierra el dique. El agua la empuja desde este lado.',
  gateOpen: 'La compuerta está abierta. Por el dique corre un hilo de agua.',
  lever: 'El mando de la compuerta. El volante gira a duras penas.',
  leverAsk: '¿Girar el volante?',
  leverDone: 'El volante está girado a tope. La compuerta sigue abierta.',
  drain: 'La compuerta se levanta. El estanque entero se vacía hacia el dique con un rugido…',
  drained: '…y el fondo queda al aire: losas mojadas y un camino hacia el norte.',
});

const drained = (s) => Boolean(s?.flag(F.t2Gate));
/** Suelo del vaso vacío (Cueva Azul, tileset 15: patrón `suelo_hielo` de Cueva1, filas 194–196). */
const basinTile = (x, y) => 384 + (194 + (y % 3)) * 8 + (x % 3);

/** Parche del estanque vaciado: el agua (capa 0) pasa a ser suelo, salvo el islote. */
export function drainPatch() {
  const P = T2.pond;
  const I = T2.islet;
  const out = [];
  for (let y = P.y0; y <= P.y1; y++) {
    for (let x = P.x0; x <= P.x1; x++) {
      if (x >= I.x0 && x <= I.x1 && y >= I.y0 && y <= I.y1) continue;
      out.push([x, y, 0, basinTile(x, y)]);
    }
  }
  return out;
}

async function pullLever(ctx) {
  if (drained(ctx.state)) { await ctx.say(T2_TEXT.leverDone); return; }
  await ctx.say(T2_TEXT.lever);
  if ((await ctx.choice(['Sí', 'No'], { message: T2_TEXT.leverAsk, cancel: 1 })) !== 0) return;
  ctx.se('Door slide');
  await pause(ctx, 10);
  await ctx.camera?.pan?.(T2.gate.x, T2.gate.y + 2, 30);
  await ctx.say(T2_TEXT.drain);
  ctx.se('PRSFX- Waterfall1', { volume: 90 });
  await ctx.shake(4, 6, 40);
  await ctx.fade('out', 20, [120, 170, 230]);
  ctx.setFlag(F.t2Gate);
  ctx.requestRefresh();
  await pause(ctx, 10);
  await ctx.fade('in', 24);
  await ctx.say(T2_TEXT.drained);
  await ctx.camera?.reset?.(24);
}

export function tramo2Events() {
  const G = T2.gate;
  return [
    {
      id: 't2_compuerta', x: G.x, y: G.y, name: 'Compuerta',
      pages: [
        { sprite: OBJ.gate, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(T2_TEXT.gate); } },
        { when: drained, sprite: OBJ.gate, dir: 8, directionFix: true, walkAnime: false, stepAnime: true, speed: 3, through: true, trigger: 'action', script: async (ctx) => { await ctx.say(T2_TEXT.gateOpen); } },
      ],
    },
    {
      id: 't2_mando', x: T2.lever.x, y: T2.lever.y, name: 'Mando',
      pages: [
        { sprite: OBJ.lever, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: pullLever },
        { when: drained, sprite: OBJ.lever, dir: 4, directionFix: true, walkAnime: false, stepAnime: true, solid: true, trigger: 'action', script: pullLever },
      ],
    },
    { id: 't2_vaso', x: T2.pond.x0, y: T2.pond.y0, pages: [{ through: true }, { when: drained, through: true, patch: drainPatch() }] },
    ...steleEvents('t2_estela', T2.stele, T2_TEXT.stele),
    { id: 't2_objeto', type: 'item', x: T2.item.x, y: T2.item.y, item: T2.item.item, hidden: true, when: drained },
  ];
}

// ───────────────────────────── Tramo 3 ─────────────────────────────

export const T3_TEXT = Object.freeze({
  // Pista del tramo: narración neutra (Zygarde habla muy poco, autor, 25-09-2026).
  hint: 'La veleta manda sobre el canal del este. Alguien le ha echado una roca delante.',
  stele: ['Una estela con glifos Unown:', '«El viento no se vence: se le cambia el rumbo.»'],
});

/**
 * La pista de la veleta solo tiene sentido mientras la roca la tapa y nadie la ha girado: se oye al llegar bajo la cinta
 * de ráfagas fuertes (fila de debajo) o al pasar junto a la roca.
 */
const T3_ROOM = 'b20_t3';
const t3HintPending = (s) => Boolean(s) && !s.flag(F.t3Hint) && !s.selfSwitch('senda_origen_3', 't3_roca', 'A')
  && !(Number(s.var(vaneVar(T3_ROOM, 'a'), 0)) > 0);

function t3HintCells() {
  const [rx, ry] = T3.rock;
  const lane = T3.rows.findIndex((r) => r.includes('2')) + 1; // la fila en calma bajo la cinta
  const cells = [...T3.rows[lane]].map((ch, c) => (ch === '.' ? [c + INNER.x, lane + INNER.y] : null)).filter(Boolean);
  return [...cells, [rx + INNER.x + 2, ry + INNER.y]];
}

export function tramo3Events() {
  const [rx, ry] = T3.rock;
  return [
    ...gustEvents(WIND_ROOM, INNER.x, INNER.y, { prefix: 't3_rafaga', roomKey: T3_ROOM }),
    ...vaneEvents(WIND_ROOM, INNER.x, INNER.y, { roomKey: T3_ROOM, names: { a: 'del canal' } }),
    {
      id: 't3_roca', type: 'ramRock', kind: 'rock', x: rx + INNER.x, y: ry + INNER.y,
      sprite: OBJ.barriers, dir: 2, directionFix: true, stepAnime: true,
    },
    ...strip('t3_pista', t3HintCells(), {
      when: t3HintPending,
      script: async (ctx) => { if (ctx.flag(F.t3Hint)) return; ctx.setFlag(F.t3Hint); await ctx.say(T3_TEXT.hint); },
    }),
    ...steleEvents('t3_estela', T3.stele, T3_TEXT.stele),
    { id: 't3_objeto', type: 'item', x: T3.item.x, y: T3.item.y, item: T3.item.item },
  ];
}

export { STONE_DIR_NAME, frame, zygardeLines };
