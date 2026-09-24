// Villa Brontia (B05; docs/CAMPANA.md §1.3 y «B05 — Interludio 2»): pueblo de meseta con molinos y campanario, a
// oscuras desde que el Consorcio se quedó con el «mantenimiento» del Parque Eólico. Centro, tienda, posada (con
// «descansar hasta tormenta»), campanario de Sixto (T03), subestación, casa de Abril, corrales de Wooloo y estación
// (tren tras P4). Salidas: O Ruta 4 · E Ruta 5 (B06) · S Ruta 6 (B07, vendavales hasta P3) · N Ruta 11 (B15,
// hielo-eco hasta P7). Tileset 1. Eventos en content/events/b05_brontia*.js y b05_t03*.js.
import { W, H, buildBrontia } from './villa_brontia_build.js';
import { BUILDINGS, INTERIOR_ENTRIES, FLY_POINT, EXITS, TOWER } from './villa_brontia_layout.js';
import { R4_TO_BRONTIA, linkIfReady } from './links.js';
import { brontiaEvents } from '../../events/b05_brontia.js';
import { brontiaOnEnter } from '../../events/b05_brontia_night.js';
import { VILLA_BRONTIA } from '../../encounters/b05.js';

const door = (bd, to) => {
  const e = INTERIOR_ENTRIES[to];
  return { x: bd.door.x, y: bd.door.y, to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'villa_brontia',
  name: 'Villa Brontia',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'PuebloMarengo',
  battleback: 'Pradera',
  start: { x: 2, y: EXITS.west.y0 + 1, dir: 6 },
  flyPoint: FLY_POINT,
  encounters: VILLA_BRONTIA,

  build: buildBrontia,

  warps: [
    door(BUILDINGS.centro, 'brontia_centro'),
    door(BUILDINGS.tienda, 'brontia_tienda'),
    door(BUILDINGS.abril, 'brontia_casa_abril'),
    door(BUILDINGS.posada, 'brontia_posada'),
    door(BUILDINGS.subestacion, 'brontia_subestacion'),
    door(BUILDINGS.estacion, 'brontia_estacion'),
    { x: TOWER.x, y: TOWER.y, to: 'brontia_campanario', tx: INTERIOR_ENTRIES.brontia_campanario.x, ty: INTERIOR_ENTRIES.brontia_campanario.y, dir: 8, door: true },
  ],

  connections: [
    { dir: 'west', to: 'ruta_4', offset: -R4_TO_BRONTIA },
    ...[linkIfReady('villa_brontia', 'ruta_5'), linkIfReady('villa_brontia', 'ruta_6'), linkIfReady('villa_brontia', 'ruta_11')].filter(Boolean),
  ],

  onEnter: brontiaOnEnter,
  events: brontiaEvents(),
};
