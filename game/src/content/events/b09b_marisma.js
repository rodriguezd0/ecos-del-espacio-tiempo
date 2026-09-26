// Eventos de la Ruta 8 · Marisma Turbia y Palafitos (docs/CAMPANA.md B09 parte B): llegada desde Lúmina con el
// golpeteo de las bombas, barro (Terreno complicado) en los bordes de cada llanura, vecinos de los Palafitos (los
// jóvenes que quieren irse, el niño y su Wooper enfermo, el viejo de la laguna clara, el puesto de hierbas),
// entrenadores, objetos, carteles, células C044/C072, la tabla de lluvia (Goomy) y los enlaces de los bordes.
// El arco T08 (Remedios, Alerce, bombas, estacas, pozas) está en b09b_t08.js.
import { EncounterSystem } from '../../world/encounters.js';
import { clerkEvent } from '../services/shop.js';
import { cellEvent } from './b01_cells.js';
import { F, SPEAKER, SPRITE, lines, blockedLink, blockers, examine, MUSIC } from './b09b_common.js';
import { t08Events, t08FinaleScene } from './b09b_t08.js';
import {
  W, H, terrainGrid, SPOTS, ITEMS, SIGNS, CELLS, HOUSES, EXITS, STILTS,
} from '../maps/b09b/ruta_8_layout.js';
import { linkOpen, blockedText } from '../maps/b09b/links.js';
import { MARISMA_GRASS, MARISMA_GRASS_RAIN, RUTA_8 } from '../encounters/b09b.js';

const healed = (s) => Boolean(s) && s.flag(F.healed);

export const MARISMA_TEXT = Object.freeze({
  arrival: 'Un golpeteo sordo llega desde la marisma, una y otra vez. Huele a hierro y a agua parada.',
  signLumina: 'RUTA 8 · MARISMA TURBIA\n← Palafitos · Aldea Mnemos   → Ciudad Lúmina',
  signMnemos: 'RUTA 8 · MARISMA TURBIA\n↑ Aldea Mnemos   ↓ Palafitos · Ciudad Lúmina',
  signPalafitos: 'LOS PALAFITOS\nCasa de Doña Remedios, curandera. Puesto de hierbas.',
  signConsorcio: 'CONSORCIO MERIDIANO DE ESTUDIOS GEOFÍSICOS\nMuestreo de lodos en curso. Prohibido el paso.',
  signConsorcioAfter: 'El cartel del Consorcio está torcido y medio hundido en el barro. Nadie ha vuelto a por él.',
  emptyHouse: 'La puerta está cerrada con un candado nuevo. Por la ventana se ven cajas de mudanza apiladas.',
  emptyHouseAfter: 'La puerta sigue cerrada, pero alguien ha quitado las cajas de la ventana.',
});

// ───────────────────────────── llegada ─────────────────────────────

async function arrivalScene(ctx) {
  if (ctx.flag(F.marshArrival)) return;
  ctx.setFlag(F.marshArrival);
  ctx.se('Anim/Earth1', { volume: 45 });
  await ctx.camera.pan(SPOTS.panPump.x, SPOTS.panPump.y, 60);
  await ctx.wait(20);
  ctx.se('Anim/Earth1', { volume: 55 });
  await ctx.say(MARISMA_TEXT.arrival);
  await ctx.camera.reset(40);
}

function arrivalEvents() {
  const out = [];
  for (let y = SPOTS.arrival.y0; y <= SPOTS.arrival.y1; y++) {
    out.push({ id: `llegada_${y}`, x: SPOTS.arrival.x, y, trigger: 'touch', through: true, when: (s) => Boolean(s) && !s.flag(F.marshArrival), script: arrivalScene });
  }
  return out;
}

// ───────────────────────────── barro (Terreno complicado) ─────────────────────────────

/**
 * Un evento `roughTerrain` por casilla de barro que linda con suelo pisable: las casillas interiores solo se alcanzan
 * cruzando uno de estos bordes (tests/b09b_reach.test.mjs lo comprueba).
 */
