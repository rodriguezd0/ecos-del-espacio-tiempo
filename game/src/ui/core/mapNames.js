// Nombres de mapa para la UI (ranuras de guardado, notas del Pokémon, mapa regional). Orden de búsqueda:
//   1. `name` de la definición del mapa (content/maps), cargada con resolveMapNames() y cacheada;
//   2. catálogo de Axis (content/services/zones.js: todos los ids de docs/CAMPANA.md y los interiores por
//      prefijo, p. ej. 'zaguan_centro' → «Villa Zaguán»), disponible al instante aunque el mapa no exista aún;
//   3. engine.mapNames (tabla opcional). Sin nombre conocido → ''.
import { engine } from '../../core/engine.js';
import { mapDisplayName } from '../../content/services/zones.js';

const cache = new Map();

/** Nombre ya conocido (síncrono) o ''. */
export function mapName(mapId) {
  if (!mapId) return '';
  const own = cache.get(mapId);
  if (own) return own;
  const known = mapDisplayName(mapId);
  if (known) return known;
  const names = engine.mapNames || engine.data?.mapNames;
  return (names && names[mapId]) || '';
}

/** Carga los nombres de una lista de mapas desde sus definiciones (ignora los desconocidos). */
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
    if (!registry.MAPS?.[id]) { cache.set(id, ''); return; }
    try {
      const def = await registry.loadMapDefinition(id);
      cache.set(id, (def && def.name) || '');
    } catch (err) {
      console.warn(`[ui] Nombre del mapa ${id} no disponible`, err);
      cache.set(id, '');
    }
  }));
}
