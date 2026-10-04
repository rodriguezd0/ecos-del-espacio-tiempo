// T09 · «El niño que recuerda» (docs/TABLILLAS.md T09; Crónica IX; recompensa Chimechita). Aldea Mnemos, tras el P5:
// Íker (8 años) recuerda cosas que nunca vivió y dibuja mapas antiguos; sus padres tienen miedo y el anciano quiere
// «limpiarle» con un ritual. Puzzle: comparar sus dibujos (Mnemos hace mil años) con la aldea actual, identificar
// los tres lugares que siguen existiendo (el Archivo Hondo, el Santuario de los Glifos y el estanque de lotos) y
// deducir dónde estaba el pozo de los Custodios: bajo la casa de té. Un Musharna (el que duerme junto a Íker) ayuda
// a entrar. En el pozo, la Tabla Mental; de vuelta, Íker deja de soñar recuerdos ajenos. Sin estado de fallo.
// Enlace con la Aldea Mnemos (B10): la aldea pone `ikerDoorEvent` en la puerta de la casa de Íker (BUILDINGS.iker) y
// la casa de té `teaHouseWellEvents` (el Musharna que abre el pozo); las salidas vuelven al punto de entrada (o, si
// faltara la aldea, al lindero sur del Bosque Neblino). Ver content/maps/b11/README.md.
import { F, V, SPEAKER, SPRITE, OBJ, when, lines, pause } from './b11_common.js';
import { IKER, POZO } from '../maps/b11/layout.js';
import { mapRegistered } from '../maps/b11/pending_links.js';

const ARC = 'T09';
const P5 = 'p5_restored';
const RETURN_VAR = 'b11_t09_regreso';
/** Sin Aldea Mnemos todavía (B10): las salidas llevan al lindero sur del Bosque Neblino, junto a la aldea. */
export const MNEMOS_FALLBACK = Object.freeze({ map: 'ruta_9_neblino', x: 25, y: 57, dir: 8 });

/** Opciones de lugares actuales de la aldea (CAMPANA §1.3: Archivo Hondo, casa de té, Santuario, casa de Olvido…). */
export const PLACES = Object.freeze(['El Archivo Hondo', 'El Santuario de los Glifos', 'El estanque de lotos', 'La casa de Olvido', 'El camino de bambú']);
/** Los tres dibujos de la pared y el lugar que muestran (índice en PLACES). */
export const DRAWINGS = Object.freeze([
  { text: 'Dibujo de Íker: una roca enorme con una escalera que se hunde en espiral. Gente con túnica baja con rollos bajo el brazo.', answer: 0 },
  { text: 'Dibujo de Íker: un círculo de piedras altas cubiertas de letras que parecen ojos. En el centro, una losa lisa.', answer: 1 },
  { text: 'Dibujo de Íker: un estanque redondo con flores que flotan. Alguien ha dibujado los peces con mucho cuidado.', answer: 2 },
]);
/** El plano de la mesa y la pregunta final (dónde estaba el pozo de los Custodios). */
export const WELL_OPTIONS = Object.freeze(['El Centro Pokémon', 'El herbolario', 'La casa de té', 'La casa de Olvido']);
export const WELL_ANSWER = 2;

