// Entrenadores del Bloque 10 — Pilar de la Memoria (docs/CAMPANA.md B10; §5 Genesis; curva POKEDEX_DISTRIBUCION
// §7.1: entrenadores 36–39, Olvido 38–40). Dinero base según docs/BALANCE.md. Formato en content/trainers/index.js.
// Los técnicos visten el uniforme del Consorcio Meridiano (fachada de Genesis) y «digitalizan» el Archivo.

const GRUNT_BGM = 'EncuentroRocket';

export default {
  // ── Aldea Mnemos ──────────────────────────────────────────────────────────────────────────────
  b10_medium_tadeo: {
    name: 'Tadeo', class: 'Médium', sprite: 'anil:medium', overworld: 'anil:medium',
    party: [{ species: 'MISDREAVUS', level: 36 }, { species: 'HAUNTER', level: 37 }],
    // «Médium» y «Exorcista» no están en la tabla de docs/BALANCE.md: especialistas (fila «expertos», como en B11).
    ai: 40, money: 48, moneyKind: 'expertos',
    loseText: 'Los espíritus me avisaron de que perdería. No les hice caso.',
    winText: 'Hasta los fantasmas recuerdan mejor que los vivos, con esta niebla.',
  },
  b10_exorcista_brigida: {
    name: 'Brígida', class: 'Exorcista', sprite: 'anil:exorcista', overworld: 'anil:exorcista',
    party: [{ species: 'DUSKULL', level: 36 }, { species: 'CHINGLING', level: 36 }, { species: 'CHIMECHO', level: 37 }],
    ai: 40, money: 48, moneyKind: 'expertos',
    loseText: 'Ni un conjuro me ha salido. La niebla se me ha llevado hasta las palabras.',
    winText: 'Fuera, fuera, niebla. ¡Fuera!',
  },
  b10_estudiante_delfina: {
    name: 'Delfina', class: 'Estudiante', sprite: 'anil:estudiante', overworld: 'anil:estudiante',
    party: [{ species: 'MUNNA', level: 36 }, { species: 'KIRLIA', level: 37 }],
    ai: 32, money: 16,
    loseText: 'Apuntado en mi cuaderno: «perdí». Al menos no se me olvidará.',
    winText: '¡Lo sabía! Lo tenía apuntado.',
  },

  // ── Archivo Hondo ─────────────────────────────────────────────────────────────────────────────
  b10_investigadora_leonor: {
    name: 'Leonor', class: 'Científica', sprite: 'anil:cientifica', overworld: 'anil:cientifica',
    party: [{ species: 'ELGYEM', level: 37 }, { species: 'BRONZOR', level: 37 }, { species: 'BEHEEYEM', level: 38 }],
    ai: 48, money: 48,
    loseText: 'Resultado inesperado. Lo repetiré en cuanto encuentre mis notas.',
    winText: 'Las palancas de esta sala son un problema de ingeniería precioso.',
  },
  b10_cerebrito_ismael: {
    name: 'Ismael', class: 'Cerebrito', sprite: 'anil:cerebrito', overworld: 'anil:cerebrito',
    party: [{ species: 'CHINGLING', level: 37 }, { species: 'MUNNA', level: 37 }, { species: 'ELGYEM', level: 38 }],
    // «Cerebrito» no está en la tabla: estudiante, fila «jovenes» (como los colegiales).
    ai: 40, money: 16, moneyKind: 'jovenes',
    loseText: 'He leído la estela diez veces y aun así he perdido.',
    winText: 'La lectura es la mejor estrategia.',
  },
  b10_medium_remigio: {
    name: 'Remigio', class: 'Médium', sprite: 'anil:medium', overworld: 'anil:medium',
    party: [{ species: 'DUSKULL', level: 37 }, { species: 'MISDREAVUS', level: 38 }, { species: 'HAUNTER', level: 38 }],
    ai: 40, money: 48, moneyKind: 'expertos',
    loseText: 'Los ecos de aquí abajo no me hacen caso. Tú tampoco.',
    winText: '¿Los has visto? Los custodios. Se repiten y se repiten…',
  },

  // ── Genesis (fachada: Consorcio Meridiano), Archivo de papel ─────────────────────────────────
  b10_tecnico_baltasar: {
    name: 'Baltasar', class: 'Técnico del Consorcio', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico',
    party: [{ species: 'PORYGON', level: 37 }, { species: 'MAGNETON', level: 38 }],
    ai: 40, money: 40, bgm: GRUNT_BGM,
    loseText: 'Incidencia registrada. La digitalización continúa.',
    winText: 'Protocolo cumplido. Siga su camino.',
  },
  b10_tecnica_noemi: {
    name: 'Noemí', class: 'Técnica del Consorcio', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica',
    party: [{ species: 'STUNKY', level: 37 }, { species: 'SKORUPI', level: 37 }, { species: 'DUOSION', level: 38 }],
    ai: 40, money: 40, bgm: GRUNT_BGM,
    loseText: 'Anotado. No afecta a la muestra.',
    winText: 'Por favor, no toque los legajos.',
  },

  // ── Guardiana de la Memoria ───────────────────────────────────────────────────────────────────
  // Olvido Arrieta (CAMPANA B10: Chimecho 38, Beheeyem 38, Bronzong 39, Spiritomb 40).
  b10_olvido: {
    name: 'Olvido', class: 'Guardiana', sprite: 'olvido_front', overworld: 'olvido',
    party: [
      { species: 'CHIMECHO', level: 38 }, { species: 'BEHEEYEM', level: 38 },
      { species: 'BRONZONG', level: 39 }, { species: 'SPIRITOMB', level: 40 },
    ],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 72, money: 100, bgm: 'CombateLider',
    loseText: 'Apuntado: he perdido. Lo subrayo dos veces.',
    winText: 'Te dejo una nota al margen: vuelve a intentarlo.',
  },
};
