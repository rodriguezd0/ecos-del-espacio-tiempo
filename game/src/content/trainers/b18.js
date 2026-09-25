// Entrenadores del Bloque 18 — Pilar de la Convergencia (docs/CAMPANA.md B18 y §5.2–5.3; curva de
// POKEDEX_DISTRIBUCION §7.1, «P9»: entrenadores 60–62; Casia 61–62, Garrido 61–63, Vértice 64–67). `money` = base por
// clase de docs/BALANCE.md (content/trainerMoney.js): técnicos 40, comandantes 80, Vértice 120. Los combates de Casia,
// Garrido y Vértice son de guion (helper común bossBattle: perder no es derrota general). Técnicos con especies de
// Genesis (§5.1). Nombres de los técnicos: genéricos (sin canon).

const genesis = ({ female = false, ...d }) => ({
  sprite: female ? 'genesis_tecnica_front' : 'genesis_tecnico_front',
  overworld: female ? 'genesis_tecnica' : 'genesis_tecnico',
  class: female ? 'Técnica de Genesis' : 'Técnico de Genesis',
  items: ['HYPERPOTION'], ai: 64, money: 40, bgm: 'EncuentroRocket',
  ...d,
});

export default {
  // ── Plataforma del Cruce: técnicos del Resonador (normales, con visión) ─────────────────────────
  b18_tecnico_resonador: genesis({
    name: 'Braulio',
    party: [{ species: 'MAGNEZONE', level: 60 }, { species: 'BRONZONG', level: 61 }],
    loseText: 'Las lecturas del Resonador… se disparan. No es cosa tuya. O no solo tuya.',
    winText: 'Perímetro del Resonador. Nadie pasa sin acreditación.',
  }),
  b18_tecnica_cadena: genesis({
    name: 'Irene', female: true,
    party: [{ species: 'PORYGON2', level: 60 }, { species: 'DRAPION', level: 60 }, { species: 'DUOSION', level: 61 }],
    loseText: 'La Cadena Sintética aguanta la tensión. Yo, no tanto.',
    winText: 'Tensión estable. Por ahora.',
  }),

  // ── Dra. Casia Varela (CAMPANA §5.3: P9 Reuniclus 62, Magnezone 61, Beheeyem 61, Hatterene 62) ─────────────
  b18_casia: {
    name: 'Casia', class: 'Directora de Genesis', sprite: 'casia_front', overworld: 'casia',
    party: [
      { species: 'REUNICLUS', level: 62 }, { species: 'MAGNEZONE', level: 61 },
      { species: 'BEHEEYEM', level: 61 }, { species: 'HATTERENE', level: 62 },
    ],
    items: ['HYPERPOTION', 'FULLHEAL'], ai: 80, money: 80, bgm: 'CombateComandante', canLose: true,
    moneyKind: 'comandante', // Comandantes de Genesis (BALANCE.md); la clase «Directora de Genesis» es solo suya
    loseText: 'Anomalía confirmada. Eso también es un dato.',
    winText: 'Los datos no se equivocan. Las personas, a veces.',
  },

  // ── Ulises Garrido (CAMPANA §5.3: P9 Conkeldurr 62, Rhyperior 62, Tinkaton 61, Houndoom 63 Mega) ─────────────
  b18_garrido: {
    name: 'Garrido', class: 'Director de Genesis', sprite: 'garrido_front', overworld: 'garrido',
    party: [
      { species: 'CONKELDURR', level: 62 }, { species: 'RHYPERIOR', level: 62 },
      { species: 'TINKATON', level: 61 }, { species: 'HOUNDOOM', level: 63, item: 'HOUNDOOMINITE' },
    ],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 80, money: 80, bgm: 'CombateComandante', canLose: true, megaRing: true,
    moneyKind: 'comandante', // Comandantes de Genesis (BALANCE.md); la clase «Director de Genesis» es solo suya
    loseText: 'Buena obra. Lo digo como capataz.',
    winText: 'Sin rencor. Aquí se trabaja.',
  },

  // ── Dr. Aurelio Vértice (CAMPANA §5.2: Magnezone 64, Porygon-Z 65, Hydreigon 65, Metagross 66, Alakazam 67 Mega;
  //    BGM CombateGiovanniFinal) ─────────────────────────────────────────────────────────────────────────────
  b18_vertice: {
    name: 'Vértice', class: 'Líder Supremo de Genesis', sprite: 'vertice_front', overworld: 'vertice_lider',
    party: [
      { species: 'MAGNEZONE', level: 64 }, { species: 'PORYGONZ', level: 65 }, { species: 'HYDREIGON', level: 65 },
      { species: 'METAGROSS', level: 66 }, { species: 'ALAKAZAM', level: 67, item: 'ALAKAZITE' },
    ],
    items: ['FULLRESTORE', 'FULLRESTORE'], ai: 100, money: 120, bgm: 'CombateGiovanniFinal', canLose: true, megaRing: true,
    moneyKind: 'vertice',
    loseText: 'Admirable. Una llave que no encaja sigue siendo una llave.',
    winText: 'Una cerradura no discute con la llave. Tú tampoco deberías.',
  },
};
