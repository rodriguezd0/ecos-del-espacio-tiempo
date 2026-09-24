// Entrenadores del Bloque 9a (docs/CAMPANA.md B09 parte A; curva de POKEDEX_DISTRIBUCION §7.1: entrenadores 31–36,
// Gael 31–34, restauradores 35–36). Dinero base según docs/BALANCE.md. Especies de las tablas de la Ruta 7, del
// Parque de las Eras y de la Ruta 14 (§7.3); los «restauradores» de la Fundación Meridiano llevan el equipo de los
// técnicos de Genesis (§5.1). Nombres de NPC genéricos sin canon.
import { gaelStarterSpecies } from './b01_town.js';
import { gaelEvolvedStarter } from '../events/b06_common.js';

const GRUNT_BGM = 'EncuentroRocket';

const route = (name, cls, alias, party, money, loseText, winText, extra = {}) => ({
  name, class: cls, sprite: `anil:${alias}`, overworld: `anil:${alias}`, party, items: [], ai: 32, money, loseText, winText, ...extra,
});

export default {
  // ── Ruta 7 (31–35) ───────────────────────────────────────────────────────────────────────────
  b09a_r7_excursionista_raul: route('Raúl', 'Excursionista', 'excursionista',
    [{ species: 'HERDIER', level: 32 }, { species: 'MUDSDALE', level: 33 }], 32,
    'Llevo toda la mañana subiendo y bajando el valle. Y ahora esto.', 'El valle es largo, pero las piernas aguantan.'),
  b09a_r7_motorista_victor: route('Víctor', 'Motorista', 'motorista',
    [{ species: 'GLAMEOW', level: 32 }, { species: 'STARAVIA', level: 33 }], 32,
    'Frenazo en seco. Me has ganado limpiamente.', 'Ni el camino de tierra me frena.', { moneyKind: 'campo' }), // como los ciclistas
  b09a_r7_ornitologo_hugo: route('Hugo', 'Ornitólogo', 'ornitologo',
    [{ species: 'STARAVIA', level: 33 }, { species: 'HOOTHOOT', level: 32 }, { species: 'STARAVIA', level: 33 }], 32,
    'Los Staravia del valle vuelan hacia el oeste. Yo, a casa.', '¡Mira cómo vuelan!'),
  b09a_r7_minera_carla: route('Carla', 'Minera', 'minera',
    [{ species: 'NACLSTACK', level: 33 }, { species: 'GRAVELER', level: 34 }], 32,
    'Como picar roca dura. Me has dejado los brazos temblando.', 'En Estrato se trabaja duro. Y se combate igual.'),
  b09a_r7_veterana_ines: route('Inés', 'Veterana', 'veterana',
    [{ species: 'SKUNTANK', level: 34 }, { species: 'STUFFUL', level: 33 }, { species: 'PONYTA', level: 34 }], 48,
    'Buen combate. Hacía años que el valle no veía uno así.', 'La experiencia pesa. Ya lo aprenderás.'),

  // ── Ciudad Lúmina (Parque de las Eras, 32–34) ─────────────────────────────────────────────────
  b09a_lum_estudiante_ana: route('Ana', 'Estudiante', 'estudiante',
    [{ species: 'RALTS', level: 32 }, { species: 'MIMEJR', level: 33 }], 16,
    'Lo apunto en la libreta: «perder con elegancia».', 'Esto no venía en el temario.'),
  b09a_lum_dama_carmen: route('Carmen', 'Dama', 'dama',
    [{ species: 'KIRLIA', level: 34 }, { species: 'PICHU', level: 32 }], 48,
    'Qué descortés por mi parte: debí dejarte ganar antes.', 'La elegancia también se entrena.'),

  // ── Ruta 14 y Reserva del Delta (32–36) ──────────────────────────────────────────────────────
  b09a_r14_bichera_lola: route('Lola', 'Bichera', 'bichera',
    [{ species: 'YANMA', level: 33 }, { species: 'RIBOMBEE', level: 34 }], 16,
    'Los bichos del delta están nerviosos. Como yo.', '¡Mis bichos zumban de alegría!'),
  b09a_r14_pescador_andres: route('Andrés', 'Pescador', 'pescador',
    [{ species: 'BARBOACH', level: 33 }, { species: 'GOLDEEN', level: 33 }, { species: 'BARBOACH', level: 34 }], 24,
    'Hoy tampoco pica. Ni el agua ni el combate.', 'El delta da peces y combates.'),
  b09a_r14_ornitologa_sara: route('Sara', 'Fotógrafa', 'fotografa',
    [{ species: 'CHATOT', level: 34 }, { species: 'TROPIUS', level: 35 }], 32,
    'Se me ha movido la foto. Y el combate.', '¡Quieto! Así, perfecto.'),
  b09a_r14_dama_elena: route('Elena', 'Dama', 'dama',
    [{ species: 'COMFEY', level: 35 }, { species: 'TANGELA', level: 35 }], 48,
    'Las flores del delta se merecían un combate así.', 'Paseo por la Reserva cada mañana. Hoy no puedo.'),
  b09a_r14_excursionista_ruben: route('Rubén', 'Excursionista', 'excursionista',
    [{ species: 'SCYTHER', level: 35 }, { species: 'CARNIVINE', level: 34 }, { species: 'GIRAFARIG', level: 35 }], 32,
    'Vale, me rindo. El delta te sienta bien.', 'Aquí abajo hace calor hasta para combatir.'),

  // ── Restauradores de la Fundación Meridiano (Genesis, T06: nivel 35–36, combate doble del muelle) ──
  b09a_restaurador_bruno: {
    name: 'Bruno', class: 'Restaurador', sprite: 'genesis_tecnico_front', overworld: 'genesis_investigador',
    party: [{ species: 'BRONZOR', level: 35 }, { species: 'MAGNETON', level: 36 }],
    items: ['SUPERPOTION'], ai: 48, money: 40, moneyKind: 'genesis', bgm: GRUNT_BGM,
    loseText: 'Esto no estaba en el protocolo de traslado.',
    winText: 'La pieza viaja con nosotros. Firmado y sellado.',
  },
  b09a_restauradora_noemi: {
    name: 'Noemí', class: 'Restauradora', sprite: 'genesis_tecnica_front', overworld: 'genesis_investigadora',
    party: [{ species: 'ELGYEM', level: 35 }, { species: 'DUOSION', level: 35 }, { species: 'SKUNTANK', level: 36 }],
    items: ['SUPERPOTION'], ai: 48, money: 40, moneyKind: 'genesis', bgm: GRUNT_BGM,
    loseText: 'Anotado. La curadora tenía ayuda.',
    winText: 'Un museo no necesita saber dónde restauramos.',
  },

  // ── Gael, combate B3 en la escalinata del museo (CAMPANA B09 y §6.3; continúa aunque se pierda, §2.6) ──
  gael_3: {
    name: 'Gael',
    class: 'Rival',
    sprite: 'gael_front',
    overworld: 'gael',
    party: (state) => [
      { species: 'STARAVIA', level: 32 },
      { species: 'LUCARIO', level: 32 },
      { species: 'GABITE', level: 31 },
      { species: 'ABSOL', level: 32 },
      { species: gaelEvolvedStarter(state) || gaelStarterSpecies(state), level: 34 },
    ],
    items: ['SUPERPOTION', 'SUPERPOTION'],
    ai: 64,
    money: 60,
    bgm: 'CombateRival',
    // El reto lo dice la escena de la escalinata (content/events/b09a_gael.js).
    loseText: '…Otra vez. Bien.',
    winText: 'Te lo dije. No he venido a mirar.',
    canLose: true,
  },
};
