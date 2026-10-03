// Ruinas del Dintel — piso 2 del Pilar del Umbral (P1): puzzle original de piedras y rescate de Geodude.
// Conserva el mapa 44×40 y sus coordenadas; las salas orientales son ahora rellanos de ascenso, tileset 2 (Cueva1)
// con el kit común de Pilar y el tinte ocre del P1. Luz limitada: la da el Core (y dos antorchas y el tragaluz).
// Coordenadas en ruinas_dintel_layout.js; guiones en content/events/b02_ruinas_*.js.
import { pilarTone } from '../../stamps/pilar.js';
import { zoneDefaults } from '../../services/zones.js';
import { W, H, ENTRANCE } from './ruinas_dintel_layout.js';
import { buildRuinas } from './ruinas_dintel_build.js';
import { RUINAS_ENCOUNTERS } from '../../encounters/b02.js';
import { ruinasEvents, ruinasOnEnter } from '../../events/b02_ruinas.js';
import { BASE, SUMMIT, PUZZLE_UP } from './ruinas_dintel_floors.js';

export default {
  id: 'ruinas_dintel',
  pillar: { id: 'P1', floor: 2 },
  ...zoneDefaults('ruinas_dintel'),
  name: 'Pilar del Umbral · piso 2',
  tileset: 2,
  width: W,
  height: H,
  outdoor: false,
  cave: true,
  bgm: 'ruins',
  battleback: 'Templo',
  tone: pilarTone('P1'),
  dark: { amount: 0.74, radius: 72 },
  start: { ...ENTRANCE.arrive },
  encounters: RUINAS_ENCOUNTERS,

  build: buildRuinas,

  warps: [
    { x: ENTRANCE.warp.x, y: ENTRANCE.warp.y, to: 'ruinas_dintel_base', tx: BASE.fromPuzzle.x, ty: BASE.fromPuzzle.y, dir: 2 },
    { x: PUZZLE_UP.x, y: PUZZLE_UP.y, to: 'ruinas_dintel_nucleo', tx: SUMMIT.arrival.x, ty: SUMMIT.arrival.y, dir: 8 },
  ],

  onEnter: ruinasOnEnter,

  events: ruinasEvents(),
};