export const T09_TEXT = Object.freeze({
  planBefore: 'Un plano grande dibujado con ceras: los tres lugares de la pared y, en medio, un pozo redondo trazado con mucha fuerza.',
  plan: 'El plano de Íker: el pozo queda entre el estanque y un bosquecillo de cañas altas, y del pozo sube vapor. Al lado, con letra de niño: «aquí se bajaba».',
  mother: [
    '¿Vienes por lo de Íker? …En la aldea ya lo sabe todo el mundo.',
    'Vivimos en la última casa, la más cerca del bosque. Cada noche la niebla se nos metía dentro.',
    'La niebla se fue, pero él sigue igual. Dice que se acuerda de cosas que nunca ha vivido. Y lo dibuja todo.',
    'Me da miedo, no te voy a mentir.',
  ],
  motherAfter: 'Habla con él, por favor. A ti te escucha más que a nosotros.',
  motherTea: 'La casa de té siempre ha tenido el agua más dulce de la aldea. Dicen que sale de debajo del suelo.',
  motherCured: 'Hacía semanas que no lo veía tan tranquilo. No sé cómo darte las gracias.',
  elder: 'Hay que limpiarle esos recuerdos. Humo de salvia y tres noches en vela, como se hacía antes.',
  elderCured: '…Quizá no hacía falta tanto humo.',
  iker: [
    '¿Tú también lo oyes? Cuando duermo veo Mnemos, pero de antes. De mucho antes.',
    'Lo dibujo para no olvidarlo. Mamá dice que esos recuerdos no son míos…',
    '¿Me ayudas a encontrar los sitios de mis dibujos? Si siguen ahí, es que no me lo invento.',
  ],
  askDrawing: (n) => `Este es el dibujo ${n}. ¿Qué es ahora?`,
  right: '¡Sí! ¡Eso es! Sigue ahí.',
  wrong: 'No… eso no se parece. Mira bien el dibujo de la pared.',
  allFound: '¡Los tres siguen existiendo! Entonces el pozo del plano también… Mira el plano de la mesa.',
  askWell: 'En mi plano, el pozo está en medio de todo. ¿Qué hay ahí ahora?',
  wellRight: '¡La casa de té! Siempre me da miedo pasar por delante… porque me acuerdo de bajar.',
  wellWrong: 'No… Del pozo sale vapor, ¿ves? Y al lado hay cañas altas.',
  musharna: 'El Musharna de Íker se despierta y suelta un humo rosado. Flota hacia la puerta.',
  musharnaIker: 'Él sabe bajar. Siempre me lleva en sueños. Te espera en la casa de té.',
  ikerWaiting: 'El Musharna te espera en la casa de té. ¡Ve con cuidado!',
  ikerCured: [
    '¡Se ha callado! Estaba dibujando y, de repente, la Mnemos de antes se ha ido. Ya solo me acuerdo de lo mío.',
    'Un poco la echo de menos… pero así está bien.',
    'Toma. Lo encontré en el estanque hace mucho. Siempre pensé que era para alguien que escuchara.',
  ],
  ikerAfter: 'Ahora dibujo lo que veo de día. ¡Mira, este eres tú!',
  musharnaHouse: 'Un Musharna dormita junto a la cama de Íker, envuelto en su propio humo rosado.',
  teaHouse: 'El Musharna exhala un humo rosado. Bajo las esteras se dibuja, por un instante, una escalera de piedra que baja.',
  teaHouseAsk: '¿Bajar por la escalera de humo?',
  wellWater: 'Una pila circular de piedra. El agua del fondo está tibia… y huele a té.',
  glyphs: 'Glifos Unown muy gastados. Hablan de dormir y de recordar.',
  plateSeen: 'Sobre el pedestal, una losa rosada late despacio, como si respirara en sueños.',
  exit: 'Subes por la escalera de humo…',
});

// ------------------------------------------------------------------ entrada y salida (enlace con B10)

/** Punto de regreso: «mapa|x|y|dir» (también se puede preajustar por URL: ?vars=b11_t09_regreso:aldea_mnemos|5|20|2). */
const returnValue = (map, x, y, dir) => `${map}|${x}|${y}|${dir}`;

async function enterFrom(ctx, map, x, y, dir) {
  const p = ctx.player;
  ctx.setVar(RETURN_VAR, returnValue(ctx.map.id, p.x, p.y, p.direction || 2));
  await ctx.warp(map, x, y, dir);
}

/** Vuelve a donde se entró (la puerta de la aldea) o, si falta, al lindero sur del Neblino. */
export async function returnToMnemos(ctx) {
  const raw = String(ctx.var(RETURN_VAR, '') || '');
  const [map, x, y, dir] = raw.split('|');
  if (map && mapRegistered(map) && Number.isFinite(Number(x)) && Number.isFinite(Number(y))) {
    const visual = ctx.map?.id === 'mnemos_casa_iker' ? { doorArrival: { x: Number(x), y: Number(y) - 1 } } : {};
    await ctx.warp(map, Number(x), Number(y), Number(dir) || 2, visual);
    return;
  }
  const f = MNEMOS_FALLBACK;
  await ctx.warp(f.map, f.x, f.y, f.dir);
}

/**
 * Puerta de la casa de Íker en la Aldea Mnemos (la pone B10: BUILDINGS.iker). Evento en la casilla de la puerta
 * (empujar o pisar); al salir se vuelve a la casilla de debajo, mirando abajo.
 */
export function ikerDoorEvent({ id = 'puerta_casa_iker', x, y } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('ikerDoorEvent: x/y enteros obligatorios');
  return {
    id, x, y, trigger: 'touch',
    script: async (ctx) => {
      ctx.setVar(RETURN_VAR, returnValue(ctx.map.id, x, y + 1, 2));
      await ctx.warp('mnemos_casa_iker', IKER.door.x, IKER.door.y, 8, { door: true, doorSource: { x, y } });
    },
  };
}

