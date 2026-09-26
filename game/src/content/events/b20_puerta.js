// Puerta de las Quince, en el fondo de la Sima del Eje (docs/CAMPANA.md B20; TABLILLAS.md §4.3 Crónica XIII y §4.8):
//   · Quince nichos en la cara del muro, uno por Tablilla de campaña (T01–T15), y tres oscuros en el centro, sobre la
//     losa: los de Arceus. Cada Tablilla colocada enciende su nicho y proyecta un tramo del camino sobre el vacío.
//   · La losa se hunde con las quince y los nueve Fragmentos (cadena de resonancia). Si falta algo, la puerta lo dice
//     (nombra las Tablillas que faltan y la Libreta marca su zona) y nada se pierde: lo colocado queda colocado.
//   · En el umbral, un zócalo: la Reconstrucción (Forma Completa) alza las quince piedras del camino proyectado.
// La Flauta NO se exige (biblia §6.10).
import { F, V, OBJ, GOLD, zygardeLines, pause, examine, frame, when, lines } from './b20_common.js';
import { nicheLit, nicheTablet, placeableNiches, doorRequirements, nichesLitCount, ALL_NICHES } from './b20_logic.js';
import { steleEvents } from './b20_senda.js';
import { PUERTA } from '../maps/b20/layout.js';
import { fragmentFor } from '../story/fragments.js';
import { extraTiles } from '../stamps/extraTiles.js';

const ZOCALO_VIVO = extraTiles('Cueva1').find((t) => t.name === 'pilar_zocalo_vivo')?.id || 0;
const P = PUERTA;

export const PUERTA_TEXT = Object.freeze({
  arrival: [
    'El fondo de la Sima del Eje. No sopla el viento. El frío es seco, como dentro de una piedra.',
    'Al norte, un muro de roca cierra el paso. En su cara hay nichos tallados, uno junto a otro. En el centro, una losa.',
  ],
  wall: 'Un muro de roca viva, tallado con nichos del tamaño de una Tablilla.',
  niche: (t) => `Un nicho vacío. En su repisa hay grabado un signo: el de la ${t.name}.`,
  nicheLit: (t) => `La ${t.name} encaja en su nicho y brilla. Su luz se tiende sobre el vacío.`,
  arceus: 'Tres nichos más, en el centro, sobre la losa. Están oscuros. Ninguna de tus Tablillas encaja en ellos.',
  slab: 'Una losa enorme cierra el paso. Tiene grabada una banda de hexágonos y un sello en el centro.',
  vibrate: 'Las Tablillas de tu Mochila vibran. La losa las reconoce.',
  place: 'Colocas cada Tablilla en su nicho. Una a una se encienden, y de cada nicho sale un haz que dibuja un trozo de camino en el vacío.',
  placedN: (n) => (n === 1 ? 'Un nicho más se ha encendido.' : `Se han encendido ${n} nichos más.`),
  missingTablets: (n) => `La losa no se mueve. ${n === 1 ? 'Queda un nicho vacío. Su signo pide:' : `Quedan ${n} nichos vacíos. Sus signos piden:`}`,
  missingNote: (n) => (n === 1 ? 'La Libreta anota dónde buscarla.' : 'La Libreta anota dónde buscarlas.'),
  missingFragments: 'La luz de los nichos tiembla y no llega a la losa. Le falta la resonancia de:',
  missingComplete: 'Más allá de la losa el camino tendrá que alzarse sobre el vacío.',
  open: 'Las quince luces se juntan en el sello de la losa… y la losa se hunde en el suelo, despacio.',
  // Zygarde habla muy poco (autor, 25-09-2026): la losa abierta la describe la narración.
  opened: 'La losa está hundida en el suelo. Más allá, la luz de los nichos dibuja un camino sobre el vacío.',
  rebuildAsk: '¿Quieres que Zygarde alce las piedras del camino?',
  rebuilt: 'Las quince piedras suben del vacío una tras otra, siguiendo la luz de los nichos.',
  stele: [
    'Una estela de piedra, gastada, con glifos Unown. La Clave Glífica los lee:',
    '«Vino un invierno largo. Los que se quedaron grabaron en estas tablas el camino al fondo del abismo, para que solo quien las reuniera todas pudiera bajar.»',
  ],
  back: 'El camino de vuelta sube hacia la Sima del Eje. Por ahora no puedes continuar por aquí.',
});

