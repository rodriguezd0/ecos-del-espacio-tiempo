// Eventos de la Ruta 1 (B01 §4.8, §6; docs/CAMPANA.md «B01 — ajustes DECIDIDO-DEV»): entrenadores con visión,
// objetos, Células de Zygarde (§2.3: C002–C006 en pasos obligados y el claro, C024 en el mirador con Correr),
// los dos topógrafos del Consorcio Meridiano, la cuesta de grava, el cruce oeste (Ruta 10, B11), el cartel
// del Pilar del Umbral y la salida sur a Villa Zaguán (B02). Los enlaces cerrados avisan y devuelven un paso.
import { CELL_TOTAL, cellFoundText, cellsOf, cellEvent } from './b01_cells.js';
// (el texto de la cuesta de grava y el de la célula los ponen los tipos del sistema de Zygarde)
import { PENDING_LINKS } from '../maps/b01/pending_links.js';
import { getCharacter } from '../characters.js';

/** Sprite registrado o, si aún no existe, el de reserva (Añil). */
const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);
/** Técnicos de campo del Consorcio Meridiano (arte de campaña, X08) con reserva de Añil. */
export const SURVEYOR_SPRITES = Object.freeze({
  a: spriteOr('genesis_tecnico', 'anil:cientifico'),
  b: spriteOr('genesis_tecnica', 'anil:cientifica'),
});

export { CELL_TOTAL, cellFoundText };

/** Células de la Ruta 1 (catálogo de content/events/b01_cells.js). */
export const RUTA1_CELLS = Object.freeze(cellsOf('ruta_1'));

/** Entrenadores (definiciones de combate en content/trainers/b01_ruta1.js). */
export const RUTA1_TRAINERS = Object.freeze([
  {
    id: 'joven_pablo', trainer: 'r1_joven_pablo', name: 'Joven Pablo', sprite: 'chaval1', x: 12, y: 11, dir: 6,
    intro: '¡Eh, tú! Ese Pokémon es nuevo, ¿verdad? ¡Veamos qué tal lo hace!',
    after: 'Entreno aquí cada mañana. Algún día mi Bidoof será enorme.',
  },
  {
    id: 'chica_nerea', trainer: 'r1_chica_nerea', name: 'Chica Nerea', sprite: 'chica1', x: 17, y: 36, dir: 4,
    intro: '¡Por fin alguien con quien combatir! No te lo pondré fácil.',
    after: 'Starly y Budew se llevan genial. Por eso los traigo juntos.',
  },
  {
    id: 'bichero_luis', trainer: 'r1_bichero_luis', name: 'Bichero Luis', sprite: 'cazabichos', x: 13, y: 48, dir: 4,
    intro: '¡Shh! Estaba buscando Pokémon bicho… ¡Pero un combate también vale!',
    after: 'Entre la hierba alta hay muchos Pokémon bicho. Mira bien por dónde pisas.',
  },
]);

/** Frase de los topógrafos (primera presencia de Genesis, sin nombre; CAMPANA §5.4). */
export const SURVEYOR_LINE = 'Lecturas de campo. Siga, por favor.';
/** Hasta que se restaura el Pilar del Umbral (B02) siguen midiendo aquí. */
const SURVEY_UNTIL = 'p1_restored';
const TRIPOD_TEXT = 'Un trípode con un aparato de medición que zumba en voz baja. Una placa dice: «Consorcio Meridiano de Estudios Geofísicos».';
const LOOKOUT_TEXT = 'MIRADOR\nEntre las copas se ven los tejados de Villa Alba.';
const WEST_SIGN = 'RUTA 10 ←\nFaldas del Monte del Portal.';
const UMBRAL_SIGN = 'Pilar del Umbral — Ruinas antiguas. Se ruega respeto.';

function trainerEvents() {
  return RUTA1_TRAINERS.map((t) => ({ ...t, type: 'trainer', sight: 4 }));
}

function cellEvents() {
  return RUTA1_CELLS.map((c) => cellEvent(c));
}

