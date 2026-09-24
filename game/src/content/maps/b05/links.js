// Enlaces del Bloque 5 con mapas de otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el mapa de destino no esté
// registrado en content/maps/index.js, el enlace queda cerrado con un aviso neutro (eventos del bloque); en cuanto
// exista (node tools/gen_registries.mjs), la conexión se activa sola. Módulo puro (Node y navegador).
// `offset` sigue ARCHITECTURE §5 / world/mapLoader.js#connectionOffset: para north/south, x de ESTE mapa donde cae
// la x 0 del vecino; para west/east, la y.
import { MAPS } from '../index.js';

/** ¿Está registrado el mapa `id`? */
export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/** Ruta 4 (salida este, y 4–7) ↔ Villa Brontia (entrada oeste, y 18–21). */
export const R4_TO_BRONTIA = -14;

/**
 * Enlaces pendientes por mapa de este bloque. `expect` = lo que debe respetar el bloque que construya el destino
 * (o ajustar aquí el offset si ya lo fijó él). `blocked` = aviso mientras tanto.
 */
export const PENDING_LINKS = Object.freeze({
  ruta_4: Object.freeze({
    // Offset acordado con B03 (content/maps/b03/pending_links.js: Caudal conecta east → ruta_4 con offset 15).
    ciudad_caudal: Object.freeze({
      dir: 'west', to: 'ciudad_caudal', block: 'B03', offset: -15,
      expect: 'Ciudad Caudal abre su Camino de la Vega en y 29–30 (= y 14–15 de la Ruta 4) y conecta east → ruta_4 con offset 15.',
      blocked: 'El camino sigue hacia Ciudad Caudal, pero por ahora no puedes continuar.',
    }),
  }),
  villa_brontia: Object.freeze({
    ruta_5: Object.freeze({
      dir: 'east', to: 'ruta_5', block: 'B06', offset: 0,
      expect: 'La Ruta 5 abre su entrada oeste en y 18–21 (= y 18–21 de Brontia) y conecta west → villa_brontia con offset 0.',
      blocked: 'El camino de la meseta sigue hacia el este, pero por ahora no puedes continuar.',
    }),
    ruta_6: Object.freeze({
      dir: 'south', to: 'ruta_6', block: 'B07', offset: 7,
      expect: 'La Ruta 6 abre su camino norte en x 13–16 (= x 20–23 de Brontia) y conecta north → villa_brontia con offset −7. Los vendavales los cierra Brontia hasta p3_restored.',
      blocked: 'El camino baja hacia el cañón, pero por ahora no puedes continuar.',
    }),
    ruta_11: Object.freeze({
      dir: 'north', to: 'ruta_11', block: 'B15', offset: 7,
      expect: 'La Ruta 11 abre su camino sur en x 13–16 (= x 20–23 de Brontia) y conecta south → villa_brontia con offset −7. El hielo-eco lo cierra Brontia hasta p7_restored.',
      blocked: 'El camino sube hacia la vertiente nevada, pero por ahora no puedes continuar.',
    }),
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(from, to) {
  const link = PENDING_LINKS[from]?.[to];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}

/**
 * Puerta del Molino del Diezmo en Ciudad Caudal (B03: content/maps/b03/caudal_layout.js, BUILDINGS.diezmo, puerta
 * en (14,35); su warp entra en molino_diezmo (7,10)). Llegada al salir: la casilla bajo la puerta. Mientras Caudal no
 * exista, la salida del molino devuelve al Camino de la Vega (Ruta 4). Si B03 mueve la puerta, se cambia solo aquí.
 */
export const MOLINO_DOOR = Object.freeze({ map: 'ciudad_caudal', x: 14, y: 35, exitX: 14, exitY: 36, ready: true });
