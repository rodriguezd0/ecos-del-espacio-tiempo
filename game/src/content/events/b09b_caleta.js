// Eventos de Caleta Sonda (docs/CAMPANA.md B09 paso 5 y §1.3): el farero Ramón (Faro Sonda, interior) abre la pista T11
// (en cola hasta Nadar); la tienda de pesca da la Supercaña (interior); muelle de buzos (la resonancia del Buceo es de
// B13: la casilla prevista está en DIVERS.resonance); embarcadero del ferri (parado hasta P7); C064 frente al muelle de
// buzos (Nadar) y el remolino del bosque de algas (Buceo → caleta_algas, C086); Binacle y la Barbaraclita en las rocas.
import { takeFerry } from '../../world/transport.js';
import { cellEvent } from './b01_cells.js';
import { F, SPEAKER, SPRITE, lines, examine, blockedLink } from './b09b_common.js';
import { coastRockEvent } from './b09b_ruta15.js';
import {
  W, H, BUILDINGS, DIVERS, FERRY, CELLS, COAST_ROCKS, SPOTS, ITEMS,
} from '../maps/b09b/caleta_layout.js';
import { ALGAS_ENTRY } from '../maps/b09b/caleta_algas_layout.js';
import { linkOpen, blockedText } from '../maps/b09b/links.js';

export const CALETA_TEXT = Object.freeze({
  sign: 'CALETA SONDA\nPueblo de pescadores y buzos. Faro Sonda en la punta.',
  ferrySign: 'EMBARCADERO DE CALETA SONDA\nFerri a Ciudad Nexo. Servicio suspendido por el estado de la mar.',
  houseLocked: 'La puerta está cerrada. Dentro se oye una radio que da el parte de la mar.',
  netMender: [
    'Remiendo las redes de toda la caleta. Estos días se rompen solas: la marea sube y baja a destiempo.',
    'Y las noches de luna rara, en el islote de enfrente bailan luces. Ramón, el del faro, no les quita ojo.',
  ],
  oldLady: [
    'Las mareas se llevan la arena y la traen de vuelta. Toda la vida ha sido así.',
    'Pero ahora a destiempo, y a veces con cosas que no son de aquí: una moneda vieja, un trozo de ánfora…',
  ],
  kid: ['¡Cuando sea mayor seré buzo, como mi hermana!', 'Ella dice que en el bosque de algas hay brillos verdes. ¡Yo quiero verlos!'],
  gardener: ['Aquí arriba, junto al Centro, se ve toda la caleta.', 'Si vienes del sendero, baja por la escalera: el pueblo está abajo, junto al agua.'],
  diver: ['Desde el final del muelle se ve el bosque de algas, ahí donde el agua se oscurece.', 'Bajamos hasta donde nos llega el aire. Más hondo, ni hablar.'],
  diverAfter: ['¿Esa burbuja verde es tuya? Con algo así podrías bajar al bosque de algas sin botella.', 'Ten cuidado ahí abajo. El agua anda rara.'],
  ferryBefore: ['Con la mar así no sale ni el ferri de Nexo. Aquí esperamos a que se calme.'],
});

function doorEvents() {
  return [examine('puerta_pescadores', BUILDINGS.pescadores.door.x, BUILDINGS.pescadores.door.y, CALETA_TEXT.houseLocked, { solid: true })];
}

function signEvents() {
  return [
    { id: 'cartel_caleta', type: 'sign', x: SPOTS.townSign.x, y: SPOTS.townSign.y, text: CALETA_TEXT.sign },
    { id: 'cartel_ferri_caleta', type: 'sign', x: FERRY.sign.x, y: FERRY.sign.y, text: CALETA_TEXT.ferrySign },
  ];
}

function npcEvents() {
  const S = SPOTS;
  return [
    { id: 'remendadora', x: S.netMender.x, y: S.netMender.y, name: 'Pescadora', sprite: 'anil:pescadoraow', dir: S.netMender.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, 'Pescadora', CALETA_TEXT.netMender) },
    { id: 'anciana_playa', x: S.oldLady.x, y: S.oldLady.y, name: 'Anciana', sprite: 'anil:anciana2', dir: S.oldLady.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, 'Anciana', CALETA_TEXT.oldLady) },
    { id: 'nino_caleta', x: S.kid.x, y: S.kid.y, name: 'Niño', sprite: SPRITE.kid, dir: S.kid.dir, move: { wander: 2 }, trigger: 'action', script: (ctx) => lines(ctx, 'Niño', CALETA_TEXT.kid) },
    { id: 'vecino_meseta', x: S.gardener.x, y: S.gardener.y, name: 'Vecino', sprite: SPRITE.neighborM, dir: S.gardener.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, 'Vecino', CALETA_TEXT.gardener) },
  ];
}

async function ferryTalk(ctx) {
  // Antes de P7 basta su explicación (takeFerry repetiría «los ferris no salen»).
  if (!ctx.flag(F.p7)) { await lines(ctx, SPEAKER.sailor, CALETA_TEXT.ferryBefore); return; }
  await takeFerry(ctx, 'caleta', { speaker: SPEAKER.sailor });
}

function portEvents() {
  const D = DIVERS;
  return [
    { id: 'marinero_ferri_caleta', x: FERRY.sailor.x, y: FERRY.sailor.y, name: SPEAKER.sailor, sprite: SPRITE.sailor, dir: FERRY.sailor.dir, move: 'still', trigger: 'action', script: ferryTalk },
    {
      id: 'buzo_muelle', x: D.diver.x, y: D.diver.y, name: SPEAKER.diver, sprite: SPRITE.diver, dir: D.diver.dir, move: 'look', trigger: 'action',
      script: (ctx) => lines(ctx, SPEAKER.diver, ctx.state.zygardeAbility('dive') ? CALETA_TEXT.diverAfter : CALETA_TEXT.diver),
    },
    {
      id: 'buceadora_ainhoa', type: 'trainer', trainer: 'b09b_buceadora_ainhoa', name: 'Buceadora Ainhoa', sprite: 'anil:buceadora',
      x: D.ainhoa.x, y: D.ainhoa.y, dir: D.ainhoa.dir, sight: 3,
      intro: '¿Vienes al muelle de buzos? Aquí primero se combate y luego se charla. ¡Vamos!',
      after: 'El Faro Sonda guía a los barcos. A los buzos nos guía el ruido del mar. Últimamente suena distinto.',
    },
    {
      id: 'remolino_algas', type: 'diveSpot', x: D.kelpDive.x, y: D.kelpDive.y, to: 'caleta_algas', tx: ALGAS_ENTRY.x, ty: ALGAS_ENTRY.y, dir: ALGAS_ENTRY.dir,
    },
  ];
}

function edgeEvents() {
  if (linkOpen('caleta_sonda', 'mar_del_sur')) return [];
  const text = blockedText('caleta_sonda', 'mar_del_sur');
  const south = [];
  for (let x = 0; x < W; x++) south.push([x, H - 1]);
  const west = [];
  for (let y = 6; y < H - 1; y++) west.push([0, y]);
  return [...blockedLink('mar_caleta_s', south, text, 'up', 'down'), ...blockedLink('mar_caleta_o', west, text, 'right', 'left')];
}

export function caletaEvents() {
  return [
    ...doorEvents(),
    ...signEvents(),
    ...npcEvents(),
    ...portEvents(),
    ...COAST_ROCKS.map(coastRockEvent),
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    cellEvent({ id: 'cell_caleta_1', x: CELLS.c064.x, y: CELLS.c064.y }),
    ...edgeEvents(),
  ];
}
