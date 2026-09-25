// Eventos de Villa Boreal (docs/CAMPANA.md B15: desvinculación, T13 y Gael; §1.3 servicios y ferri tras P7):
// llegada (a pie o en ferri) con el Swinub que ya no reconoce a su niño, la Torre de Hielo (andamio hasta el T13; en
// pie después), vecinos, el marinero del ferri (Nexo), el sendero de los Lagos del Alma (B16, cerrado mientras no
// exista), la aurora de noche y, al salir del Observatorio tras el combate B5, la llamada de Alerce («Ese aro no es de
// ninguna tienda.»). Coordenadas en content/maps/b15/layout_boreal.js.
import { takeFerry } from '../../world/transport.js';
import {
  F, SPEAKER, SPRITE, OBJ, isNorthUnbound, markNorthUnbound, zygardeSays, lines, alerceCall, pause, when, isNight,
} from './b15_common.js';
import { BOREAL } from '../maps/b15/layout_boreal.js';
import { PENDING_LINKS } from '../maps/b15/links.js';
import { ceremonyEvents } from './b15_t13.js';

const B = BOREAL;
const N = B.npcs;

export const BOREAL_TEXT = Object.freeze({
  townSign: 'VILLA BOREAL\nDonde el cielo se enciende.',
  obsSign: 'OBSERVATORIO BOREAL\nAbierto a los vecinos las noches de aurora.',
  tallSign: 'TALLERES DEL HIELO\nTallas, bloques y la Torre de cada invierno.',
  ferrySign: 'MUELLE DE VILLA BOREAL\nFerri a Ciudad Nexo.',
  arrival: 'Villa Boreal: casas bajas, humo de chimeneas y, en la plaza, un andamio vacío donde otros inviernos se alza la Torre de Hielo.',
  boyCall: '¡Bolita! Ven, que nos vamos a casa…',
  boy: ['No me hace caso. Desde hace días ni me mira.', 'Mamá dice que les pasa a todos los del pueblo. Que es por el cielo.'],
  arrivalZygarde: 'Aquí también. Más fuerte que en la vertiente.',
  scaffold: 'El andamio de la Torre de Hielo, vacío. Un cartel clavado a un poste: «Este invierno no habrá Torre. — El concejo.»',
  tower: 'La Torre de Hielo, tallada con el bloque del Lago Viejo. De noche, su fanal se ve desde la Ruta 13.',
  concejal: [
    'Este invierno no habrá Torre de Hielo. Rosendo, el tallista, dice que no reconoce el hielo del lago.',
    'Sin él nadie sabe tallarla. Y sin la Torre, con ventisca, los que bajan del Paso se pierden.',
  ],
  concejalAfter: 'La Torre vuelve a guiar a los viajeros. El pueblo te debe una. Y Nieves… Nieves ya es tallista.',
  vecina: [
    'En Boreal miramos las auroras desde hace siglos. Este año el cielo está raro y nadie quiere mirar hacia arriba.',
    'Mi Cubchoo se sienta en la puerta y me mira como a una desconocida. Hay quien habla de marcharse al sur hasta que esto pase.',
  ],
  vecinaAfter: 'Esta mañana mi Cubchoo me ha esperado en la puerta. Como antes.',
  pescador: [
    'Con el mar en calma han vuelto los ferris. Y los témpanos: se ven flotar al oeste.',
    'Al noroeste hay un islote con una instalación abandonada. No es de aquí ni de nadie que conozcamos.',
  ],
  vigia: [
    'Hay un chico en la terraza del Observatorio desde hace días. Dice que espera a alguien.',
    'Lleva una piedra verde en la mano. No brilla. Él la mira como si fuera a hacerlo.',
  ],
  vigiaAfter: 'El chico de la terraza se fue sin despedirse. Bajó la escalera sin mirar a nadie.',
  cabana: 'La puerta está cerrada. Por la ventana se ve un telescopio pequeño apuntando al cielo del norte.',
  sailor: '¡Ferri a Ciudad Nexo! Con el mar en calma, salimos cada día.',
  swinub: 'El Swinub da un paso atrás. No reconoce a nadie.',
  lagos: PENDING_LINKS.villa_boreal.lagos_alma.blocked,
});

// ───────────────────────────── Llegada y llamada de Alerce ─────────────────────────────

