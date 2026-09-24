// Enlaces del Bloque 6 con mapas que construyen otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no
// esté registrado en content/maps/index.js, el borde queda cerrado con un aviso neutro; en cuanto exista
// (node tools/gen_registries.mjs) la conexión se activa sola. Módulo puro.
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * `offset` (ARCHITECTURE §5): para `west`, fila de la Ruta 5 donde cae la fila 0 del vecino. Villa Brontia (B05,
 * 44×40) y la Ruta 5 (60×40) tienen la misma altura: offset 0, camino en las filas 18–21 de ambas (acordado con
 * content/maps/b05/links.js).
 */
export const PENDING_LINKS = Object.freeze({
  villa_brontia: Object.freeze({
    from: 'ruta_5', dir: 'west', to: 'villa_brontia', block: 'B05', offset: 0,
    expect: 'Villa Brontia abre su salida este (x 43) en las filas 18–21 y conecta `east` con la Ruta 5, offset 0.',
    blocked: 'El camino baja hacia Villa Brontia, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
