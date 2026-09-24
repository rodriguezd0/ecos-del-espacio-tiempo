// Enlaces del Bloque 10 con mapas que construyen otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no
// esté registrado en content/maps/index.js, el borde queda cerrado con un aviso neutro (eventos de
// content/events/b10_mnemos.js); en cuanto exista (node tools/gen_registries.mjs) la conexión se activa sola.
// `offset` (ARCHITECTURE §5 / world/mapLoader.js#connectionOffset): para north/south, x de Mnemos donde cae la x 0 del
// vecino. Si el bloque vecino fija otro trazado, se cambia SOLO aquí (y el README del bloque).
import { MAPS } from '../index.js';
import { EXITS } from './mnemos_layout.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

export const PENDING_LINKS = Object.freeze({
  // Ruta 8 / Marisma Turbia (B09, 50×70): su salida norte (hacia Mnemos, «NO» en el atlas) en x 30–33, offset 0.
  ruta_8_marisma: Object.freeze({
    dir: 'south', to: 'ruta_8_marisma', block: 'B09', offset: 0, x0: EXITS.south.x0, x1: EXITS.south.x1,
    expect: 'La Ruta 8 abre su camino norte en x 30–33 (= x 30–33 de Mnemos) y conecta `north` → aldea_mnemos con offset 0.',
    blocked: 'El camino baja hacia la Marisma Turbia, pero por ahora no puedes continuar.',
  }),
  // Ruta 9 / Bosque Neblino (B11, 50×60): su salida sur (hacia Mnemos) en x 22–24, offset 0 (acordado con
  // content/maps/b11/layout.js NEBLINO.south). La niebla del olvido la cierra Mnemos hasta p5_restored (muro de niebla).
  ruta_9_neblino: Object.freeze({
    dir: 'north', to: 'ruta_9_neblino', block: 'B11', offset: 0, x0: EXITS.north.x0, x1: EXITS.north.x1,
    expect: 'La Ruta 9 abre su camino sur en x 22–24 (= x 22–24 de Mnemos) y conecta `south` → aldea_mnemos con offset 0.',
    blocked: 'El sendero sube hacia el Bosque Neblino, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
