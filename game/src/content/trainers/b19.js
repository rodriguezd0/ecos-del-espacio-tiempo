// Entrenadores del Bloque 19 — Interludio 9: la Calzada del Rey (docs/CAMPANA.md B19; TABLILLAS.md T15: Casandra con
// Druddigon 63, Noivern 63, Shelgon 64, Kommo-o 65; curva POKEDEX_DISTRIBUCION §7.1: entrenadores 62–64; dinero base de
// docs/BALANCE.md). Especies del inventario de Axis. Formato en content/trainers/index.js.
//   · Los Peregrinos del Rey no están en la tabla de BALANCE: son caminantes de campo (fila «campo», 32).
//   · Casandra, su guía (50 años), cuenta como veterana (fila «expertos», 48).

const PILGRIM = Object.freeze({ ai: 56, money: 32, moneyKind: 'campo' });

export default {
  // ── Pila A (62–63) ─────────────────────────────────────────────────────────────────────────────
  b19_peregrino_ciriaco: {
    ...PILGRIM, name: 'Ciriaco', class: 'Peregrino', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'ALTARIA', level: 62 }, { species: 'BRONZONG', level: 63 }],
    loseText: 'Las piedras del Rey me sostienen a mí, no a mis combates.',
    winText: '¡La Calzada es de quien la camina!',
  },
  b19_peregrina_benigna: {
    ...PILGRIM, name: 'Benigna', class: 'Peregrina', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'TROPIUS', level: 62 }, { species: 'DRAGONAIR', level: 62 }, { species: 'SIGILYPH', level: 63 }],
    loseText: 'Mis Pokémon vuelan. Yo, por lo visto, no.',
    winText: 'Desde esta pila se ve la Peña entera. ¡Mírala!',
  },
  // ── Pila B (63) ────────────────────────────────────────────────────────────────────────────────
  b19_peregrino_nicanor: {
    ...PILGRIM, name: 'Nicanor', class: 'Peregrino', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'STEELIX', level: 63 }, { species: 'CYCLIZAR', level: 63 }],
    loseText: 'La segunda pila es la más vieja. Y yo, el más cabezota.',
    winText: 'Aquí nunca se cayó nada. Ni siquiera yo.',
  },
  b19_peregrina_ursula: {
    ...PILGRIM, name: 'Úrsula', class: 'Peregrina', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'GOODRA', level: 63 }, { species: 'DRAKLOAK', level: 63 }],
    loseText: 'Crucé con las piedras forzadas. No pienso volver por ellas.',
    winText: '¡Por el Rey del Eje!',
  },
  // ── Peña del Rey (64) ──────────────────────────────────────────────────────────────────────────
  b19_veterano_isidro: {
    name: 'Isidro', class: 'Veterano', sprite: 'anil:veterano', overworld: 'anil:veterano',
    party: [{ species: 'TYRANITAR', level: 64 }, { species: 'DRAGONITE', level: 64 }],
    ai: 72, money: 48,
    loseText: 'Cuarenta años de peregrino, y he tenido que llegar a la Peña para perder así.',
    winText: 'La Peña del Rey pide respeto. Y buenos Pokémon.',
  },
  // ── Sima del Eje: sendero del oeste (63–64) ────────────────────────────────────────────────────
  b19_montanera_olaya: {
    name: 'Olaya', class: 'Montañera', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'GOLEM', level: 63 }, { species: 'MAMOSWINE', level: 63 }],
    ai: 56, money: 32,
    loseText: 'Bajé a ver el fondo de la Sima. Me llevo un buen combate, que ya es algo.',
    winText: 'Aquí abajo el eco repite cada golpe.',
  },
  b19_veterano_ruperto: {
    name: 'Ruperto', class: 'Veterano', sprite: 'anil:veterano', overworld: 'anil:veterano',
    party: [{ species: 'HIPPOWDON', level: 63 }, { species: 'GLISCOR', level: 63 }, { species: 'CROBAT', level: 64 }],
    ai: 72, money: 48,
    loseText: 'Treinta años bajando cornisas y aún me sorprenden.',
    winText: 'La Sima no perdona a los despistados.',
  },
  // ── Casandra, guía de los Peregrinos del Rey (TABLILLAS T15). Combate de guion: perder no es derrota general. ─
  b19_casandra: {
    name: 'Casandra', class: 'Guía peregrina', moneyKind: 'expertos', sprite: 'anil:veterana', overworld: 'anil:veterana',
    party: [
      { species: 'DRUDDIGON', level: 63 }, { species: 'NOIVERN', level: 63 },
      { species: 'SHELGON', level: 64 }, { species: 'KOMMOO', level: 65 },
    ],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 80, money: 48, bgm: 'Batalla Jefe Torre',
    loseText: '…Las piedras te responden. A mí no me respondieron nunca.',
    winText: 'El Rey no abre su puerta a cualquiera.',
    canLose: true,
  },
};
