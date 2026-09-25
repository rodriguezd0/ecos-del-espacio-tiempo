// Textos del Bloque 21 (docs/CAMPANA.md B21, D21–D24). Módulo PURO. Las líneas marcadas «canon» son literales de
// CAMPANA; el resto se redactó respetando las voces fijadas (Zygarde sobrio y telepático; Arceus mide y reconoce al
// jugador, nunca malvado; Alerce sobrio y sin confesión; Vértice cortés e irónico) y está en el informe del bloque
// para que el autor lo revise. Las funciones reciben el estado para respetar el género del protagonista.
import { byGender } from './b21_common.js';

export const JUMP_TEXT = Object.freeze({
  // B20 describe el sello del suelo; CAMPANA B21 §1, el Nodo como «hexágono del suelo»: el hexágono está en su centro.
  node: 'En el centro del sello, un hexágono grabado late despacio, con una luz verde que no es de ninguna antorcha.',
  noJump: 'El hexágono late despacio, pero no pasa nada.',
  warn: 'No podrás volver hasta terminar lo que empiece allí. Prepárate cuanto quieras.', // canon
  ask: '¿Saltar a Columna Lanza?',
  wait: 'El nodo espera.', // canon (CAMPANA: «El nodo espera»)
  ride: 'Súbete. Esta forma sabe correr por los caminos viejos.', // canon
  form: 'Zygarde se deshace en células y se recompone, ligero: la \\c[3]Forma 10 %\\c[0].',
});

export const ARRIVAL_TEXT = Object.freeze({
  place: 'Sobre las nubes, el cielo no es azul: arde en colores que no tienen nombre.',
  form: 'Las células se recogen. Zygarde vuelve a su \\c[3]Forma Completa\\c[0].',
  zygarde: 'Arriba. Duerme.',
  // El centro del hexágono (pieza pilar_camara_nucleo) se ve verde: brilla, pero no responde.
  noReturn: 'El hexágono del suelo aún brilla, pero no responde. No hay vuelta hasta terminar.',
});

export const ZYGARDE_TEXT = Object.freeze({
  ask: 'Antes de despertarlo… llévame contigo. No como parte del camino. Como parte del combate.', // canon
  choices: Object.freeze(['Sí', 'Todavía no']), // canon
  later: 'Esperaré.',
  ball: '\\PN saca una Honor Ball. No la lanza: la tiende en la palma de la mano.',
  touch: 'Zygarde se acerca y la toca.',
  joined: '¡Zygarde se ha unido a tu equipo!',
  after: 'Aunque algún día me guardes, seguiré contigo en el camino.',
  full: 'Tu equipo está completo. El Arca de Zygarde se abre: hay que dejarle sitio.',
  pick: '¿A quién envías al PC?',
  mustPick: 'El Arca sigue abierta. Elige a quién enviar al PC.',
  sent: (name, box) => `${name} se ha enviado al PC (${box}).`,
  noRoom: 'No queda sitio en ninguna caja del PC. Libera espacio y vuelve a hablar con Zygarde.',
  reorder: 'Podrás ordenar tu equipo desde el menú cuando quieras.',
  beforeFlute: 'Zygarde se interpone con suavidad entre tú y Arceus.',
});

// Sin «altar» (DESCARTADO en la biblia, CAMPANA: «no reintroduce… altar»): Arceus duerme en la cima, sobre el gran
// hexágono grabado en la piedra.
export const FLUTE_TEXT = Object.freeze({
  sleeping: 'Arceus duerme en lo alto de la Columna, sobre el gran hexágono grabado. El aire vibra a su alrededor, como una cuerda tensa.',
  ask: '¿Tocar la Flauta Azur?',
  noFlute: 'Sin la Flauta Azur no hay nada que despierte al que duerme.',
  play: '\\PN toca la Flauta Azur.',
  felt: 'La melodía resuena en las piedras. Los zócalos de las Tablillas se encienden uno a uno.',
  wake: Object.freeze([
    '…Dormía. Y mientras dormía, el mundo tuvo que sostenerse solo.',
    'No despierto para quien me llama. Despierto para medir lo que se hizo mientras dormía.',
    'Te conozco. Tus pasos están en cada piedra que volvió a su sitio.',
    'Mediré.',
  ]),
  awake: 'Arceus te observa, inmóvil. Sigue esperando tu respuesta.',
  vigil: 'Arceus vigila en silencio desde lo alto de la Columna.',
  resume: '¿Continuar?',
});

