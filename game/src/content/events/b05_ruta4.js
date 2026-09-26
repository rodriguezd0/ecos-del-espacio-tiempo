// Eventos de la Ruta 4 (docs/CAMPANA.md B05 y §2.3; POKEDEX_DISTRIBUCION «Ruta 4»): el vado del Albo (anegado hasta
// p2_restored), la roca de tutorial de Embestida con el rincón de la Heracrossita (C026), las Células C025 (vega)
// y C073 (poza del río, Nadar), cinco entrenadores, objetos, árbol de miel, hierba que se agita, vecinos y carteles.
// Coordenadas en content/maps/b05/ruta_4_layout.js.
import { F, SPEAKER, SPRITE, say, blockedLink, examine, blockers } from './b05_common.js';
import { cellsOf, cellEvent } from './b05_cells.js';
import { honeyTreeEvent, rustleEvents } from './b05_wild.js';
import { FORD, WEST_ENTRY, NOOK, HOLLOW_TREE, HONEY_TREE, RUSTLE, FARM, SIGNS } from '../maps/b05/ruta_4_layout.js';
import { FORD_TILES } from '../maps/b05/ruta_4_build.js';
import { PENDING_LINKS, mapRegistered } from '../maps/b05/links.js';

/** Entrenadores (definiciones de combate en content/trainers/b05.js). */
export const RUTA4_TRAINERS = Object.freeze([
  { id: 'pescador_tomas', trainer: 'r4_pescador_tomas', name: 'Pescador Tomás', sprite: 'anil:pescador', x: 18, y: 18, dir: 8, sight: 4,
    after: 'El Albo trae ahora Goldeen enormes. Con una caña buena, hasta Seaking.' },
  { id: 'excursionista_nuria', trainer: 'r4_excursionista_nuria', name: 'Excursionista Nuria', sprite: 'anil:excursionista_f', x: 31, y: 19, dir: 2, sight: 3,
    after: 'Cuando el río crecía, la vega entera era un lago. Hoy se puede pasear.' },
  { id: 'montanero_hugo', trainer: 'r4_montanero_hugo', name: 'Montañero Hugo', sprite: 'anil:montanero', x: 43, y: 25, dir: 8, sight: 4,
    after: 'La escalera de la terraza la pusieron los de Brontia. Antes se subía a gatas.' },
  { id: 'ornitologo_samuel', trainer: 'r4_ornitologo_samuel', name: 'Ornitólogo Samuel', sprite: 'anil:ornitologo', x: 55, y: 11, dir: 2, sight: 4,
    after: 'Los Swablu de la meseta vuelan en círculos, como si el viento no supiera adónde ir.' },
  { id: 'joven_dani', trainer: 'r4_joven_dani', name: 'Joven Dani', sprite: 'anil:joven', x: 71, y: 3, dir: 2, sight: 4,
    after: 'Dicen que al campanario de Brontia le cae un rayo cada noche. Yo no me acerco.' },
]);

const TEXT = Object.freeze({
  signWest: 'RUTA 4\n→ Villa Brontia, por la vega y la meseta.',
  signFord: 'VADO DE LA RUTA 4\nCuando el Albo crece, el vado queda cerrado.',
  signEast: 'VILLA BRONTIA →\nLa meseta de los molinos.',
  signClimb: 'SUBIDA A LA MESETA\nEscalera de la terraza. Cuidado con el viento.',
  fordFlooded: 'El Albo baja crecido y revuelto. El vado está bajo el agua: por aquí no se puede cruzar.',
  farmDoor: 'Casa de labranza. La puerta está cerrada con un cerrojo de madera.',
  hollowEmpty: 'Un hueco en el tronco del árbol. Ya no queda nada dentro.',
  hollowFind: 'En el hueco del tronco hay algo que brilla…',
});

function trainerEvents() {
  return RUTA4_TRAINERS.map((t) => ({ ...t, type: 'trainer' }));
}

/** Agricultora junto al vado (orilla oeste): cuenta la crecida o su final según el P2. */
function farmerEvent() {
  return {
    id: 'agricultora', x: 8, y: 12, name: SPEAKER.farmer, sprite: SPRITE.farmer, dir: 2, move: 'look',
    script: async (ctx) => {
      if (!ctx.flag(F.p2)) {
        await say(ctx, SPEAKER.farmer, 'Desde que el Albo se volvió loco, de día se desborda y de noche casi se seca. Hoy el vado está bajo el agua.');
        await say(ctx, SPEAKER.farmer, 'La gente de Caudal dice que el río nace mal allá arriba, en la Garganta. Yo solo sé que no puedo cruzar a mi huerto.');
        return;
      }
      await say(ctx, SPEAKER.farmer, '¡El Albo ha vuelto a su cauce! Ya se cruza el vado sin mojarse las rodillas.');
      await say(ctx, SPEAKER.farmer, 'Al otro lado empieza la vega, y luego la subida a la meseta. Arriba está Villa Brontia.');
    },
  };
}

/** Labrador de la casa de la vega (lado este). */
function farmHandEvent() {
  return {
    id: 'labrador', x: FARM.door.x + 1, y: FARM.door.y + 2, name: 'Labrador', sprite: SPRITE.neighborM, dir: 2, move: { wander: 1 },
    script: async (ctx) => {
      await say(ctx, 'Labrador', 'La crecida me dejó el huerto lleno de barro. Por lo menos crecen solas las flores de la vega.');
      await say(ctx, 'Labrador', 'Si subes a Brontia, lleva una linterna. Allí arriba ya no se enciende nada por las noches.');
    },
  };
}

