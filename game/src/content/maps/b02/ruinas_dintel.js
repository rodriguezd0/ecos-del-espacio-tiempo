// Ruinas del Dintel — Pilar del Umbral (P1), docs/CAMPANA.md B02: un solo nivel de 44×40 con cinco salas
// (Antesala, Galería de los Dinteles, Cámara de Geodude, Cámara de la Guardiana y Núcleo), tileset 2 (Cueva1)
// con el kit común de Pilar y el tinte ocre del P1. Luz limitada: la da el Core (y dos antorchas y el tragaluz).
// Coordenadas en ruinas_dintel_layout.js; guiones en content/events/b02_ruinas_*.js.
import { pilarTone } from '../../stamps/pilar.js';
import { zoneDefaults } from '../../services/zones.js';
import { W, H, ENTRANCE } from './ruinas_dintel_layout.js';
import { buildRuinas } from './ruinas_dintel_build.js';
import { RUINAS_ENCOUNTERS } from '../../encounters/b02.js';
import { ruinasEvents, ruinasOnEnter } from '../../events/b02_ruinas.js';
import { EXPLANADA_DOOR } from './explanada_umbral_layout.js';

export default {
  id: 'ruinas_dintel',
  ...zoneDefaults('ruinas_dintel'),
  name: 'Ruinas del Dintel',
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
    { x: ENTRANCE.warp.x, y: ENTRANCE.warp.y, to: 'explanada_umbral', tx: EXPLANADA_DOOR.out.x, ty: EXPLANADA_DOOR.out.y, dir: 2 },
  ],

  onEnter: ruinasOnEnter,

  events: ruinasEvents(),
};
