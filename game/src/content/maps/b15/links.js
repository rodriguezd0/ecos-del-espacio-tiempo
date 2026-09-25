// Enlaces del Bloque 15 con mapas de otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no esté registrado
// en content/maps/index.js, el paso queda cerrado con un aviso neutro (eventos del bloque); en cuanto exista
// (node tools/gen_registries.mjs), la conexión se activa sola. Módulo puro (Node y navegador).
// `offset` sigue world/mapLoader.js#connectionOffset: para north/south, x de ESTE mapa donde cae la x 0 del vecino.
import { MAPS } from '../index.js';

/** ¿Está registrado el mapa `id`? */
export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/** Enlaces pendientes: lo que debe respetar el bloque que construya el destino. */
export const PENDING_LINKS = Object.freeze({
  villa_boreal: Object.freeze({
    lagos_alma: Object.freeze({
      dir: 'north', to: 'lagos_alma', block: 'B16', offset: 8,
      expect: 'Los Lagos del Alma (60×60) abren su sendero sur en x 12–15 (= x 20–23 de Villa Boreal, y 0) y conectan south → villa_boreal con offset −8.',
      blocked: 'El sendero sigue hacia los Lagos del Alma, pero por ahora no puedes continuar.',
    }),
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(from, to) {
  const link = PENDING_LINKS[from]?.[to];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}

/** Conexión interna del bloque (el vecino se registra con el mismo bloque): solo si ya existe. */
export function internal(dir, to, offset = 0) {
  return mapRegistered(to) ? [{ dir, to, offset }] : [];
}