/** Preguntas de cada fase (canon, D22) y nombres. */
export const PHASE_TEXT = Object.freeze([
  Object.freeze({ plate: 'Terrax', type: 'Tierra', question: '¿Sostienes lo que reparaste?' }),
  Object.freeze({ plate: 'Terror', type: 'Fantasma', question: '¿Miras la sombra sin volverte ella?' }),
  Object.freeze({ plate: 'Legendaria', type: 'Normal', question: '¿Qué eres cuando no queda nada que ganar?' }),
]);

export const BATTLE_TEXT = Object.freeze({
  question: (q) => `Arceus: «${q}»`,
  drop: (plate) => `¡Arceus ha soltado la Tabla ${plate}!`,
  change: (type) => `¡Arceus se niega a caer! Su cuerpo toma el tipo ${type}.`,
  boon: '«La Tabla liberada devuelve fuerza a quien la liberó.»', // canon
  held: (plate) => `Arceus aún sostiene la Tabla ${plate}.`, // canon («Arceus aún sostiene la Tabla X»)
  legend: '¡Arceus ha soltado la Tabla Legendaria!',
  catchable: 'Arceus ya no se resiste: ahora se puede capturar.',
  lost: 'Arceus espera. ¿Qué quieres hacer?',
  options: Object.freeze(['Reintentar fase', 'Retirarse']), // canon
  retry: 'Tu equipo y tus objetos vuelven a estar como al empezar la fase.',
  retreat: 'Te retiras a la antecámara. Tu equipo se ha recuperado.',
  retreatWait: (type) => `Arceus seguirá en lo alto. Cuando vuelvas, retomará la medida en la fase ${type}.`,
  error: 'Algo ha fallado en el combate. Tu equipo vuelve a estar como al empezar la fase.',
});

export const RESOLUTION_TEXT = Object.freeze({
  fainted: 'Arceus se detiene y baja la cabeza, como quien ha terminado de medir.',
  caught: 'La Poké Ball se ha quedado quieta. Dentro, algo inmenso descansa.',
  tablets: 'Las dieciocho Tablillas brillan a la vez. Los zócalos de la Columna responden, uno tras otro.',
  confirm: (s) => byGender(s,
    'Respondiste a la llamada. Eres aquel del que hablaban las piedras.', // canon
    'Respondiste a la llamada. Eres aquella de la que hablaban las piedras.'), // canon, en femenino
  axis: {
    DIALGA: 'Una luz rosada recorre la Columna. El espacio que quedó sin atar vuelve a su sitio.',
    PALKIA: 'Una luz azul recorre la Columna. El tiempo que quedó sin atar vuelve a su cauce.',
    none: 'Una luz recorre la Columna. Lo que quedó sin atar vuelve a su sitio.',
  },
  sky: 'La aurora se apaga. La luna vuelve a su tamaño. El cielo de Axis recupera su ritmo.',
  stays: 'Arceus se tiende otra vez sobre el gran hexágono. Esta vez no duerme: vigila.',
  zygarde: 'Está hecho.',
  home: 'Volvamos. Esta forma sabe correr por los caminos viejos.', // canon (la línea del Salto)
});

