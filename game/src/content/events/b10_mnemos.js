// Eventos de Aldea Mnemos (docs/CAMPANA.md B10): bambú (sprites sólidos), vecinos y notas de nombres, Olvido, la
// niebla del olvido (capa visual y el muro del camino del norte hasta el P5), enlaces pendientes con la Ruta 8 (B09)
// y la Ruta 9 (B11), células C045 y C074, árbol de miel, el risco del Santuario (Trepar) con la Losa del Olvido
// (Spiritomb de noche con la Piedra Espíritu), tres entrenadores, objetos y carteles.
import { F, V, SPEAKER, SPRITE, OBJ, when, lines, zygardeSays, byGender, placePlayer } from './b10_common.js';
import { b10CellEvents } from './b10_cells.js';
import { olvidoEvents, fogEvent, archivoDoorEvent, arrivalScene, faustaTalk } from './b10_mnemos_story.js';
import { brunoTalk, panchamTalk, nereaTalk } from './b10_notes.js';
import { pickWeighted } from './b05_wild.js';
import { ikerDoorEvent } from './b11_t09.js'; // T09 (B11): puerta de la casa de Íker
import { MNEMOS_HONEY, SPIRITOMB } from '../encounters/b10.js';
import {
  EXITS, FOG_WALL_Y, FOG_RETURN_Y, BAMBOO, TERRACE, RISCO, HONEY_TREE, SIGNS, NPC, ARRIVAL, BUILDINGS,
} from '../maps/b10/mnemos_layout.js';
import { PENDING_LINKS, mapRegistered } from '../maps/b10/pending_links.js';

export const MNEMOS_TEXT = Object.freeze({
  townSign: 'ALDEA MNEMOS\n«Donde se guarda lo que otros olvidan.»',
  plazaSign: 'PLAZA DEL ESTRADO\nNorte: Bosque Neblino (Ruta 9). Noroeste: el Archivo. Noreste: Santuario de los Glifos.',
  fog: 'La niebla se cierra tanto que no ves ni tus pies. Das unos pasos… y, sin saber cómo, vuelves a estar en la aldea.',
  fogZygarde: 'El camino da vueltas sobre sí mismo. La niebla no nos deja pasar.',
  losa: 'La Losa del Olvido: una piedra alta llena de muescas. En la base hay una hendidura del tamaño de un puño.',
  losaDay: 'De día la hendidura está fría. Dicen que la losa solo contesta de noche.',
  losaNoStone: 'Algo se mueve dentro de la piedra, muy despacio. Haría falta ponerle algo en la hendidura.',
  losaAsk: '¿Colocas la Piedra Espíritu en la hendidura?',
  losaWake: 'La piedra suelta un suspiro frío. Un rostro se asoma entre las muescas…',
  losaGone: 'Spiritomb se ha vuelto a hundir en la losa. Volverá a asomarse otra noche, después de descansar.',
  losaDone: 'La losa está en calma. La hendidura ya no guarda nada.',
  honeyBare: 'Un árbol de corteza dulce. Si untaras un poco de Miel en el tronco, quizá se acercaría algún Pokémon.',
  honeyAsk: '¿Quieres untar Miel en el tronco?',
  honeySpread: 'Has untado la Miel en el tronco. Habrá que dejar pasar un rato (descansar) y volver.',
  honeyWait: 'La Miel sigue en el tronco. Todavía no ha venido nadie.',
  honeyCame: '¡Un Pokémon salvaje se ha acercado a la Miel!',
  herbolario: 'HERBOLARIO DE TOMÉ\nHierbas, raíces y remedios de la aldea.',
  te: 'CASA DE TÉ\nTé verde y silencio.',
  santuario: 'SANTUARIO DE LOS GLIFOS\nSe ruega no tocar las inscripciones.',
  archivo: 'EL ARCHIVO\nDebajo, el Archivo Hondo. No bajar sin permiso de la guarda.',
});

// ------------------------------------------------------------ bambú

/** Mata de bambú (sprite 32×128, sólida): variante y fase de balanceo según la casilla. */
export function bambooEvent(x, y, prefix = 'bambu') {
  return {
    id: `${prefix}_${x}_${y}`, x, y, sprite: OBJ.bamboo,
    dir: [2, 4, 6, 8][(x * 7 + y * 3) % 4], pattern: (x + y) % 4,
    directionFix: true, stepAnime: true, walkAnime: false, speed: 1, shadow: false, solid: true,
  };
}

