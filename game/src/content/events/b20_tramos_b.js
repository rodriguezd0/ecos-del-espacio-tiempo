// Senda del Origen, tramos 4–6 (docs/CAMPANA.md B20):
//   4 · Masa — placa de contrapeso (Terreno): primer Manantial del Origen; una franja de barro (Terreno complicado) y una
//       placa que solo baja con peso (montado en el 10 %, reglas de B08) y alza la plataforma de la salida.
//   5 · Memoria — losa de recuerdo que se sigue (Trepar): al pisar la losa, el eco de un custodio cruza el Suelo Olvidado
//       por el único camino seguro (piezas de B10) y sube la pared con vetas; pisar fuera devuelve al borde sin daño.
//   6 · Invertido — arista de giro con Ancla: eventos del mapa base y de su gemelo girado (world/impossible, B12).
import { F, OBJ, SPRITE, SPEAKER, GOLD, zygardeSays, zygardeLines, pause, placePlayer, eventById, when } from './b20_common.js';
import { platePresses } from './b20_logic.js';
import { springEvent, steleEvents, tramoId, EXIT_STAND, ARRIVE } from './b20_senda.js';
import { T4, T5 } from '../maps/b20/layout.js';
import { ecoEvent, ecoAppear, ecoVanish, ecoMove, stepsAlong, footprint, runEco } from './b10_hondo_eco.js';
import { zygardeArea } from '../../world/zygarde/eventTypes.js';
import { isRiding, setRiding, canRide } from '../../world/zygarde/mount.js';
import { extraTiles } from '../stamps/extraTiles.js';

const KIT = extraTiles('Cueva1');
const kitTile = (name, dx = 0, dy = 0) => KIT.find((t) => t.name === name && t.dx === dx && t.dy === dy)?.id || 0;

// ───────────────────────────── Tramo 4 ─────────────────────────────

export const T4_TEXT = Object.freeze({
  plateHint: 'Una placa de piedra con un hexágono grabado. La pisas… y ni se inmuta. Hará falta más peso.',
  plateCore: 'Conmigo encima pesas más. Súbete.',
  ride: '¿Montar en Zygarde?',
  press: 'La placa se hunde con un chasquido y se queda encajada.',
  rise: 'Del abismo sube una plataforma de losas y encaja bajo la boca del norte.',
  down: 'La placa está hundida y encajada.',
  stele: ['Una estela con glifos Unown:', '«La piedra no escucha a quien pasa. Escucha a quien pesa.»'],
  weight: 'Un contrapeso de piedra cuelga sobre el abismo. Se balancea sin que sople el aire.',
});

const pressed = (s) => Boolean(s?.flag(F.t4Plate));

/** Losas de la plataforma alzada (capa 1, sobre el abismo): enlosado del kit en un bloque de 3×3. */
export function platformPatch() {
  const cells = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cells.push([11 + i, 5 + j, 1, kitTile('pilar_enlosado', i, j)]);
  return cells;
}

async function pressPlate(ctx) {
  if (pressed(ctx.state)) return;
  ctx.setFlag(F.t4Plate);
  ctx.se('PRSFX- Rock Wrecker', { volume: 80 });
  ctx.shake(3, 6, 20);
  await ctx.say(T4_TEXT.press);
  await ctx.camera?.pan?.(12, 7, 30);
  ctx.se('PRSFX- Iron Defense', { volume: 80 });
  await ctx.flash([180, 186, 196], 10, 110);
  ctx.requestRefresh();
  await pause(ctx, 20);
  await ctx.say(T4_TEXT.rise);
  await ctx.camera?.reset?.(24);
  await zygardeSays(ctx, 'Juntos pesamos lo bastante.');
}

