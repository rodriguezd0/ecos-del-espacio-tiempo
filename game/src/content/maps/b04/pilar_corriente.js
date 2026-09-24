// Pilar de la Corriente (P2) — «Escalera de Estanques» (docs/CAMPANA.md B04; tileset 15 + kit de Pilar, tinte
// azul). Seis estanques escalonados E1–E6 alrededor del núcleo, cuatro compuertas C1–C4, la noria y la palanca de
// reinicio (puzle: content/events/b04_hydraulics.js). Guardián: Leandro Alcántara. Entrada desde la Garganta del
// Albo (salida sur). Eventos: content/events/b04_pilar.js.
import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { W, H, SPOTS } from './pilar_corriente_layout.js';
import { PILAR_DOOR } from './garganta_albo_layout.js';
import { BRUSHES, buildPilarCorriente } from './pilar_corriente_build.js';
import { pilarEvents, pilarOnEnter } from '../../events/b04_pilar.js';
import { PILAR_CORRIENTE } from '../../encounters/b04.js';

export default {
  id: 'pilar_corriente',
  ...zoneDefaults('pilar_corriente'),
  bgm: 'CuevaCeleste',
  tileset: 15,
  width: W,
  height: H,
  cave: true,
  tone: pilarTone('P2'),
  noFollower: false,
  start: { x: SPOTS.arrival.x, y: SPOTS.arrival.y, dir: SPOTS.arrival.dir },
  encounters: PILAR_CORRIENTE,
  brushes: BRUSHES,
  build: buildPilarCorriente,
  warps: [{ x: SPOTS.exitWarp.x, y: SPOTS.exitWarp.y, to: 'garganta_albo', tx: PILAR_DOOR.arrive.x, ty: PILAR_DOOR.arrive.y, dir: 2, dirTrigger: 2 }],
  events: pilarEvents(),
  onEnter: pilarOnEnter,
};
