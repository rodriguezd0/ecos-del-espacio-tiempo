// Modo desarrollador: catálogo de mapas registrados agrupado por bloque (carpeta de content/maps) con búsqueda por
// nombre o id. Módulo PURO: el bloque sale del texto del import de cada entrada del registro GENERADO
// (`() => import("./b02/villa_zaguan.js")`), así que no hay que mantener otra lista a mano.
import { mapDisplayName } from '../content/services/zones.js';
import { searchList } from './devSearch.js';

export const DEV_GROUP = 'dev';

/** Carpeta del módulo de un mapa ('b02', 'b09a', 'b22d'…) o 'dev' para los mapas de prueba sueltos. */
export function mapFolder(loader) {
  const m = String(loader ?? '').match(/import\(\s*["'`]\.\/([^/"'`]+)\//);
  return m ? m[1] : DEV_GROUP;
}

/** Etiqueta del grupo: 'b02' → 'B02', 'b09a' → 'B09a', 'dev' → 'Pruebas'. */
export function groupLabel(folder) {
  if (folder === DEV_GROUP) return 'Pruebas';
  const m = /^b(\d+)([a-z]*)$/i.exec(folder);
  return m ? `B${m[1].padStart(2, '0')}${m[2]}` : folder;
}

/** Orden de grupos: por número de bloque y sufijo; los de prueba al final. */
function groupOrder(folder) {
  const m = /^b(\d+)([a-z]*)$/i.exec(folder);
  return m ? Number(m[1]) * 100 + (m[2] ? m[2].charCodeAt(0) - 96 : 0) : 1e6;
}

/**
 * Catálogo { groups: [{ folder, label, maps: [{ id, name, folder, group }] }], maps: [...] } a partir del registro
 * MAPS de content/maps/index.js. `nameOf(id)` permite nombres ya cargados de las definiciones.
 */
export function mapCatalog(registry, nameOf = mapDisplayName) {
  const byFolder = new Map();
  for (const [id, loader] of Object.entries(registry || {})) {
    const folder = mapFolder(loader);
    const entry = { id, name: nameOf(id) || id, folder, group: groupLabel(folder) };
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(entry);
  }
  const groups = [...byFolder.entries()]
    .sort(([a], [b]) => groupOrder(a) - groupOrder(b) || a.localeCompare(b))
    .map(([folder, maps]) => ({ folder, label: groupLabel(folder), maps: maps.sort((a, b) => a.id.localeCompare(b.id)) }));
  return { groups, maps: groups.flatMap((g) => g.maps) };
}

/** Busca mapas por nombre, id o grupo («zaguan», «ruinas», «B02», «centro»). */
export function searchMaps(catalog, query) {
  return searchList(catalog.maps, query, (m) => [m.name, m.id, m.group]);
}