export const EPILOGUE_TEXT = Object.freeze({
  labyrinth: 'Aquí te esperé. Aquí empezó todo.', // eco de B01 §4.6: «Te he estado esperando.»
  olmedo: Object.freeze([
    'Otra vez tú.', // canon
    '…Anda, pasa. Tu madre lleva toda la tarde en la puerta.',
  ]),
  mom: Object.freeze([
    '¡\\PN! ¡Has vuelto!',
    (s) => `Hace un rato el cielo se ha quedado quieto de golpe, y he sabido que eras tú. No me preguntes cómo.`,
    (s) => `Déjame que te mire… Estás ${byGender(s, 'entero', 'entera')}. Eso es lo que importa.`,
  ]),
  momAlerce: 'Mira quién viene por ahí.',
  alerce: Object.freeze([
    '\\PN.',
    'Me alegro de verte de vuelta.',
    'Toma.',
  ]),
  alerceKey: 'Hay cosas ahí que debería haber enseñado hace tiempo. Cuando quieras.', // canon
  alerceBye: 'Alerce asiente y vuelve despacio hacia el laboratorio.',
  montage: 'Mientras tanto, en los Pilares…',
  momGael: Object.freeze([
    'Por cierto… la casa de Gael tiene la puerta abierta desde esta mañana. No lo he visto salir.',
    'Te espero en casa. Hay algo en las noticias que deberías ver.',
  ]),
  momHome: '¿Has pasado por casa de Gael? Tenía la puerta abierta.',
  gaelHouse: 'La casa de Gael está en silencio. La puerta estaba abierta, pero no hay nadie.',
  gaelTable: 'Junto a la mesa hay una nota y un Huevo.',
  gaelNote: '«Para que tu Pokédex no tenga huecos por mi culpa.»', // canon
  gaelNoteAgain: 'La nota de Gael: «Para que tu Pokédex no tenga huecos por mi culpa.»',
  eggFull: 'Tu equipo está completo. El Huevo se queda junto a la mesa. Vuelve a por él cuando tengas sitio.',
  eggNow: 'El Huevo sigue junto a la mesa, esperándote.',
  tvMom: 'Ven, corre. Mira lo que están dando.',
  tv: Object.freeze([
    'Última hora: el Dr. Vértice ha abandonado Axis en un carguero con bandera extranjera.', // canon
    // Casia y Garrido, los dos directores, ya están detenidos (B18); quedan restos de la organización (CAMPANA §5.4).
    'Los dos directores de Genesis siguen detenidos. La Policía Regional busca al personal que queda en la región.',
  ]),
  shipCaption: 'Lejos de la costa…',
  vertice: Object.freeze([
    'Qué curioso. Juraría que lo llevaba encima.',
    'Bueno. Las llaves se pueden volver a fabricar.',
  ]),
  momAfterTv: Object.freeze([
    'Ese señor ya no es asunto nuestro.',
    (s) => `Anda, sube a descansar. Te lo has ganado, ${byGender(s, 'hijo', 'hija')}.`,
  ]),
  wake: 'Entra la luz de la mañana.',
  zygardeStays: 'Sigo entero. Nada me obliga ya. Me quedo.',
  formNote: 'Zygarde conserva la Forma Completa. El Arca solo cambia sus formas; el vínculo no.',
  postgame: 'Axis está en calma. Aún quedan lugares y leyendas por descubrir.',
  save: '¿Quieres guardar la partida?',
  nodeAwake: 'El hexágono late despacio, como si esperara.',
  nodeAsk: '¿Saltar al nodo del Laberinto?',
});

/** Rótulos del montaje de los Guardianes (CAMPANA B21 §6). */
export const MONTAGE_CAPTIONS = Object.freeze({
  casilda: 'Casilda · Pilar del Umbral',
  leandro: 'Leandro · Pilar de la Corriente',
  abril: 'Abril · Pilar del Impulso',
  fermin: 'Fermín · Pilar de la Masa',
  olvido: 'Olvido · Pilar de la Memoria',
  clefairy: 'El Círculo del Jardín · Villa Alba',
});

/** Estelas de Columna Lanza (escritura Unown; se traducen con la Clave Glífica). Canon: TABLILLAS §4.3. */
export const STELE_TEXT = Object.freeze({
  chronicleTitle: 'Estela de la antecámara',
  chronicle: 'Antes de cerrar los ojos, el que duerme nos mostró lo que vendría, y lo escribimos en los Pilares.', // Crónica XIV
  arceus: Object.freeze({ EARTHPLATE: 'Lo que sostiene.', SPOOKYPLATE: 'Lo que acecha.', LEGENDPLATE: 'Lo que es.' }), // Crónica
  socketLit: (name) => `Un zócalo hexagonal. La ${name} resuena en tu Mochila y el zócalo brilla.`,
  socketDark: 'Un zócalo hexagonal, apagado. Tiene grabada una inscripción en escritura Unown.',
  spring: 'El agua del manantial devuelve las fuerzas a tu equipo.',
  springLook: 'Un manantial de piedra. El agua sube sola, sin ruido.',
});
