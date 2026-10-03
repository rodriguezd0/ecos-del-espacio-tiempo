// Eventos de las Ruinas del Dintel (Pilar del Umbral, CAMPANA B02): Casilda que acompaña, antesala, Galería de los
// Dinteles (puzzle), Cámara de Geodude, Cámara de la Guardiana, Núcleo, células C010–C012, entrenadores
// (Excursionista Remo, Arqueóloga Inés, Montañero Paco, nv 6–9) y objetos.
import { b02CellEvents } from './b02_cells.js';
import { casildaEvents, placeCasilda, ROOM, ROOM_VAR } from './b02_ruinas_casilda.js';
import { salasEvents } from './b02_ruinas_salas.js';
import { camaraEvents, guardianEvents, placeGeodude } from './b02_ruinas_camara.js';
import { nucleoEvents } from './b02_ruinas_nucleo.js';
import { F } from './b02_common.js';
import { TRAINER_SPOTS, PUZZLE_UP } from '../maps/b02/ruinas_dintel_floors.js';

/** Entrenadores de la mazmorra (definiciones de combate en content/trainers/b02.js). */
export const RUINAS_TRAINERS = Object.freeze([
  {
    id: 'excursionista_remo', trainer: 'b02_excursionista_remo', name: 'Excursionista Remo', sprite: 'anil:excursionista',
    x: 10, y: 31, dir: 6, sight: 4,
    intro: '¡Alto! Vengo a entrenar aquí porque nadie molesta. Y ahora molestas tú. ¡Combate!',
    after: 'Dicen que la vieja Casilda conoce estas ruinas piedra a piedra. Yo solo conozco la antesala.',
  },
  {
    id: 'montanero_paco', trainer: 'b02_montanero_paco', name: 'Montañero Paco', sprite: 'anil:montanero',
    x: 31, y: 32, dir: 4, sight: 4,
    intro: '¡Las ruinas tiemblan, pero mis Pokémon no! ¡A ver los tuyos!',
    after: 'Esa losa del fondo no se mueve ni con mi Geodude empujando. Habrá que buscar otro camino.',
  },
  {
    id: 'arqueologa_ines', trainer: 'b02_arqueologa_ines', name: 'Arqueóloga Inés', sprite: 'anil:cientifica',
    x: 20, y: 22, dir: 4, sight: 4,
    intro: 'Cuidado con tocar las piedras de las alcobas: son un yacimiento. ¡Y yo soy la que lo estudia!',
    after: 'Las piedras giran, pero a mí no me han hecho nada. Quizá les falte algo que yo no llevo.',
  },
]);

export function ruinasBaseEvents() {
  return RUINAS_TRAINERS.map((t) => ({ ...t, ...TRAINER_SPOTS[t.id], type: 'trainer' }));
}

export async function ruinasBaseOnEnter({ state }) {
  // El identificador del entrenador se conserva; las partidas antiguas guardaban su victoria en el piso 2.
  for (const t of RUINAS_TRAINERS) {
    if (state.selfSwitch('ruinas_dintel', t.id, 'A')) state.setSelfSwitch('ruinas_dintel_base', t.id, 'A');
  }
}

/** Al entrar (warp o carga): Casilda y el Geodude donde les toca según la historia. */
export async function ruinasOnEnter(ctx) {
  placeCasilda(ctx);
  placeGeodude(ctx);
}

/** Todos los eventos del mapa. */
export function ruinasEvents() {
  return [
    ...casildaEvents(),
    ...salasEvents(),
    ...camaraEvents(),
    ...b02CellEvents('ruinas_dintel'),
    {
      id: 'escalera_nucleo_cerrada', x: PUZZLE_UP.x, y: PUZZLE_UP.y, solid: true, trigger: 'touch',
      when: (s) => !s.flag(F.restored) && !(s.flag(F.dinteles) && s.flag(F.rockBroken)),
      script: async (ctx) => { await ctx.say('La escalera del piso superior está cerrada por el derrumbe.'); },
    },
  ];
}

export function ruinasCoreEvents() {
  return [...casildaEvents({ floor: 3 }), ...guardianEvents(), ...nucleoEvents()];
}

export async function ruinasCoreOnEnter(ctx) {
  if (!ctx.flag(F.exit) && !ctx.flag(F.nucleo)) ctx.setVar(ROOM_VAR, ctx.flag(F.casildaBeaten) ? ROOM.nucleo : ROOM.guardiana);
  placeCasilda(ctx);
  if (ctx.state.selfSwitch('ruinas_dintel', 'superpocion', 'A')) {
    ctx.state.setSelfSwitch('ruinas_dintel_nucleo', 'superpocion', 'A');
  }
}
