// Enlaces del Bloque 3 con mapas que construyen otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el mapa de
// destino no esté registrado en content/maps/index.js, el enlace queda cerrado con un aviso neutro; en cuanto
// exista (node tools/gen_registries.mjs), la conexión se activa sola sin tocar este bloque.
// Módulo puro (Node y navegador). `offset` sigue ARCHITECTURE §5: para north/south, x de ESTE mapa donde cae la
// x 0 del vecino (x vecino = x propia − offset); para west/east, lo mismo con la y.
import { MAPS } from '../index.js';

/** ¿Está registrado el mapa `id`? */
export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * Enlaces pendientes por mapa de este bloque. `expect` = lo que debe respetar el bloque que construya el destino
 * (o ajustar aquí el offset si ya lo ha fijado él). `blocked` = aviso mientras tanto.
 */
export const PENDING_LINKS = Object.freeze({
  ruta_2: Object.freeze({
    villa_zaguan: Object.freeze({
      dir: 'north', to: 'villa_zaguan', block: 'B02', offset: -5,
      expect: 'Villa Zaguán abre su camino sur en x 18–21 (= x 13–16 de la Ruta 2) y conecta south → ruta_2 con offset 5.',
      blocked: 'El camino sigue hacia Villa Zaguán, pero por ahora no puedes continuar.',
    }),
  }),
  ciudad_caudal: Object.freeze({
    ruta_3: Object.freeze({
      // Alineado con maps/b04/ruta_3_layout.js: su camino este (y 32–34) = sendero de la ribera de Caudal (y 3–5) y
      // su Albo (y 39–42) = el río de Caudal (y 10–13).
      dir: 'west', to: 'ruta_3', block: 'B04', offset: -29,
      expect: 'La Ruta 3 conecta east → ciudad_caudal con offset 29: su camino este (y 32–34) cae en el sendero de la ribera de Caudal (y 3–5) y su río (y 39–42) en el Albo de Caudal (y 10–13).',
      blocked: 'El sendero de la ribera sigue río arriba hacia la Garganta del Albo, pero hoy está cortado.',
    }),
    ruta_4: Object.freeze({
      dir: 'east', to: 'ruta_4', block: 'B05', offset: 15,
      expect: 'La Ruta 4 abre su salida oeste en y 14–15 (= y 29–30 del Camino de la Vega de Caudal) y conecta west → ciudad_caudal con offset −15.',
      blocked: 'Más allá empieza la vega del Albo. Está inundada: por ahora no se puede cruzar.',
    }),
    senda_mirador: Object.freeze({
      dir: 'south', to: 'senda_mirador', block: 'B17', offset: 30,
      expect: 'La Senda del Mirador abre su camino norte en x 14–17 (= x 44–47 de Caudal) y conecta north → ciudad_caudal con offset −30.',
      blocked: 'PASO CERRADO\nLa senda hacia el Mirador de la Sima está cerrada por desprendimientos.',
    }),
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(from, to) {
  const link = PENDING_LINKS[from]?.[to];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
