// Núcleo del Pilar del Origen (docs/CAMPANA.md B20): la sala dorada del trono (InteriorLiga, stamp `sala_trono`, anotado
// en docs/stamps.md para el Pilar del Origen) con el gran sello del suelo. Fragmento 10, la Flauta Azur, la profecía
// entera y la falsa calma. Coordenadas: layout.js (NUCLEO) · eventos: content/events/b20_nucleo.js.
import { NUCLEO, LINKS } from './layout.js';
import { nucleoEvents, nucleoOnEnter } from '../../events/b20_nucleo.js';
import { MUSIC } from '../../events/b20_common.js';
import { pilarTone } from '../../stamps/pilar.js';
import '../../events/b21_salto.js'; // B21: registra el Salto de Convergencia en el Nodo del Origen (registerOriginNode)
import { b22aOriginEvents } from '../../events/b22a_red.js';

export function buildNucleo(b) {
  b.fill(0, 'vacio');
  b.stamp('sala_trono', NUCLEO.hall.x, NUCLEO.hall.y);
  sealOverEmblem(b);
}

/**
 * El sello del núcleo: el emblema de la Liga de la sala del trono se lee como una Poké Ball (como en la Terraza). Sus
 * casillas pasan a alfombra lisa (la de la columna libre de su izquierda, fila a fila) y encima se graba la cámara de
 * núcleo del kit de Pilar (hexágono, capa 2) centrada en el sello; el resto de la alfombra baja a la capa 1 intacto.
 */
function sealOverEmblem(b) {
  const C = NUCLEO.core;
  const E = NUCLEO.emblem;
  for (let y = C.y - 2; y <= C.y + 2; y++) {
    for (let x = C.x - 2; x <= C.x + 2; x++) {
      const inEmblem = x >= E.x0 && x <= E.x1 && y >= E.y0 && y <= E.y1;
      b.set(1, x, y, b.get(2, inEmblem ? E.plainX : x, y));
      b.set(2, x, y, 0);
    }
  }
  b.stamp('pilar_camara_nucleo', C.x - 2, C.y - 2);
}

const back = LINKS.nucleoToTerraza;

export default {
  id: 'nucleo_origen',
  name: 'Núcleo del Origen',
  tileset: 8,
  width: NUCLEO.w,
  height: NUCLEO.h,
  outdoor: false,
  bgm: MUSIC.core,
  battleback: 'Cielo',
  tone: pilarTone('P10', 0.3),
  mount: false,
  escapeRope: true,
  encounters: {},
  start: { ...NUCLEO.arrive },
  build: buildNucleo,
  warps: [{ x: NUCLEO.back.x, y: NUCLEO.back.y, to: back.map, tx: back.x, ty: back.y, dir: back.dir, dirTrigger: 2 }],
  onEnter: nucleoOnEnter,
  events: b22aOriginEvents(nucleoEvents()),
};
