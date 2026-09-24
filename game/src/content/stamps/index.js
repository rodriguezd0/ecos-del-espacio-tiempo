// Biblioteca de stamps y brushes por tileset (docs/ARCHITECTURE.md §5, catálogo en docs/stamps.md).
// Módulo puro (sin DOM): lo usan el MapBuilder en el navegador y las herramientas/tests en Node.
//
// Cada tileset tiene:
//   <Imagen>.js         definición legible (src/from/tiles + metadatos + brushes)
//   baked/<Imagen>.js   GENERADO por `node tools/stamps_bake.mjs`: rejillas de IDs ya resueltas
//                       (los recortes `from` de mapas de Añil no están disponibles en tiempo de ejecución).
//
// API:
//   await loadStampLibrary(tilesetId) → StampLibrary
//   buildStampLibrary(def, baked)     → StampLibrary (síncrono; tests/herramientas)
//   lib.stamp(name) → Stamp { name, w, h, layers: [number[]|null ×3], door?, footprint?, tags, desc, ... }
//   lib.brush(name) → definición del brush (ver brushes.js → paintBrush)
//   lib.byTag(tag)  → [Stamp]
//   stampWrites(stamp, x, y, opts?) → [{ x, y, layer, id }] (solo celdas no vacías)

export const STAMP_LIBRARIES = {
  7: { image: 'ExteriorBosqueCeleste', def: () => import('./ExteriorBosqueCeleste.js'), baked: () => import('./baked/ExteriorBosqueCeleste.js') },
  4: { image: 'Interior1', def: () => import('./Interior1.js'), baked: () => import('./baked/Interior1.js') },
  2: { image: 'Cueva1', def: () => import('./Cueva1.js'), baked: () => import('./baked/Cueva1.js') },
  // Derivadas de ExteriorBosqueCeleste (misma disposición de IDs; ver derive.js)
  1: { image: 'Exterior1', def: () => import('./Exterior1.js'), baked: () => import('./baked/Exterior1.js') },
  3: { image: 'Exterior2', def: () => import('./Exterior2.js'), baked: () => import('./baked/Exterior2.js') },
  5: { image: 'Exterior3', def: () => import('./Exterior3.js'), baked: () => import('./baked/Exterior3.js') },
  6: { image: 'ExteriorSafari', def: () => import('./ExteriorSafari.js'), baked: () => import('./baked/ExteriorSafari.js') },
  9: { image: 'ExteriorPrisma', def: () => import('./ExteriorPrisma.js'), baked: () => import('./baked/ExteriorPrisma.js') },
  11: { image: 'InteriorTorre', def: () => import('./InteriorTorre.js'), baked: () => import('./baked/InteriorTorre.js') },
  8: { image: 'InteriorLiga', def: () => import('./InteriorLiga.js'), baked: () => import('./baked/InteriorLiga.js') },
};

/** Tilesets que comparten imagen (y por tanto IDs) con una biblioteca existente. */
export const TILESET_ALIASES = { 12: 2, 13: 2, 14: 2, 15: 2 };

const LAYERS = 3;

/**
 * Firma de la geometría de un stamp: si cambia la definición, el horneado queda obsoleto.
 * Debe calcularse igual aquí y en tools/stamps_bake.mjs.
 */
export function stampSignature(def) {
  const geo = { src: def.src ?? null, from: def.from ?? null, tiles: def.tiles ?? null, layer: def.layer ?? null, skip: def.skip ?? null };
  const s = JSON.stringify(geo);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function freezeStamp(name, def, bakedEntry, image) {
  if (!bakedEntry) {
    throw new Error(`Stamp "${name}" de ${image} sin hornear: ejecuta "node tools/stamps_bake.mjs ${image}"`);
  }
  if (bakedEntry.sig !== stampSignature(def)) {
    throw new Error(`Stamp "${name}" de ${image} cambió desde el horneado: ejecuta "node tools/stamps_bake.mjs ${image}"`);
  }
  const { src: _s, from: _f, tiles: _t, skip: _k, ...meta } = def;
  const layers = [];
  for (let l = 0; l < LAYERS; l++) layers.push(bakedEntry.layers[l] ? Object.freeze(bakedEntry.layers[l].slice()) : null);
  return Object.freeze({
    ...meta,
    name,
    w: bakedEntry.w,
    h: bakedEntry.h,
    layers: Object.freeze(layers),
    tags: Object.freeze([...(def.tags || [])]),
    desc: def.desc || '',
  });
}

/** Construye la biblioteca a partir de la definición y su horneado (valida que estén sincronizados). */
export function buildStampLibrary(def, baked) {
  if (!def || !def.stamps) throw new Error('Definición de stamps inválida (falta "stamps")');
  if (!baked || baked.tileset !== def.tileset) {
    throw new Error(`Horneado de ${def.image} ausente o de otro tileset: ejecuta "node tools/stamps_bake.mjs ${def.image}"`);
  }
  const stamps = {};
  for (const [name, sdef] of Object.entries(def.stamps)) stamps[name] = freezeStamp(name, sdef, baked.stamps[name], def.image);
  const brushes = Object.freeze({ ...(def.brushes || {}) });
  const frozenStamps = Object.freeze(stamps);
  return Object.freeze({
    tileset: def.tileset,
    image: def.image,
    stamps: frozenStamps,
    brushes,
    stamp(name) {
      const s = frozenStamps[name];
      if (!s) throw new Error(`Stamp desconocido en ${def.image}: "${name}"`);
      return s;
    },
    brush(name) {
      const b = brushes[name];
      if (!b) throw new Error(`Brush desconocido en ${def.image}: "${name}"`);
      return b;
    },
    byTag(tag) {
      return Object.values(frozenStamps).filter((s) => s.tags.includes(tag));
    },
  });
}

const cache = new Map();

/** Carga (con caché) la biblioteca de un tileset por su ID de tilesets.json. */
export async function loadStampLibrary(tilesetId) {
  const id = TILESET_ALIASES[tilesetId] ?? tilesetId;
  const entry = STAMP_LIBRARIES[id];
  if (!entry) throw new Error(`No hay biblioteca de stamps para el tileset ${tilesetId}`);
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      const [defMod, bakedMod] = await Promise.all([entry.def(), entry.baked()]);
      return buildStampLibrary(defMod.default, bakedMod.default);
    })());
  }
  try {
    return await cache.get(id);
  } catch (err) {
    cache.delete(id);
    throw err;
  }
}

/**
 * Escrituras de tiles para colocar `stamp` con su esquina superior izquierda en (x, y).
 * opts.layer fuerza todas las celdas del stamp a una capa (útil para stamps de una sola capa).
 */
export function stampWrites(stamp, x, y, opts = {}) {
  const out = [];
  for (let l = 0; l < LAYERS; l++) {
    const grid = stamp.layers[l];
    if (!grid) continue;
    for (let dy = 0; dy < stamp.h; dy++) {
      for (let dx = 0; dx < stamp.w; dx++) {
        const id = grid[dx + dy * stamp.w];
        if (id) out.push({ x: x + dx, y: y + dy, layer: opts.layer ?? l, id });
      }
    }
  }
  return out;
}

/** Casilla absoluta de la puerta de un stamp colocado en (x, y), o null. */
export function stampDoor(stamp, x, y) {
  return stamp.door ? { x: x + stamp.door[0], y: y + stamp.door[1] } : null;
}
