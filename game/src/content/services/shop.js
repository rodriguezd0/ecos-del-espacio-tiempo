// Tiendas: stock por progreso de la campaña (Pilares restaurados), dependiente reutilizable y plantilla
// de interior de tienda independiente. La interfaz es ui.openShop (ui/screens/shop.js).
//
// Tablas de stock TÉCNICAS provisionales (curva de BW2 adaptada a los Pilares de docs/CAMPANA.md): cada
// tramo se añade al anterior al restaurar ese número de Pilares. Una tienda concreta puede sumar o quitar
// objetos (`extra`, `remove`) o usar su propia lista fija (`items`).
import { restoredPillars } from './stages.js';
import {
  INTERIOR_TILESET, SERVICE_BRUSHES, SERVICE_STAMPS, SERVICE_FALLBACK, exitWarps, exitArrowEvents, furnitureEvents,
} from './interior.js';
import { zoneDefaults } from './zones.js';

export const STOCK_TABLES = Object.freeze({
  // Tienda general (Centro Pokémon y tiendas de pueblo).
  general: Object.freeze([
    { pillars: 0, items: ['POKEBALL', 'POTION', 'ANTIDOTE', 'PARALYZEHEAL', 'AWAKENING'] },
    { pillars: 1, items: ['GREATBALL', 'SUPERPOTION', 'REPEL', 'BURNHEAL', 'ICEHEAL'] },
    { pillars: 3, items: ['SUPERREPEL', 'REVIVE'] },
    { pillars: 5, items: ['ULTRABALL', 'HYPERPOTION', 'FULLHEAL'] },
    { pillars: 7, items: ['MAXREPEL', 'MAXPOTION'] },
    { pillars: 8, items: ['FULLRESTORE'] },
  ]),
  // Poké Balls especiales (grandes almacenes o mostradores de ciudad).
  balls: Object.freeze([
    { pillars: 1, items: ['NESTBALL', 'NETBALL'] },
    { pillars: 3, items: ['DIVEBALL', 'REPEATBALL', 'TIMERBALL'] },
    { pillars: 5, items: ['DUSKBALL', 'QUICKBALL', 'HEALBALL'] },
    { pillars: 7, items: ['LUXURYBALL'] },
  ]),
  // Tienda de pesca (Caleta Sonda): las Balls útiles junto al agua.
  fishing: Object.freeze([
    { pillars: 0, items: ['NETBALL', 'DIVEBALL', 'LUREBALL'] },
  ]),
});

export const DEFAULT_CLERK_SPRITE = 'tendero';

/**
 * Objetos en venta según el progreso. Puro.
 * @param {object} state GameState (o { flag(k) })
 * @param {{ list?: string, items?: string[], extra?: string[], remove?: string[], pillars?: number }} opts
 *   list: tabla de STOCK_TABLES ('general' por defecto) · items: lista fija (ignora la tabla)
 *   extra/remove: objetos añadidos o quitados · pillars: fuerza el nº de Pilares (pruebas)
 * @returns {string[]} ids sin duplicados, en orden de tabla
 */
export function shopStock(state, { list = 'general', items = null, extra = [], remove = [], pillars = null } = {}) {
  let base;
  if (Array.isArray(items)) {
    base = items;
  } else {
    const table = STOCK_TABLES[list];
    if (!table) throw new Error(`Tabla de tienda desconocida: "${list}"`);
    const n = Number.isFinite(pillars) ? pillars : restoredPillars(state);
    base = table.filter((tier) => n >= tier.pillars).flatMap((tier) => tier.items);
  }
  const out = [];
  for (const id of [...base, ...extra]) if (!out.includes(id) && !remove.includes(id)) out.push(id);
  return out;
}

/**
 * Abre la tienda desde un guion. opts: los de shopStock + { greeting, mode, prices }.
 * Devuelve la lista vendida (útil en pruebas).
 */
export async function openMart(ctx, opts = {}) {
  const stock = shopStock(ctx.state, opts);
  if (!stock.length) {
    await ctx.say('Lo siento, ahora mismo no tenemos nada a la venta.');
    return stock;
  }
  await ctx.ui.openShop(stock, { greeting: opts.greeting, mode: opts.mode, prices: opts.prices });
  return stock;
}

/**
 * Evento del dependiente. Uso en un mapa: `clerkEvent({ x: 13, y: 11, dir: 4 })`.
 * opts: { id, x, y, dir, sprite, list, items, extra, remove, greeting, prices, when }
 */
export function clerkEvent({ id = 'dependiente', x, y, dir = 2, sprite = DEFAULT_CLERK_SPRITE, when, ...shop } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`clerkEvent(${id}): x/y enteros obligatorios`);
  return {
    id, x, y, sprite, dir, move: 'still', when,
    script: async (ctx) => { await openMart(ctx, shop); },
  };
}

// ------------------------------------------------------------ interior de tienda independiente
export const SHOP_LAYOUT = Object.freeze({
  width: 15, height: 12,
  room: { x: 1, y: 1, w: 13, h: 9 },
  door: { x: 4, y: 9 },
  counter: { x: 8, y: 6 },
  clerk: { x: 9, y: 8, dir: 4 },
  shelves: [{ x: 2, y: 3 }, { x: 8, y: 3 }],
  plant: { x: 13, y: 4 },
});

/**
 * Definición completa del interior de una tienda. Uso en content/maps/<bloque>/<id>.js:
 *   export default shopMap({ id: 'caleta_tienda', exit: { map: 'caleta_sonda', x: 12, y: 9 }, list: 'fishing' });
 * opts: { id, name, exit: { map, x, y, dir }, bgm, list, items, extra, remove, greeting, prices, sprite, events }
 */
export function shopMap(opts = {}) {
  const { id, exit, events = [], sprite = DEFAULT_CLERK_SPRITE } = opts;
  if (!id) throw new Error('shopMap: falta el id del mapa');
  const L = SHOP_LAYOUT;
  const zone = zoneDefaults(exit?.map);
  const { x: dx, y: dy } = L.door;
  return {
    id,
    name: opts.name ?? zone.name ?? '',
    tileset: INTERIOR_TILESET,
    width: L.width,
    height: L.height,
    outdoor: false,
    bgm: opts.bgm ?? zone.bgm ?? 'town',
    battleback: 'indoor',
    showLocation: false,
    start: { x: dx, y: dy, dir: 8 },
    brushes: SERVICE_BRUSHES,
    stamps: SERVICE_STAMPS,
    fallback: SERVICE_FALLBACK,
    build(b) {
      const r = L.room;
      b.fill(null, 'svc_vacio');
      b.rect(null, r.x, r.y, r.w, r.h, 'svc_habitacion_centro');
      b.stamp('svc_salida_centro', dx - 2, dy);
      for (const s of L.shelves) b.stamp('svc_revistero', s.x, s.y);
      b.stamp('svc_mostrador_tienda', L.counter.x, L.counter.y);
      if (b.hasStamp('planta')) b.stamp('planta', L.plant.x, L.plant.y);
    },
    warps: exitWarps(dx, dy, exit || {}),
    events: [
      ...exitArrowEvents(dx, dy + 1),
      clerkEvent({ ...opts, id: 'dependiente', x: L.clerk.x, y: L.clerk.y, dir: L.clerk.dir, sprite }),
      ...L.shelves.flatMap((s, i) => furnitureEvents(`estante${i}`, s.x, s.y + 2, 4, 'Estanterías llenas de productos para entrenadores.')),
      ...events,
    ],
  };
}
