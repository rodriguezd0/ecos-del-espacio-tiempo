// Santuario del Alma — Pilar del Alma (P8) (docs/CAMPANA.md B16; §1.5: «Centro y 3 alas», Uxie, Mesprit y Azelf;
// tileset 11 + kit de Pilar con tinte rosa pálido; fondo Templo). Patio central, Ala del Saber, Ala del Sentir, Ala del
// Querer y Telar del Alma en un solo mapa (salas sobre la oscuridad enlazadas por dinteles y escalinatas). Coordenadas
// en santuario_layout.js; construcción en santuario_build.js; eventos en content/events/b16_{santuario,saber,sentir,
// querer,telar}.js.
import { W, H, PATIO, SABER, SENTIR, QUERER, ENTRY } from './santuario_layout.js';
import { buildSantuario } from './santuario_build.js';
import { SANCTUARY } from './lagos_layout.js';
import { SANTUARIO_ALMA } from '../../encounters/b16.js';
import { pilarTone } from '../../stamps/pilar.js';
import { patioEvents } from '../../events/b16_santuario.js';
import { saberEvents, saberWarps } from '../../events/b16_saber.js';
import { sentirEvents, sentirWarps } from '../../events/b16_sentir.js';
import { quererEvents, quererWarps } from '../../events/b16_querer.js';
import { telarEvents, telarWarps } from '../../events/b16_telar.js';
import { ensurePlayerLooksLikePlayer } from '../../events/b16_recuerdo.js';
import { SABER as S } from './santuario_layout.js';

const gateWarp = (g, to) => ({ x: g.warp.x, y: g.warp.y, to: 'santuario_alma', tx: to.x, ty: to.y, dir: 8 });

export default {
  id: 'santuario_alma',
  name: 'Pilar del Alma',
  tileset: 11,
  width: W,
  height: H,
  outdoor: false,
  cave: true,
  bgm: 'Emociones',
  battleback: 'Templo',
  tone: pilarTone('P8'),
  escapeRope: false, // se sale por la escalinata: la salida lleva a la escena del hito
  start: { x: ENTRY.arrive.x, y: ENTRY.arrive.y, dir: 8 },
  encounters: {},
  encounterZones: [{ x0: PATIO.zone.x, y0: PATIO.zone.y, x1: PATIO.zone.x + PATIO.zone.w - 1, y1: PATIO.zone.y + PATIO.zone.h - 1, encounters: SANTUARIO_ALMA }],

  build: buildSantuario,

  warps: [
    // salida a los Lagos (escalinata del patio)
    ...PATIO.exit.exits.map((e) => ({ x: e.x, y: e.y, dirTrigger: 2, to: 'lagos_alma', tx: SANCTUARY.out.x, ty: SANCTUARY.out.y, dir: 2 })),
    // los tres dinteles del patio
    gateWarp(PATIO.gates.saber, S.glyphRoom.entry.arrive),
    gateWarp(PATIO.gates.sentir, SENTIR.mirrors[0].entry),
    gateWarp(PATIO.gates.querer, QUERER.wind.entry),
    ...saberWarps(PATIO.gates.saber.front),
    ...sentirWarps(),
    ...quererWarps(),
    ...telarWarps(),
  ],

  onEnter: ensurePlayerLooksLikePlayer,
  events: [...patioEvents(), ...saberEvents(), ...sentirEvents(), ...quererEvents(), ...telarEvents()],
};

export const SANTUARIO_ROOMS = Object.freeze({ PATIO, SABER, SENTIR, QUERER });
