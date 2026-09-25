// Senda del Mirador (docs/CAMPANA.md B17 «Salida: la Senda del Mirador, en el borde norte de la Sima. b17_vigilia»).
// El mapa existe desde el principio de la partida (Caudal abre su verja sur cuando está registrado): antes del P8 es una
// senda tranquila con un mirador sobre la Sima; el tramo hacia la Cabeza del Puente está derrumbado (Reconstrucción).
// Con el P8 (fase 3 de la crisis) la Sima se ensancha, suben curiosos, Genesis levanta dos torres del Anillo de
// Captación en los espolones y la Policía Regional corta el paso al Puente hasta la Vigilia de Caudal.
// B18 empieza aquí: el tablero (x 18–22) llega al borde sur y sigue en su Puente de la Convergencia (README del bloque).
import {
  F, SPEAKER, SPRITE, when, occupied, lines, zygardeSays, examine, npc,
} from './b17_common.js';
import {
  W, GAP, BRIDGE, DESCENT, TOWERS, SPOTS, ITEMS, ESPLANADE,
} from '../maps/b17/senda_layout.js';
import { socketTiles } from '../maps/b17/rim.js';
import { towerEvents } from './b17_torres.js';
import { mapRegistered, blockedText } from '../maps/b17/links.js';
import BAKED from '../stamps/baked/Exterior1.js';

const Z = socketTiles('Exterior1');
const P8 = F.p8;
const cordonUp = (s) => occupied(s) && !s.flag(F.vigil);
/** Tiles de la barrera de obras (stamp `barrera_obras`, 2×1) para las barreras de la Policía Regional. */
const BARRIER = BAKED.stamps.barrera_obras?.layers?.[2] || [0, 0];

export const SENDA_TEXT = Object.freeze({
  sign: 'SENDA DEL MIRADOR\n↑ Ciudad Caudal · ↓ Mirador Norte de la Sima.',
  restSign: 'DESCANSADERO DE LA SENDA\nNo se permite acampar junto al borde.',
  miradorSign: (s) => (s.flag(P8)
    ? 'MIRADOR NORTE\nAlguien ha escrito debajo, a lápiz: «La Sima ya no cabe en el cartel».'
    : 'MIRADOR NORTE\nAl sur, la Sima del Eje. Al otro lado, el Mirador Sur y las torres de Ciudad Lúmina.'),
  plankSign: 'Al espolón del este. Borde inestable: no pasar de la barandilla.',
  gapBlocked: 'El paso hacia la vieja Cabeza del Puente se ha derrumbado. En el borde quedan zócalos hexagonales, muy gastados.',
  arrivalCrisis: 'La Sima respira. Se abre un poco más cada noche.',
  arrivalTowers: 'Algo tira de la tierra aquí. Hacia esas torres del borde.',
  stele: (s) => (s.hasItem?.('GLYPHKEY') || s.hasKeyItem?.('GLYPHKEY')
    ? ['Una estela de glifos Unown muy gastados. Con la Clave Glífica se distinguen dos palabras: «tiempo» y «espacio».']
    : ['Una estela de glifos Unown muy gastados.']),
  bridgeEnd: 'El tablero sigue sobre la Sima, pero un poco más allá el Puente de la Convergencia se ha hundido. Por aquí no se puede seguir.',
  bridgeEndZygarde: 'Aquí hubo un camino. Lo siento debajo, muy hondo.',
  hiker: (s) => (s.flag(P8)
    ? ['Antes venía a ver la Sima los domingos. Ahora vengo a ver si sigue en su sitio.', 'Cada mañana hay un palmo menos de borde. No os acerquéis a la barandilla.']
    : ['El Albo se despeña en la Sima un poco más abajo. Dicen que nadie ha visto dónde cae.', 'Desde el mirador, en días claros, se ve el Mirador Sur al otro lado.']),
  painter: ['Llevo tres años pintando la Sima y nunca me sale igual. Es como si cambiara de sitio cuando no la miro.'],
  fisher: (s) => (s.flag(P8)
    ? ['Desde que la luna está así, el río baja con prisa. Los peces también.']
    : ['Aquí pican poco, pero se está tranquilo. Más abajo el río se tira a la Sima y se acabó la pesca.']),
  agent: [
    'Alto. Por orden del Agente Olmedo, nadie pasa al Puente.',
    'El borde cede por momentos y en el Mirador Sur hay gente del Consorcio haciendo cosas raras. Hasta nuevo aviso, cerrado.',
  ],
  agentAfter: ['El Agente Olmedo dice que te deje pasar. Tú sabrás lo que haces.', 'El tablero sigue hasta el Puente, y el Puente cruza la Sima entera. No mires abajo.'],
  agentPush: 'El agente te hace volver atrás con un gesto.',
});