/** Entrada al pozo desde la casa de té (B10): el Musharna, cuando ya se ha deducido el sitio. */
export function teaHouseWellEvents({ x, y, dir = 2 } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('teaHouseWellEvents: x/y enteros obligatorios');
  return [{
    id: 'musharna_casa_te', x, y, name: 'Musharna',
    pages: [{
      when: when({ all: [F.wellFound] }), sprite: SPRITE.musharna, dir, move: 'still', stepAnime: true, speed: 2,
      trigger: 'action', light: { radius: 80, intensity: 0.8 },
      script: async (ctx) => {
        ctx.cry?.('MUSHARNA');
        await ctx.say(T09_TEXT.teaHouse);
        if (!(await ctx.confirm(T09_TEXT.teaHouseAsk))) return;
        ctx.setFlag(F.wellOpen);
        await ctx.fade('out', 30, [255, 190, 220]);
        await enterFrom(ctx, 'mnemos_pozo_custodios', POZO.entry.x, POZO.entry.y, POZO.entry.dir);
      },
    }],
  }];
}

// ------------------------------------------------------------------ casa de Íker

async function ensureClue(ctx) {
  if (!ctx.flag(F.ikerMet)) {
    ctx.setFlag(F.ikerMet);
    await ctx.story.openClue(ARC, { direct: true, silent: true });
    await ctx.story.advanceClue(ARC, 2);
  }
}

async function motherTalk(ctx) {
  if (ctx.flag(F.ikerCured)) { await ctx.say(T09_TEXT.motherCured, { speaker: SPEAKER.madreIker }); return; }
  if (!ctx.flag(F.ikerMet)) {
    await lines(ctx, SPEAKER.madreIker, T09_TEXT.mother);
    await ensureClue(ctx);
  }
  await ctx.say(ctx.flag(F.drawingsSolved) ? T09_TEXT.motherTea : T09_TEXT.motherAfter, { speaker: SPEAKER.madreIker });
}

async function elderTalk(ctx) {
  await ctx.say(ctx.flag(F.ikerCured) ? T09_TEXT.elderCured : T09_TEXT.elder, { speaker: SPEAKER.anciano });
}

/** Identificación de los tres dibujos (se puede repetir: un error no penaliza). */
async function identifyDrawings(ctx) {
  for (let i = Number(ctx.var(V.drawings, 0)); i < DRAWINGS.length; i++) {
    await ctx.say(DRAWINGS[i].text);
    const pick = await ctx.choice([...PLACES, 'No lo sé'], { message: T09_TEXT.askDrawing(i + 1), cancel: PLACES.length });
    if (pick !== DRAWINGS[i].answer) { await ctx.say(T09_TEXT.wrong, { speaker: SPEAKER.iker }); return false; }
    ctx.se?.('decision');
    await ctx.say(T09_TEXT.right, { speaker: SPEAKER.iker });
    ctx.setVar(V.drawings, i + 1);
  }
  ctx.setFlag(F.drawingsSolved);
  await ctx.say(T09_TEXT.allFound, { speaker: SPEAKER.iker });
  return true;
}

async function deduceWell(ctx) {
  await ctx.say(T09_TEXT.plan);
  const pick = await ctx.choice([...WELL_OPTIONS, 'No lo sé'], { message: T09_TEXT.askWell, cancel: WELL_OPTIONS.length });
  if (pick !== WELL_ANSWER) { await ctx.say(T09_TEXT.wellWrong, { speaker: SPEAKER.iker }); return false; }
  await ctx.say(T09_TEXT.wellRight, { speaker: SPEAKER.iker });
  ctx.cry?.('MUSHARNA');
  await ctx.say(T09_TEXT.musharna);
  await ctx.say(T09_TEXT.musharnaIker, { speaker: SPEAKER.iker });
  ctx.setFlag(F.wellFound);
  return true;
}

async function ikerTalk(ctx) {
  if (ctx.flag(F.ikerCured)) { await ctx.say(T09_TEXT.ikerAfter, { speaker: SPEAKER.iker }); return; }
  if (ctx.flag(F.wellFound)) { await ctx.say(T09_TEXT.ikerWaiting, { speaker: SPEAKER.iker }); return; }
  if (!ctx.flag('b11_t09_iker_hablo')) {
    ctx.setFlag('b11_t09_iker_hablo');
    await lines(ctx, SPEAKER.iker, T09_TEXT.iker);
    await ensureClue(ctx);
  }
  if (!ctx.flag(F.drawingsSolved) && !(await identifyDrawings(ctx))) return;
  await deduceWell(ctx);
}

/** Vuelta a casa con la Tablilla: Íker ya no sueña recuerdos ajenos (Chimechita). */
async function curedScene(ctx) {
  await ctx.emote('iker', '!');
  await pause(ctx, 10);
  await lines(ctx, SPEAKER.iker, T09_TEXT.ikerCured);
  await ctx.giveItem('CHIMECHITE', 1);
  await ctx.say(T09_TEXT.motherCured, { speaker: SPEAKER.madreIker });
  await ctx.say(T09_TEXT.elderCured, { speaker: SPEAKER.anciano });
  ctx.setFlag(F.ikerCured);
}