export function mudBorderCells() {
  const g = terrainGrid();
  const out = [];
  const walk = (c) => c !== 'm' && c !== 'T' && c !== 'w';
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x] !== 'm') continue;
      const border = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx; const ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < W && ny < H && walk(g[ny][nx]);
      });
      if (border) out.push([x, y]);
    }
  }
  return out;
}

function mudEvents() {
  return mudBorderCells().map(([x, y]) => ({ id: `barro_${x}_${y}`, type: 'roughTerrain', kind: 'mud', x, y }));
}

/**
 * Bloqueos sobre el agua: los tejados de los palafitos que vuelan sobre la laguna y los pilotes (se nada alrededor, no
 * por debajo; sin ellos, un nadador podía meterse bajo un tejado sin poder salir).
 */
export function stiltBlockerCells() {
  const g = terrainGrid();
  const out = [];
  for (const h of Object.values(HOUSES)) {
    for (let y = h.y; y < h.y + 8; y++) for (let x = h.x; x < h.x + 6; x++) if (g[y]?.[x] === 'w') out.push([x, y]);
  }
  for (const [x, y] of STILTS) if (!out.some(([ox, oy]) => ox === x && oy === y)) out.push([x, y]);
  return out;
}

// ───────────────────────────── lluvia: Goomy sustituye a Skorupi ─────────────────────────────

const RAIN = new Set(['rain', 'storm', 'heavyRain']);

/** Evento paralelo: mientras llueve, la hierba usa la tabla parcial de lluvia (POKEDEX_DISTRIBUCION §7.3). */
function rainEncounterEvent() {
  return {
    id: 'lluvia_juncal', x: 0, y: 0, through: true, trigger: 'parallel',
    script: async (ctx) => {
      const world = ctx.world;
      if (world?.map?.id === 'ruta_8_marisma') {
        const want = RAIN.has(ctx.scene?.weather?.type) ? MARISMA_GRASS_RAIN : MARISMA_GRASS;
        if (world.encounters?.b09bGrass !== want) {
          const sys = new EncounterSystem({ ...RUTA_8, grass: want }, world.rng);
          sys.b09bGrass = want;
          world.encounters = sys;
        }
      }
      await ctx.wait(60);
    },
  };
}

// ───────────────────────────── Palafitos: vecinos y servicios ─────────────────────────────