function bambooEvents() {
  const cells = [...BAMBOO.grove, ...BAMBOO.loose, ...TERRACE.divider];
  const seen = new Set();
  return cells.filter(([x, y]) => (seen.has(`${x},${y}`) ? false : (seen.add(`${x},${y}`), true))).map(([x, y]) => bambooEvent(x, y));
}

// ------------------------------------------------------------ niebla del norte y enlaces pendientes

async function fogLoop(ctx) {
  ctx.se('PRSFX- Mist', { volume: 60 });
  await ctx.fade('out', 20, [230, 230, 236]);
  await placePlayer(ctx, ctx.player.x, FOG_RETURN_Y, 2, { fade: false });
  await ctx.wait(10);
  await ctx.fade('in', 20);
  await ctx.say(MNEMOS_TEXT.fog);
  await zygardeSays(ctx, MNEMOS_TEXT.fogZygarde);
}

async function blockedLink(ctx, link, back) {
  ctx.face('player', back === 'down' ? 'up' : 'down');
  await ctx.say(link.blocked);
  await ctx.move('player', [back], { through: false });
}

/** Muro de niebla del camino del norte (hasta el P5) y, después, el aviso si la Ruta 9 aún no existe. */
function northEvents() {
  const link = PENDING_LINKS.ruta_9_neblino;
  const open = mapRegistered(link.to);
  const out = [];
  for (let x = EXITS.north.x0; x <= EXITS.north.x1; x++) {
    out.push({
      id: `niebla_norte_${x}`, x, y: FOG_WALL_Y,
      pages: [
        { when: (s) => Boolean(s) && !s.flag(F.restored), solid: true, trigger: 'touch', noOver: true, script: fogLoop },
        open
          ? { when: (s) => Boolean(s) && s.flag(F.restored), through: true }
          : { when: (s) => Boolean(s) && s.flag(F.restored), trigger: 'touch', through: true, script: (ctx) => blockedLink(ctx, link, 'down') },
      ],
    });
  }
  return out;
}

/** Borde sur cerrado mientras no exista la Ruta 8 (Marisma, B09). */
function southEvents() {
  const link = PENDING_LINKS.ruta_8_marisma;
  if (mapRegistered(link.to)) return [];
  const out = [];
  for (let x = EXITS.south.x0; x <= EXITS.south.x1; x++) {
    out.push({ id: `limite_marisma_${x}`, x, y: EXITS.south.y, trigger: 'touch', through: true, script: (ctx) => blockedLink(ctx, link, 'up') });
  }
  return out;
}

/** Franja de la calle sur: escena de llegada si se entra por la Marisma (la conexión no ejecuta onEnter). */
function arrivalStrip() {
  const t = ARRIVAL.trigger;
  const out = [];
  for (let x = t.x0; x <= t.x1; x++) {
    out.push({ id: `llegada_${x}`, x, y: t.y, trigger: 'touch', through: true, when: when({ none: [F.arrival] }), script: arrivalScene });
  }
  return out;
}

// ------------------------------------------------------------ risco del Santuario (Trepar) y Losa del Olvido

function riscoEvents() {
  const w = RISCO.wall; const d = RISCO.down;
  return [
    { id: 'pared_risco', type: 'climbWall', x: w.x, y: w.y, to: w.top, h: 3, sprite: OBJ.wall, dir: 6, directionFix: true, stepAnime: true, shadow: false },
    { id: 'pared_risco_bajada', type: 'climbWall', x: d.x, y: d.y, to: d.bottom, down: true, h: 3, glow: false },
    { id: 'losa_olvido', x: RISCO.losa.event.x, y: RISCO.losa.event.y, trigger: 'action', solid: true, noOver: true, script: losaScript },
    { id: 'objeto_risco', type: 'item', x: RISCO.item.x, y: RISCO.item.y, item: 'PPUP' },
  ];
}

const restCount = (s) => Number(s.var(V.restCount, 0)) || 0;