function signs() {
  return [
    { id: 'cartel_senda', type: 'sign', ...SPOTS.sign, text: SENDA_TEXT.sign, skin: 'sign hgss dir' },
    { id: 'cartel_descansadero', type: 'sign', ...SPOTS.restSign, text: SENDA_TEXT.restSign },
    { id: 'cartel_mirador', ...SPOTS.miradorSign, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(SENDA_TEXT.miradorSign(ctx.state), { skin: 'sign hgss dir' }); } },
    { id: 'cartel_tablas', type: 'sign', ...SPOTS.plankSign, text: SENDA_TEXT.plankSign },
    examine('estela_puente', SPOTS.bridgeStele.x, SPOTS.bridgeStele.y + 1, (s) => SENDA_TEXT.stele(s)),
    examine('estela_puente_2', SPOTS.bridgeStele.x + 1, SPOTS.bridgeStele.y + 1, (s) => SENDA_TEXT.stele(s)),
  ];
}

function people() {
  const hikerSpot = SPOTS.hiker;
  return [
    npc('excursionista_senda', hikerSpot.x, hikerSpot.y, SPRITE.hiker, SPEAKER.hiker, (s) => SENDA_TEXT.hiker(s), { dir: hikerSpot.dir }),
    npc('pintor_mirador', SPOTS.painter.x, SPOTS.painter.y, 'anil:hombre1', 'Pintor', SENDA_TEXT.painter, { dir: 2, move: 'still', when: (s) => !s.flag(P8) }),
    npc('pescador_senda', 18, 14, 'anil:pescador', 'Pescador', (s) => SENDA_TEXT.fisher(s), { dir: 6, move: 'still' }),
    {
      id: 'montanero_oscar', type: 'trainer', trainer: 'b17_montanero_oscar', name: 'Montañero Óscar', sprite: 'anil:montanero',
      ...SPOTS.trainerA, sight: 3, when: (s) => s.flag(P8),
      intro: '¿También vienes a ver cómo se ensancha? Antes de acercarte al borde, a ver qué tal pisas.',
      after: 'Ayer esa farola estaba a dos pasos del borde. Hoy, a uno.',
    },
    {
      id: 'veterana_amparo', type: 'trainer', trainer: 'b17_veterana_amparo', name: 'Veterana Amparo', sprite: 'anil:veterana',
      ...SPOTS.trainerB, sight: 3, when: (s) => s.flag(P8),
      intro: 'Esas torres del borde no estaban la semana pasada. Ni tú tampoco. Veamos quién aguanta más.',
      after: 'Las torres zumban de noche. Mi Absol no duerme desde que las pusieron.',
    },
  ];
}

/** Tramo derrumbado hacia la Cabeza del Puente (tipo rebuildGap de B16 con flag compartido). */
function gapEvents() {
  const tiles = GAP.cells.map(([x, y]) => [x, y, 2, Z.stone]);
  return GAP.sockets.map((p, i) => ({
    id: `zocalo_senda_${i}`, type: 'rebuildGap', x: p.x, y: p.y, flag: F.sendaGap, tiles, tutorial: true,
    blockedText: SENDA_TEXT.gapBlocked,
  }));
}