/** Dos topógrafos del Consorcio con su trípode (hablan poco; no combaten). */
function surveyEvents(survey) {
  const present = (s) => !s?.flag(SURVEY_UNTIL);
  const talk = (speaker) => async (ctx) => {
    await ctx.say(SURVEYOR_LINE, { speaker });
    ctx.face('this', ctx.event?.page?.dir || 2);
  };
  return [
    {
      id: 'topografo_a', x: survey.a.x, y: survey.a.y, name: 'Topógrafo', when: present,
      sprite: SURVEYOR_SPRITES.a, dir: survey.a.dir, move: 'still', trigger: 'action', script: talk('Topógrafo'),
    },
    {
      id: 'topografa_b', x: survey.b.x, y: survey.b.y, name: 'Topógrafa', when: present,
      sprite: SURVEYOR_SPRITES.b, dir: survey.b.dir, move: 'still', trigger: 'action', script: talk('Topógrafa'),
    },
    {
      id: 'tripode', x: survey.tripod.x, y: survey.tripod.y, when: present,
      sprite: 'asset:objects/tripode.png', dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
      solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TRIPOD_TEXT); },
    },
  ];
}

/**
 * Cuesta de grava del mirador (CAMPANA §1.1, puerta G1): tipo `gravelSlope` del sistema de Zygarde (a pie se
 * resbala; montado en el 10 % se sube). Ocupa la fila inferior de la rampa.
 */
function gravelEvents(lookout) {
  return lookout.ramp.map((x) => ({ id: `grava_${x}`, type: 'gravelSlope', x, y: lookout.rampY[1] }));
}

/** Enlace cerrado: aviso neutro y un paso atrás (dir = hacia dónde se retrocede). */
function blockedLink(prefix, cells, text, back, face) {
  const script = async (ctx) => {
    ctx.face('player', face);
    await ctx.say(text);
    await ctx.move('player', [back], { through: false });
  };
  return cells.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, trigger: 'touch', script }));
}

/**
 * Eventos de la Ruta 1. opts: { southRow, pathX0, pathX1, zaguanOpen, westOpen, westCrossing, lookout, survey }.
 */
export function ruta1Events(opts) {
  const { southRow, pathX0, pathX1, zaguanOpen = false, westOpen = false, westCrossing, lookout, survey } = opts;
  const out = [
    ...trainerEvents(),
    ...cellEvents(),
    { id: 'pocion_1', type: 'item', x: 5, y: 15, item: 'POTION' },
    { id: 'pocion_2', type: 'item', x: 5, y: 38, item: 'POTION' },
    { id: 'pokeball_1', type: 'item', x: 19, y: 32, item: 'POKEBALL' },
    { id: 'pocion_oculta', type: 'item', x: 24, y: 26, item: 'POTION', hidden: true },
    { id: 'cartel_umbral', type: 'sign', x: 18, y: 55, text: UMBRAL_SIGN },
  ];
  if (survey) out.push(...surveyEvents(survey));
  if (lookout) {
    out.push(...gravelEvents(lookout));
    out.push({ id: 'cartel_mirador', type: 'sign', x: lookout.sign.x, y: lookout.sign.y, text: LOOKOUT_TEXT });
  }
  if (westCrossing) {
    out.push({ id: 'cartel_ruta10', type: 'sign', x: westCrossing.sign.x, y: westCrossing.sign.y, text: WEST_SIGN, skin: 'sign hgss dir' });
    if (!westOpen) {
      const cells = [[4, westCrossing.y0], [4, westCrossing.y1]];
      out.push(...blockedLink('desprendimiento', cells, PENDING_LINKS.ruta_10.blocked, 'right', 'left'));
    }
  }
  if (!zaguanOpen) {
    const cells = [];
    for (let x = pathX0; x <= pathX1; x++) cells.push([x, southRow]);
    out.push(...blockedLink('limite_sur', cells, PENDING_LINKS.villa_zaguan.blocked, 'up', 'down'));
  }
  return out;
}