async function plateScript(ctx) {
  if (pressed(ctx.state)) { await ctx.say(T4_TEXT.down); return; }
  if (platePresses(isRiding(ctx.world))) { await pressPlate(ctx); return; }
  if (!ctx.flag(F.t4Hint)) {
    ctx.setFlag(F.t4Hint);
    await ctx.say(T4_TEXT.plateHint);
    await zygardeSays(ctx, T4_TEXT.plateCore);
  }
  if (!canRide(ctx.world)) return;
  if ((await ctx.choice(['Sí', 'No'], { message: T4_TEXT.ride, cancel: 1 })) !== 0) return;
  setRiding(ctx.world, true);
  ctx.se('core_signal', { volume: 40 });
  for (let i = 0; i < 20 && !isRiding(ctx.world); i++) await pause(ctx, 1);
  if (platePresses(isRiding(ctx.world))) await pressPlate(ctx);
}

/** Vigila montar encima de la placa con la tecla (el peso cambia sin dar un paso). */
async function plateWatch(ctx) {
  const p = ctx.player;
  if (pressed(ctx.state) || p.x !== T4.plate.x || p.y !== T4.plate.y || ctx.world?.scriptBusy?.()) return;
  if (!platePresses(isRiding(ctx.world))) return;
  await ctx.scene?.runScript?.((c) => pressPlate(c), null, 'tramo4:placa');
}

export function tramo4Events() {
  const P = T4.plate;
  const base = { sprite: OBJ.plate, directionFix: true, walkAnime: false, through: true, shadow: false };
  return [
    springEvent('t4_manantial', 1, T4.spring),
    ...zygardeArea('roughTerrain', 't4_barro', 5, 11, 14, 2, { kind: 'mud' }),
    {
      id: 't4_placa', x: P.x, y: P.y, name: 'Placa',
      pages: [
        { ...base, dir: 2, trigger: 'touch', script: plateScript },
        { ...base, when: pressed, dir: 4, trigger: 'action', script: async (ctx) => { await ctx.say(T4_TEXT.down); } },
      ],
    },
    { id: 't4_vigia', x: 0, y: 0, pages: [{ when: (s) => !pressed(s), trigger: 'parallel', lock: false, script: plateWatch }] },
    { id: 't4_plataforma', x: 12, y: 6, pages: [{ through: true }, { when: pressed, through: true, patch: platformPatch() }] },
    ...steleEvents('t4_estela', T4.stele, T4_TEXT.stele),
    ...T4.weights.map(([x, y], i) => ({
      id: `t4_contrapeso_${i}`, x, y, through: true, sprite: OBJ.weight, dir: 2, directionFix: true, stepAnime: true,
      speed: 1 + (i % 2), walkAnime: false, shadow: false,
    })),
    { id: 't4_objeto', type: 'item', x: T4.item.x, y: T4.item.y, item: T4.item.item },
  ];
}

// ───────────────────────────── Tramo 5 ─────────────────────────────

export const T5_TEXT = Object.freeze({
  losa: 'Una losa con anillos grabados. Al pisarla, el aire huele a papel viejo…',
  fall: 'El suelo no estaba ahí. Algo te sujeta en la caída y te devuelve, sin daño, al borde.',
  fallCore: 'Solo quien lo recuerda sabe dónde pisar. Vuelve a la losa: él lo recuerda por nosotros.',
  crossed: 'Has cruzado el Suelo Olvidado. A tu espalda, el camino del custodio queda marcado con glifos tenues.',
  climbCore: 'Subió por la pared. Nosotros también podemos.',
});

const GLYPH = kitTile('pilar_glifo');
const pathSet = new Set(T5.path.map(([x, y]) => `${x},${y}`));
const lastStep = T5.path[T5.path.length - 1];

/** Casillas del Suelo Olvidado fuera del camino seguro (trampas). */
export function forgottenTraps() {
  const out = [];
  for (let y = 8; y <= 12; y++) for (let x = 5; x <= 18; x++) if (!pathSet.has(`${x},${y}`)) out.push([x, y]);
  return out;
}

async function ecoWalk(ctx) {
  await runEco(async () => {
    await ctx.say(T5_TEXT.losa);
    const ev = eventById(ctx, 't5_eco');
    const home = T5.ecoHome;
    await ecoAppear(ctx, ev, { at: home, dir: 8 });
    const cells = [...T5.path];
    const steps = stepsAlong(home, cells);
    const route = [{ speed: 3 }];
    steps.forEach((s, i) => { route.push(s, { call: () => footprint(ctx, cells[i][0], cells[i][1]) }); });
    route.push('up', 'up', 'up');
    await ecoMove(ctx, ev, route);
    await ecoVanish(ctx, ev);
    if (!ctx.flag('b20_t5_eco_visto')) {
      ctx.setFlag('b20_t5_eco_visto');
      await zygardeSays(ctx, T5_TEXT.climbCore);
    }
  });
}

