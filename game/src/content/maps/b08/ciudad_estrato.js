import { withB24Events } from '../../events/b24_maps.js';
// Ciudad Estrato (docs/CAMPANA.md §1.3: «Ciudad minera en cañón escalonado», Exterior3, 56×48; N Ruta 6 · E Dunas de
// Ceniza · O Ruta 7; Centro, tienda, Mina Galena, Escuela del Pico, oficinas del Consorcio, casa de Fermín, mercado de
// minerales tras el P4 y estación). Construcción: ciudad_estrato_build.js · coordenadas: layout.js (ESTRATO) ·
// eventos: content/events/b08_estrato*.js y b08_t05.js.
import { buildEstrato, W, H } from './ciudad_estrato_build.js';
import { ESTRATO as E, ESTRATO_INTERIORS as IN, MINA } from './layout.js';
import { linkIfReady } from './links.js';
import { ESTRATO_TO_DUNAS } from './dunas_ceniza.js';
import { estratoEvents, estratoOnEnter } from '../../events/b08_estrato.js';

const door = (bd, to) => ({ x: bd.door.x, y: bd.door.y, to, tx: IN[to].x, ty: IN[to].y, dir: 8, door: true });
const B = E.buildings;

export default {
  id: 'ciudad_estrato',
  name: 'Ciudad Estrato',
  tileset: 5,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'CiudadVerde',
  battleback: 'ZonaEscarpada',
  start: { x: E.north.x0 + 2, y: 1, dir: 2 },
  flyPoint: E.flyPoint,

  build: buildEstrato,

  warps: [
    door(B.estacion, 'estrato_estacion'),
    door(B.galena, 'estrato_casa_galena'),
    door(B.escuela, 'estrato_escuela'),
    door(B.casa_norte, 'estrato_casa_norte'),
    { x: B.centro.door.x, y: B.centro.door.y, to: 'estrato_centro', tx: 9, ty: 12, dir: 8, door: true },
    { x: B.tienda.door.x, y: B.tienda.door.y, to: 'estrato_tienda', tx: 4, ty: 9, dir: 8, door: true },
    door(B.consorcio, 'estrato_consorcio'),
    door(B.casa_sur, 'estrato_casa_sur'),
    { x: E.mine.door.x, y: E.mine.door.y, to: 'mina_galena', tx: MINA.exit.arrive.x, ty: MINA.exit.arrive.y, dir: 8, door: true },
  ],

  connections: [
    { dir: 'east', to: 'dunas_ceniza', offset: ESTRATO_TO_DUNAS },
    ...[linkIfReady('ciudad_estrato', 'ruta_6'), linkIfReady('ciudad_estrato', 'ruta_7')].filter(Boolean),
  ],

  onEnter: estratoOnEnter,
  events: withB24Events('ciudad_estrato', estratoEvents()),
};
