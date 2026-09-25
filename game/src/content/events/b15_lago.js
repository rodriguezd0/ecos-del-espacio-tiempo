// El Lago Viejo en el juego (docs/TABLILLAS.md T13 «La torre de hielo»): cada casilla del plano de
// content/events/b15_lago_logic.js es un evento. Las placas cuentan pasadas (variable b15_lago) y muestran sus grietas;
// al entrar en una placa, el guion hace resbalar al jugador con las reglas puras (move) hasta que algo lo para; si una
// placa ya tenía dos pasadas, se hunde: caída al agua, el lago se reinicia y se vuelve a la orilla sin daño. Los
// bloques de hielo se rompen con Embestida (variable b15_lago_bloques) y el bloque antiguo se saca desde su única
// casilla vecina. Al sacarlo, Nieves lo talla: la Tabla Helada y la Torre de Hielo (content/events/b15_t13.js).
import { F, V, OBJ, SPRITE, zygardeSays, pause } from './b15_common.js';
import { LAKE, move, ram, canExtract, encodeCounts, decodeCounts, iceFrame } from './b15_lago_logic.js';
import { LAGO, lakeToMap } from '../maps/b15/layout_lago.js';
import { FIELD_TEXT } from '../zygarde/texts.js';

export const MAP_ID = 'boreal_lago';
const DIR_NAME = { 2: 'down', 4: 'left', 6: 'right', 8: 'up' };
const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

export const LAKE_TEXT = Object.freeze({
  block: 'Un bloque de hielo del lago, grueso y turbio. Tiene una fisura blanca.',
  ancient: 'Un bloque de hielo oscuro, con capas como las de un tronco. Por dentro brilla algo.',
  ancientAlone: 'Sacarlo sin alguien que sepa tallar sería romperlo. En el pueblo, en los Talleres del Hielo, sabrán qué hacer.',
  rock: 'Una roca nevada que asoma del hielo.',
  fall: '¡Crac! La placa cede bajo tus pies y caes al agua helada…',
  fallBack: 'Sales tiritando a la orilla. El lago vuelve a cerrarse en un momento: está como al principio.',
  reset: 'El agua que asoma entre las grietas vuelve a helarse. El lago está como al principio.',
});

// ───────────────────────────── Estado ─────────────────────────────

export const lakeCounts = (s) => decodeCounts(s?.var?.(V.lake, '') ?? '');
export const lakeBroken = (s) => Number(s?.var?.(V.lakeBlocks, 0)) || 0;

/** Estado del lago a partir de la partida y la casilla del jugador en el plano. */
function lakeState(s, x, y) {
  return { x, y, counts: lakeCounts(s), broken: lakeBroken(s), fell: false, solved: false };
}

export function resetLake(state) {
  state.setVar(V.lake, encodeCounts(new Array(LAKE.ice.length).fill(0)));
  state.setVar(V.lakeBlocks, 0);
}

// ───────────────────────────── Resbalar y caer ─────────────────────────────

async function fall(ctx) {
  ctx.se?.('Ice Smash');
  ctx.se?.('PRSFX- Splash');
  ctx.shake(4, 8, 16);
  await ctx.flash([200, 230, 255], 10, 170);
  await ctx.say(LAKE_TEXT.fall);
  await ctx.fade('out', 24);
  resetLake(ctx.state);
  ctx.setVar(V.lakeFalls, (Number(ctx.var(V.lakeFalls, 0)) || 0) + 1);
  ctx.requestRefresh();
  const R = LAGO.respawn;
  await ctx.warp(MAP_ID, R.x, R.y, R.dir, { fade: false });
  await ctx.fade('in', 24);
  await ctx.say(LAKE_TEXT.fallBack);
}

/**
 * Al pisar una placa: resbala con las reglas del plano. (lx, ly) = placa recién pisada; el jugador venía de la
 * casilla anterior en su dirección.
 */
export async function iceStep(ctx, lx, ly) {
  if (ctx.flag(F.ancientBlock)) return;
  const dir = ctx.player.direction;
  const [dx, dy] = DV[dir];
  const res = move(LAKE, lakeState(ctx.state, lx - dx, ly - dy), dir);
  if (!res.moved) return;
  const counts = lakeCounts(ctx.state);
  const p = ctx.player;
  const keepAnime = p.walkAnime;
  p.walkAnime = false;
  try {
    for (let i = 0; i < res.path.length; i++) {
      const [x, y] = res.path[i];
      if (i > 0) await ctx.move('player', [DIR_NAME[dir]], { through: true, speed: 5 });
      const k = LAKE.iceIndex(x, y);
      if (k < 0) continue; // orilla
      if (counts[k] >= 2) { p.walkAnime = keepAnime; await fall(ctx); return; }
      counts[k] += 1;
      ctx.setVar(V.lake, encodeCounts(counts));
      ctx.se?.(counts[k] === 2 ? 'PRSFX- Freeze Shock1' : 'PRSFX- Ice Shard', { volume: 55 });
    }
  } finally {
    p.walkAnime = keepAnime;
  }
}

// ───────────────────────────── Bloques y bloque antiguo ─────────────────────────────