async function losaScript(ctx) {
  const s = ctx.state;
  await ctx.say(MNEMOS_TEXT.losa);
  if (s.flag(F.spiritomb)) { await ctx.say(MNEMOS_TEXT.losaDone); return; }
  if (s.isDay?.()) { await ctx.say(MNEMOS_TEXT.losaDay); return; }
  if (!s.hasItem('ODDKEYSTONE')) { await ctx.say(MNEMOS_TEXT.losaNoStone); return; }
  const fled = s.var(V.spiritombRest, null);
  if (fled !== null && fled !== undefined && restCount(s) <= Number(fled)) { await ctx.say(MNEMOS_TEXT.losaGone); return; }
  if (!(await ctx.confirm(MNEMOS_TEXT.losaAsk))) return;
  ctx.se('PRSFX- Curse', { volume: 70 });
  await ctx.flash([80, 60, 110], 20, 150);
  await ctx.say(MNEMOS_TEXT.losaWake);
  const outcome = await ctx.wildBattle({ ...SPIRITOMB });
  if (outcome === 'caught') {
    s.removeItem('ODDKEYSTONE', 1);
    ctx.setFlag(F.spiritomb);
    return;
  }
  // Sin pérdida (CAMPANA §2.6): la Piedra Espíritu se conserva y Spiritomb vuelve tras descansar.
  ctx.setVar(V.spiritombRest, restCount(s));
  await ctx.say(MNEMOS_TEXT.losaGone);
}

// ------------------------------------------------------------ árbol de miel

function honeyTreeEvent() {
  const t = HONEY_TREE.trunk;
  return {
    id: 'arbol_miel', x: t.x, y: t.y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => {
      const s = ctx.state;
      const at = Number(s.var(V.honey, 0)) || 0;
      if (at > 0 && restCount(s) >= at) {
        await ctx.say(MNEMOS_TEXT.honeyCame);
        ctx.setVar(V.honey, 0);
        await ctx.wildBattle(pickWeighted(MNEMOS_HONEY));
        return;
      }
      if (at > 0) { await ctx.say(MNEMOS_TEXT.honeyWait); return; }
      if (!s.hasItem('HONEY')) { await ctx.say(MNEMOS_TEXT.honeyBare); return; }
      if (!(await ctx.confirm(MNEMOS_TEXT.honeyAsk))) return;
      s.removeItem('HONEY', 1);
      ctx.setVar(V.honey, restCount(s) + 1);
      ctx.se('PRSFX- Sweet Scent', { volume: 70 });
      await ctx.say(MNEMOS_TEXT.honeySpread);
    },
  };
}

// ------------------------------------------------------------ vecinos

function simpleNpc(id, pos, sprite, speaker, beforeLines, afterLines, extra = {}) {
  return {
    id, x: pos.x, y: pos.y, name: speaker, sprite, dir: pos.dir ?? 2, move: extra.move ?? 'look', ...extra,
    script: async (ctx) => { await lines(ctx, speaker, ctx.flag(F.restored) ? afterLines : beforeLines); },
  };
}

function villagerEvents() {
  return [
    { id: 'fausta', x: NPC.fausta.x, y: NPC.fausta.y, name: SPEAKER.fausta, sprite: SPRITE.fausta, dir: NPC.fausta.dir, move: 'look', script: faustaTalk },
    { id: 'bruno', x: NPC.bruno.x, y: NPC.bruno.y, name: SPEAKER.bruno, sprite: SPRITE.bruno, dir: NPC.bruno.dir, move: 'still', script: brunoTalk },
    { id: 'pancham', x: NPC.pancham.x, y: NPC.pancham.y, name: 'Pancham', sprite: SPRITE.pancham, dir: NPC.pancham.dir, move: { wander: 1 }, stepAnime: true, script: panchamTalk },
    { id: 'nerea', x: NPC.nerea.x, y: NPC.nerea.y, name: SPEAKER.nerea, sprite: SPRITE.nerea, dir: NPC.nerea.dir, move: 'look', script: nereaTalk },
    { id: 'chingling_nerea', x: NPC.nerea.x - 1, y: NPC.nerea.y + 1, name: 'Chingling', sprite: SPRITE.chingling, dir: 6, move: 'still', stepAnime: true,
      script: async (ctx) => { ctx.cry('CHINGLING'); await ctx.say('Chingling: ¡Tilín, tilín!'); } },
    simpleNpc('monje', NPC.monje, SPRITE.monje, SPEAKER.vecino, [
      'Toco la campana del Santuario cada mediodía. Hoy no recuerdo si ya la he tocado, así que llevo tres veces.',
    ], ['Hoy la he tocado una sola vez. ¡Una! Qué descanso, acordarse.']),
    simpleNpc('pescador', NPC.pescador, SPRITE.pescador, SPEAKER.pescador, [
      'En el islote del estanque brilla algo verde desde hace días. Sin bote no se llega, y el bote tiene un agujero.',
      '¿Que por qué no lo arreglo? Porque no me acuerdo de dónde dejé el martillo.',
    ], [
      'Ya me acuerdo de dónde dejé el martillo. Lo que no encuentro son las ganas.',
      'Lo verde del islote sigue ahí. Haría falta nadar hasta él.',
    ]),
    simpleNpc('vecina_plaza', { x: 28, y: 23, dir: 8 }, SPRITE.vecina, SPEAKER.vecina, [
      'Llevo toda la mañana buscando algo. Si me acordara de qué es, lo encontraría antes.',
    ], ['¡Las llaves! Eran las llaves. Estaban en la puerta, como siempre.']),
    simpleNpc('vecino_centro', { x: 35, y: 37, dir: 6 }, SPRITE.vecino, SPEAKER.vecino, [
      'Dicen que la niebla viene del Bosque Neblino. El camino del norte da vueltas: entras y sales por donde has venido.',
    ], ['Ya se puede subir al Bosque Neblino. Aunque yo no subiría: dicen que allí se esconde gente rara.']),
  ];
}

