// Terraza del Último Sello (docs/CAMPANA.md B20 y §6.4): terraza de piedra dorada colgada sobre el cielo interior, con
// el dintel del núcleo al norte. Gael cura, combate B6 y la conversación del verso X. InteriorLiga (tileset 8) con el kit
// de Pilar y el panorama `cielo`; caer al vacío devuelve a la pasarela (world/impossible).
// Coordenadas: layout.js (TERRAZA) · eventos: content/events/b20_terraza.js.
import { TERRAZA } from './layout.js';
import { terrazaEvents, terrazaWarps } from '../../events/b20_terraza.js';
import { MUSIC } from '../../events/b20_common.js';
import { pilarTone } from '../../stamps/pilar.js';

const T = TERRAZA;
const cells = (r) => {
  const out = [];
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) out.push([x, y]);
  return out;
};

export function buildTerraza(b) {
  const deck = cells(T.deck);
  const all = [...deck, ...cells(T.bridge), ...cells(T.porch)];
  for (const [x, y] of all) b.set(0, x, y, 0);
  b.paint('suelo_solemne', all, { layer: 0 });
  b.paint('pilar_enlosado', all);
  // Hueco negro bajo el dintel (warp al núcleo)
  for (let y = T.door.y - 1; y <= T.door.y; y++) for (let x = T.door.x - 1; x <= T.door.x + 1; x++) { b.set(0, x, y, 384); b.set(1, x, y, 0); }
  b.stamp('pilar_dintel', T.dintel.x, T.dintel.y);
  // El sello de la terraza: el gran hexágono del kit de Pilar (los emblemas de InteriorLiga se leen como Poké Balls),
  // con el punto del combate (TERRAZA.battleStand) en su centro y cuatro luces en cruz.
  b.stamp('pilar_camara_nucleo', T.battleStand.x - 2, T.battleStand.y - 2);
  b.stamp('pilar_placa_unown', T.stele.x, T.stele.y);
  for (const [x, y] of [[9, 12], [15, 12], [12, 8], [12, 16]]) b.stamp('luz_suelo', x, y);
  for (const [x, y] of [[5, 6], [20, 6], [5, 14], [20, 14]]) b.stamp('pilar_columna', x, y);
  // Columnas que enmarcan el dintel (antes, bustos de InteriorLiga: figuras humanas que parecían NPC)
  for (const [x, y] of [[9, 3], [16, 3]]) b.stamp('pilar_columna', x, y);
  b.stamp('pilar_monolito', 6, 16);
  b.stamp('pilar_arista_grande', 18, 16);
  b.stamp('pilar_columna_quebrada', 7, 9);
  for (const [x, y] of [[8, 13], [17, 10]]) b.stamp('pilar_glifo', x, y);
}

export default {
  id: 'terraza_ultimo_sello',
  name: 'Terraza del Último Sello',
  tileset: 8,
  width: T.w,
  height: T.h,
  outdoor: false,
  bgm: MUSIC.terrace,
  battleback: 'Cielo',
  tone: pilarTone('P10', 0.35),
  panorama: Object.freeze({ image: 'anil:Graphics/Panoramas/cielo.png', parallax: 0.2 }),
  mount: false,
  escapeRope: true,
  encounters: {},
  start: { ...T.arrive },
  impossible: { section: 'terraza', spawn: { ...T.arrive }, fallFlag: 'b20_terraza_caida' },
  build: buildTerraza,
  warps: terrazaWarps(),
  events: terrazaEvents(),
};
