// Eventos de una sala de ejes a partir de su ASCII (world/axis/logic.js#parseAxisRoom), colocada con la esquina en
// (ox, oy) del mapa. Así la geometría del mapa, los eventos, el solucionador, los tests y el E2E salen de la misma
// descripción. Módulo puro (solo crea definiciones de evento).
//
//   axisRoomEvents(room, { ox, oy, prefix, axisVar, safe, passTile, crystal: { tutorial, tutorialFlag, … },
//                          items: [{ item, count, hidden }…], when }) → [eventos]
//   roomToMap(room, ox, oy, x, y) → { x, y }   ·   roomSafe(room, ox, oy, dir) → punto seguro (la entrada)
import { AXIS_VAR, currentAt, foldPair } from './logic.js';

export const roomToMap = (ox, oy, x, y) => ({ x: ox + x, y: oy + y });

/** Punto seguro de una sala (su entrada E) en coordenadas del mapa. */
export function roomSafe(room, ox, oy, dir = 8) {
  return { x: ox + room.entry.x, y: oy + room.entry.y, dir };
}

export function axisRoomEvents(room, opts = {}) {
  const { ox = 0, oy = 0, prefix = room.name || 'sala', axisVar = AXIS_VAR, passTile, crystal = {}, items = [], when = null } = opts;
  const safe = opts.safe || roomSafe(room, ox, oy);
  const common = { axisVar, ...(when ? { when } : {}) };
  const out = [];
  room.crystals.forEach((c, i) => {
    out.push({ ...crystal, ...common, id: `${prefix}_cristal_${i}`, type: 'axisCrystal', ...roomToMap(ox, oy, c.x, c.y), safe });
  });
  room.debris.forEach((c, i) => {
    out.push({
      ...common, id: `${prefix}_escombro_${c.x}_${c.y}`, type: 'axisDebris', ...roomToMap(ox, oy, c.x, c.y),
      ...(passTile ? { passTile } : {}), phase: (c.x * 3 + c.y * 5 + i) % 4,
    });
  });
  room.currents.forEach((c) => {
    out.push({ ...common, id: `${prefix}_corriente_${c.x}_${c.y}`, type: 'axisCurrent', ...roomToMap(ox, oy, c.x, c.y), dir: currentAt(room, c.x, c.y), safe });
  });
  room.folds.forEach((f) => {
    for (const [a, b] of [[f.a, f.b], [f.b, f.a]]) {
      out.push({ ...common, id: `${prefix}_pliegue_${f.id}_${a.x}_${a.y}`, type: 'axisFold', ...roomToMap(ox, oy, a.x, a.y), to: roomToMap(ox, oy, b.x, b.y) });
    }
  });
  room.items.forEach((c, i) => {
    const it = items[i];
    if (!it) return;
    out.push({ id: `${prefix}_objeto_${i}`, type: 'item', ...roomToMap(ox, oy, c.x, c.y), item: it.item, count: it.count ?? 1, ...(it.hidden ? { hidden: true } : {}) });
  });
  return out;
}

/** ¿Qué hay en la casilla (x, y) del mapa según la sala? (para builds y tests) → carácter o null si está fuera. */
export function roomCharAt(room, ox, oy, x, y) {
  const lx = x - ox;
  const ly = y - oy;
  if (lx < 0 || ly < 0 || lx >= room.w || ly >= room.h) return null;
  return room.at(lx, ly);
}

export { foldPair };