// ------------------------------------------------------------ entrenadores, objetos y carteles

function trainerEvents() {
  return [
    {
      id: 'medium_tadeo', type: 'trainer', trainer: 'b10_medium_tadeo', x: 20, y: 14, dir: 6, sight: 3, name: 'Tadeo', sprite: 'anil:medium',
      after: 'Los espíritus del bosque bajan con la niebla. No te asustes si oyes tu nombre. Aquí es lo único que no se olvida.',
    },
    {
      id: 'exorcista_brigida', type: 'trainer', trainer: 'b10_exorcista_brigida', x: 12, y: 36, dir: 6, sight: 4, name: 'Brígida', sprite: 'anil:exorcista',
      after: 'La niebla no es un espíritu. Lo he comprobado. Los espíritus, al menos, se acuerdan de quiénes son.',
    },
    {
      id: 'estudiante_delfina', type: 'trainer', trainer: 'b10_estudiante_delfina', x: 25, y: 23, dir: 4, sight: 3, name: 'Delfina', sprite: 'anil:estudiante',
      after: 'He venido a estudiar el Archivo y me he olvidado de qué quería estudiar. Menos mal que lo apunté.',
    },
  ];
}

function itemEvents() {
  return [
    { id: 'objeto_mnemos_1', type: 'item', x: 5, y: 37, item: 'ULTRABALL', count: 2 },
    { id: 'objeto_mnemos_2', type: 'item', x: 26, y: 14, item: 'HYPERPOTION', hidden: true },
    { id: 'objeto_mnemos_3', type: 'item', x: 43, y: 29, item: 'REVIVE' },
    { id: 'objeto_mnemos_4', type: 'item', x: 11, y: 24, item: 'DUSKBALL', count: 2, hidden: true },
  ];
}

function signEvents() {
  const sign = (id, s, text) => ({ id, type: 'sign', x: s.x, y: s.y, text });
  return [
    sign('cartel_aldea', SIGNS.aldea, MNEMOS_TEXT.townSign),
    sign('cartel_plaza', SIGNS.plaza, MNEMOS_TEXT.plazaSign),
    sign('cartel_herbolario', SIGNS.herbolario, MNEMOS_TEXT.herbolario),
    sign('cartel_te', SIGNS.te, MNEMOS_TEXT.te),
    sign('cartel_santuario', SIGNS.santuario, MNEMOS_TEXT.santuario),
    sign('cartel_archivo', SIGNS.archivo, MNEMOS_TEXT.archivo),
  ];
}

/** Todos los eventos de Aldea Mnemos. */
export function mnemosEvents() {
  return [
    fogEvent(),
    ...arrivalStrip(),
    ...olvidoEvents(),
    archivoDoorEvent(),
    ikerDoorEvent({ x: BUILDINGS.iker.door.x, y: BUILDINGS.iker.door.y }),
    ...villagerEvents(),
    ...trainerEvents(),
    ...itemEvents(),
    ...signEvents(),
    ...b10CellEvents('aldea_mnemos'),
    honeyTreeEvent(),
    ...riscoEvents(),
    ...northEvents(),
    ...southEvents(),
    ...bambooEvents(),
  ];
}

export { byGender };
