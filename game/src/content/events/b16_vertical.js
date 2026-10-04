// Compatibilidad de los guardados del antiguo santuario de tres alas en un solo mapa.
import { P8_MAPS, SABER, SENTIR, QUERER, TELAR } from '../maps/b16/santuario_layout.js';
import { sentirEvents } from './b16_sentir.js';
import { quererEvents } from './b16_querer.js';
import { telarEvents } from './b16_telar.js';
import { ensurePlayerLooksLikePlayer } from './b16_recuerdo.js';

const inside = (x, y, r) => x >= r.x - 1 && x <= r.x + r.w && y >= r.y - 1 && y <= r.y + r.h;

/** Coordenadas de guardados locales: solo las salas antiguas reconocidas cambian de mapa. */
export function legacySantuarioFloor(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 1;
  if ([QUERER.wind.room, QUERER.azelf.room, TELAR.room].some((r) => inside(x, y, r))) return 3;
  if ([...SENTIR.mirrors.map((m) => m.room), SENTIR.lastMirror.room, SENTIR.mesprit.room].some((r) => inside(x, y, r))) return 2;
  return 1;
}

/** Se ejecuta antes de nearestFreeSpot, mientras aún se conservan las coordenadas del guardado. */
export function redirectSantuarioArrival({ x, y, dir }) {
  const floor = legacySantuarioFloor(x, y);
  return floor === 1 ? null : { map: P8_MAPS[floor], x, y, dir };
}

/** Las recogidas/estados de eventos trasladados siguen vigentes al cargar cualquier planta nueva. */
export function migrateSantuarioSwitches(state, floor) {
  if (floor === 1) return false;
  let changed = false;
  const events = floor === 2 ? sentirEvents() : [...quererEvents(), ...telarEvents()];
  const ids = [...events.map((e) => e.id), floor === 2 ? 'objeto_alma_3' : 'objeto_alma_4'];
  if (floor === 3) ids.push('sello_telar');
  for (const id of ids) for (const letter of ['A', 'B', 'C', 'D']) {
    if (state.selfSwitch(P8_MAPS[1], id, letter) && !state.selfSwitch(P8_MAPS[floor], id, letter)) {
      state.setSelfSwitch(P8_MAPS[floor], id, letter);
      changed = true;
    }
  }
  return changed;
}

export async function enterSantuarioFloor(ctx, floor) {
  await ensurePlayerLooksLikePlayer(ctx);
  if (migrateSantuarioSwitches(ctx.state, floor)) ctx.requestRefresh?.();
  if (floor !== 1) return;
  const targetFloor = legacySantuarioFloor(ctx.player.x, ctx.player.y);
  if (targetFloor === 1) return;
  migrateSantuarioSwitches(ctx.state, targetFloor);
  await ctx.warp(P8_MAPS[targetFloor], ctx.player.x, ctx.player.y, ctx.player.direction || 8);
}

/** Ubicación canónica de los objetos declarados para cada ala. */
export function santuarioItemFloor(item) {
  if (inside(item.x, item.y, SABER.glyphRoom.room) || inside(item.x, item.y, SABER.uxie.room)) return 1;
  return legacySantuarioFloor(item.x, item.y);
}
