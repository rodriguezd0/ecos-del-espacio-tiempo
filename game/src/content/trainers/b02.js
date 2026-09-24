// Entrenadores del Bloque 2 — Pilar del Umbral (docs/CAMPANA.md B02; POKEDEX_DISTRIBUCION §7.1: entrenadores nv 6–9,
// Casilda 11–12). Formato en content/trainers/index.js. Sprites de combate: arte de campaña (Casilda) o clases de Añil.
// `money` = base por clase de docs/BALANCE.md (content/trainerMoney.js).

export default {
  // ─── Ruinas del Dintel ───────────────────────────────────────────────────────────────────────
  b02_excursionista_remo: {
    name: 'Remo',
    class: 'Excursionista',
    sprite: 'anil:excursionista',
    overworld: 'anil:excursionista',
    party: [{ species: 'ZUBAT', level: 6 }, { species: 'MACHOP', level: 7 }],
    items: [],
    ai: 16,
    money: 32,
    intro: '¡Alto! Vengo a entrenar aquí porque nadie molesta. Y ahora molestas tú. ¡Combate!',
    loseText: 'Vale, vale. Molestas, pero combates bien.',
    winText: '¡Ja! Las ruinas me dan suerte.',
  },
  b02_montanero_paco: {
    name: 'Paco',
    class: 'Montañero',
    sprite: 'anil:montanero',
    overworld: 'anil:montanero',
    party: [{ species: 'GEODUDE', level: 7 }, { species: 'MACHOP', level: 8 }],
    items: [],
    ai: 24,
    money: 32,
    intro: '¡Las ruinas tiemblan, pero mis Pokémon no! ¡A ver los tuyos!',
    loseText: 'Ni un temblor habría movido así a mi Geodude.',
    winText: '¡Firmes como la roca!',
  },
  b02_arqueologa_ines: {
    name: 'Inés',
    class: 'Arqueóloga',
    sprite: 'anil:cientifica',
    overworld: 'anil:cientifica',
    party: [{ species: 'ZUBAT', level: 8 }, { species: 'ONIX', level: 9 }],
    items: [],
    ai: 32,
    money: 48,
    intro: 'Cuidado con tocar las piedras de las alcobas: son un yacimiento. ¡Y yo soy la que lo estudia!',
    loseText: 'Anotado: el yacimiento tiene visita.',
    winText: 'La paciencia es la primera herramienta de una arqueóloga.',
  },

  // ─── La Guardiana del Umbral (D07, X06) ─────────────────────────────────────────────────────────
  b02_casilda: {
    name: 'Casilda',
    class: 'Guardiana',
    sprite: 'casilda_front',
    overworld: 'casilda',
    party: [
      // Cabeza Roca (no Robustez): sin el combo Robustez + Azote que tumba al inicial de un golpe en el primer reto.
      { species: 'BONSLY', level: 11, ability: 'ROCKHEAD', moves: ['ROCKTHROW', 'FLAIL', 'FAKETEARS', 'DISABLE'] },
      { species: 'NACLI', level: 11, moves: ['ROCKTHROW', 'MUDSHOT', 'SMACKDOWN', 'HARDEN'] },
      { species: 'HIPPOPOTAS', level: 12, ability: 'SANDSTREAM', item: 'ORANBERRY', moves: ['SANDTOMB', 'BITE', 'YAWN', 'SANDATTACK'] },
    ],
    items: ['POTION'],
    ai: 48,
    money: 100, // Guardianes de los Pilares (docs/BALANCE.md)
    bgm: 'CombateLider',
    // El reto lo dice la escena (content/events/b02_ruinas_camara.js).
    loseText: '…Está bien. Sabes lo que haces.',
    winText: 'Todavía no.',
    canLose: true,
  },
};
