// Enlaces del Bloque 4 con mapas de otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no esté
// registrado en content/maps/index.js, el enlace queda cerrado con un aviso neutro; en cuanto exista (node
// tools/gen_registries.mjs), la conexión se activa sola. Módulo puro (Node y navegador).
import { MAPS } from '../index.js';

/** ¿Está registrado el mapa `id`? */
export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * `offset` (ARCHITECTURE §5): para east/west, y de la Ruta 3 donde cae la y 0 del vecino. Acordado con B03
 * (maps/b03/pending_links.js: Caudal conecta west → ruta_3 con offset −29): el camino este de la Ruta 3 (y 32–34)
 * cae en el sendero de la ribera de Caudal (y 3–5) y el Albo (y 39–42) en el río de Caudal (y 10–13).
 */
export const PENDING_LINKS = Object.freeze({
  ciudad_caudal: Object.freeze({
    from: 'ruta_3', dir: 'east', to: 'ciudad_caudal', block: 'B03', offset: 29,
    expect: 'Ciudad Caudal abre su sendero de la ribera en el borde oeste (y 3–5) y conecta west → ruta_3 con offset −29.',
    blocked: 'El sendero de la ribera sigue hacia Ciudad Caudal, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
