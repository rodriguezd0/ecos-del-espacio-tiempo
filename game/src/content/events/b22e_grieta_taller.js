import { F, V, OBJ, eventById } from './b22e_common.js';
import { IRON_ROOM, TALLER } from '../maps/b22e/grieta_layout.js';
import { normalizeState, ram, isLocked, isSolved, resetRoom } from './b22e_iron_logic.js';

export const ironState = (s) => normalizeState(IRON_ROOM, s.var(V.bloques, null));

export function syncBlocks(ctx) {
  const st = ironState(ctx.state);
  st.blocks.forEach(([x, y], i) => {
    const ev = eventById(ctx, `b22e_bloque_${i}`);
    if (!ev || ev.busy()) return;
    if (ev.x !== x || ev.y !== y) ev.moveTo(x, y);
    ev.direction = isLocked(IRON_ROOM, st, i) ? 4 : 2;
  });
}

export async function ramBlock(ctx, index) {
  if (!ctx.zygarde('ram')) { await ctx.say('El bloque pesa demasiado para moverlo a mano.'); return false; }
  const p = ctx.player;
  const r = ram(IRON_ROOM, ironState(ctx.state), p.x, p.y, p.direction);
  if (!r || r.index !== index || !r.moved) {
    await ctx.say('Por este lado no puede deslizarse. Los bloques que encajan en un zócalo quedan fijos.'); return false;
  }
  if (!(await ctx.confirm('¿Embestir el bloque de hierro?'))) return false;
  ctx.se?.('PRSFX- Rock Smash');
  ctx.effect?.('zygardeHexBurst', { x: p.x, y: p.y, mode: 'out', count: 14, frames: 20 });
  const ev = eventById(ctx, `b22e_bloque_${index}`);
  if (ev && ctx.move) {
    const names = { 2: 'down', 4: 'left', 6: 'right', 8: 'up' };
    await ctx.move(ev, [{ speed: 5 }, ...r.path.map(() => names[p.direction])], { through: true, wait: true });
  }
  ctx.setVar(V.bloques, r.state.blocks);
  syncBlocks(ctx);
  if (isSolved(IRON_ROOM, r.state) && !ctx.flag(F.tallerResuelto)) {
    ctx.setFlag(F.tallerResuelto);
    ctx.cry?.('IRONHANDS');
    await ctx.say('Los tres bloques encienden la plataforma. Ferropalmas baja al taller.');
  }
  ctx.requestRefresh?.();
  return true;
}

export function tallerEvents() {
  return [
    ...IRON_ROOM.blocks.map(([x, y], i) => ({ id: `b22e_bloque_${i}`, x, y,
      sprite: OBJ.block, dir: 2, solid: true, directionFix: true, walkAnime: false,
      script: (ctx) => ramBlock(ctx, i) })),
    ...IRON_ROOM.pillars.map(([x, y], i) => ({ id: `b22e_columna_${i}`, x, y, sprite: 'asset:objects/b22e_columna.png',
      solid: true, walkAnime: false, directionFix: true })),
    ...IRON_ROOM.sockets.map(([x, y], i) => ({ id: `b22e_zocalo_${i}`, x, y, sprite: OBJ.socket,
      solid: true, walkAnime: false, directionFix: true })),
    { id: 'b22e_ferropalmas_dormido', x: TALLER.palmas.x, y: TALLER.palmas.y,
      pages: [{ when: (s) => !s.flag(F.tallerResuelto), sprite: 'follower:IRONHANDS:0:0', dir: 2,
        solid: true, script: async (ctx) => ctx.say('Ferropalmas permanece inmóvil sobre la plataforma. Hay tres zócalos vacíos.') }] },
    { id: 'b22e_palanca_taller', x: IRON_ROOM.lever[0], y: IRON_ROOM.lever[1], sprite: OBJ.lever,
      solid: true, script: async (ctx) => {
        if (ctx.flag(F.tallerResuelto)) { await ctx.say('La plataforma está completa. Los tres bloques permanecen encajados.'); return; }
        if (!(await ctx.confirm('¿Reiniciar el taller? Todos los bloques volverán a sus posiciones iniciales.'))) return;
        ctx.setVar(V.bloques, resetRoom(IRON_ROOM, ironState(ctx.state)).blocks);
        syncBlocks(ctx); ctx.se?.('PRSFX- Rock Smash'); ctx.requestRefresh?.();
      } },
  ];
}