/** Barrera de la Policía Regional a la entrada del tablero (del P8 a la Vigilia) y el agente después. */
function cordonEvents() {
  const B = BRIDGE;
  const [c0, c1] = B.cordon;
  const push = async (ctx) => {
    ctx.face('agente_puente', ctx.player);
    await lines(ctx, SPEAKER.agent, SENDA_TEXT.agent);
    await ctx.say(SENDA_TEXT.agentPush);
    await ctx.move('player', ['up'], { through: false });
  };
  return [
    { id: 'barrera_puente_0', x: c0.x, y: c0.y, pages: [{ when: cordonUp, tileId: BARRIER[0], solid: true }] },
    { id: 'barrera_puente_1', x: c1.x, y: c1.y, pages: [{ when: cordonUp, tileId: BARRIER[1] || BARRIER[0], solid: true }] },
    {
      id: 'agente_puente', x: B.agent.x, y: B.agent.y, name: SPEAKER.agent,
      pages: [
        { when: cordonUp, sprite: SPRITE.agent, dir: 8, move: 'still', trigger: 'action', script: async (ctx) => { await lines(ctx, SPEAKER.agent, SENDA_TEXT.agent); } },
      ],
    },
    ...B.agentFree.map((p, i) => ({ id: `paso_agente_puente_${i}`, x: p.x, y: p.y, through: true, trigger: 'touch', when: cordonUp, script: push })),
    npc('agente_puente_despues', ESPLANADE.x0 + 3, ESPLANADE.y1, SPRITE.agent, SPEAKER.agent, SENDA_TEXT.agentAfter, {
      dir: 6, move: 'still', when: (s) => s.flag(F.vigil) && !s.flag(F.p9),
    }),
  ];
}

/** Fin del tablero: aviso neutro mientras B18 no enganche su Puente (puente_convergencia) por el borde sur. */
function bridgeEndEvents() {
  if (mapRegistered('puente_convergencia')) return [];
  const e = BRIDGE.south;
  const script = async (ctx) => {
    await ctx.say(SENDA_TEXT.bridgeEnd);
    if (ctx.state.zygardeAbility('rebuild')) await zygardeSays(ctx, SENDA_TEXT.bridgeEndZygarde);
  };
  const out = [];
  for (let x = e.x0; x <= e.x1; x++) out.push({ id: `fin_tablero_${x}`, x, y: e.y, trigger: 'action', noOver: true, solid: true, script });
  return out.filter((ev) => ev.x >= 0 && ev.x < W);
}

/** Bajada a la Sima: cerrada con aviso neutro hasta que exista `sima_eje` (B19). */
function descentEvents() {
  if (mapRegistered('sima_eje')) return [];
  const text = blockedText('senda_mirador', 'sima_eje');
  return DESCENT.block.map((p, i) => ({
    id: `bajada_sima_${i}`, x: p.x, y: p.y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => { await ctx.say(text); },
  }));
}

function arrivalEvents() {
  return [{
    id: 'senda_llegada_crisis', x: 0, y: 0, trigger: 'auto',
    when: when({ all: [P8], none: ['b17_senda_llegada'] }),
    script: async (ctx) => {
      ctx.setFlag('b17_senda_llegada');
      await zygardeSays(ctx, SENDA_TEXT.arrivalCrisis);
      if (occupied(ctx.state)) await zygardeSays(ctx, SENDA_TEXT.arrivalTowers);
    },
  }];
}

function items() {
  return ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) }));
}

export function sendaEvents() {
  const tiles = Z;
  return [
    ...signs(),
    ...people(),
    ...gapEvents(),
    ...cordonEvents(),
    ...bridgeEndEvents(),
    ...descentEvents(),
    ...arrivalEvents(),
    ...towerEvents({ ...TOWERS.viento, image: 'Exterior1' }, tiles),
    ...towerEvents({ ...TOWERS.tormenta, image: 'Exterior1' }, tiles),
    ...items(),
  ];
}