/** Caminante en la meseta, junto al cartel de Brontia. */
function hikerEvent() {
  return {
    id: 'caminante', x: 74, y: 8, name: 'Caminante', sprite: 'anil:excursionista', dir: 4, move: 'look',
    script: async (ctx) => {
      await say(ctx, 'Caminante', 'Desde aquí se ven los molinos de Brontia. Antes giraban todos a la vez; ahora cada uno va a su aire.');
      await say(ctx, 'Caminante', 'Y más allá está el Parque Eólico. Hace meses que no da luz.');
    },
  };
}

/** Vado: mientras el P2 no esté restaurado, la orilla tapa el camino (agua) y avisa al examinarlo. */
function fordEvents() {
  const flooded = (s) => !s?.flag(F.p2);
  const out = [{
    id: 'vado', x: FORD.x0, y: FORD.y0 - 1, through: true,
    pages: [{ when: flooded, patch: FORD_TILES }, { when: (s) => !flooded(s) }],
  }];
  for (let y = FORD.y0; y <= FORD.y1; y++) {
    out.push({ id: `vado_aviso_${y}`, x: FORD.x0, y, when: flooded, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(TEXT.fordFlooded); } });
  }
  // Corriente visible sobre el vado anegado.
  for (const [x, y] of [[12, 13], [14, 15], [11, 16], [13, 14]]) {
    out.push({ id: `vado_corriente_${x}_${y}`, x, y, when: flooded, sprite: 'anil:corrientes', dir: 4, stepAnime: true, directionFix: true, walkAnime: false, through: true, shadow: false, speed: 3 });
  }
  return out;
}

/**
 * Roca de tutorial de Embestida (CAMPANA B05: «roca de tutorial en la Ruta 4») y el rincón que guarda (C026 y la
 * Heracrossita). Zygarde habla muy poco (autor, 25-09-2026): la roca no lleva comentario del Core; la describe su
 * propio evento (ramRock).
 */
function nookEvents() {
  const r = NOOK.rock;
  // Las rocas grandes que cierran el rincón solo bloquean su fila de abajo: se cierra también la de arriba.
  const wall = [];
  for (const y of [20, 22, 25, 27]) wall.push([69, y], [70, y]);
  return [
    ...blockers('rincon_muro', wall),
    { id: 'roca_tutorial', type: 'ramRock', x: r.x, y: r.y, sprite: SPRITE.barrier, dir: 2, directionFix: true, stepAnime: true },
    {
      id: 'hueco_arbol', x: HOLLOW_TREE.trunk.x, y: HOLLOW_TREE.trunk.y, trigger: 'action', noOver: true, solid: true,
      pages: [
        { script: async (ctx) => {
          await ctx.say(TEXT.hollowFind);
          ctx.setSelfSwitch('A', true);
          await ctx.giveItem('HERACRONITE', 1, { found: true });
        } },
        { when: (_s, ev) => ev.selfSwitch('A'), trigger: 'action', script: async (ctx) => { await ctx.say(TEXT.hollowEmpty); } },
      ],
    },
  ];
}

function itemEvents() {
  return [
    { id: 'superpocion_vega', type: 'item', x: 20, y: 17, item: 'SUPERPOTION' },
    { id: 'superball_vega', type: 'item', x: 40, y: 7, item: 'GREATBALL', count: 2 },
    { id: 'repelente_t1', type: 'item', x: 48, y: 3, item: 'REPEL' },
    { id: 'revivir_t2', type: 'item', x: 79, y: 2, item: 'REVIVE' },
    { id: 'eter_oculto', type: 'item', x: 24, y: 26, item: 'ETHER', hidden: true },
    { id: 'miel_oculta', type: 'item', x: 60, y: 22, item: 'HONEY', hidden: true },
    { id: 'miel_vega', type: 'item', x: 36, y: 12, item: 'HONEY' },
    { id: 'antidoto_rincon', type: 'item', x: 77, y: 24, item: 'FULLHEAL' },
  ];
}

function signEvents() {
  return [
    { id: 'cartel_oeste', type: 'sign', x: SIGNS.west.x, y: SIGNS.west.y, text: TEXT.signWest },
    { id: 'cartel_vado', type: 'sign', x: SIGNS.ford.x, y: SIGNS.ford.y, text: TEXT.signFord },
    { id: 'cartel_este', type: 'sign', x: SIGNS.east.x, y: SIGNS.east.y, text: TEXT.signEast },
    { id: 'cartel_subida', type: 'sign', x: SIGNS.climb.x, y: SIGNS.climb.y, text: TEXT.signClimb },
    examine('puerta_granja', FARM.door.x, FARM.door.y, TEXT.farmDoor),
  ];
}

/** Enlace con Ciudad Caudal (B03) mientras su mapa no exista: aviso neutro y un paso atrás. */
function caudalLink() {
  if (mapRegistered('ciudad_caudal')) return [];
  const cells = [];
  for (let y = WEST_ENTRY.y0; y <= WEST_ENTRY.y1; y++) cells.push([0, y]);
  return blockedLink('limite_oeste', cells, PENDING_LINKS.ruta_4.ciudad_caudal.blocked, 'right', 'left');
}

export function ruta4Events() {
  return [
    ...trainerEvents(),
    ...cellsOf('ruta_4').map((c) => cellEvent(c)),
    farmerEvent(),
    farmHandEvent(),
    hikerEvent(),
    ...fordEvents(),
    ...nookEvents(),
    honeyTreeEvent('arbol_miel', HONEY_TREE.trunk.x, HONEY_TREE.trunk.y),
    ...rustleEvents('hierba_agitada', RUSTLE),
    ...itemEvents(),
    ...signEvents(),
    ...caudalLink(),
  ];
}
