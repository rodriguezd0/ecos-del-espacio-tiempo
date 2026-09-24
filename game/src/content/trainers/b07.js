// Entrenadores del Bloque 7 — Interludio 3: Ruta 6 y la Cantería Solano (docs/CAMPANA.md B07; curva
// POKEDEX_DISTRIBUCION §7.1: entrenadores 25–29, sin jefe). Dinero base: docs/BALANCE.md. Los técnicos de la
// voladura trabajan bajo la fachada del Consorcio Meridiano (operaciones de campo de Genesis, CAMPANA §5.1).
const GRUNT_BGM = 'EncuentroRocket';

export default {
  // ── Rellano alto y medio (entre Brontia y la Cantería) ────────────────────────────────────────
  b07_excursionista_bruno: {
    name: 'Bruno', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'GLIGAR', level: 25 }, { species: 'NOSEPASS', level: 26 }],
    ai: 32, money: 32,
    loseText: 'En este cañón hasta las derrotas hacen eco.',
    winText: 'Aquí abajo gana quien conoce la roca.',
  },
  b07_veterana_carmen: {
    name: 'Carmen', class: 'Veterana', sprite: 'anil:veterana', overworld: 'anil:veterana',
    party: [{ species: 'HOUNDOUR', level: 26 }, { species: 'MEDITITE', level: 26 }],
    ai: 48, money: 48,
    loseText: 'Firme como la pared del cañón. Me gusta.',
    winText: 'Te falta paciencia de piedra.',
  },
  b07_montanero_ramiro: {
    name: 'Ramiro', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'RHYHORN', level: 26 }, { species: 'MACHOKE', level: 27 }],
    ai: 32, money: 32,
    loseText: '¡Uf! Como bajar el cañón de un tirón.',
    winText: 'Piernas fuertes, Pokémon fuertes.',
  },
  // ── Rellano bajo (camino de Estrato, tras el derrumbe) ────────────────────────────────────────
  b07_minero_tino: {
    name: 'Tino', class: 'Minero', sprite: 'anil:minero', overworld: 'minero',
    party: [{ species: 'TIMBURR', level: 27 }, { species: 'NACLI', level: 27 }, { species: 'GRAVELER', level: 28 }],
    ai: 32, money: 32,
    loseText: 'Me has dejado más molido que la grava de la mina.',
    winText: 'En Estrato se aprende a aguantar.',
  },
  b07_excursionista_nora: {
    name: 'Nora', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'BOMBIRDIER', level: 28 }, { species: 'GLIGAR', level: 28 }],
    ai: 32, money: 32,
    loseText: 'Mis Pokémon voladores no se esperaban tanta fuerza.',
    winText: 'Desde arriba se ve todo el cañón. ¡Y a ti también!',
  },
  b07_minera_eva: {
    name: 'Eva', class: 'Minera', sprite: 'anil:minera', overworld: 'minera',
    party: [{ species: 'TINKATINK', level: 28 }, { species: 'ONIX', level: 28 }, { species: 'NOSEPASS', level: 29 }],
    ai: 40, money: 32,
    loseText: 'Vale, vale. Te dejo pasar a Estrato.',
    winText: 'Vuelve cuando tengas los brazos más duros.',
  },

  // ── Consorcio Meridiano: técnicos de la voladura delante de las galerías ─────────────────────
  b07_tecnico_voladura: {
    name: 'Héctor', class: 'Técnico del Consorcio', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico',
    party: [{ species: 'HOUNDOUR', level: 26 }, { species: 'SKORUPI', level: 27 }],
    ai: 40, money: 40, bgm: GRUNT_BGM,
    loseText: 'Incidencia en el perímetro. Lo anoto.',
    winText: 'Perímetro asegurado. Retírese.',
  },
  b07_tecnica_voladura: {
    name: 'Marga', class: 'Técnica del Consorcio', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica',
    party: [{ species: 'BRONZOR', level: 27 }, { species: 'DUOSION', level: 27 }],
    ai: 40, money: 40, bgm: GRUNT_BGM,
    loseText: 'El director no va a estar contento.',
    winText: 'La carga sigue programada. No insista.',
  },
};
