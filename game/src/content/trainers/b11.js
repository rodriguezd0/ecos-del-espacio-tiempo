// Entrenadores del Bloque 11 — Interludio 5 (docs/CAMPANA.md B11; §5 Genesis, §6 Gael; curva POKEDEX_DISTRIBUCION
// §7.1: entrenadores 38–43, Gael 41–43; dinero base de docs/BALANCE.md). El tramo bajo de la Ruta 10 es de la
// etapa A (se llega desde la Ruta 1 al salir de casa): sus dos entrenadores llevan niveles de la apertura.
// Formato en content/trainers/index.js. Los técnicos de Genesis visten el uniforme del Consorcio Meridiano.
import { gaelFinalStarter } from '../events/b11_common.js';

const GRUNT_BGM = 'EncuentroRocket';

export default {
  // ── Ruta 10, tramo bajo (etapa A: niveles 5–7) ──────────────────────────────────────────────────
  b11_joven_tomas: {
    name: 'Tomás', class: 'Joven', sprite: 'anil:joven', overworld: 'anil:joven',
    party: [{ species: 'STARLY', level: 6 }, { species: 'LILLIPUP', level: 6 }],
    ai: 16, money: 16,
    loseText: '¡Anda! Y eso que conozco la ribera como la palma de mi mano.',
    winText: 'Aquí abajo se entrena de maravilla.',
  },
  b11_chica_nuria: {
    name: 'Nuria', class: 'Chica', sprite: 'anil:chica', overworld: 'anil:chica',
    party: [{ species: 'BUDEW', level: 6 }, { species: 'PIDOVE', level: 7 }],
    ai: 16, money: 16,
    loseText: 'Vale, me rindo. ¡Pero la próxima vez traigo más Pokémon!',
    winText: '¡Toma ya!',
  },

  // ── Ruta 10, tramo alto (etapa E: niveles 40–43) ─────────────────────────────────────────────────
  b11_montanero_elias: {
    name: 'Elías', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'MACHOKE', level: 41 }, { species: 'GRAVELER', level: 41 }],
    ai: 48, money: 32,
    loseText: 'He subido estas raíces cien veces y nunca me había caído tan fuerte.',
    winText: 'En el Monte manda la piedra. Y yo me llevo bien con ella.',
  },
  b11_ornitologa_marisa: {
    name: 'Marisa', class: 'Ornitóloga', sprite: 'anil:ornitologo', overworld: 'anil:ornitologo',
    party: [{ species: 'SWABLU', level: 40 }, { species: 'BOMBIRDIER', level: 41 }, { species: 'ALTARIA', level: 42 }],
    ai: 48, money: 32, // Ornitóloga → fila «campo» (aficionados de campo, docs/BALANCE.md)
    loseText: 'Las Altaria de la pradera cantan distinto cuando pierdo. ¿O me lo parece?',
    winText: 'Los pájaros del Monte vuelan alto. Los míos, más.',
  },
  b11_veterana_amparo: {
    name: 'Amparo', class: 'Veterana', sprite: 'anil:veterana', overworld: 'anil:veterana',
    party: [{ species: 'MEDICHAM', level: 42 }, { species: 'ABSOL', level: 42 }],
    ai: 64, money: 48,
    loseText: 'Buena cabeza. Hacía años que nadie me ganaba en esta ladera.',
    winText: 'La montaña enseña paciencia. Vuelve cuando la tengas.',
  },

  // ── Ruta 9 y Bosque Neblino (niveles 38–42) ──────────────────────────────────────────────────────
  b11_medium_celia: {
    name: 'Celia', class: 'Médium', sprite: 'anil:medium', overworld: 'anil:medium',
    party: [{ species: 'MISDREAVUS', level: 39 }, { species: 'GASTLY', level: 38 }, { species: 'MIMIKYU', level: 40 }],
    // «Médium» no está en la tabla de docs/BALANCE.md: especialista, como arqueólogos y científicos (fila «expertos»).
    ai: 48, money: 48, moneyKind: 'expertos',
    loseText: 'La niebla se ha ido… y con ella, mi suerte.',
    winText: 'Los espíritus del bosque te miran. No les gustas.',
  },
  b11_excursionista_ruben: {
    name: 'Rubén', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'APPLIN', level: 39 }, { species: 'VENIPEDE', level: 39 }, { species: 'TOEDSCOOL', level: 40 }],
    ai: 48, money: 32,
    loseText: 'Llevaba semanas sin poder cruzar el bosque por la niebla. Y ahora esto.',
    winText: 'Sin niebla, el Neblino es precioso. ¿A que sí?',
  },
  b11_bichera_lucia: {
    name: 'Lucía', class: 'Bichera', sprite: 'anil:bichera', overworld: 'anil:bichera',
    party: [{ species: 'CUTIEFLY', level: 38 }, { species: 'VENIPEDE', level: 39 }, { species: 'RIBOMBEE', level: 41 }],
    ai: 32, money: 16,
    loseText: 'Mis Cutiefly se han mareado con tanto cristal brillante.',
    winText: '¡Los bichos del bosque lila son los mejores!',
  },
  b11_veterano_andres: {
    name: 'Andrés', class: 'Veterano', sprite: 'anil:veterano', overworld: 'anil:veterano',
    party: [{ species: 'THIEVUL', level: 41 }, { species: 'NOCTOWL', level: 40 }, { species: 'HATTREM', level: 41 }],
    ai: 64, money: 48,
    loseText: 'Recuerdo este combate. Eso ya es mucho, después de la niebla.',
    winText: 'Durante semanas no supe ni cómo me llamaba. Hoy sí.',
  },

  // ── Campamento del Monte · Genesis (fachada: Consorcio Meridiano) ────────────────────────────────
  b11_tecnico_sondeo: {
    name: 'Íñigo', class: 'Técnico del Consorcio', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico',
    party: [{ species: 'PORYGON', level: 40 }, { species: 'MAGNETON', level: 41 }],
    ai: 48, money: 40, bgm: GRUNT_BGM,
    loseText: 'Anotado. La incidencia constará en el parte de hoy.',
    winText: 'Perímetro asegurado. Gracias por su colaboración.',
  },
  b11_tecnica_sondeo: {
    name: 'Mara', class: 'Técnica del Consorcio', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica',
    party: [{ species: 'SKORUPI', level: 40 }, { species: 'CROAGUNK', level: 40 }, { species: 'HOUNDOUR', level: 41 }],
    ai: 48, money: 40, bgm: GRUNT_BGM,
    loseText: 'Resultado fuera de rango. Repetiremos la medición.',
    winText: 'Lecturas estables. Puede circular.',
  },

  // ── Gael, combate B4 al pie del Monte (CAMPANA §6.3: Staraptor 41, Lucario 41, Gabite 41, Absol 42, inicial
  //    final 43). Continúa la historia aunque el jugador pierda (§2.6). ───────────────────────────────────────
  b11_gael_b4: {
    name: 'Gael', class: 'Rival', sprite: 'gael_front', overworld: 'gael',
    party: (state) => [
      { species: 'STARAPTOR', level: 41 }, { species: 'LUCARIO', level: 41 }, { species: 'GABITE', level: 41 },
      { species: 'ABSOL', level: 42 }, { species: gaelFinalStarter(state), level: 43 },
    ],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 80, money: 60, bgm: 'CombateRival',
    loseText: '…Ya.',
    winText: 'No era esto lo que quería ganar.',
    canLose: true,
  },
};