function palafitosEvents() {
  const [y1, y2] = SPOTS.youths;
  const youthLines = {
    before1: ['Aquí ya no se puede vivir. El agua huele a hierro y los Pokémon enferman.', 'En cuanto vendamos la barca, nos vamos a Lúmina.'],
    before2: ['Mi abuela dice que esto era una laguna clara. Yo solo la he conocido así.', 'Si buscas a alguien que sepa de la marisma, habla con Doña Remedios. Su casa es la de más al oeste de los Palafitos.'],
    after1: 'Nos quedamos. La marisma respira otra vez.',
    after2: 'Hemos vuelto a sacar la barca. Esta vez para pescar.',
  };
  return [
    {
      id: 'joven_1', x: y1.x, y: y1.y, name: SPEAKER.youth,
      pages: [
        { sprite: SPRITE.youth, dir: y1.dir, move: 'still', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.youth, youthLines.before1) },
        { when: healed, sprite: SPRITE.youth, dir: 2, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(youthLines.after1, { speaker: SPEAKER.youth }); } },
      ],
    },
    {
      id: 'joven_2', x: y2.x, y: y2.y, name: SPEAKER.youthF,
      pages: [
        { sprite: SPRITE.youthF, dir: y2.dir, move: 'still', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.youthF, youthLines.before2) },
        { when: healed, sprite: SPRITE.youthF, dir: 2, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(youthLines.after2, { speaker: SPEAKER.youthF }); } },
      ],
    },
    {
      id: 'nino_wooper', x: SPOTS.kid.x, y: SPOTS.kid.y, name: SPEAKER.kid,
      pages: [
        { sprite: SPRITE.kid, dir: SPOTS.kid.dir, move: 'still', trigger: 'action', script: async (ctx) => { await ctx.say('Mi Wooper no quiere jugar. Doña Remedios dice que es por el agua.', { speaker: SPEAKER.kid }); } },
        { when: healed, sprite: SPRITE.kid, dir: SPOTS.kid.dir, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say('¡Mi Wooper vuelve a chapotear! Dice Remedios que es porque el agua ya no pica.', { speaker: SPEAKER.kid }); } },
      ],
    },
    {
      id: 'wooper_enfermo', x: SPOTS.wooper.x, y: SPOTS.wooper.y, name: 'Wooper',
      pages: [
        {
          sprite: SPRITE.wooper, dir: 4, directionFix: true, stepAnime: false, trigger: 'action',
          script: async (ctx) => { ctx.cry('WOOPER', 1); await ctx.say('El Wooper apenas levanta la cabeza. Tiene la piel reseca y sin brillo.'); },
        },
        {
          when: healed, sprite: SPRITE.wooper, dir: 4, stepAnime: true, move: 'look', trigger: 'action',
          script: async (ctx) => { ctx.cry('WOOPER', 1); await ctx.say('¡Wooo! El Wooper salta sobre los tablones, empapado y contento.'); },
        },
      ],
    },
    {
      id: 'anciano_palafitos', x: 20, y: 32, name: 'Anciano',
      pages: [
        {
          sprite: SPRITE.elder, dir: 2, move: 'look', trigger: 'action',
          script: (ctx) => lines(ctx, 'Anciano', ['De chaval, el agua era tan clara que se veía el fondo desde los tablones.', 'Luego vino aquel invierno y la laguna se fue en una semana. Nadie supo explicar por qué.']),
        },
        {
          when: healed, sprite: SPRITE.elder, dir: 2, move: 'look', trigger: 'action',
          script: (ctx) => lines(ctx, 'Anciano', ['Esta mañana he visto un Barboach bajo el puente. Hacía años.']),
        },
      ],
    },
    {
      id: 'pescador_viejo', x: 26, y: 38, name: SPEAKER.fisher, sprite: SPRITE.fisher, dir: 2, move: 'still', trigger: 'action',
      script: (ctx) => lines(ctx, SPEAKER.fisher, [
        'Con una Caña Buena aquí pican los Barboach, y alguna vez un Whiscash.',
        'En Ciudad Nexo hay un pescador en el muelle que regala cañas a quien sabe escuchar al agua.',
      ]),
    },
    clerkEvent({
      id: 'vendedora_hierbas', x: SPOTS.vendor.x, y: SPOTS.vendor.y, dir: SPOTS.vendor.dir, sprite: SPRITE.vendor,
      items: ['ANTIDOTE', 'HEALPOWDER', 'ENERGYPOWDER', 'ENERGYROOT', 'REVIVALHERB', 'PECHABERRY'],
      greeting: 'Hierbas de la marisma. Amargas, pero curan.',
    }),
    examine('casa_vacia', HOUSES.vacia.door.x, HOUSES.vacia.door.y, (s) => (healed(s) ? MARISMA_TEXT.emptyHouseAfter : MARISMA_TEXT.emptyHouse), { solid: true }),
  ];
}

// ───────────────────────────── entrenadores, objetos, carteles, células ─────────────────────────────

function trainerEvents() {
  return [
    {
      id: 'pescadora_lorena', type: 'trainer', trainer: 'b09b_pescadora_lorena', name: 'Pescadora Lorena', sprite: 'anil:pescadora',
      x: SPOTS.fisher.x, y: SPOTS.fisher.y, dir: SPOTS.fisher.dir, sight: 2,
      intro: 'Chis. Que se espantan… Bah, ya se han espantado. ¡Combate!',
      after: 'Desde que el agua huele a hierro, aquí solo pican los más duros.',
    },
    {
      id: 'excursionista_julian', type: 'trainer', trainer: 'b09b_excursionista_julian', name: 'Excursionista Julián', sprite: 'anil:excursionista',
      x: 37, y: 64, dir: 6, sight: 3,
      intro: '¿Vas a la marisma? Primero, a ver si aguantas el barro.',
      after: 'Dicen que en los Palafitos hay una curandera que lo cura todo. Hasta el mal humor.',
    },
    {
      id: 'bichera_sara', type: 'trainer', trainer: 'b09b_bichera_sara', name: 'Bichera Sara', sprite: 'anil:bichera',
      x: 18, y: 21, dir: 6, sight: 4,
      intro: 'En el juncal hay bichos que no he visto en ningún libro. ¡Y los míos son los mejores!',
      after: 'Mis bichos rehúyen las máquinas del barro. No les gusta cómo suena.',
    },
  ];
}