async function arrival(ctx) {
  ctx.setFlag(F.borealIntro);
  markNorthUnbound(ctx);
  await ctx.say(BOREAL_TEXT.arrival);
  if (ctx.world?.events?.some((e) => e.id === 'nino_bolita' && e.page)) {
    await ctx.camera?.pan?.(N.ninoPerro.x, N.ninoPerro.y, 30);
    await ctx.say(BOREAL_TEXT.boyCall, { speaker: 'Niño' });
    await ctx.emote('swinub_bolita', '?');
    await ctx.move('swinub_bolita', ['turn_right', { wait: 12 }, 'turn_down'], { through: true });
    await lines(ctx, 'Niño', BOREAL_TEXT.boy);
    await ctx.camera?.reset?.(30);
  }
  await zygardeSays(ctx, BOREAL_TEXT.arrivalZygarde);
}

/** Tras el combate B5 (al salir del Observatorio): Alerce llama. */
export async function alerceRingCall(ctx) {
  if (!ctx.flag(F.gaelB5) || ctx.flag(F.alerceRing)) return;
  ctx.setFlag(F.alerceRing);
  await pause(ctx, 20);
  await alerceCall(ctx, [
    '\\PN. Me ha llegado el registro de tu Pokédex: el combate con Gael en el Observatorio.',
    'Su Absol megaevoluciona con un aro negro. Una piedra violeta, engastada a mano.',
    '…',
    'Ese aro no es de ninguna tienda.',
    'Si vuelves a ver a Gael, no le preguntes por el aro. Todavía no.',
  ]);
  await zygardeSays(ctx, 'Al norte, los lagos. Algo nos espera allí.');
}

export async function borealOnEnter(ctx) {
  if (ctx.flag(F.gaelB5) && !ctx.flag(F.alerceRing)) await alerceRingCall(ctx);
  const onPier = ctx.player && ctx.player.x <= B.boardwalk.x1;
  if (!ctx.flag(F.borealIntro) && onPier) await arrival(ctx);
}

// ───────────────────────────── Eventos ─────────────────────────────

function sceneEvents() {
  const out = [];
  for (let x = N.llegada.x0; x <= N.llegada.x1; x++) {
    out.push({ id: `llegada_boreal_${x}`, x, y: N.llegada.y, trigger: 'touch', when: when({ none: [F.borealIntro] }), script: arrival });
  }
  // Aurora sobre el pueblo por la noche (fenómeno de siempre en Boreal; el cielo de crisis va aparte).
  out.push({ id: 'aurora_boreal', x: 21, y: 0, through: true, when: (s) => isNight(s), glow: { name: 'aurora', color: [120, 255, 200], alpha: 0.5 } });
  return out;
}

function towerEvents() {
  const T = B.tower;
  const out = [{
    id: 'torre_hielo', x: T.x, y: T.y, name: 'Torre de Hielo',
    pages: [
      { sprite: OBJ.tower, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(BOREAL_TEXT.scaffold); } },
      {
        when: when({ all: [F.tower] }), sprite: OBJ.tower, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
        solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(BOREAL_TEXT.tower); },
      },
    ],
  }];
  T.footprint.forEach(([x, y], i) => out.push({ id: `torre_pie_${i}`, x, y, solid: true, trigger: 'action', script: async (ctx) => {
    await ctx.say(ctx.flag(F.tower) ? BOREAL_TEXT.tower : BOREAL_TEXT.scaffold);
  } }));
  return out;
}

