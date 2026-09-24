// Eventos de la Ruta 6 (docs/CAMPANA.md §1.4 y «B07»): el derrumbe que corta el camino de Estrato hasta el rescate,
// la Cantería (content/events/b07_canteria.js), seis entrenadores (nv 25–29), objetos, carteles, el barro del
// bancal alto (C035, Terreno complicado), la cornisa de la Absolita y la repisa de C056 (Trepar, al volver) y el
// enlace con Ciudad Estrato (B08): mientras no exista, aviso neutro y un paso atrás.
import { F, SPEAKER, SPRITE, OBJ, when, say } from './b07_common.js';
import { canteriaEvents } from './b07_canteria.js';
import { b07CellEvents } from './b07_cells.js';
import { RUTA6, CANTERIA } from '../maps/b07/layout.js';
import { PENDING_LINKS } from '../maps/b07/pending_links.js';

const R = RUTA6;
const C = CANTERIA;

export const RUTA6_TEXT = Object.freeze({
  sign: 'RUTA 6\n↑ Villa Brontia · Cantería Solano · Ciudad Estrato ↓',
  signSouth: 'RUTA 6\n↑ Cantería Solano · Ciudad Estrato ↓',
  rubble: 'Un derrumbe de rocas enormes tapa el cañón de pared a pared. Si alguien empieza a quitarlas sin saber, se viene abajo el resto.',
  rubbleAfter: 'Aquí estaba el derrumbe. Los canteros han apilado las piedras a un lado del camino.',
});

/**
 * Derrumbe del camino de Estrato: rocas grandes (eventos) hasta que los canteros y los Timburr lo despejan; después,
 * parte de esas piedras queda apilada a los lados del camino (RUTA6.rubblePiles).
 */
function rubbleEvents() {
  const out = [];
  const r = R.rubble;
  const cells = [];
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) cells.push([x, y]);
  // Bordes irregulares del derrumbe (piedras sueltas por delante y por detrás).
  cells.push(...R.rubbleEdge);
  const piled = new Set(R.rubblePiles.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of cells) {
    const look = { sprite: OBJ.rubble, dir: 8, pattern: (x * 5 + y * 3) % 4, directionFix: true, walkAnime: false, solid: true, noOver: true, trigger: 'action' };
    const pages = [{
      ...look, when: when({ none: [F.ruta] }),
      script: async (ctx) => {
        await ctx.say(RUTA6_TEXT.rubble);
        if (ctx.flag(F.rescate)) await ctx.say('Al otro lado se oye a los Timburr apartando piedras.');
      },
    }];
    if (piled.has(`${x},${y}`)) {
      pages.push({ ...look, when: when({ all: [F.ruta] }), script: async (ctx) => { await ctx.say(RUTA6_TEXT.rubbleAfter); } });
    }
    out.push({ id: `derrumbe_${x}_${y}`, x, y, pages });
  }
  return out;
}

/** Tras el rescate: un cantero junto al paso despejado. */
function roadEvents() {
  return [{
    id: 'cantero_camino', x: R.rubbleNorth.x + 3, y: R.rubbleNorth.y, name: SPEAKER.cantero,
    pages: [{
      when: when({ all: [F.ruta] }), sprite: SPRITE.cantero, dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, SPEAKER.cantero, 'Paso libre hasta Estrato. Los Timburr de Quino mueven más piedra que diez canteros.');
      },
    }],
  }];
}

function trainerEvents() {
  const t = (id, name, sprite, x, y, dir, sight, intro, after) => ({ id, type: 'trainer', trainer: `b07_${id}`, name, sprite, x, y, dir, sight, intro, after });
  return [
    t('excursionista_bruno', 'Excursionista Bruno', 'anil:excursionista', 24, 9, 4, 4,
      '¡Eh! Desde que paró el vendaval se puede bajar el cañón. ¡Y yo llevo semanas esperando un combate!',
      'El viento de la meseta bajaba por aquí como un río. Ahora solo se oye la cantera.'),
    // Carmen vigila la escalera (solo su columna central se pisa) desde arriba: al acercarse se queda en el camino,
    // nunca encima del último escalón.
    t('veterana_carmen', 'Veterana Carmen', 'anil:veterana', 21, 12, 2, 2,
      'Nadie baja esta escalera sin que yo vea cómo se mueve. Enséñame.',
      'Abajo está la Cantería Solano. Los canteros de allí son buena gente, aunque tozudos como la piedra.'),
    t('montanero_ramiro', 'Montañero Ramiro', 'anil:montanero', 8, 21, 6, 5,
      '¿Has oído eso? Son las voladuras de los del Consorcio. Ya ni combatir tranquilo se puede.',
      'Antes, aquí solo sonaban los picos de los canteros. Ahora, cada dos por tres, ¡bum!'),
    t('minero_tino', 'Minero Tino', 'minero', 18, 48, 4, 5,
      '¡Por fin baja alguien! Vengo de la Mina Galena y llevo toda la mañana esperando a que se abra el paso.',
      'En Estrato estamos que no dormimos: las casas crujen de noche. Ya lo verás.'),
    t('excursionista_nora', 'Excursionista Nora', 'anil:excursionista_f', 15, 51, 4, 5,
      '¡Desde arriba vi cómo quitaban el derrumbe! ¿Has sido tú? ¡Pues a ver qué tal combates!',
      'Mis Pokémon voladores miran el cañón desde arriba. Dicen que se ve Estrato entero.'),
    t('minera_eva', 'Minera Eva', 'minera', 18, 64, 4, 5,
      'Si quieres entrar en Estrato, antes tienes que pasar por mí. Norma de la casa.',
      'Estrato es ciudad de mineros. Allí se respeta a quien no se rinde.'),
  ];
}

