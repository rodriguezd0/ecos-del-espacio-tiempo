import { withB24Events } from '../../events/b24_maps.js';
// Estación Talasa (docs/CAMPANA.md B13, §1.4: plataforma de investigación de Genesis; tileset 5 + interiores en 4,
// GuaridaRocket, fondo BaseVillano). Cuelga del borde sur del Mar del Sur. Asalto con Alerce: control, invernadero,
// pasarela, torre de dirección (foto y tarjeta) y laboratorio del tanque (N4). Coordenadas en talasa_layout.js;
// eventos en content/events/b13_talasa.js. Bajo la dársena, los pilotes (Buceo: talasa_pilotes, C087).
import { zoneDefaults } from '../../services/zones.js';
import { MAPS } from '../index.js';
import { W, H, SEA_LINK, BUILDINGS, INTERIOR_ENTRIES, START } from './talasa_layout.js';
import { buildTalasa } from './talasa_build.js';
import { ESTACION_TALASA } from '../../encounters/b13.js';
import { talasaEvents } from '../../events/b13_talasa.js';
import { talasaRuinsEvents } from '../../events/b22e_rooms.js';

const door = (bd) => {
  const e = INTERIOR_ENTRIES[bd.to];
  return { x: bd.door.x, y: bd.door.y, to: bd.to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'estacion_talasa',
  ...zoneDefaults('estacion_talasa'),
  tileset: 5,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  encounters: ESTACION_TALASA,
  // Buceo: la dársena baja a los pilotes con las mismas coordenadas (world/zygarde/dive.js#divePoint).
  dive: { map: 'talasa_pilotes', dx: 0, dy: 0 },
  build: buildTalasa,
  // El laboratorio no tiene warp: su puerta es un evento (sellada hasta tener la tarjeta de dirección).
  warps: Object.values(BUILDINGS).filter((bd) => bd.to !== 'talasa_laboratorio' && Object.hasOwn(MAPS, bd.to)).map(door),
  connections: Object.hasOwn(MAPS, SEA_LINK.to) ? [{ dir: 'north', to: SEA_LINK.to, offset: SEA_LINK.offset }] : [],
  events: withB24Events('estacion_talasa', [...talasaEvents(), ...talasaRuinsEvents()]),
};