const mask = (s) => Number(s?.var(V.niches, 0)) || 0;
const doorOpen = (s) => Boolean(s?.flag(F.doorOpen));
const pathBuilt = (s) => Boolean(s?.flag(F.path));

/** Nombre de las Tablillas que faltan, una por línea («· Tabla Pradal: Villa Zaguán, …»). */
function missingList(tablets) {
  return tablets.map((t) => `· ${t.name}: ${t.place}`);
}

async function placeTablets(ctx, list) {
  await ctx.say(PUERTA_TEXT.vibrate);
  await ctx.say(PUERTA_TEXT.place);
  let m = mask(ctx.state);
  for (const n of list) {
    m |= 1 << (n - 1);
    ctx.setVar(V.niches, m);
    ctx.requestRefresh();
    ctx.se('Mining ping', { volume: 70, pitch: 90 + n * 3 });
    const [x, y] = P.path[n - 1];
    const h = ctx.effect?.('softLight', { x, y, radius: 34, color: [...GOLD], intensity: 0.7, fadeIn: 6 });
    await pause(ctx, 12);
    h?.remove?.(20);
  }
  await ctx.say(PUERTA_TEXT.placedN(list.length));
}

/** Tras colocar: dice lo que falta (y abre las pistas de las Tablillas que faltan) o abre la losa. */
async function checkDoor(ctx) {
  const req = doorRequirements(ctx.state, mask(ctx.state));
  if (req.tablets.length) {
    ctx.setFlag(F.missingSeen);
    await ctx.say(PUERTA_TEXT.missingTablets(req.tablets.length));
    for (const l of missingList(req.tablets)) await ctx.say(l);
    for (const t of req.tablets) if (t.arc) await ctx.story?.openClue?.(t.arc, { direct: true, silent: true });
    await ctx.say(PUERTA_TEXT.missingNote(req.tablets.length));
  }
  if (req.fragments.length) {
    ctx.setFlag(F.missingSeen);
    await ctx.say(PUERTA_TEXT.missingFragments);
    for (const n of req.fragments) await ctx.say(`· el Fragmento Azur del ${fragmentFor(n).name}`);
  }
  if (!req.ready) return false;
  await openDoor(ctx);
  if (!req.complete) {
    await ctx.say(PUERTA_TEXT.missingComplete);
  }
  return true;
}

async function openDoor(ctx) {
  await ctx.camera?.pan?.(P.slab.x, P.slab.y - 2, 30);
  await ctx.say(PUERTA_TEXT.open);
  ctx.se('PRSFX- Earthquake');
  await ctx.shake(3, 6, 30);
  ctx.se('Door slide');
  const ev = ctx.world?.events?.find((e) => e.id === 'puerta_losa');
  if (ev) {
    for (const k of [1, 2, 3]) { Object.assign(ev, { pattern: k }); await pause(ctx, 12); }
    for (let i = 0; i <= 12; i++) { ev.opacity = Math.max(0, 255 - i * 22); await pause(ctx, 2); }
  }
  ctx.setFlag(F.doorOpen);
  ctx.requestRefresh();
  await ctx.camera?.pan?.(P.path[7][0], P.path[7][1], 40);
  await pause(ctx, 30);
  await ctx.camera?.reset?.(30);
}

/** Guion de la losa y de los nichos: coloca las Tablillas que lleve el jugador y comprueba la puerta. */
export async function doorScript(ctx) {
  if (doorOpen(ctx.state)) { await ctx.say(PUERTA_TEXT.opened); return; }
  await ctx.say(PUERTA_TEXT.slab);
  const list = placeableNiches(ctx.state, mask(ctx.state));
  if (list.length) await placeTablets(ctx, list);
  await checkDoor(ctx);
}

function nicheEvents() {
  return P.niches.map((n) => {
    const t = nicheTablet(n.n);
    const base = { sprite: OBJ.niche, solid: true, trigger: 'action', noOver: true };
    return {
      id: `puerta_nicho_${n.n}`, x: n.x, y: n.y, name: t.name,
      pages: [
        { ...base, ...frame(0), script: async (ctx) => { await ctx.say(PUERTA_TEXT.niche(t)); await doorScript(ctx); } },
        {
          ...base, ...frame(n.n), when: (s) => nicheLit(mask(s), n.n), light: { radius: 40, intensity: 0.6 },
          script: async (ctx) => { await ctx.say(PUERTA_TEXT.nicheLit(t)); if (!doorOpen(ctx.state)) await doorScript(ctx); },
        },
      ],
    };
  });
}

