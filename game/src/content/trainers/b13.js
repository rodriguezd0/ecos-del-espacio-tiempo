// Entrenadores del Bloque 13 (docs/CAMPANA.md B13; curva de POKEDEX_DISTRIBUCION §7.1, «Interludio 6»: entrenadores
// 44–48, perforación 46–47, doble de Talasa 49–51). Nombres de NPC genéricos (sin canon) salvo Casia y Garrido
// (CAMPANA §5.3). Técnicos con especies de Genesis (§5.1). `money` = base por clase de docs/BALANCE.md
// (content/trainerMoney.js). Los combates de guion (Casia y Garrido, la jefa de perforación) no bloquean la historia.

const GRUNT_BGM = 'EncuentroRocket';
const route = (d) => ({ items: [], ai: 40, ...d });
const genesis = ({ female = false, ...d }) => ({
  sprite: female ? 'genesis_tecnica_front' : 'genesis_tecnico_front',
  overworld: female ? 'genesis_tecnica' : 'genesis_tecnico',
  class: female ? 'Técnica de Genesis' : 'Técnico de Genesis',
  items: ['HYPERPOTION'], ai: 56, money: 40, bgm: GRUNT_BGM,
  ...d,
});

export default {
  // ── Mar del Sur ─────────────────────────────────────────────────────────────────────────────
  b13_nadadora_ines: route({
    name: 'Inés', class: 'Nadadora', sprite: 'anil:nadadora', overworld: 'anil:nadadora', money: 24,
    party: [{ species: 'MANTYKE', level: 44 }, { species: 'FRILLISH', level: 45 }],
    loseText: 'Me he quedado sin aire… y sin Pokémon.',
    winText: '¡Nadar entre boyas entrena más que un gimnasio!',
  }),
  b13_nadador_hugo: route({
    name: 'Hugo', class: 'Nadador', sprite: 'anil:nadador', overworld: 'anil:nadador', money: 24,
    party: [{ species: 'TENTACRUEL', level: 45 }, { species: 'PELIPPER', level: 45 }],
    loseText: 'Vale, vale. Las aguas son de quien las cruza.',
    winText: 'En el mar abierto no hay atajos.',
  }),
  b13_pescador_ruben: route({
    name: 'Rubén', class: 'Pescador', sprite: 'anil:pescador', overworld: 'anil:pescador', money: 24,
    party: [{ species: 'OCTILLERY', level: 45 }, { species: 'CLAWITZER', level: 46 }],
    loseText: 'Ni los peces ni los combates: hoy no es mi día.',
    winText: 'Desde este banco de arena se ve venir todo.',
  }),
  b13_nadadora_paula: route({
    name: 'Paula', class: 'Nadadora', sprite: 'anil:nadadora', overworld: 'anil:nadadora', money: 24,
    party: [{ species: 'LUMINEON', level: 46 }, { species: 'MANTINE', level: 46 }],
    loseText: 'Me vuelvo a la costa antes de que zumbe esa plataforma.',
    winText: '¡El mar es más grande que cualquier plataforma!',
  }),
  b13_marinero_ezequiel: route({
    name: 'Ezequiel', class: 'Marinero', sprite: 'anil:marinero', overworld: 'anil:marinero', money: 24,
    party: [{ species: 'PELIPPER', level: 46 }, { species: 'GYARADOS', level: 46 }],
    loseText: 'Treinta años navegando y me gana alguien a nado.',
    winText: '¡Así se pelea en alta mar!',
  }),
  b13_nadador_ivan: route({
    name: 'Iván', class: 'Nadador', sprite: 'anil:nadador', overworld: 'anil:nadador', money: 24,
    party: [{ species: 'BRUXISH', level: 47 }, { species: 'TENTACRUEL', level: 46 }],
    loseText: 'El agua está fría y yo, derrotado.',
    winText: 'Cerca del volcán el agua quemaba. Ahora ni eso.',
  }),

  // ── Estación Talasa ─────────────────────────────────────────────────────────────────────────
  b13_tecnico_control: genesis({
    name: 'Óscar',
    party: [{ species: 'MAGNETON', level: 45 }, { species: 'SKUNTANK', level: 46 }],
    loseText: 'Control del embarcadero comprometido. Lo anoto y me aparto.',
    winText: 'Acceso denegado. Por protocolo.',
  }),
  b13_tecnica_cubierta: genesis({
    name: 'Leire', female: true,
    party: [{ species: 'BRONZONG', level: 46 }, { species: 'DUOSION', level: 46 }],
    loseText: 'Las lecturas de la cubierta van a salir torcidas.',
    winText: 'Las cubiertas son zona restringida.',
  }),
  b13_investigadora_invernadero: genesis({
    name: 'Amaia', female: true, class: 'Investigadora de Genesis', sprite: 'genesis_tecnica_front', overworld: 'genesis_investigadora',
    party: [{ species: 'DUOSION', level: 46 }, { species: 'DUOSION', level: 47 }, { species: 'SOLOSIS', level: 46 }],
    loseText: 'Cuidado con los tanques. Esas células tardaron meses en dividirse.',
    winText: 'Aquí dentro todo crece según lo previsto.',
  }),
  b13_tecnico_torre: genesis({
    name: 'Rodrigo',
    party: [{ species: 'DRAPION', level: 47 }, { species: 'HOUNDOOM', level: 47 }],
    loseText: 'La directora no va a estar contenta.',
    winText: 'Nadie sube a dirección sin cita.',
  }),
  b13_tecnica_laboratorio: genesis({
    name: 'Nerea', female: true,
    party: [{ species: 'TOXICROAK', level: 47 }, { species: 'MAGNETON', level: 48 }, { species: 'BEHEEYEM', level: 48 }],
    loseText: 'El laboratorio… No debería dejarte pasar. Pero ya no puedo impedirlo.',
    winText: 'El tanque no se toca.',
  }),
  // Dra. Casia Varela y Ulises Garrido (CAMPANA B13 y §5.3). Combate doble con Alerce de aliado.
  b13_casia: {
    name: 'Casia', class: 'Directora de Genesis', sprite: 'casia_front', overworld: 'casia',
    party: [{ species: 'REUNICLUS', level: 50 }, { species: 'MAGNETON', level: 49 }, { species: 'BEHEEYEM', level: 49 }],
    items: ['HYPERPOTION'], ai: 72, money: 80, bgm: 'CombateComandante', canLose: true,
    moneyKind: 'comandante', // Comandantes de Genesis (BALANCE.md); la clase «Directora de Genesis» es solo suya
    loseText: 'Dato registrado. No cambia la conclusión.',
    winText: 'La muestra se queda con nosotros.',
  },
  b13_garrido: {
    name: 'Garrido', class: 'Director de Genesis', sprite: 'garrido_front', overworld: 'garrido',
    party: [{ species: 'CONKELDURR', level: 50 }, { species: 'HOUNDOOM', level: 50 }, { species: 'RHYDON', level: 51 }],
    items: ['HYPERPOTION'], ai: 72, money: 80, bgm: 'CombateComandante', canLose: true,
    moneyKind: 'comandante', // Comandantes de Genesis (BALANCE.md); la clase «Director de Genesis» es solo suya
    loseText: 'Buen trabajo. Lo digo en serio.',
    winText: 'Sin rencor. Es trabajo.',
  },

  // ── Islote Lumbre ───────────────────────────────────────────────────────────────────────────
  b13_dama_hortensia: route({
    name: 'Hortensia', class: 'Dama', sprite: 'anil:dama', overworld: 'anil:dama', money: 48, ai: 56,
    party: [{ species: 'COMFEY', level: 46 }, { species: 'SLURPUFF', level: 47 }],
    loseText: 'Qué elegancia. Los Clefairy estarían de acuerdo.',
    winText: 'Aquí se viene a mirar los cerezos, no a pelear. Aunque…',
  }),

  // ── Volcán Tizón ────────────────────────────────────────────────────────────────────────────
  b13_montanero_blas: route({
    name: 'Blas', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero', money: 32,
    party: [{ species: 'RAPIDASH', level: 46 }, { species: 'MAGCARGO', level: 47 }],
    loseText: 'La ladera está fría. Y yo, también.',
    winText: '¡A estos Pokémon los templó el volcán!',
  }),
  b13_excursionista_carmen: route({
    name: 'Carmen', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f', money: 32,
    party: [{ species: 'FLETCHINDER', level: 45 }, { species: 'HOUNDOUR', level: 46 }, { species: 'TORKOAL', level: 47 }],
    loseText: 'Subí para ver el humo del cráter. Ya ni eso.',
    winText: 'En la ladera del Tizón se sube despacio.',
  }),
  b13_tecnico_perforacion: genesis({
    name: 'Iñaki',
    party: [{ species: 'HOUNDOOM', level: 46 }, { species: 'MAGNETON', level: 46 }],
    loseText: 'La sonda sigue abajo. Sin mí.',
    winText: 'Perforación en curso. Circule.',
  }),
  b13_tecnica_perforacion: genesis({
    name: 'Olaia', female: true,
    party: [{ species: 'SCOLIPEDE', level: 46 }, { species: 'BRONZONG', level: 47 }],
    loseText: 'Las coladas no eran cosa nuestra… o no del todo.',
    winText: 'El volcán es un yacimiento. Nada más.',
  }),
  b13_jefa_perforacion: genesis({
    name: 'Maite', female: true, class: 'Jefa de perforación de Genesis', moneyKind: 'genesis', canLose: true,
    party: [{ species: 'DRAPION', level: 46 }, { species: 'SKUNTANK', level: 46 }, { species: 'HOUNDOOM', level: 47 }],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 64,
    loseText: 'Entendido. No voy a jugarme la sonda en otro combate.',
    winText: 'El magma no tiene dueño. Por eso lo medimos.',
  }),
};
