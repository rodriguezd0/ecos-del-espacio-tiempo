// Entrenadores del Bloque 3 (docs/CAMPANA.md B03; curva de POKEDEX_DISTRIBUCION §7.1: entrenadores 7–11, Gael
// 8–10). Nombres de NPC genéricos sin canon (como en B01); especies de las tablas de la Ruta 2 y de Caudal.
// Gael B2 (§6.3): Starly 8, Riolu 9, inicial 10; continúa la historia aunque se pierda (§2.6).
// Curva rebajada a petición del autor (DECISIONES X35 «DECIDIDO (autor, 25-09-2026)»: antes entrenadores 9–13 y Gael
// Starly 12, Riolu 12, inicial 14, «es mucha diferencia» con el inicial recién elegido).
// `money` = base por clase de docs/BALANCE.md (content/trainerMoney.js).
import { gaelStarterSpecies } from './b01_town.js';

const route = (name, cls, alias, party, money, intro, loseText, winText) => ({
  name, class: cls, sprite: `anil:${alias}`, overworld: `anil:${alias}`, party, items: [], ai: 20, money, intro, loseText, winText,
});

export default {
  // ── Ruta 2 ─────────────────────────────────────────────────────────────────────────────────
  r2_ornitologo_ciro: route('Ciro', 'Ornitólogo', 'ornitologo',
    [{ species: 'PIDOVE', level: 7 }, { species: 'FLETCHLING', level: 8 }], 32,
    '¡Silencio! Estaba contando Pidove… Bueno, ya los has espantado. ¡Combate!',
    'Se me han volado todos.', 'Mis aves vuelan más alto que las tuyas.'),
  r2_aspirante_irene: route('Irene', 'Aspirante', 'aspirante_f',
    [{ species: 'BUNEARY', level: 8 }, { species: 'PAWMI', level: 9 }], 48,
    'Voy camino de Caudal para entrenar junto al río. Tú primero.',
    'Vale, vale. Me quedo un rato más en la pradera.', '¡Ja! El entrenamiento funciona.'),
  r2_pescador_tomas: route('Tomás', 'Pescador', 'pescador',
    [{ species: 'MAGIKARP', level: 8 }, { species: 'GOLDEEN', level: 9 }, { species: 'MAGIKARP', level: 8 }], 24,
    '¡Ha picado algo! Ah, no: eras tú. Ya que estás…',
    'Hoy no pica nada. Ni en el agua ni fuera.', 'El estanque me da suerte.'),
  r2_excursionista_olga: route('Olga', 'Excursionista', 'excursionista_f',
    [{ species: 'WOOLOO', level: 9 }, { species: 'RALTS', level: 9 }], 32,
    'Desde el alto se ve Caudal entera. Antes, un combate para estirar las piernas.',
    'Me has dejado sin aliento.', 'Buen paseo, buen combate.'),
  r2_joven_adrian: route('Adrián', 'Joven', 'joven',
    [{ species: 'NICKIT', level: 9 }, { species: 'PIDOVE', level: 9 }, { species: 'BUNEARY', level: 10 }], 16,
    '¡Te he visto venir desde el puente! Nadie pasa sin combatir.',
    'Bueno… pasa, pasa.', '¡Nadie pasa! Te lo dije.'),

  // ── Ciudad Caudal ──────────────────────────────────────────────────────────────────────────
  cc_pescadora_luz: route('Luz', 'Pescadora', 'pescadora',
    [{ species: 'GOLDEEN', level: 10 }, { species: 'BARBOACH', level: 11 }], 24,
    'El río está raro, pero mis Pokémon no. ¿Lo comprobamos?',
    'Parece que el río no es lo único que va a la deriva.', 'Los canales nos hacen fuertes.'),
  cc_marinero_bruno: route('Bruno', 'Marinero', 'marinero',
    [{ species: 'BUIZEL', level: 10 }, { species: 'WOOLOO', level: 10 }, { species: 'PSYDUCK', level: 11 }], 24,
    '¡Eh! Llevo tres días sin poder sacar la barca. Necesito desfogarme.',
    'Uf. Mejor que remar contra corriente.', 'Esto sí que es navegar.'),

  // ── Gael, combate B2 en el puente de entrada (CAMPANA B03 y §6.2–6.3) ─────────────────────
  gael_2: {
    name: 'Gael',
    class: 'Rival',
    sprite: 'gael_front',
    overworld: 'gael',
    party: (state) => [
      { species: 'STARLY', level: 8 },
      { species: 'RIOLU', level: 9 },
      { species: gaelStarterSpecies(state), level: 10 },
    ],
    items: [],
    ai: 40,
    money: 60,
    bgm: 'battle_rival',
    // El reto lo dice la escena del puente (content/events/b03_caudal_gael.js).
    loseText: '…Ya está. Otra vez tú.',
    winText: 'Esta vez no. Tómalo como un aviso.',
    canLose: true,
  },
};
