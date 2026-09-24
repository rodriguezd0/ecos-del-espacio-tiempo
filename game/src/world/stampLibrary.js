// Acceso tolerante a la biblioteca de stamps/brushes (content/stamps, mantenida por otro módulo).
// Si no existe o falla, devuelve una biblioteca vacía y el MapBuilder usa los `fallback` del mapa.

const EMPTY = Object.freeze({ tileset: null, image: null, stamps: {}, brushes: {}, missing: true });
const cache = new Map();
let painterPromise = null;

/**
 * @param {number} tilesetId id de tilesets.json
 * @returns {Promise<{ library: object, paintBrush: Function|null }>}
 */
export function loadBuilderLibrary(tilesetId) {
  if (!cache.has(tilesetId)) cache.set(tilesetId, load(tilesetId));
  return cache.get(tilesetId);
}

async function load(tilesetId) {
  let library = EMPTY;
  try {
    const mod = await import('../content/stamps/index.js');
    library = await mod.loadStampLibrary(tilesetId);
  } catch (err) {
    console.warn(`Biblioteca de stamps del tileset ${tilesetId} no disponible: ${err.message}`);
  }
  return { library, paintBrush: await loadPainter() };
}

function loadPainter() {
  if (!painterPromise) {
    painterPromise = import('../content/stamps/brushes.js')
      .then((m) => m.paintBrush || null)
      .catch(() => null);
  }
  return painterPromise;
}