async function breakBlock(ctx, bx, by) {
  await ctx.say(LAKE_TEXT.block);
  if (!ctx.zygarde('ram')) { await ctx.say(FIELD_TEXT.ramRock); return; }
  if ((await ctx.choice(['Sí', 'No'], { message: FIELD_TEXT.ramAsk, cancel: 1 })) !== 0) return;
  const [px, py] = [ctx.player.x - LAGO.origin.x, ctx.player.y - LAGO.origin.y];
  const d = Object.entries(DV).find(([, [ox, oy]]) => px + ox === bx && py + oy === by);
  if (!d) return;
  const r = ram(LAKE, lakeState(ctx.state, px, py), Number(d[0]));
  if (!r.broke) return;
  ctx.se?.('PRSFX- Head Smash');
  await ctx.flash([255, 255, 255], 6, 110);
  ctx.shake(5, 9, 14);
  ctx.se?.('Ice Smash');
  const ev = ctx.event;
  for (let f = 1; f <= 10; f++) { ev.opacity = Math.round(255 * (1 - f / 10)); await ctx.wait(1); }
  ctx.setVar(V.lakeBlocks, r.state.broken);
  ev.opacity = 255;
  ctx.requestRefresh();
}

/** Pulsar A ante el bloque antiguo: si se está en su casilla vecina y mirándolo, `onAncient(ctx)` (b15_t13.js). */
async function ancientBlock(ctx, onAncient) {
  const [ax, ay] = LAKE.ancient;
  const [px, py] = [ctx.player.x - LAGO.origin.x, ctx.player.y - LAGO.origin.y];
  const d = Object.entries(DV).find(([, [ox, oy]]) => px + ox === ax && py + oy === ay);
  await ctx.say(LAKE_TEXT.ancient);
  if (!d || !canExtract(LAKE, lakeState(ctx.state, px, py), Number(d[0]))) return;
  if (onAncient) await onAncient(ctx);
}

// ───────────────────────────── Eventos ─────────────────────────────

const hideWhenSolved = (s) => !s?.flag(F.ancientBlock);

function cellEvents(onAncient) {
  const out = [];
  for (let ly = 0; ly < LAKE.h; ly++) {
    for (let lx = 0; lx < LAKE.w; lx++) {
      const c = LAKE.at(lx, ly);
      if (!['.', 'B', '#', 'A'].includes(c)) continue;
      const [x, y] = lakeToMap(lx, ly);
      const frame = iceFrame(LAKE, lx, ly);
      const base = { sprite: OBJ.ice[0], ...frame, directionFix: true, walkAnime: false, through: true, shadow: false };
      const idx = LAKE.iceIndex(lx, ly);
      if (idx >= 0) {
        const bi = LAKE.blockIndex(lx, ly);
        const walkable = (s) => bi < 0 || Boolean(lakeBroken(s) & (1 << bi));
        const step = (ctx) => iceStep(ctx, lx, ly);
        out.push({
          id: `placa_${lx}_${ly}`, x, y, name: 'Placa de hielo',
          pages: [0, 1, 2].map((n) => ({
            ...base, sprite: OBJ.ice[n],
            when: (s) => n === 0 || (hideWhenSolved(s) && lakeCounts(s)[idx] === n && walkable(s)),
            trigger: 'touch', script: (ctx) => (walkable(ctx.state) ? step(ctx) : null),
          })),
        });
      } else {
        out.push({ id: `placa_fija_${lx}_${ly}`, x, y, name: 'Hielo', ...base });
      }
      if (c === '#') {
        out.push({ id: `roca_lago_${lx}_${ly}`, x, y, name: 'Roca nevada', sprite: OBJ.rock, dir: 2, pattern: (lx + ly) % 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(LAKE_TEXT.rock); } });
      }
      if (c === 'B') {
        const bi = LAKE.blockIndex(lx, ly);
        out.push({
          id: `bloque_lago_${bi}`, x, y, name: 'Bloque de hielo',
          pages: [{
            when: (s) => hideWhenSolved(s) && !(lakeBroken(s) & (1 << bi)), sprite: SPRITE.iceObject, dir: 2, pattern: bi % 4,
            directionFix: true, walkAnime: false, solid: true, trigger: 'action', glow: { name: 'zygardeFissure', kind: 'rock' },
            script: (ctx) => breakBlock(ctx, lx, ly),
          }],
        });
      }
      if (c === 'A') {
        out.push({
          id: 'bloque_antiguo', x, y, name: 'Bloque antiguo',
          pages: [{ when: hideWhenSolved, sprite: OBJ.ancient, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: (ctx) => ancientBlock(ctx, onAncient) }],
        });
      }
    }
  }
  return out;
}

export function lakeEvents({ onAncient = null } = {}) {
  return cellEvents(onAncient);
}

/** Al entrar en el mapa del lago (sin resolver): el hielo vuelve a estar entero (reintento de TABLILLAS §4.8). */
export async function lakeOnEnter(ctx) {
  if (!ctx.flag(F.ancientBlock)) resetLake(ctx.state);
  ctx.requestRefresh?.();
  await pause(ctx, 1);
}

export { zygardeSays };
