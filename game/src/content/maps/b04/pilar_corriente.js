// Pilar de la Corriente (P2) — «Escalera de Estanques» (docs/CAMPANA.md B04; tileset 15 + kit de Pilar, tinte
// azul). Seis estanques escalonados E1–E6 alrededor del núcleo, cuatro compuertas C1–C4, la noria y la palanca de
// reinicio (puzle: content/events/b04_hydraulics.js). Guardián: Leandro Alcántara. Entrada desde la Garganta del
// Albo (salida sur). Eventos: content/events/b04_pilar.js.
import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { W, H, SPOTS } from './pilar_corriente_layout.js';
import { BASE, SUMMIT, PUZZLE_UP } from './pilar_corriente_floors.js';
import { BRUSHES, buildPilarCorriente } from './pilar_corriente_build.js';
import { pilarEvents, pilarOnEnter } from '../../events/b04_pilar.js';
import { PILAR_CORRIENTE } from '../../encounters/b04.js';

export default {
  id: 'pilar_corriente',
  pillar: { id: 'P2', floor: 2 },
  ...zoneDefaults('pilar_corriente'),
  name: 'Pilar de la Corriente · piso 2',
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
  warps: [
    { x: SPOTS.exitWarp.x, y: SPOTS.exitWarp.y, to: 'pilar_corriente_base', tx: BASE.fromPuzzle.x, ty: BASE.fromPuzzle.y, dir: 2, dirTrigger: 2 },
    { x: PUZZLE_UP.x, y: PUZZLE_UP.y, to: 'pilar_corriente_nucleo', tx: SUMMIT.arrival.x, ty: SUMMIT.arrival.y, dir: 8 },
  ],
  events: pilarEvents(),
  onEnter: pilarOnEnter,
};
