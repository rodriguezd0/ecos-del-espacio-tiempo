// Nombres de mapa para la UI (ranuras de guardado, notas del Pokémon). Se resuelven desde las
// definiciones de content/maps (campo `name`) y se cachean; sin nombre conocido → ''.
import { engine } from '../../core/engine.js';

const cache = new Map();

/** Nombre ya conocido (síncrono) o ''. */
export function mapName(mapId) {
  if (!mapId) return '';
  if (cache.has(mapId)) return cache.get(mapId);
  const names = engine.mapNames || engine.data?.mapNames;
  return (names && names[mapId]) || '';
}

/** Carga los nombres de una lista de mapas (ignora los desconocidos). */
export async function resolveMapNames(ids) {
  const pending = [...new Set(ids.filter((id) => id && !cache.has(id)))];
  if (!pending.length) return;
  let registry;
  try {
    registry = await import('../../content/maps/index.js');
  } catch (err) {
    console.warn('[ui] No se pudo cargar el registro de mapas', err);
    return;
  }
  await Promise.all(pending.map(async (id) => {
    try {
      const def = await registry.loadMapDefinition(id);
      cache.set(id, (def && def.name) || '');
    } catch {
      cache.set(id, '');
    }
  }));
}
