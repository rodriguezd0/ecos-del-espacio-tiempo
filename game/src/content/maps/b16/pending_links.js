// Enlaces del Bloque 16 con mapas que construye otro bloque (docs/CAMPANA.md §1.3–1.4: Villa Boreal «N Lagos del
// Alma»). Mientras el destino no esté registrado en content/maps/index.js, el borde queda cerrado con un aviso neutro
// (eventos `borde_sur_*` de content/events/b16_lagos.js); en cuanto exista (node tools/gen_registries.mjs) la conexión
// se activa sola. `offset` (world/mapLoader.js#connectionOffset): para north/south, x de ESTE mapa donde cae la x 0 del
// vecino. B15 ya lo fijó en content/maps/b15/links.js: Villa Boreal abre su borde norte en x 20–23 con offset 8, así
// que el sendero de los Lagos está en x 12–15 y el offset desde aquí es −8. Módulo puro.
import { MAPS } from '../index.js';
import { EXITS } from './lagos_layout.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

export const PENDING_LINKS = Object.freeze({
  villa_boreal: Object.freeze({
    dir: 'south', to: 'villa_boreal', block: 'B15', offset: EXITS.south.offset, x0: EXITS.south.x0, x1: EXITS.south.x1,
    expect: 'Villa Boreal abre su camino norte en x 20–23 (= x 12–15 de los Lagos) y conecta `north` → lagos_alma con offset 8.',
    blocked: 'El sendero baja hacia Villa Boreal, pero por ahora no puedes continuar.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
