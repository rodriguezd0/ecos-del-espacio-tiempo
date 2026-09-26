// Entrenadores del Bloque 4 (docs/CAMPANA.md B04; curva de docs/POKEDEX_DISTRIBUCION.md §7.1: entrenadores 13–17,
// técnicos 14–16, Leandro 17–19; rebajada dos niveles con la curva inicial del autor, DECISIONES X35 «DECIDIDO (autor,
// 25-09-2026)»: antes 14–19, 15–17 y 19–21). Técnicos del Consorcio Meridiano (Genesis sin nombre público, CAMPANA §5.1:
// Magnemite, Bronzor, Solosis), pescadores y buceadoras de la Escalera de Estanques y el Guardián de la Corriente.
// Nombres de ruta, técnicos y gente de la Escalera: genéricos (sin canon). Música por situación: CAMPANA §1.8 (X20).
// `money` = base por clase de docs/BALANCE.md (content/trainerMoney.js).

const GENESIS = { sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico', class: 'Técnico del Consorcio', bgm: 'EncuentroRocket', victoryBGM: 'victory_genesis', ai: 32 };
const GENESIS_F = { ...GENESIS, sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica', class: 'Técnica del Consorcio' };
const ROUTE = { bgm: 'PrismaEntrenador', ai: 24, items: [] };

export default {
  // ─── Ruta 3 ────────────────────────────────────────────────────────────────────────────
  r3_pescador_nicanor: {
    ...ROUTE, name: 'Nicanor', class: 'Pescador', sprite: 'anil:pescador', overworld: 'anil:pescador', money: 24,
    party: [{ species: 'MAGIKARP', level: 13 }, { species: 'BARBOACH', level: 13 }],
    loseText: 'Hoy no pica nada. Ni los combates.',
    winText: '¡Por fin algo muerde!',
  },
  r3_excursionista_rufo: {
    ...ROUTE, name: 'Rufo', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista', money: 32,
    party: [{ species: 'GEODUDE', level: 13 }, { species: 'MACHOP', level: 14 }],
    loseText: '¡Uf! Ni cuesta arriba me ganas.',
    winText: 'Piernas fuertes, Pokémon fuertes.',
  },
  r3_aspirante_vera: {
    ...ROUTE, name: 'Vera', class: 'Aspirante', sprite: 'anil:aspirante_f', overworld: 'anil:aspirante_f', money: 48,
    party: [{ species: 'BUIZEL', level: 14 }, { species: 'YANMA', level: 14 }],
    loseText: 'Vale, vale. Tú subes más rápido.',
    winText: '¡La Garganta entrena mejor que cualquier gimnasio!',
  },

  // ─── Garganta del Albo: técnicos de las balizas ────────────────────────────────────────────
  ga_tecnico_ribas: {
    ...GENESIS, name: 'Ribas', money: 40,
    party: [{ species: 'MAGNEMITE', level: 14 }, { species: 'SOLOSIS', level: 14 }],
    loseText: 'Tendré que anotar la incidencia en el parte.',
    winText: 'Medición completada. Siga su camino, por favor.',
  },
  ga_tecnica_noa: {
    ...GENESIS_F, name: 'Noa', money: 40,
    party: [{ species: 'BRONZOR', level: 14 }, { species: 'MAGNEMITE', level: 15 }],
    loseText: 'Interesante. No esperaba esa variable.',
    winText: 'Las cifras no mienten.',
  },
  ga_tecnico_salcedo: {
    ...GENESIS, name: 'Salcedo', money: 40,
    party: [{ species: 'SOLOSIS', level: 15 }, { species: 'BRONZOR', level: 16 }],
    loseText: 'Los datos de la puerta tendrán que esperar.',
    winText: 'Gracias por su colaboración.',
  },

  // ─── Gruta del Albo ─────────────────────────────────────────────────────────────────────
  gr_montanero_ciriaco: {
    ...ROUTE, name: 'Ciriaco', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero', money: 32,
    party: [{ species: 'GEODUDE', level: 14 }, { species: 'ZUBAT', level: 14 }, { species: 'MACHOP', level: 15 }],
    loseText: 'Esta gruta es pequeña, pero tú no.',
    winText: 'En la roca se aprende paciencia.',
  },

  // ─── Pilar de la Corriente: gente de la Escalera de Estanques ──────────────────────────────
  pc_pescador_bruno: {
    ...ROUTE, name: 'Bruno', class: 'Pescador', sprite: 'anil:pescador', overworld: 'anil:pescador', money: 24,
    party: [{ species: 'MAGIKARP', level: 14 }, { species: 'BARBOACH', level: 15 }],
    loseText: 'En el río ya no pican. Aquí dentro, tampoco.',
    winText: 'Aquí abajo el agua aún obedece a alguien.',
  },
  pc_buceadora_marta: {
    ...ROUTE, name: 'Marta', class: 'Buceadora', sprite: 'anil:buceadora', overworld: 'anil:buceadora', money: 24,
    party: [{ species: 'BUIZEL', level: 15 }, { species: 'MARILL', level: 15 }],
    loseText: '¡Me has dejado sin aire!',
    winText: 'Bajo el agua se aguanta más de lo que crees.',
  },
  pc_pescador_tomas: {
    ...ROUTE, name: 'Tomás', class: 'Pescador', sprite: 'anil:pescador', overworld: 'anil:pescador', money: 24,
    party: [{ species: 'WOOPER', level: 16 }, { species: 'BARBOACH', level: 16 }],
    loseText: 'Buena captura… para ti.',
    winText: 'Paciencia y buen sedal.',
  },
  pc_buceadora_ines: {
    ...ROUTE, name: 'Inés', class: 'Buceadora', sprite: 'anil:buceadora', overworld: 'anil:buceadora', money: 24,
    party: [{ species: 'PSYDUCK', level: 16 }, { species: 'SHELLOS', level: 17 }],
    loseText: 'Vale. Tú sí sabes nadar a contracorriente.',
    winText: 'El agua de aquí dentro tiene memoria.',
  },

  // ─── Guardián de la Corriente (X06: Leandro Alcántara, 38, orgullo) ──────────────────────────
  leandro: {
    name: 'Leandro', class: 'Maestre de Esclusas', sprite: 'leandro_front', overworld: 'leandro',
    party: [
      { species: 'BARBOACH', level: 17 }, { species: 'BUIZEL', level: 17 },
      { species: 'MARILL', level: 18 }, { species: 'QUAGSIRE', level: 19, item: 'SITRUSBERRY' },
    ],
    items: ['SUPERPOTION'],
    ai: 64,
    money: 100, // Guardianes de los Pilares: premio = 100 × nivel (19)
    moneyKind: 'guardian', // su clase («Maestre de Esclusas») no está en la tabla de BALANCE.md
    bgm: 'CombateLider',
    victoryBGM: 'victory_important',
    canLose: true, // reintento: se le vuelve a hablar (CAMPANA B04)
    loseText: '…Sabes dónde pisas. Y sabes cuándo no pisar.',
    winText: 'El agua no se doma a la primera. Vuelve a intentarlo.',
  },
};
