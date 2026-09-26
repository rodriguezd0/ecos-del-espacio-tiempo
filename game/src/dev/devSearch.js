// Búsquedas del modo desarrollador: especies (con formas) y objetos (items.json + items_axis.json). Módulo PURO.

/** Minúsculas sin tildes ni diéresis (la ñ se conserva) para comparar búsquedas. */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'ñ')
    .trim();
}

/**
 * Filtra una lista por una consulta de varias palabras: cada palabra debe aparecer en alguno de los textos que
 * devuelve `keys(item)`. Orden: primero los que EMPIEZAN por la consulta, luego el resto (estable).
 */
export function searchList(list, query, keys) {
  const q = normalize(query);
  if (!q) return list.slice();
  const words = q.split(/\s+/).filter(Boolean);
  const scored = [];
  list.forEach((item, i) => {
    const texts = keys(item).map(normalize);
    if (!words.every((w) => texts.some((t) => t.includes(w)))) return;
    const starts = texts.some((t) => t.startsWith(q)) ? 0 : 1;
    const exact = texts.some((t) => t === q) ? 0 : 1;
    scored.push({ item, rank: exact * 2 + starts, i });
  });
  scored.sort((a, b) => a.rank - b.rank || a.i - b.i);
  return scored.map((s) => s.item);
}

/**
 * Especies y formas de species.json: [{ species, form, num, name, formName, label }], por número de Pokédex
 * nacional y forma. `label` = «Nombre (Forma)».
 */
export function speciesEntries(db) {
  const out = [];
  for (const sp of Object.values(db?.species || {})) {
    if (!sp?.id) continue;
    out.push({ species: sp.id, form: 0, num: sp.num || 0, name: sp.name || sp.id, formName: sp.formName || '', label: sp.name || sp.id });
    for (const [key, f] of Object.entries(sp.forms || {})) {
      const form = Number(key);
      if (!Number.isInteger(form) || form <= 0) continue;
      const formName = f?.formName || `Forma ${form}`;
      out.push({ species: sp.id, form, num: sp.num || 0, name: sp.name || sp.id, formName, label: `${sp.name || sp.id} (${formName})` });
    }
  }
  return out.sort((a, b) => a.num - b.num || a.form - b.form || a.species.localeCompare(b.species));
}

/** Busca especies por nombre, id o número («25», «pikachu», «mega», «zygarde completa»…). */
export function searchSpecies(db, query, entries = speciesEntries(db)) {
  return searchList(entries, query, (e) => [e.name, e.species, e.formName, String(e.num)]);
}

/** Nombre de bolsillo de la Mochila (pocket 1–8, Essentials). */
export const POCKET_NAMES = Object.freeze({
  1: 'Objetos', 2: 'Medicinas', 3: 'Poké Balls', 4: 'MT/MO', 5: 'Bayas', 6: 'Correo', 7: 'Combate', 8: 'Clave',
});
export const KEY_POCKET = 8;

/** Objetos de la base de datos (ya fusionados con items_axis): [{ id, name, pocket, key }] por nombre. */
export function itemEntries(db) {
  return Object.values(db?.items || {})
    .filter((it) => it && typeof it === 'object' && it.id)
    .map((it) => ({ id: it.id, name: it.name || it.id, pocket: it.pocket || 1, key: it.pocket === KEY_POCKET }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Busca objetos por nombre o id («poción», «POTION», «fragmento azur»). */
export function searchItems(db, query, entries = itemEntries(db)) {
  return searchList(entries, query, (e) => [e.name, e.id]);
}
