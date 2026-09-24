// Enlaces del Bloque 1 con mapas que construirán otros bloques (docs/CAMPANA.md §1.4). Mientras el mapa de
// destino no esté registrado en content/maps/index.js, el enlace queda cerrado con un aviso neutro; en cuanto
// exista (node tools/gen_registries.mjs), la conexión se activa sola sin tocar este bloque.
// Módulo puro (Node y navegador). Lo usa también tools/validate_content.mjs.
import { MAPS } from '../index.js';

/** ¿Está registrado el mapa `id`? */
export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * Enlaces pendientes. `offset` = desplazamiento de la conexión (ARCHITECTURE §5): para `south`, x de la
 * Ruta 1 donde cae la x 0 del vecino; para `west`, y de la Ruta 1 donde cae la y 0 del vecino.
 * `expect` = lo que el bloque que construya el destino debe respetar (o ajustar aquí el offset).
 */
export const PENDING_LINKS = Object.freeze({
  villa_zaguan: Object.freeze({
    from: 'ruta_1', dir: 'south', to: 'villa_zaguan', block: 'B02', offset: -5,
    expect: 'Villa Zaguán abre su camino norte en x 18–21 (= x 13–16 de la Ruta 1).',
    blocked: 'El sendero sigue hacia Villa Zaguán, pero por ahora no puedes continuar.',
  }),
  ruta_10: Object.freeze({
    from: 'ruta_1', dir: 'west', to: 'ruta_10', block: 'B11', offset: -4,
    expect: 'La Ruta 10 (tramo bajo) abre su salida este en y 20–21 (= y 16–17 de la Ruta 1).',
    blocked: 'El camino del oeste está cortado por un desprendimiento.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
