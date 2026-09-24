// Enlaces del Bloque 8 con mapas que construyen otros bloques (docs/CAMPANA.md §1.3–1.4). Mientras el destino no esté
// registrado en content/maps/index.js, el borde queda cerrado con un aviso neutro (eventos de Estrato); en cuanto
// exista (node tools/gen_registries.mjs) la conexión se activa sola. Módulo puro (Node y navegador).
// `offset` (ARCHITECTURE §5, world/mapLoader.js): para north/south, x de ESTE mapa donde cae la x 0 del vecino; para
// west/east, la y de ESTE mapa donde cae la y 0 del vecino. Los offsets siguen las propuestas de los bloques vecinos
// (maps/b07/pending_links.js y maps/b09a/links.js).
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

export const PENDING_LINKS = Object.freeze({
  ciudad_estrato: Object.freeze({
    ruta_6: Object.freeze({
      dir: 'north', to: 'ruta_6', block: 'B07', offset: 13,
      expect: 'La Ruta 6 abre su camino sur en x 13–17 (= x 26–30 de Estrato) y conecta south → ciudad_estrato con offset −13.',
      blocked: 'El camino sube hacia la Ruta 6, pero por ahora no puedes continuar.',
    }),
    ruta_7: Object.freeze({
      dir: 'west', to: 'ruta_7', block: 'B09a', offset: 6,
      expect: 'La Ruta 7 abre su salida este en y 16–19 (= filas 22–25 de Estrato) y conecta east → ciudad_estrato con offset −6. El Paso del Derrumbe lo cierra la Ruta 7 hasta p4_restored. La vía entra por la fila 11 de Estrato (= y 5 de la Ruta 7).',
      blocked: 'El valle sigue hacia el oeste, pero por ahora no puedes continuar.',
    }),
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(from, to) {
  const link = PENDING_LINKS[from]?.[to];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}

export function blockedText(from, to) {
  return PENDING_LINKS[from]?.[to]?.blocked || 'Por ahora no puedes continuar.';
}