function arceusEvents() {
  return P.arceus.map((a, i) => ({
    id: `puerta_nicho_centro_${i}`, x: a.x, y: a.y, name: 'Nicho oscuro',
    sprite: OBJ.nicheArceus, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 1,
    through: true, alwaysOnTop: true, shadow: false,
  }));
}

function slabEvents() {
  const closed = (s) => !doorOpen(s);
  const talk = async (ctx) => {
    if (!ctx.flag('b20_puerta_centro')) {
      ctx.setFlag('b20_puerta_centro');
      await ctx.say(PUERTA_TEXT.arceus);
    }
    await doorScript(ctx);
  };
  return [
    {
      id: 'puerta_losa', x: P.slab.x, y: P.slab.y, name: 'Losa',
      pages: [{ when: closed, sprite: OBJ.door, ...frame(0), solid: true, trigger: 'action', script: talk }],
    },
    ...[P.slab.x - 1, P.slab.x + 1].map((x) => ({
      id: `puerta_losa_${x}`, x, y: P.slab.y, pages: [{ when: closed, solid: true, trigger: 'action', noOver: true, script: talk }],
    })),
  ];
}

function pathEvents() {
  const beams = P.path.map(([x, y], i) => ({
    id: `puerta_haz_${i + 1}`, x, y,
    pages: [{
      when: (s) => nicheLit(mask(s), i + 1) && !pathBuilt(s),
      sprite: OBJ.beam, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, through: true, shadow: false,
      opacity: 200, light: { radius: 30, intensity: 0.5 },
    }],
  }));
  const [sx, sy] = P.path[0];
  return [
    ...beams,
    {
      id: 'puerta_zocalo', type: 'rebuildGap', x: sx, y: sy, flag: F.path, tutorial: true,
      when: (s) => doorOpen(s),
      tiles: P.path.map(([x, y]) => [x, y, 2, ZOCALO_VIVO]),
      // Este camino nunca estuvo en pie: sin el genérico «ha vuelto a su sitio»
      askText: PUERTA_TEXT.rebuildAsk,
      doneText: PUERTA_TEXT.rebuilt,
    },
  ];
}

async function arrivalScene(ctx) {
  ctx.setFlag(F.arrival);
  await pause(ctx, 20);
  for (const t of PUERTA_TEXT.arrival) await ctx.say(t);
}

/**
 * Salida sur hacia la Sima del Eje (B19). Si el mapa existe, se llega a `def.puertaQuinceArrival` (casilla que B19
 * puede declarar en su definición) o a su `start`; si aún no existe, aviso neutro.
 */
async function toSima(ctx) {
  try {
    const { MAPS, loadMapDefinition } = await import('../maps/index.js');
    if (!Object.hasOwn(MAPS, 'sima_eje')) { await ctx.say(PUERTA_TEXT.back); return; }
    const def = await loadMapDefinition('sima_eje');
    const to = def.puertaQuinceArrival || def.start || { x: 1, y: 1, dir: 2 };
    await ctx.warp('sima_eje', to.x, to.y, to.dir ?? 2);
  } catch (err) {
    console.error('[B20] salida a la Sima del Eje', err);
    await ctx.say(PUERTA_TEXT.back);
  }
}

export function puertaEvents() {
  return [
    { id: 'puerta_llegada', x: P.arrive.x, y: P.arrive.y - 1, pages: [{ when: (s) => !s.flag(F.arrival), trigger: 'auto', script: arrivalScene }] },
    ...nicheEvents(),
    ...arceusEvents(),
    ...slabEvents(),
    ...pathEvents(),
    ...steleEvents('puerta_estela', P.stele, PUERTA_TEXT.stele),
    { id: 'puerta_sima', x: P.back.x, y: P.back.y, pages: [{ through: true, trigger: 'touch', script: toSima }] },
    ...P.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
  ];
}

export { nichesLitCount, ALL_NICHES, examine, when, lines, zygardeLines };
