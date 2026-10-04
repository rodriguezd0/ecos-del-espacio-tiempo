// Contrato común de las plantas; cada puzzle conserva su geometría y sus flags originales.
import { W, H, PATIO, SABER, SENTIR, QUERER, ENTRY, P8_MAPS, P8_UP, SANTUARIO_ITEMS } from './santuario_layout.js';
import { buildSantuarioFloor } from './santuario_build.js';
import { SANCTUARY } from './lagos_layout.js';
import { SANTUARIO_ALMA } from '../../encounters/b16.js';
import { pilarTone } from '../../stamps/pilar.js';
import { patioEvents } from '../../events/b16_santuario.js';
import { saberEvents, saberWarps } from '../../events/b16_saber.js';
import { sentirEvents, sentirWarps } from '../../events/b16_sentir.js';
import { quererEvents, quererWarps } from '../../events/b16_querer.js';
import { telarEvents, telarWarps } from '../../events/b16_telar.js';
import { enterSantuarioFloor, santuarioItemFloor, redirectSantuarioArrival } from '../../events/b16_vertical.js';
import { b22aSantuarioEvents } from '../../events/b22a_trio.js';

function floorEvents(floor) {
  const patio = patioEvents().filter((e) => (e.id !== 'patio_bienvenida' || floor === 1) && (e.id !== 'sello_telar' || floor === 3));
  const puzzles = floor === 1 ? saberEvents() : floor === 2 ? sentirEvents() : [...quererEvents(), ...telarEvents()];
  const items = SANTUARIO_ITEMS.filter((i) => santuarioItemFloor(i) === floor).map((i) => ({ ...i, type: 'item' }));
  // B22a añade sus capturas normales. Los reflejos de Mesprit solo pertenecen a las salas del piso 2.
  return b22aSantuarioEvents([...patio, ...puzzles, ...items])
    .filter((e) => floor === 2 || !/^b22a_(reflejo|mesprit_espejo)_/.test(e.id));
}

function floorWarps(floor) {
  const id = P8_MAPS[floor];
  const roomEntry = floor === 1 ? SABER.glyphRoom.entry.arrive : floor === 2 ? SENTIR.mirrors[0].entry : QUERER.wind.entry;
  const gate = floor === 1 ? PATIO.gates.saber : floor === 2 ? PATIO.gates.sentir : PATIO.gates.querer;
  const internal = floor === 1 ? saberWarps(gate.front) : floor === 2 ? sentirWarps() : [...quererWarps(), ...telarWarps()];
  const returnTo = floor === 1 ? SANCTUARY.out : { x: P8_UP[floor - 1].x, y: P8_UP[floor - 1].y + 1 };
  return [
    ...PATIO.exit.exits.map((e) => ({ x: e.x, y: e.y, to: floor === 1 ? 'lagos_alma' : P8_MAPS[floor - 1], tx: returnTo.x, ty: returnTo.y, dir: 2 })),
    ...(floor < 3 ? [{ x: P8_UP[floor].x, y: P8_UP[floor].y, to: P8_MAPS[floor + 1], tx: ENTRY.arrive.x, ty: ENTRY.arrive.y, dir: 8 }] : []),
    { x: gate.warp.x, y: gate.warp.y, to: id, tx: roomEntry.x, ty: roomEntry.y, dir: 8 },
    ...internal.map((w) => ({ ...w, to: w.to === P8_MAPS[1] ? id : w.to })),
  ];
}

export function santuarioFloorDef(floor) {
  if (![1, 2, 3].includes(floor)) throw new Error(`Piso del Pilar del Alma desconocido: ${floor}`);
  return {
    id: P8_MAPS[floor], name: `Pilar del Alma · ${['', 'Saber', 'Sentir', 'Querer y Telar'][floor]}`,
    pillar: { id: 'P8', floor }, tileset: 11, width: W, height: H, outdoor: false, cave: true,
    bgm: 'Emociones', battleback: 'Templo', tone: pilarTone('P8'), escapeRope: false,
    start: { ...ENTRY.arrive, dir: 8 }, encounters: {},
    encounterZones: floor === 1 ? [{ x0: PATIO.zone.x, y0: PATIO.zone.y, x1: PATIO.zone.x + PATIO.zone.w - 1, y1: PATIO.zone.y + PATIO.zone.h - 1, encounters: SANTUARIO_ALMA }] : [],
    build: (b) => buildSantuarioFloor(b, floor),
    warps: floorWarps(floor), events: floorEvents(floor),
    redirectArrival: floor === 1 ? redirectSantuarioArrival : null,
    onEnter: (ctx) => enterSantuarioFloor(ctx, floor),
  };
}
