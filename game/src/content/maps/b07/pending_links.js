// Enlaces del Bloque 7 con mapas que construyen otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no
// esté registrado en content/maps/index.js, el borde queda cerrado con un aviso neutro; en cuanto exista
// (node tools/gen_registries.mjs) la conexión se activa sola. Módulo puro.
// `offset` (ARCHITECTURE §5, world/mapLoader.js): para north/south, x de la Ruta 6 donde cae la x 0 del vecino.
import { MAPS } from '../index.js';
import { RUTA6 } from './layout.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * Ciudad Estrato (B08, 56×48, en paralelo). Propuesta: Estrato abre su camino norte (y 0) en x 26–30 y conecta
 * `north` → ruta_6 con offset 13; la Ruta 6 conecta `south` → ciudad_estrato con offset −13 (su salida sur está en
 * x 13–17, y 69). Si B08 fija otras columnas, basta con cambiar `offset` aquí (la vuelta debe ser la opuesta).
 */
export const PENDING_LINKS = Object.freeze({
  ciudad_estrato: Object.freeze({
    dir: 'south', to: 'ciudad_estrato', block: 'B08', offset: -13,
    expect: `Ciudad Estrato abre su camino norte en x ${RUTA6.south.x0 + 13}–${RUTA6.south.x1 + 13} (= x ${RUTA6.south.x0}–${RUTA6.south.x1} de la Ruta 6) y conecta north → ruta_6 con offset 13.`,
    blocked: 'El camino sigue bajando hacia Ciudad Estrato, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
