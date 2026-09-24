// Enlaces del Bloque 9a con mapas que construyen otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no
// esté registrado en content/maps/index.js, el borde queda cerrado con un aviso neutro; en cuanto exista
// (node tools/gen_registries.mjs) la conexión se activa sola. Módulo puro (Node y navegador).
// `offset` (ARCHITECTURE §5, world/mapLoader.js): para north/south, x de ESTE mapa donde cae la x 0 del vecino; para
// west/east, la y de ESTE mapa donde cae la y 0 del vecino. `expect` = lo que debe respetar el bloque que construya el
// destino (o se ajusta aquí el offset si ya lo fijó él).
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/** Conexiones internas del bloque (los dos lados son de B09a). */
export const INTERNAL = Object.freeze({
  // Ruta 7 (oeste, camino y 20–23 · vía y 5) ↔ Lúmina (este, avenida y 30–33 · vía y 15).
  ruta7ToLumina: -10,
  luminaToRuta7: 10,
  // Lúmina (sur, x 34–37) ↔ Ruta 14 (norte, x 28–31).
  luminaToRuta14: 6,
  ruta14ToLumina: -6,
});

export const PENDING_LINKS = Object.freeze({
  ruta_7: Object.freeze({
    ciudad_estrato: Object.freeze({
      dir: 'east', to: 'ciudad_estrato', block: 'B08', offset: -6,
      expect: 'Ciudad Estrato (56×48) abre su salida oeste en las filas 22–25 (= y 16–19 de la Ruta 7) y conecta west → ruta_7 con offset 6. La vía del tren entra por la fila 11 de Estrato (= y 5 de la Ruta 7).',
      blocked: 'El valle sigue hacia Ciudad Estrato, pero por ahora no puedes continuar.',
    }),
    calzada_rey: Object.freeze({
      dir: 'north', to: 'calzada_rey', block: 'B19', offset: 58,
      expect: 'La Calzada del Rey abre su salida sur en x 2–5 (= x 60–63 de la Ruta 7) y conecta south → ruta_7 con offset −58. El paso requiere Reconstrucción (lo decide B19).',
      blocked: 'Un cartel: «Mirador de la Calzada. Paso cerrado: el borde de la Sima no es seguro».',
    }),
  }),
  ciudad_lumina: Object.freeze({
    ruta_8_marisma: Object.freeze({
      dir: 'west', to: 'ruta_8_marisma', block: 'B09b', offset: -54,
      expect: 'La Ruta 8 (50×70) abre su salida este en las filas 63–66 (= y 9–12 de Lúmina) y conecta east → ciudad_lumina con offset 54. El barro (Terreno complicado) lo pone la Ruta 8.',
      blocked: 'El camino de la marisma sigue hacia el noroeste, pero por ahora no puedes continuar.',
    }),
    mirador_sur: Object.freeze({
      dir: 'north', to: 'mirador_sur', block: 'B17', offset: 20,
      expect: 'El Mirador Sur abre su camino sur en x 13–16 (= x 33–36 de Lúmina) y conecta south → ciudad_lumina con offset −20. La verja de Lúmina se quita sola cuando el mapa exista.',
      blocked: 'MIRADOR SUR\nAcceso cerrado: desprendimientos en el borde de la Sima.',
    }),
  }),
  ruta_14_reserva: Object.freeze({
    ciudad_nexo: Object.freeze({
      dir: 'south', to: 'ciudad_nexo', block: 'B09b', offset: -2,
      expect: 'Ciudad Nexo (64×52) abre su camino norte en x 30–33 (= x 28–31 de la Ruta 14) y conecta north → ruta_14_reserva con offset 2.',
      blocked: 'El camino del delta sigue hacia Ciudad Nexo, pero por ahora no puedes continuar.',
    }),
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(from, to) {
  const link = PENDING_LINKS[from]?.[to];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}

/** Texto del aviso de un enlace cerrado. */
export function blockedText(from, to) {
  return PENDING_LINKS[from]?.[to]?.blocked || 'Por ahora no puedes continuar.';
}
