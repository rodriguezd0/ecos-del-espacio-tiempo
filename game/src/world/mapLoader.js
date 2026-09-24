// Construcción de mapas a partir de su definición (content/maps/<id>.js). Puro: lo usan MapScene
// (navegador) y las herramientas/tests de Node, que aportan las dependencias.
import { MapBuilder } from './mapBuilder.js';
import { GameMap } from './gameMap.js';

/** Valida los campos mínimos de una definición de mapa. */
export function validateMapDef(def) {
  if (!def || typeof def !== 'object') throw new Error('Definición de mapa vacía');
  const errs = [];
  if (!def.id) errs.push('id');
  if (!Number.isInteger(def.tileset)) errs.push('tileset');
  if (!Number.isInteger(def.width) || def.width <= 0) errs.push('width');
  if (!Number.isInteger(def.height) || def.height <= 0) errs.push('height');
  if (typeof def.build !== 'function' && !def.layers) errs.push('build()');
  if (errs.length) throw new Error(`Mapa ${def.id || '?'}: faltan o son inválidos: ${errs.join(', ')}`);
  for (const w of def.warps || []) {
    if (!Number.isInteger(w.x) || !Number.isInteger(w.y) || !w.to) throw new Error(`Mapa ${def.id}: warp inválido ${JSON.stringify(w)}`);
  }
  return def;
}

/**
 * Ejecuta build(b) y devuelve { width, height, layers, markers, stamps }.
 * deps: { library, paintBrush, isEmpty, anilMap, warn }
 */
export function buildMap(def, deps = {}) {
  validateMapDef(def);
  if (def.layers) {
    return { width: def.width, height: def.height, tileset: def.tileset, layers: def.layers.map((l) => Uint16Array.from(l)), markers: [], stamps: [] };
  }
  const b = new MapBuilder({
    width: def.width,
    height: def.height,
    tileset: def.tileset,
    id: def.id,
    seed: def.seed,
    library: deps.library,
    paintBrush: deps.paintBrush,
    stamps: def.stamps,
    brushes: def.brushes,
    fallback: def.fallback,
    isEmpty: deps.isEmpty,
    anilMap: deps.anilMap,
    warn: deps.warn,
  });
  def.build(b);
  return b.build();
}

/** Entrada de mapa lista para World: { id, def, map: GameMap, offset }. */
export function createEntry(def, built, tilesetData) {
  const map = new GameMap({ id: def.id, def, built, tileset: tilesetData });
  return { id: def.id, def, map, offset: { x: 0, y: 0 }, events: null };
}

/** Desplazamiento (en casillas) de un mapa conectado respecto al actual. */
export function connectionOffset(conn, curDef, otherDef) {
  const off = conn.offset || 0;
  switch (conn.dir) {
    case 'north': return { x: off, y: -otherDef.height };
    case 'south': return { x: off, y: curDef.height };
    case 'west': return { x: -otherDef.width, y: off };
    case 'east': return { x: curDef.width, y: off };
    default: throw new Error(`Conexión con dirección desconocida "${conn.dir}" en ${curDef.id}`);
  }
}