function itemEvents() {
  return ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) }));
}

function signEvents() {
  return [
    { id: 'cartel_lumina', type: 'sign', x: SIGNS.lumina.x, y: SIGNS.lumina.y, text: MARISMA_TEXT.signLumina, skin: 'sign hgss dir' },
    { id: 'cartel_mnemos', type: 'sign', x: SIGNS.mnemos.x, y: SIGNS.mnemos.y, text: MARISMA_TEXT.signMnemos, skin: 'sign hgss dir' },
    { id: 'cartel_palafitos', type: 'sign', x: SIGNS.palafitos.x, y: SIGNS.palafitos.y, text: MARISMA_TEXT.signPalafitos },
    {
      id: 'cartel_consorcio', type: 'sign', x: SIGNS.consorcio.x, y: SIGNS.consorcio.y,
      script: async (ctx) => { await ctx.say(ctx.flag(F.healed) ? MARISMA_TEXT.signConsorcioAfter : MARISMA_TEXT.signConsorcio); },
    },
  ];
}

function cellEvents() {
  return [
    cellEvent({ id: 'cell_marisma_1', x: CELLS.c044.x, y: CELLS.c044.y }),
    cellEvent({ id: 'cell_marisma_2', x: CELLS.c072.x, y: CELLS.c072.y }),
  ];
}

// ───────────────────────────── bordes ─────────────────────────────

function edgeEvents() {
  const out = [];
  const n = EXITS.north;
  // Senda de Mnemos: marca de salida del bloque (sin texto) y aviso si Mnemos aún no existe.
  for (let x = n.x0; x <= n.x1; x++) {
    out.push({ id: `senda_norte_${x}`, x, y: SPOTS.northMark.y, trigger: 'touch', through: true, when: (s) => Boolean(s) && !s.flag(F.marshNorth), script: async (ctx) => { ctx.setFlag(F.marshNorth); } });
  }
  if (!linkOpen('ruta_8_marisma', 'aldea_mnemos')) {
    const cells = [];
    for (let x = n.x0; x <= n.x1; x++) cells.push([x, n.y]);
    out.push(...blockedLink('borde_mnemos', cells, blockedText('ruta_8_marisma', 'aldea_mnemos'), 'down', 'up'));
  }
  if (!linkOpen('ruta_8_marisma', 'ciudad_lumina')) {
    const e = EXITS.east;
    const cells = [];
    for (let y = e.y0; y <= e.y1; y++) cells.push([e.x, y]);
    out.push(...blockedLink('borde_lumina', cells, blockedText('ruta_8_marisma', 'ciudad_lumina'), 'left', 'right'));
  }
  return out;
}

/** Al entrar: si una partida se cortó entre la Tablilla y la escena final, la escena se repite (§2.6). */
export async function marismaOnEnter(ctx) {
  if (ctx.flag(F.tablet) && !ctx.flag(F.healed)) await t08FinaleScene(ctx);
  else if (!ctx.flag(F.healed)) ctx.bgm(MUSIC.marsh);
}

export function marismaEvents() {
  return [
    ...arrivalEvents(),
    ...mudEvents(),
    ...blockers('pilote', stiltBlockerCells()),
    rainEncounterEvent(),
    ...t08Events(),
    ...palafitosEvents(),
    ...trainerEvents(),
    ...itemEvents(),
    ...signEvents(),
    ...cellEvents(),
    ...edgeEvents(),
  ];
}
