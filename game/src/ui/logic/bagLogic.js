// Lógica de la mochila: bolsillos, filtros y ordenación. Módulo PURO.
// La mochila del guardado es { [itemId]: cantidad } (el orden de inserción = orden de obtención).

export const POCKETS = [
  { id: 1, name: 'Objetos' },
  { id: 2, name: 'Medicinas' },
  { id: 3, name: 'Poké Balls' },
  { id: 4, name: 'MT y MO' },
  { id: 5, name: 'Bayas' },
  { id: 6, name: 'Megapiedras' },
  { id: 7, name: 'Obj. Batalla' },
  { id: 8, name: 'Obj. Clave' },
];

/** Bolsillos que se ordenan siempre automáticamente (como BAG_POCKET_AUTO_SORT de Añil). */
export const AUTO_SORT_POCKETS = [4, 5];

export const SORT_MODES = [
  { id: 'obtained', name: 'Por obtención' },
  { id: 'name', name: 'Por nombre' },
  { id: 'type', name: 'Por tipo' },
  { id: 'number', name: 'Por número' },
];

/** Objetos importantes: sin cantidad visible, no se pueden tirar ni vender. */
export function isKeyItem(item) {
  if (!item) return false;
  return item.pocket === 8 || item.fieldUse === 'HM' || (item.flags || []).includes('KeyItem');
}

/** ¿Muestra cantidad? (las MO y objetos clave no). */
export function showsQuantity(item) {
  return !isKeyItem(item);
}

/** Número de MT/MO para ordenar ("MT05" → 5; MO → 1000 + n). */
export function machineNumber(item) {
  const m = /^(MT|MO|DT|TM|HM|TR)\s*0*(\d+)/i.exec(item?.name || item?.id || '');
  if (!m) return 99999;
  const base = /^(MO|HM)/i.test(m[1]) ? 1000 : 0;
  return base + Number(m[2]);
}

function typeRank(item) {
  const f = item.flags || [];
  if (f.includes('PokeBall')) return 1;
  if (f.includes('Healing')) return 2;
  if (item.fieldUse === 'OnPokemon') return 3;
  if (f.includes('EvolutionStone')) return 4;
  if (f.includes('Berry')) return 5;
  if (item.battleUse) return 6;
  if (item.fieldUse) return 7;
  return 8;
}

/**
 * Entradas de un bolsillo, ordenadas.
 * @param {Record<string, number>} bag
 * @param {Record<string, object>} itemsDb   engine.data.items
 * @param {number} pocket
 * @param {{ sort?: string, filter?: (item: object) => boolean, order?: string[] }} opts
 *   order: orden de referencia de IDs (p. ej. Object.keys(itemsDb)) para 'number'.
 * @returns {Array<{ id: string, qty: number, item: object }>}
 */
export function pocketEntries(bag, itemsDb, pocket, opts = {}) {
  const entries = [];
  for (const [id, qty] of Object.entries(bag || {})) {
    const item = itemsDb[id];
    if (!item || qty <= 0) continue;
    if ((item.pocket || 1) !== pocket) continue;
    if (opts.filter && !opts.filter(item)) continue;
    entries.push({ id, qty, item });
  }
  const mode = AUTO_SORT_POCKETS.includes(pocket) ? 'number' : opts.sort || 'obtained';
  return sortEntries(entries, mode, opts.order || Object.keys(itemsDb));
}

/**
 * Devuelve una copia ordenada de las entradas.
 * @param {Array<{id:string, item:object}>} entries
 * @param {'obtained'|'name'|'type'|'number'} mode
 * @param {string[]} order  orden de referencia (IDs) para 'number'
 */
export function sortEntries(entries, mode, order = []) {
  const list = entries.slice();
  const idx = new Map(order.map((id, i) => [id, i]));
  const num = (e) => {
    const mn = machineNumber(e.item);
    if (mn !== 99999) return mn;
    return idx.has(e.id) ? idx.get(e.id) : 1e6;
  };
  const byName = (a, b) => a.item.name.localeCompare(b.item.name, 'es', { sensitivity: 'base' });
  switch (mode) {
    case 'name': return list.sort(byName);
    case 'type': return list.sort((a, b) => typeRank(a.item) - typeRank(b.item) || byName(a, b));
    case 'number': return list.sort((a, b) => num(a) - num(b) || byName(a, b));
    default: return list;
  }
}

/** Cantidad de objetos distintos por bolsillo (para saltar bolsillos vacíos). */
export function pocketCounts(bag, itemsDb, filter) {
  const counts = Object.fromEntries(POCKETS.map((p) => [p.id, 0]));
  for (const [id, qty] of Object.entries(bag || {})) {
    const item = itemsDb[id];
    if (!item || qty <= 0) continue;
    if (filter && !filter(item)) continue;
    counts[item.pocket || 1] = (counts[item.pocket || 1] || 0) + 1;
  }
  return counts;
}

/**
 * Siguiente bolsillo en una dirección (+1/-1). Si `skipEmpty`, salta los vacíos.
 * @returns {number}
 */
export function nextPocket(current, dir, counts, skipEmpty) {
  const n = POCKETS.length;
  let p = current;
  for (let i = 0; i < n; i++) {
    p = ((p - 1 + dir + n) % n) + 1;
    if (!skipEmpty || (counts[p] || 0) > 0) return p;
  }
  return current;
}

/** Precio de venta (la mitad, como en los juegos). */
export function sellPrice(item) {
  return Math.floor((item?.price || 0) / 2);
}

/** Filtros predefinidos para openBag({ filter }). */
export const BAG_FILTERS = {
  battle: (item) => Boolean(item.battleUse),
  balls: (item) => (item.flags || []).includes('PokeBall'),
  holdable: (item) => !isKeyItem(item),
  berries: (item) => (item.flags || []).includes('Berry'),
  sellable: (item) => !isKeyItem(item) && (item.price || 0) > 0,
};
