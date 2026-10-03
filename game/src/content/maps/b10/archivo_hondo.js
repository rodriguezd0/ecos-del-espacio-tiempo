// Archivo Hondo — segundo piso del Pilar de la Memoria (X36). Guardiana Olvido Arrieta en el tercer piso.
// Tileset 11 (InteriorTorre) con el kit común de Pilar y el tinte
// sepia del P5. Segundo piso: Suelo Olvidado → Dos Manos → Lectura → Rollos → Sala del Mural → escalera al núcleo.
// En cada estancia de recuerdo, una losa (pilar_losa_eco) despierta un eco-custodio translúcido que hace la
// acción que hay que reproducir; se puede repetir sin límite. Coordenadas en hondo_layout.js; eventos en
// content/events/b10_hondo*.js. Se entra por la escalera del Archivo de papel (mnemos_archivo).
import { W, H, ENTRY } from './hondo_layout.js';
import { buildHondo } from './hondo_build.js';
import { ARCHIVO_ROOM } from './archivo_layout.js';
import { hondoEvents, hondoOnEnter } from '../../events/b10_hondo.js';
import { ARCHIVO_HONDO } from '../../encounters/b10.js';
import { pilarTone } from '../../stamps/pilar.js';

export default {
  id: 'archivo_hondo',
  name: 'Pilar de la Memoria · Piso 2',
  pillar: { id: 'P5', floor: 2 },
  tileset: 11,
  width: W,
  height: H,
  outdoor: false,
  cave: true,
  bgm: 'Emociones',
  battleback: 'Templo',
  tone: pilarTone('P5'),
  start: { x: ENTRY.arrival.x, y: ENTRY.arrival.y, dir: ENTRY.arrival.dir },
  encounters: ARCHIVO_HONDO,

  build: buildHondo,

  warps: ENTRY.exitTiles.map(([x, y]) => ({
    x, y, dirTrigger: 8, to: 'mnemos_archivo', tx: ARCHIVO_ROOM.stairsArrival.x, ty: ARCHIVO_ROOM.stairsArrival.y, dir: ARCHIVO_ROOM.stairsArrival.dir,
  })),

  onEnter: hondoOnEnter,
  events: hondoEvents(),
};