export function ikerHouseEvents() {
  const I = IKER;
  const text = (t) => async (ctx) => { await ctx.say(t); };
  const out = [
    { id: 'iker', x: I.iker.x, y: I.iker.y, name: SPEAKER.iker, sprite: SPRITE.iker, dir: I.iker.dir, move: 'look', trigger: 'action', script: ikerTalk },
    { id: 'madre_iker', x: I.mother.x, y: I.mother.y, name: SPEAKER.madreIker, sprite: SPRITE.madreIker, dir: I.mother.dir, move: 'still', trigger: 'action', script: motherTalk },
    {
      id: 'anciano_mnemos', x: I.elder.x, y: I.elder.y, name: SPEAKER.anciano,
      pages: [{ when: when({ none: [F.ikerCured] }), sprite: SPRITE.anciano, dir: I.elder.dir, move: 'still', trigger: 'action', script: elderTalk }],
    },
    {
      id: 'musharna_iker', x: I.musharna.x, y: I.musharna.y, name: 'Musharna',
      pages: [
        { when: when({ none: [F.wellFound] }), sprite: SPRITE.musharna, dir: I.musharna.dir, move: 'still', stepAnime: true, speed: 1, trigger: 'action', script: async (ctx) => { ctx.cry?.('MUSHARNA'); await ctx.say(T09_TEXT.musharnaHouse); } },
        { when: when({ all: [F.ikerCured] }), sprite: SPRITE.musharna, dir: I.musharna.dir, move: 'still', stepAnime: true, speed: 1, trigger: 'action', script: async (ctx) => { ctx.cry?.('MUSHARNA'); await ctx.say(T09_TEXT.musharnaHouse); } },
      ],
    },
    ...DRAWINGS.map((d, i) => ({ id: `dibujo_${i}`, x: I.drawings[i].x, y: I.drawings[i].y, trigger: 'action', noOver: true, script: text(d.text) })),
    {
      id: 'plano_iker', x: I.plan.x, y: I.plan.y, trigger: 'action', noOver: true,
      script: async (ctx) => { await ctx.say(ctx.flag(F.drawingsSolved) ? T09_TEXT.plan : T09_TEXT.planBefore); },
    },
    { id: 'iker_curado', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.mindPlate], none: [F.ikerCured] }), script: curedScene },
    // Salida: felpudo (empujar hacia abajo) → vuelta a la puerta de la aldea.
    ...[-1, 0, 1].map((dx) => ({
      id: `salida_iker_${dx + 1}`, x: I.door.x + dx, y: I.door.y + 1, trigger: 'touch',
      script: async (ctx) => { ctx.se?.('Door exit'); await returnToMnemos(ctx); },
    })),
  ];
  return out;
}

// ------------------------------------------------------------------ pozo de los Custodios

async function takeMindPlate(ctx) {
  await ctx.say(T09_TEXT.plateSeen);
  await ctx.story.giveTablet('MINDPLATE');
  ctx.setFlag(F.mindPlate); // Zygarde habla muy poco (autor, 25-09-2026)
}

export function wellEvents() {
  const P = POZO;
  const text = (t) => async (ctx) => { await ctx.say(t); };
  return [
    {
      id: 'musharna_pozo', x: P.entry.x + 1, y: P.entry.y - 1, name: 'Musharna',
      pages: [{ sprite: SPRITE.musharna, dir: 4, move: 'still', stepAnime: true, speed: 2, trigger: 'action', light: { radius: 150, intensity: 1 }, script: async (ctx) => { ctx.cry?.('MUSHARNA'); } }],
    },
    ...[[7, 7], [8, 7], [9, 7], [7, 8], [9, 8], [7, 9], [8, 9], [9, 9]].map(([x, y], i) => ({ id: `pila_${i}`, x, y, trigger: 'action', noOver: true, script: text(T09_TEXT.wellWater) })),
    { id: 'glifos_o', x: 4, y: 6, trigger: 'action', noOver: true, script: text(T09_TEXT.glyphs) },
    { id: 'glifos_e', x: 11, y: 6, trigger: 'action', noOver: true, script: text(T09_TEXT.glyphs) },
    {
      id: 'tabla_mental', x: P.plate.x, y: P.plate.y, name: 'Tablilla',
      pages: [{
        when: when({ none: [F.mindPlate] }), sprite: OBJ.plate, dir: 4, directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
        trigger: 'action', light: { radius: 60, intensity: 0.7 }, script: takeMindPlate,
      }],
    },
    {
      id: 'salida_pozo', x: P.exit.x, y: P.exit.y, trigger: 'touch',
      script: async (ctx) => { await ctx.say(T09_TEXT.exit); await returnToMnemos(ctx); },
    },
  ];
}

export { P5 };
