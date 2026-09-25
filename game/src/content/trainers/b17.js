// Entrenadores del Bloque 17 — Interludio 8: Axis en eclipse (docs/CAMPANA.md B17; §5.1 técnicos de Genesis: Magnemite/
// Magneton, Bronzor, Solosis/Duosion, Elgyem, Porygon, Stunky, Skorupi, Houndour, Croagunk, Venipede, al nivel del
// tramo; POKEDEX_DISTRIBUCION §7.1: entrenadores 58–62, torres del Anillo 58–60; dinero base de docs/BALANCE.md).
// Especies del inventario de Axis. Formato en content/trainers/index.js.

const GRUNT_BGM = 'EncuentroRocket';
const tech = (name, klass, sprite, party, loseText, winText) => ({
  name, class: klass, sprite: `${sprite}_front`, overworld: sprite, party, ai: 56, money: 40, bgm: GRUNT_BGM, loseText, winText,
});

export default {
  // ── Torres del Anillo de Captación: dos técnicos por torre (combate doble de guion, 58–60) ──────────────────────
  b17_tecnico_viento: tech('Ismael', 'Técnico de Genesis', 'genesis_tecnico',
    [{ species: 'MAGNETON', level: 58 }, { species: 'BRONZONG', level: 59 }],
    'Lectura del rotor: cero. Así constará.', 'Captación estable. Buenos días.'),
  b17_tecnica_viento: tech('Lorena', 'Técnica de Genesis', 'genesis_tecnica',
    [{ species: 'REUNICLUS', level: 58 }, { species: 'SKUNTANK', level: 59 }],
    'No estaba en el protocolo que alguien caminara sobre la Sima.', 'El viento es de quien lo mide.'),
  b17_tecnico_tormenta: tech('Tobías', 'Técnico de Genesis', 'genesis_tecnico',
    [{ species: 'PORYGON2', level: 59 }, { species: 'MAGNETON', level: 59 }],
    'Descarga fuera de rango. La mía, en concreto.', 'Tormenta canalizada. Siga su camino.'),
  b17_tecnica_tormenta: tech('Sara', 'Técnica de Genesis', 'genesis_tecnica',
    [{ species: 'DRAPION', level: 59 }, { species: 'TOXICROAK', level: 60 }],
    'La bobina aguanta más que yo, por lo visto.', 'Rayos en su sitio. Usted también.'),
  b17_tecnico_temblor: tech('Rubén', 'Técnico de Genesis', 'genesis_tecnico',
    [{ species: 'BEHEEYEM', level: 60 }, { species: 'BRONZONG', level: 60 }],
    'El pistón seguía el compás. Usted no.', 'Sin incidencias. Como debe ser.'),
  b17_tecnica_temblor: tech('Elvira', 'Técnica de Genesis', 'genesis_tecnica',
    [{ species: 'HOUNDOOM', level: 60 }, { species: 'SCOLIPEDE', level: 59 }],
    'Anoto: temblor interrumpido por causas ajenas.', 'La roca obedece. Tome nota.'),

  // ── Senda del Mirador (tras el P8: curiosos que suben a ver cómo se ensancha la Sima) ──────────────────────────────
  b17_montanero_oscar: {
    name: 'Óscar', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'GOLEM', level: 59 }, { species: 'STEELIX', level: 60 }],
    ai: 48, money: 32,
    loseText: 'La Sima se ha comido medio metro de borde desde ayer. Y tú, mi equipo entero.',
    winText: 'Con los pies firmes, hasta el borde da menos miedo.',
  },
  b17_veterana_amparo: {
    name: 'Amparo', class: 'Veterana', sprite: 'anil:veterana', overworld: 'anil:veterana',
    party: [{ species: 'ABSOL', level: 60 }, { species: 'TOGEKISS', level: 61 }],
    ai: 64, money: 48,
    loseText: 'Mi Absol no para de mirar la Sima. Ahora entiendo por qué te mira a ti también.',
    winText: 'He visto el cielo raro muchas veces. Nunca tanto.',
  },

  // ── Mirador Sur (tras el P8, fuera de la valla del Consorcio) ─────────────────────────────────────────────────────
  b17_fotografa_marcela: {
    name: 'Marcela', class: 'Fotógrafa', sprite: 'anil:fotografa', overworld: 'anil:fotografa',
    party: [{ species: 'NOCTOWL', level: 59 }, { species: 'STARAPTOR', level: 59 }, { species: 'SIGILYPH', level: 60 }],
    ai: 48, money: 32,
    loseText: 'Venía a fotografiar la luna. Me llevo una foto tuya ganando.',
    winText: 'Con esta luz, todo sale bien. Hasta los combates.',
  },
  b17_aspirante_ines: {
    name: 'Inés', class: 'Aspirante', sprite: 'anil:aspirante_f', overworld: 'anil:aspirante_f',
    party: [{ species: 'GALLADE', level: 61 }, { species: 'TINKATON', level: 62 }],
    ai: 64, money: 48,
    loseText: 'Me habían dicho que el Mirador estaba cerrado. Tú tampoco te has creído el cartel.',
    winText: 'Dicen que al otro lado de la valla montan algo enorme. Yo solo quería ver la Sima.',
  },
};
