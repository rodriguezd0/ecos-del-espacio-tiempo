// Entrenadores del Bloque 15 — Interludio 7: el norte, Villa Boreal y el quinto núcleo (docs/CAMPANA.md B15; §5 Genesis,
// §6 Gael; curva POKEDEX_DISTRIBUCION §7.1: entrenadores 52–56, Gael 53–56; dinero base de docs/BALANCE.md). Especies del
// inventario de Axis. Formato en content/trainers/index.js.
import { gaelFinalStarter } from '../events/b15_common.js';

const GRUNT_BGM = 'EncuentroRocket';

export default {
  // ── Ruta 11 · vertiente nevada (52–54) ─────────────────────────────────────────────────────────
  b15_excursionista_begona: {
    name: 'Begoña', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'PILOSWINE', level: 52 }, { species: 'BEARTIC', level: 53 }],
    ai: 48, money: 32,
    loseText: 'Vale, vale. Tres semanas esperando a que se fuera el hielo para esto.',
    winText: '¡La vertiente es mía!',
  },
  b15_montanero_abel: {
    name: 'Abel', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'GOLEM', level: 53 }, { species: 'MACHAMP', level: 53 }],
    ai: 48, money: 32,
    loseText: 'Conozco la montaña. A mis Pokémon, estos días, no tanto.',
    winText: 'Aquí arriba manda la roca.',
  },
  b15_fotografa_sabina: {
    name: 'Sabina', class: 'Fotógrafa', sprite: 'anil:fotografa', overworld: 'anil:fotografa',
    party: [{ species: 'NOCTOWL', level: 52 }, { species: 'STARAPTOR', level: 52 }, { species: 'ALTARIA', level: 53 }],
    ai: 48, money: 32,
    loseText: 'Me has dejado la foto movida. Y el combate también.',
    winText: '¡Esa sí que ha salido bien!',
  },
  b15_veterano_hilario: {
    name: 'Hilario', class: 'Veterano', sprite: 'anil:veterano', overworld: 'anil:veterano',
    party: [{ species: 'MEDICHAM', level: 53 }, { species: 'ABSOL', level: 54 }],
    ai: 64, money: 48,
    loseText: 'Treinta inviernos y todavía aprendo algo. Bien.',
    winText: 'El frío no perdona los descuidos.',
  },

  // ── Paso del Norte (53–54): técnicos de Genesis en el mirador y un curioso ──────────────────────
  b15_tecnico_paso: {
    name: 'Germán', class: 'Técnico de Genesis', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico',
    party: [{ species: 'MAGNETON', level: 53 }, { species: 'BRONZONG', level: 53 }],
    ai: 48, money: 40, bgm: GRUNT_BGM,
    loseText: 'Lectura interrumpida. Constará en el registro.',
    winText: 'Medición completa. Gracias por su paciencia.',
  },
  b15_tecnica_paso: {
    name: 'Candela', class: 'Técnica de Genesis', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica',
    party: [{ species: 'TOXICROAK', level: 53 }, { species: 'DRAPION', level: 53 }, { species: 'HOUNDOOM', level: 54 }],
    ai: 48, money: 40, bgm: GRUNT_BGM,
    loseText: 'Desviación fuera de rango. Repetiremos la toma.',
    winText: 'Datos estables. Puede seguir su camino.',
  },
  b15_aspirante_valentin: {
    name: 'Valentín', class: 'Aspirante', sprite: 'anil:aspirante', overworld: 'anil:aspirante',
    party: [{ species: 'HONCHKROW', level: 54 }, { species: 'GALLADE', level: 54 }],
    ai: 64, money: 48,
    loseText: 'He venido a ver la columna de luz y me llevo una lección.',
    winText: 'La luz de la cumbre da suerte. A mí, por lo menos.',
  },

  // ── Senda del Lazo (53–55): curiosos atraídos por la columna de luz ─────────────────────────────
  b15_excursionista_telmo: {
    name: 'Telmo', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'GRAVELER', level: 53 }, { species: 'STEELIX', level: 54 }],
    ai: 48, money: 32,
    loseText: 'Tres días subiendo. Tres días volviendo aquí. Y ahora esto.',
    winText: 'Por lo menos algo me sale bien en esta senda.',
  },
  b15_aspirante_ximena: {
    name: 'Ximena', class: 'Aspirante', sprite: 'anil:aspirante_f', overworld: 'anil:aspirante_f',
    party: [{ species: 'ALTARIA', level: 54 }, { species: 'GARDEVOIR', level: 55 }],
    ai: 64, money: 48,
    loseText: 'Si has llegado hasta aquí arriba, lo merecías.',
    winText: 'Desde este mirador hasta los combates saben distintos.',
  },

  // ── Ruta 13 · nieve profunda (54–55) ────────────────────────────────────────────────────────────
  b15_montanera_yolanda: {
    name: 'Yolanda', class: 'Montañera', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'AVALUGG', level: 54 }, { species: 'MAMOSWINE', level: 55 }],
    ai: 48, money: 32,
    loseText: 'En la nieve honda se avanza despacio. Tú no.',
    winText: 'Paso firme, como en la nieve.',
  },
  b15_excursionista_emilio: {
    name: 'Emilio', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'ABOMASNOW', level: 54 }, { species: 'BEARTIC', level: 54 }],
    ai: 48, money: 32,
    loseText: 'Me voy a Boreal a entrar en calor. Y a pensar.',
    winText: '¡Ni la ventisca me para!',
  },
  b15_veterana_genoveva: {
    name: 'Genoveva', class: 'Veterana', sprite: 'anil:veterana', overworld: 'anil:veterana',
    party: [{ species: 'GLALIE', level: 55 }, { species: 'FROSLASS', level: 55 }],
    ai: 64, money: 48,
    loseText: 'Buen pulso. Se nota que has cruzado medio Axis.',
    winText: 'El norte pide paciencia. Vuelve cuando la tengas.',
  },

  // ── Gruta Escarcha (55–56) ─────────────────────────────────────────────────────────────────────
  b15_excursionista_lucio: {
    name: 'Lucio', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'CROBAT', level: 55 }, { species: 'GLALIE', level: 55 }],
    ai: 48, money: 32,
    loseText: 'En la gruta todo resbala. Hasta mis planes.',
    winText: 'Aquí dentro el eco repite cada victoria.',
  },
  b15_montanero_fidel: {
    name: 'Fidel', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'ARCTIBAX', level: 55 }, { species: 'AVALUGG', level: 56 }],
    ai: 48, money: 32,
    loseText: 'Mi Arctibax no me hace caso estos días. Hoy tampoco me ha salvado.',
    winText: 'El hielo viejo aguanta. Como yo.',
  },

  // ── Mar Boreal (54–55) ─────────────────────────────────────────────────────────────────────────
  b15_marinero_teo: {
    name: 'Teo', class: 'Marinero', sprite: 'anil:marinero', overworld: 'anil:marinero',
    party: [{ species: 'PELIPPER', level: 54 }, { species: 'JELLICENT', level: 55 }],
    ai: 48, money: 24,
    loseText: 'Con el mar así de frío, hasta perder se agradece: te calienta la cara.',
    winText: '¡Ni los témpanos me paran!',
  },

  // ── Gael, combate B5 en el Observatorio Boreal (CAMPANA §6.3: Staraptor 53, Lucario 53, Weavile 53, Garchomp 54,
  //    Absol 55 Mega con el aro negro de piedra violeta, inicial final 56). Continúa la historia aunque se pierda. ─────
  b15_gael_b5: {
    name: 'Gael', class: 'Rival', sprite: 'gael_front', overworld: 'gael',
    party: (state) => [
      { species: 'STARAPTOR', level: 53 }, { species: 'LUCARIO', level: 53 }, { species: 'WEAVILE', level: 53 },
      { species: 'GARCHOMP', level: 54 }, { species: 'ABSOL', level: 55, item: 'ABSOLITE' },
      { species: gaelFinalStarter(state), level: 56 },
    ],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 80, money: 60, bgm: 'CombateRival', megaRing: true,
    megaRingName: 'el aro negro',
    loseText: '…Ya.',
    winText: 'Lo quería saber. Ya lo sé.',
    canLose: true,
  },
};
