// Enlaces del Bloque 2 con mapas que construirán otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el mapa de
// destino no esté registrado en content/maps/index.js, el enlace queda cerrado con un aviso neutro; en cuanto
// exista (node tools/gen_registries.mjs), la conexión se activa sola sin tocar este bloque.
// Módulo puro (Node y navegador).
import { MAPS } from '../index.js';

/** ¿Está registrado el mapa `id`? */
export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * Enlaces pendientes. `offset` = desplazamiento de la conexión (ARCHITECTURE §5): para `south`, x de Villa Zaguán
 * donde cae la x 0 del vecino. `expect` = lo que el bloque que construya el destino debe respetar (o ajustar aquí).
 */
export const PENDING_LINKS = Object.freeze({
  ruta_2: Object.freeze({
    from: 'villa_zaguan', dir: 'south', to: 'ruta_2', block: 'B03', offset: 5,
    expect: 'La Ruta 2 abre su camino norte en x 13–16 (= x 18–21 de Villa Zaguán) y conecta `north` con offset −5.',
    blocked: 'El camino sigue hacia la Ruta 2, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