function npcEvents() {
  const unbound = (s) => isNorthUnbound(s);
  return [
    {
      id: 'nino_bolita', x: N.ninoPerro.x, y: N.ninoPerro.y, name: 'Niño', sprite: SPRITE.nino, dir: N.ninoPerro.dir, move: 'look',
      trigger: 'action', script: (ctx) => lines(ctx, 'Niño', unbound(ctx.state) ? BOREAL_TEXT.boy : ['¡Bolita ha vuelto a jugar conmigo!']),
    },
    {
      id: 'swinub_bolita', x: N.swinub.x, y: N.swinub.y, name: 'Swinub', sprite: SPRITE.swinub, dir: 4, stepAnime: true,
      trigger: 'action', script: async (ctx) => { ctx.cry('SWINUB'); await ctx.say(unbound(ctx.state) ? BOREAL_TEXT.swinub : '¡Swii!'); },
    },
    {
      id: 'concejal_boreal', x: N.concejal.x, y: N.concejal.y, name: 'Concejal', sprite: SPRITE.vecino, dir: N.concejal.dir, move: 'look',
      pages: [
        { trigger: 'action', script: (ctx) => lines(ctx, 'Concejal', BOREAL_TEXT.concejal) },
        { when: when({ all: [F.tower] }), trigger: 'action', script: async (ctx) => { await ctx.say(BOREAL_TEXT.concejalAfter, { speaker: 'Concejal' }); } },
      ],
    },
    {
      id: 'vecina_plaza', x: N.vecinaPlaza.x, y: N.vecinaPlaza.y, name: SPEAKER.vecina, sprite: SPRITE.vecina, dir: N.vecinaPlaza.dir, move: 'look',
      trigger: 'action', script: (ctx) => (unbound(ctx.state) ? lines(ctx, SPEAKER.vecina, BOREAL_TEXT.vecina) : ctx.say(BOREAL_TEXT.vecinaAfter, { speaker: SPEAKER.vecina })),
    },
    {
      id: 'pescador_boreal', x: N.pescador.x, y: N.pescador.y, name: 'Pescador', sprite: 'pescador', dir: N.pescador.dir, move: 'look',
      trigger: 'action', script: (ctx) => lines(ctx, 'Pescador', BOREAL_TEXT.pescador),
    },
    {
      id: 'vigia_observatorio', x: N.vigia.x, y: N.vigia.y, name: 'Vigía', sprite: SPRITE.astronomo, dir: N.vigia.dir, move: 'look',
      pages: [
        { trigger: 'action', script: (ctx) => lines(ctx, 'Vigía', BOREAL_TEXT.vigia) },
        { when: when({ all: [F.gaelB5] }), trigger: 'action', script: async (ctx) => { await ctx.say(BOREAL_TEXT.vigiaAfter, { speaker: 'Vigía' }); } },
      ],
    },
    {
      id: 'marinero_ferri_boreal', x: B.ferry.sailor.x, y: B.ferry.sailor.y, name: SPEAKER.marinero, sprite: SPRITE.marinero, dir: B.ferry.sailor.dir, move: 'still',
      trigger: 'action',
      script: async (ctx) => {
        await ctx.say(BOREAL_TEXT.sailor, { speaker: SPEAKER.marinero });
        await takeFerry(ctx, 'boreal', { speaker: SPEAKER.marinero });
      },
    },
  ];
}

function objectEvents({ lagosOpen }) {
  const BD = B.buildings;
  const out = [
    { id: 'cartel_boreal', type: 'sign', x: 23, y: 22, text: BOREAL_TEXT.townSign },
    { id: 'cartel_observatorio', type: 'sign', x: BD.observatorio.door.x + 2, y: BD.observatorio.door.y + 1, text: BOREAL_TEXT.obsSign },
    { id: 'cartel_talleres', type: 'sign', x: BD.talleres.door.x + 2, y: BD.talleres.door.y + 1, text: BOREAL_TEXT.tallSign },
    { id: 'cartel_ferri_boreal', type: 'sign', x: B.ferry.sign.x, y: B.ferry.sign.y, text: BOREAL_TEXT.ferrySign },
    { id: 'puerta_cabana', x: BD.cabana.door.x, y: BD.cabana.door.y, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(BOREAL_TEXT.cabana); } },
    ...B.yard.blocks.map(([x, y], i) => ({ id: `bloque_patio_${i}`, x, y, name: 'Bloque de hielo', sprite: SPRITE.iceObject, dir: 2 + 2 * (i % 3), directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Bloques de hielo cortados del lago, esperando al tallista.'); } })),
    { id: 'trineo_patio', ...B.yard.sled, name: 'Trineo', sprite: OBJ.sled, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Un trineo cargado de bloques de hielo. Las cuerdas están heladas.'); } },
    ...B.yard.sculptures.map(([x, y, v], i) => ({ id: `talla_patio_${i}`, x, y, name: 'Talla de hielo', sprite: OBJ.sculptures, dir: 2, pattern: v, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Una talla de hielo de los Talleres. Tiene el pulso firme de alguien con muchos inviernos.'); } })),
    { id: 'objeto_boreal_oculto_1', type: 'item', ...B.items.hidden1, item: 'NEVERMELTICE', hidden: true },
    { id: 'objeto_boreal_oculto_2', type: 'item', ...B.items.hidden2, item: 'RARECANDY', hidden: true },
  ];
  if (!lagosOpen) {
    for (let x = B.north.x0; x <= B.north.x1; x++) {
      out.push({ id: `sendero_lagos_${x}`, x, y: B.north.y, solid: true, trigger: 'touch', script: async (ctx) => { await ctx.say(BOREAL_TEXT.lagos); } });
    }
  }
  return out;
}

export function borealEvents({ lagosOpen = false } = {}) {
  return [...sceneEvents(), ...towerEvents(), ...npcEvents(), ...objectEvents({ lagosOpen }), ...ceremonyEvents()];
}
