// C001 (docs/CAMPANA.md §2.3 y «B01 — ajustes DECIDIDO-DEV»): la primera Célula de Zygarde, en el parterre
// central de Villa Alba. Aparece al recibir la Pokédex y, al salir del laboratorio, una escena forzada lleva
// al jugador hasta ella: el Core la señala («Aquí. Una parte de mí.») y se recoge. Si la escena se
// interrumpiera, la célula sigue ahí y se recoge al pisarla (tipo zygardeCell).
import { F, when } from './b01_town_common.js';
import { B01_CELLS, cellEvent, collectCell } from './b01_cells.js';
import { findRoute } from './b01_town_path.js';

export const PARTERRE_CELL = B01_CELLS.find((c) => c.id === 'cell_villa_alba_1');
/** Línea del Core en la escena (CAMPANA, literal). */
export const PARTERRE_LINE = 'Aquí. Una parte de mí.';
const GREEN = [185, 255, 102];

const pending = (s) => !s.hasCell(PARTERRE_CELL.id);

/** Escena forzada: el Core nota la célula, el jugador camina hasta el parterre y la recoge. */
export async function parterreScene(ctx) {
  const cell = PARTERRE_CELL;
  await ctx.wait(10);
  ctx.face('player', ctx.directionTo(ctx.player, cell));
  ctx.audio?.playCoreSignal?.();
  const core = ctx.world.core;
  if (core?.visible) {
    core.turnToward(cell);
    await ctx.emote('core', '!');
  }
  await ctx.flash(GREEN, 16, 110);
  await ctx.say(PARTERRE_LINE, { telepathy: true });
  const p = ctx.player;
  const route = findRoute(p, cell.x, cell.y, { onto: true, canStep: (x, y, d) => p.passable(x, y, d) });
  if (route?.length) await ctx.move('player', route, { through: false });
  else if (route === null) await ctx.movePlayerTo(cell.x, cell.y, { through: false });
  ctx.face('player', 'down');
  await collectCell(ctx, cell.id, { react: false });
}

/** Eventos de Villa Alba: la célula (visible con la Pokédex) y el director de la escena (auto, una vez). */
export function parterreCellEvents() {
  const afterDex = when({ all: [F.dex] });
  return [
    cellEvent(PARTERRE_CELL, { when: afterDex }),
    {
      id: 'escena_celula_parterre', x: 0, y: 1, trigger: 'auto',
      when: when({ all: [F.dex], test: pending }),
      script: parterreScene,
    },
  ];
}