async function fall(ctx) {
  ctx.se('PRSFX- Shadow Sneak1', { volume: 70 });
  await ctx.fade('out', 16, [24, 18, 10]);
  const b = T5.fallBack;
  await placePlayer(ctx, b.x, b.y, b.dir, { fade: false });
  await pause(ctx, 10);
  await ctx.fade('in', 16);
  await ctx.say(T5_TEXT.fall);
  if (!ctx.flag(F.t5Fall)) {
    ctx.setFlag(F.t5Fall);
    await zygardeSays(ctx, T5_TEXT.fallCore);
  }
}

export function tramo5Events() {
  const L = T5.losa;
  const out = [];
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    out.push({ id: `t5_losa_${dx}${dy}`, x: L.x + dx, y: L.y + dy, trigger: 'touch', through: true, script: ecoWalk });
  }
  for (const [x, y] of forgottenTraps()) out.push({ id: `t5_trampa_${x}_${y}`, x, y, trigger: 'touch', through: true, script: fall });
  out.push({
    id: 't5_cruzado', x: lastStep[0], y: lastStep[1],
    pages: [
      { trigger: 'touch', through: true, script: async (ctx) => {
        if (ctx.flag(F.t5Crossed)) return;
        ctx.setFlag(F.t5Crossed);
        ctx.se('PRSFX- Miracle Eye', { volume: 60 });
        await ctx.say(T5_TEXT.crossed);
      } },
      { when: when({ all: [F.t5Crossed] }), through: true, patch: GLYPH ? T5.path.map(([x, y]) => [x, y, 2, GLYPH]) : undefined },
    ],
  });
  out.push(ecoEvent('t5_eco', T5.ecoHome, { sprite: SPRITE.custodio, name: SPEAKER.custodio }));
  out.push({ id: 't5_pared', type: 'climbWall', x: T5.climb.x, y: T5.climb.y, to: [...T5.climb.to], h: 2 });
  out.push({ id: 't5_pared_bajar', type: 'climbWall', x: T5.climbDown.x, y: T5.climbDown.y, to: [...T5.climbDown.to], down: true, h: 2 });
  out.push({ id: 't5_objeto', type: 'item', x: T5.item.x, y: T5.item.y, item: T5.item.item });
  return out;
}

// ───────────────────────────── Tramo 6 ─────────────────────────────

export const T6_TEXT = Object.freeze({
  anchor: 'Un poste de piedra con un anillo tallado. El aire a su alrededor se queda quieto. Si caes, volverás aquí.',
  firstFall: ['Caímos.', 'Aquí nada se rompe al caer. El poste nos recoge.'],
  exit: 'Una grieta dorada en el aire. Al otro lado se oye agua.',
  back: 'Una grieta en el aire. Por ella se vuelve al Suelo Olvidado.',
});

export async function t6FirstFall(ctx) {
  await zygardeLines(ctx, T6_TEXT.firstFall);
}

/** Grieta de salida o de vuelta del tramo 6 (portal que se pisa). */
export function t6Portal(id, x, y, to) {
  return {
    id, x, y, sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, through: true, shadow: false,
    trigger: 'touch', glow: { name: 'softLight', radius: 56, intensity: 0.55, pulse: 0.5, color: [...GOLD] },
    script: async (ctx) => {
      ctx.se('PRSFX- Teleport', { volume: 60 });
      await ctx.warp(to.map, to.x, to.y, to.dir ?? 8, { fade: true, frames: 20 });
    },
  };
}

export const T6_LINKS = Object.freeze({
  next: Object.freeze({ map: tramoId(7), ...ARRIVE }),
  prev: Object.freeze({ map: tramoId(5), ...EXIT_STAND }),
});
