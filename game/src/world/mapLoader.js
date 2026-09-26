// Construcción de mapas a partir de su definición (content/maps/<id>.js). Puro: lo usan MapScene
// (navegador) y las herramientas/tests de Node, que aportan las dependencias.
import { MapBuilder } from './mapBuilder.js';
import { GameMap } from './gameMap.js';
import { sealTreeTips } from './treeTips.js';

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

/** Casillas 'x,y' que un pincel no debe tapar fuera de su trazo: eventos, warps, `start` y `flyPoint`. */
function reservedCells(def) {
  const out = [];
  for (const p of [...(def.events || []), ...(def.warps || []), def.start, def.flyPoint]) {
    if (p && Number.isInteger(p.x) && Number.isInteger(p.y)) out.push(`${p.x},${p.y}`);
  }
  return out;
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
    openSides: Object.fromEntries((def.connections || []).map((c) => [c.dir, true])),
    reserved: reservedCells(def),
  });
  def.build(b);
  return b.build();
}

/**
 * Entrada de mapa lista para World: { id, def, map: GameMap, offset }. Antes sella las puntas de copa que tienen algo
 * encima (world/treeTips.js; modifica built.layers, es idempotente).
 */
export function createEntry(def, built, tilesetData) {
  sealTreeTips(built, tilesetData, def);
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
