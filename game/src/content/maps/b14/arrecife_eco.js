// Arrecife del Eco (docs/CAMPANA.md §1.4 «Arrecife y Ruinas de Antea (P7) · Mar frente a Caleta Sonda · Buceo» y B14).
// Tileset 15, mapa submarino (Buceo). Se llega buceando por el remolino del suroeste de Caleta Sonda (y se sube por la
// misma casilla). Norte: la Puerta de Antea (sala 1 de las ruinas), tapada por el cabezal de la draga de Genesis hasta
// que la jefa de la campana lo aparta. Oeste: la campana de dragado. Este: el Fondo del Mar del Sur.
// Construcción: arrecife_build.js · eventos: content/events/b14_arrecife.js.
import { zoneDefaults } from '../../services/zones.js';
import { buildArrecife } from './arrecife_build.js';
import { CAVE_BRUSHES } from './paint.js';
import { ARRECIFE, ROOMS, roomMap } from './layout.js';
import { TONES } from '../../events/b14_common.js';
import { ARRECIFE_ECO } from '../../encounters/b14.js';
import { arrecifeEvents } from '../../events/b14_arrecife.js';

const A = ARRECIFE;
const R1 = ROOMS[1];

export default {
  id: 'arrecife_eco',
  ...zoneDefaults('arrecife_eco'),
  tileset: 15,
  width: A.w,
  height: A.h,
  cave: true,
  brushes: CAVE_BRUSHES,
  dark: { amount: 0.8 },
  tone: TONES.presente,
  noFollower: true,
  underwater: { shallow: [[A.arrival.x - 2, A.arrival.y - 2, 5, 3], [A.gate.arrival.x - 2, 5, 5, 3]] },
  encounters: ARRECIFE_ECO,
  start: { x: A.arrival.x, y: A.arrival.y, dir: A.arrival.dir },
  build: buildArrecife,
  warps: [
    { x: A.gate.door.x, y: A.gate.door.y, to: roomMap(1, 'presente'), tx: R1.south.arrival.x, ty: R1.south.arrival.y, dir: R1.south.arrival.dir },
  ],
  connections: [{ dir: 'east', to: 'fondo_mar_sur', offset: A.east.y0 - 20 }],
  events: arrecifeEvents(),
};
