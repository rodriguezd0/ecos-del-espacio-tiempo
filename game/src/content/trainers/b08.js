// Entrenadores del Bloque 8 — Pilar de la Masa (docs/CAMPANA.md B08; §5 Genesis: Garrido; TABLILLAS T05; curva
// POKEDEX_DISTRIBUCION §7.1: entrenadores 28–31, Garrido 31–32, Fermín 32–34; T05 (tramo B09): mineros 33–34, Sol
// 34–35, técnicos 35). Dinero base de docs/BALANCE.md. Formato en content/trainers/index.js.
// Los técnicos visten el uniforme del Consorcio Meridiano (Genesis ya se ha presentado en el P3).

const GRUNT_BGM = 'EncuentroRocket';
const MINER = { class: 'Minero', sprite: 'anil:minero', overworld: 'anil:minero', money: 32, ai: 40 };
const MINER_F = { class: 'Minera', sprite: 'anil:minera', overworld: 'anil:minera', money: 32, ai: 40 };
const TECH = { class: 'Técnico del Consorcio', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico', money: 40, bgm: GRUNT_BGM };
const TECH_F = { class: 'Técnica del Consorcio', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica', money: 40, bgm: GRUNT_BGM };

/** Equipo de Sol Galena (TABLILLAS T05: Pangoro 34, Gurdurr 34, Tinkatuff 35). */
export const SOL_PARTY = Object.freeze([
  Object.freeze({ species: 'PANGORO', level: 34 }), Object.freeze({ species: 'GURDURR', level: 34 }), Object.freeze({ species: 'TINKATUFF', level: 35 }),
]);

export default {
  // ── Mina Galena ───────────────────────────────────────────────────────────────────────────────
  b08_minero_veta: {
    name: 'Rufo', ...MINER,
    party: [{ species: 'NACLSTACK', level: 29 }, { species: 'TIMBURR', level: 28 }],
    loseText: 'La veta brilla más que mis Pokémon. Qué se le va a hacer.',
    winText: '¡Así se pica piedra!',
  },
  b08_tecnico_pozo: {
    name: 'Íñigo', ...TECH, ai: 40,
    party: [{ species: 'HOUNDOUR', level: 29 }, { species: 'SKORUPI', level: 29 }],
    loseText: 'Anotado. El sujeto no respeta los permisos municipales.',
    winText: 'Permiso de estudio del terreno, en regla. Circule.',
  },
  b08_tecnica_pozo: {
    name: 'Mireia', ...TECH_F, ai: 44,
    party: [{ species: 'BRONZOR', level: 29 }, { species: 'MAGNETON', level: 30 }],
    loseText: 'Lecturas alteradas. El director lo querrá saber.',
    winText: 'Vibraciones dentro de lo previsto.',
  },
  // Ulises Garrido, director de Operaciones de Genesis (CAMPANA §5.3: Gurdurr 31, Rhyhorn 31, Houndoom 32).
  b08_garrido: {
    name: 'Garrido', class: 'Director de Genesis', sprite: 'garrido_front', overworld: 'garrido',
    party: [{ species: 'GURDURR', level: 31 }, { species: 'RHYHORN', level: 31 }, { species: 'HOUNDOOM', level: 32 }],
    items: ['SUPERPOTION', 'SUPERPOTION'], ai: 64, money: 80, bgm: 'CombateComandante',
    moneyKind: 'comandante', // Comandantes de Genesis (BALANCE.md); la clase «Director de Genesis» es solo suya
    loseText: 'Bien. Cumples. Eso también es un dato.',
    winText: 'Sin rencor. Es trabajo.',
  },

  // ── Dunas de Ceniza y Cueva de las Dunas ──────────────────────────────────────────────────────
  b08_excursionista_dunas: {
    name: 'Adrián', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'HIPPOPOTAS', level: 29 }, { species: 'NOSEPASS', level: 29 }],
    ai: 32, money: 32,
    loseText: 'La ceniza se te mete hasta en los calcetines. Y ahora, además, he perdido.',
    winText: '¡En las dunas manda quien no se hunde!',
  },
  b08_excursionista_f_dunas: {
    name: 'Nerea', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'SKORUPI', level: 30 }, { species: 'DARUMAKA', level: 29 }],
    ai: 32, money: 32,
    loseText: 'Me voy a sentar a la sombra de una roca. Si encuentro alguna.',
    winText: 'Aquí fuera hay que ser duro.',
  },
  b08_arqueologa_dunas: {
    name: 'Carmen', class: 'Arqueóloga', sprite: 'anil:cientifica', overworld: 'anil:cientifica',
    party: [{ species: 'SIGILYPH', level: 30 }, { species: 'NOSEPASS', level: 30 }],
    ai: 48, money: 48,
    loseText: 'Estos zócalos son hexagonales, ¿sabes? Como las piedras del Pilar. Y me has ganado.',
    winText: 'Las ruinas enseñan paciencia.',
  },
  b08_montanero_cueva: {
    name: 'Julián', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'GRAVELER', level: 31 }, { species: 'CARBINK', level: 30 }],
    ai: 32, money: 32,
    loseText: 'La cueva me ha ganado a mí antes que tú.',
    winText: '¡Más fuerte que la roca!',
  },

  // ── Cerro Plomo ───────────────────────────────────────────────────────────────────────────────
  b08_minera_cerro: {
    name: 'Blanca', ...MINER_F,
    party: [{ species: 'ONIX', level: 30 }, { species: 'NACLSTACK', level: 30 }],
    loseText: 'Trabajé con el padre de Fermín. Nunca nos dejó pasar de la verja.',
    winText: 'El Cerro no es para turistas.',
  },
  b08_montanero_cerro: {
    name: 'Octavio', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'GRAVELER', level: 31 }, { species: 'MUDBRAY', level: 30 }],
    ai: 32, money: 32,
    loseText: 'En este cerro pesa todo el doble. Hasta las derrotas.',
    winText: 'Sube con cuidado. Y baja con más.',
  },

  // ── Guardián de la Masa ───────────────────────────────────────────────────────────────────────
  // Fermín Galena (CAMPANA B08: Graveler 32, Naclstack 32, Mudsdale 33, Onix 33, Rhydon 34).
  b08_fermin: {
    name: 'Fermín', class: 'Guardián', sprite: 'fermin_front', overworld: 'fermin',
    party: [
      { species: 'GRAVELER', level: 32 }, { species: 'NACLSTACK', level: 32 }, { species: 'MUDSDALE', level: 33 },
      { species: 'ONIX', level: 33 }, { species: 'RHYDON', level: 34 },
    ],
    items: ['SUPERPOTION', 'SUPERPOTION'], ai: 64, money: 100, bgm: 'CombateLider',
    loseText: 'Vaya. La roca ha cedido antes que tú.',
    winText: 'La piedra no se mueve por empujarla una vez.',
  },

  // ── T05 «El Pulso de Estrato»: Torneo del Pulso y defensa nocturna de la Losa ─────────────────
  b08_t05_minero_1: {
    name: 'Tito', ...MINER,
    party: [{ species: 'MACHOKE', level: 33 }, { species: 'NACLSTACK', level: 33 }],
    loseText: 'Primera ronda y fuera. Como mi abuelo.',
    winText: '¡Brazo de minero!',
  },
  b08_t05_minera_2: {
    name: 'Lola', ...MINER_F,
    party: [{ species: 'MEDITITE', level: 33 }, { species: 'TINKATUFF', level: 33 }],
    loseText: 'Buen pulso. De los de antes.',
    winText: 'La cabeza fría y el brazo firme.',
  },
  b08_t05_minero_3: {
    name: 'Quique', ...MINER,
    party: [{ species: 'GURDURR', level: 34 }, { species: 'MUDSDALE', level: 34 }],
    loseText: 'Pues a la final. Que te toque Sol, ya verás.',
    winText: 'Aquí no pasa nadie sin sudar.',
  },
  b08_t05_sol: {
    name: 'Sol', class: 'Minera', sprite: 'sol_front', overworld: 'sol',
    party: SOL_PARTY.map((p) => ({ ...p })),
    items: ['SUPERPOTION'], ai: 56, money: 32,
    loseText: '…Buen pulso. Tienes el brazo más firme que cualquier minero.',
    winText: 'En Estrato se gana con las manos.',
  },
  b08_t05_tecnico: {
    name: 'Rogelio', ...TECH, ai: 48,
    party: [{ species: 'SKUNTANK', level: 35 }, { species: 'CROAGUNK', level: 34 }],
    loseText: 'Retirada. No nos pagan por esto.',
    winText: 'La losa se viene con nosotros.',
  },
  b08_t05_tecnica: {
    name: 'Susana', ...TECH_F, ai: 48,
    party: [{ species: 'DUOSION', level: 35 }, { species: 'MAGNETON', level: 35 }],
    loseText: 'Registro incompleto. Nos vamos.',
    winText: 'Muestra asegurada.',
  },
};

/** Sol como aliada en la defensa nocturna de la Losa (no es un rival: sin entrenador propio en el registro). */
export function solAlly() {
  return { name: 'Sol', party: SOL_PARTY.map((p) => ({ ...p })), skill: 56 };
}
