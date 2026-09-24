// Enlaces del Bloque 9b (Ruta 8, Ciudad Nexo, Ruta 15 y Caleta Sonda) con los mapas vecinos (docs/CAMPANA.md
// §1.3–1.4). Mientras el destino no esté registrado en content/maps/index.js el borde queda cerrado con un aviso neutro
// (eventos del bloque); en cuanto exista (node tools/gen_registries.mjs) la conexión se activa sola.
// `offset` (ARCHITECTURE §5, world/mapLoader.js#connectionOffset): para north/south, x de ESTE mapa donde cae la x 0
// del vecino; para west/east, la y de ESTE mapa donde cae la y 0 del vecino. Módulo puro (Node y navegador).
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/** Conexiones internas del bloque (los dos lados son de B09b). */
export const INTERNAL = Object.freeze({
  // Ciudad Nexo (oeste, calle y 20–23) ↔ Ruta 15 (este, sendero y 14–17).
  nexoToRuta15: 6,
  ruta15ToNexo: -6,
  // Ruta 15 (oeste, sendero y 12–15) ↔ Caleta Sonda (este, calle y 10–13).
  ruta15ToCaleta: 2,
  caletaToRuta15: -2,
});

/**
 * Enlaces con mapas de otros bloques. Los de Lúmina (B09a) y Mnemos (B10) usan los offsets que esos bloques ya
 * fijaron (maps/b09a/links.js, maps/b10/pending_links.js). `offset: null` = el otro bloque decide el trazado: no se
 * activa solo y el borde muestra el aviso (mar abierto del Mar del Sur, B13).
 */
export const PENDING_LINKS = Object.freeze({
  ruta_8_marisma: Object.freeze({
    ciudad_lumina: Object.freeze({
      dir: 'east', to: 'ciudad_lumina', block: 'B09a', offset: 54,
      expect: 'Ciudad Lúmina abre su salida oeste en sus filas 9–12 (= y 63–66 de la Ruta 8) y conecta west → ruta_8_marisma con offset −54 (ya lo hace maps/b09a/links.js).',
      blocked: 'El camino sigue hacia Ciudad Lúmina, pero por ahora no puedes continuar.',
    }),
    aldea_mnemos: Object.freeze({
      dir: 'north', to: 'aldea_mnemos', block: 'B10', offset: 0,
      expect: 'Aldea Mnemos abre su salida sur en x 30–33 (= x 30–33 de la Ruta 8) y conecta south → ruta_8_marisma con offset 0 (ya lo hace maps/b10/pending_links.js).',
      blocked: 'La senda sube hacia Aldea Mnemos, pero por ahora no puedes continuar.',
    }),
  }),
  ciudad_nexo: Object.freeze({
    ruta_14_reserva: Object.freeze({
      dir: 'north', to: 'ruta_14_reserva', block: 'B09a', offset: 2,
      expect: 'La Ruta 14 abre su camino sur en x 28–31 (= x 30–33 de Nexo) y conecta south → ciudad_nexo con offset −2 (ya lo hace maps/b09a/links.js).',
      blocked: 'El camino del delta sigue hacia el norte, pero por ahora no puedes continuar.',
    }),
    mar_del_sur: Object.freeze({
      dir: 'south', to: 'mar_del_sur', block: 'B13', offset: null,
      expect: 'El Mar del Sur (B13) decide su trazado: Nexo tiene mar abierto en su borde sur (x 36–63) y este (y 30–51). Añadir aquí el offset y la conexión simétrica.',
      blocked: 'Mar adentro, las olas rompen desordenadas. Mejor no alejarse de la costa por ahora.',
    }),
  }),
  ruta_15: Object.freeze({
    mar_del_sur: Object.freeze({
      dir: 'south', to: 'mar_del_sur', block: 'B13', offset: null,
      expect: 'El Mar del Sur (B13) decide su trazado: la Ruta 15 tiene mar abierto en todo su borde sur (y 39).',
      blocked: 'Mar adentro, las olas rompen desordenadas. Mejor no alejarse de la costa por ahora.',
    }),
  }),
  caleta_sonda: Object.freeze({
    mar_del_sur: Object.freeze({
      dir: 'south', to: 'mar_del_sur', block: 'B13', offset: null,
      expect: 'El Mar del Sur (sector oeste, B13) decide su trazado: Caleta tiene mar abierto en su borde sur (y 31) y oeste (x 0). El Arrecife del Eco (B14) se alcanza buceando desde el mar.',
      blocked: 'Más allá de la caleta el mar se vuelve oscuro y revuelto. Mejor no alejarse por ahora.',
    }),
  }),
});

/** Conexión lista para `connections` si el destino existe y el offset está acordado; si no, null. */
export function linkIfReady(from, to) {
  const link = PENDING_LINKS[from]?.[to];
  if (!link || link.offset === null || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}

/** ¿Está abierto el enlace? (para ocultar los avisos del borde). */
export function linkOpen(from, to) {
  return Boolean(linkIfReady(from, to));
}

/** Texto del aviso de un enlace cerrado. */
export function blockedText(from, to) {
  return PENDING_LINKS[from]?.[to]?.blocked || 'Por ahora no puedes continuar.';
}