function itemEvents() {
  const k = R.cornice;
  return [
    { id: 'objeto_ruta6_1', type: 'item', x: 26, y: 2, item: 'GREATBALL', count: 2 },
    { id: 'objeto_ruta6_2', type: 'item', x: 3, y: 13, item: 'SUPERPOTION' },
    { id: 'objeto_ruta6_3', type: 'item', x: 14, y: 11, item: 'ETHER', hidden: true },
    { id: 'objeto_ruta6_4', type: 'item', x: 17, y: 26, item: 'FULLHEAL' },
    { id: 'objeto_ruta6_5', type: 'item', x: 25, y: 36, item: 'REVIVE', hidden: true },
    { id: 'objeto_ruta6_6', type: 'item', x: 3, y: 47, item: 'SUPERREPEL' },
    { id: 'objeto_ruta6_7', type: 'item', x: 23, y: 60, item: 'HYPERPOTION' },
    { id: 'objeto_ruta6_8', type: 'item', x: 4, y: 64, item: 'NUGGET', hidden: true },
    // Absolita (POKEDEX_DISTRIBUCION §7.7): en la cornisa del cañón, con Trepar (al volver).
    { id: 'objeto_absolita', type: 'item', x: k.item.x, y: k.item.y, item: 'ABSOLITE' },
  ];
}

/** Cornisa de la Absolita y repisa de C056: paredes con vetas verdes para Trepar (subir y bajar). */
function climbEvents() {
  const k = R.cornice;
  const w = R.wallLedge;
  const base = { type: 'climbWall', sprite: 'asset:objects/barreras.png', dir: 6, directionFix: true, stepAnime: true };
  return [
    { ...base, id: 'pared_cornisa', x: k.wall.x, y: k.wall.y, to: [k.top.x, k.top.y], h: 3 },
    { type: 'climbWall', id: 'bajada_cornisa', x: k.top.x, y: k.top.y + 1, to: [k.foot.x, k.foot.y], down: true, glow: false },
    { ...base, id: 'pared_repisa', x: w.wall.x, y: w.wall.y, to: [w.top.x, w.top.y], h: 3 },
    { type: 'climbWall', id: 'bajada_repisa', x: w.top.x, y: w.top.y + 1, to: [w.foot.x, w.foot.y], down: true, glow: false },
  ];
}

/** Barro al pie de la escalera del bancal alto (Terreno complicado). */
function mudEvents() {
  const out = [];
  const m = C.mud;
  for (let y = m.y0; y <= m.y1; y++) for (let x = m.x0; x <= m.x1; x++) out.push({ id: `barro_${x}_${y}`, type: 'roughTerrain', kind: 'mud', x, y });
  return out;
}

/** Borde sur cerrado mientras no exista Ciudad Estrato. */
function estratoBlock() {
  const link = PENDING_LINKS.ciudad_estrato;
  const script = async (ctx) => {
    ctx.face('player', 'down');
    await ctx.say(link.blocked);
    await ctx.move('player', ['up'], { through: false });
  };
  const out = [];
  for (let x = R.south.x0; x <= R.south.x1; x++) out.push({ id: `limite_estrato_${x}`, x, y: R.south.y, trigger: 'touch', script });
  return out;
}

export function ruta6Events({ estratoOpen = false } = {}) {
  return [
    ...canteriaEvents(),
    ...rubbleEvents(),
    ...roadEvents(),
    ...trainerEvents(),
    ...itemEvents(),
    ...climbEvents(),
    ...mudEvents(),
    ...b07CellEvents('ruta_6'),
    { id: 'cartel_ruta6', type: 'sign', x: 10, y: 3, text: RUTA6_TEXT.sign, skin: 'sign hgss dir' },
    { id: 'cartel_ruta6_sur', type: 'sign', x: 15, y: 61, text: RUTA6_TEXT.signSouth, skin: 'sign hgss dir' },
    ...(estratoOpen ? [] : estratoBlock()),
  ];
}
