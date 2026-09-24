// Enlaces del Bloque 11 con mapas que construye otro bloque (docs/CAMPANA.md §1.3–1.4). Mientras el mapa de destino
// no esté registrado en content/maps/index.js, el enlace queda cerrado con un aviso neutro; en cuanto exista
// (node tools/gen_registries.mjs), la conexión se activa sola. Módulo puro (Node y navegador).
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * Enlaces pendientes. `offset` = desplazamiento de la conexión (ARCHITECTURE §5): para `south`, x del Neblino donde
 * cae la x 0 del vecino. `expect` = lo que debe respetar el bloque que construya el destino.
 */
export const PENDING_LINKS = Object.freeze({
  aldea_mnemos: Object.freeze({
    from: 'ruta_9_neblino', dir: 'south', to: 'aldea_mnemos', block: 'B10', offset: 0,
    expect: 'La Aldea Mnemos abre su camino norte en x 22–24 (= x 22–24 del Neblino) y conecta `north` con offset 0 '
      + 'hacia ruta_9_neblino (o se ajusta aquí el offset). Antes del P5 su propia niebla corta ese camino.',
    blocked: 'El sendero sigue hacia la Aldea Mnemos, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
