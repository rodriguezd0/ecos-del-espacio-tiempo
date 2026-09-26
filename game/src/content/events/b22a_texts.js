// Textos del Bloque 22a (docs/CAMPANA.md B22). Módulo PURO. Las líneas marcadas «canon» son literales de CAMPANA,
// de la biblia o de content/zygarde/texts.js; el resto se redactó respetando las voces fijadas (Zygarde sobrio y
// telepático; los legendarios miden y reconocen al jugador, nunca bufonescos) y va en el informe del bloque para que el
// autor lo revise (DECIDIDO-DEV). Las funciones reciben el estado para respetar el género del protagonista.
import { byGender } from './b22a_common.js';

/** Anclaje espacial (X16; biblia §8: «fijar una orientación inestable»). */
export const ANCHOR_TEXT = Object.freeze({
  tutorial: Object.freeze([
    'Aquí el espacio se tuerce.',
    'Puedo sostener lo que se tuerce.', // canon (MEMORY_LINES.anchor)
    'No abro caminos. Solo dejo quieto lo que no para de girar, tal como esté cuando me lo pidas.',
  ]),
  cant: 'Aquí el espacio se tuerce. Todavía no puedo sostenerlo.',
});

/** Senda del Lazo (B15) con el nudo del tramo alto. */
export const SENDA_TEXT = Object.freeze({
  knot: 'Sobre el tramo alto, el aire se retuerce como un nudo de luz. La senda entra en él… y vuelve a salir por abajo.',
  knotZygarde: 'Este es el nudo que no podía deshacer. Deshacerlo, no. Pero ahora puedo sujetarlo.',
  ask: '¿Pedirle a Zygarde que ancle el nudo?',
  anchored: 'El nudo se queda quieto, sujeto por una red de hexágonos verdes. Por encima, la senda sigue subiendo entre las nubes.',
  anchoredZygarde: 'Ya no se dobla. Sube.',
  after: 'El nudo sigue fijo, sujeto por una red de hexágonos verdes. La senda sube.',
  up: 'La senda deja atrás el mirador y sube por encima de las nubes…',
});

/** Cumbre Azur (la Senda del Lazo abierta). */
export const CUMBRE_TEXT = Object.freeze({
  arrival: 'Por encima del mar de nubes, la ladera se convierte en una cresta de roca y nieve. Arriba, la columna de luz.',
  arrivalZygarde: 'Aquí arriba nadie ha pisado en mucho tiempo. Solo los que levantaron estas piedras.',
  stele: 'Una estela partida. El viento ha borrado casi todos los glifos; solo se distingue un hexágono.',
  monolith: 'Un monolito de los Custodios, medio enterrado en la nieve.',
  gate: 'Un dintel de piedra antigua bajo la columna de luz. Al otro lado, unos peldaños de nube suben hacia Columna Lanza.',
  gateAsk: '¿Subir a Columna Lanza?',
  down: 'La cresta baja hacia el mirador de la Senda del Lazo.',
  curiosa: Object.freeze([
    '¡Lo has abierto! Llevaba días viendo esa luz desde abajo, y hoy la senda ha seguido subiendo.',
    'No me atrevo a pasar de ese dintel. Hay cosas que se miran mejor desde aquí.',
  ]),
  curiosaAgain: 'Desde aquí se ve toda Axis. Hasta el mar del sur, cuando se aparta la bruma.',
});

/** Columna Lanza en el postgame (B21). */
export const COLUMNA_TEXT = Object.freeze({
  onFoot: 'Volvemos arriba. Esta vez, a pie.',
  stairs: 'Unos peldaños de nube bajan por el borde de la Columna hacia la Cumbre Azur.',
  stairsAsk: '¿Bajar hacia la Senda del Lazo?',
  platformCold: 'Un hexágono grabado en el borde de la cima. Está frío.',
  platformNoOrb: 'Un hexágono grabado en el borde de la cima. Parece esperar algo que ya no está aquí.',
  platformNoChosen: (chosen, orb) => `La ${orb} tiembla en tu Mochila, pero el hexágono no responde. Le falta ${chosen}.`,
  platformHintCaught: (chosen) => `${chosen} tiene que estar en tu equipo. El orbe solo responde si los dos vuelven a encontrarse.`,
  platformHintCruce: (chosen) => `Si aún no has capturado a ${chosen}, sigue en la Cámara del Cruce. Descansa y volverá junto al núcleo.`,
  summon: (chosen, orb) => `${chosen} se agita en su Poké Ball. La ${orb} arde en tu Mochila…`,
  roar: 'Un rugido rasga el cielo sobre la Columna. La piedra tiembla bajo tus pies.',
  appear: (other) => `${other} aparece sobre el hexágono.`,
  zygarde: 'Dejó su orbe como promesa. Ha venido a cumplirla.',
  ready: (n) => `¿Te enfrentas a ${n}?`,
  waiting: (n) => `${n} te espera sobre el hexágono.`,
  fainted: (n) => `${n} se repliega hacia el cielo. Cuando descanses, volverá a su plataforma.`,
  caught: (n) => `${n} se queda contigo.`,
  lose: 'Te recuperas junto a la plataforma. Tu equipo vuelve a estar a punto.',
  platformEmpty: 'El hexágono del borde brilla en calma.',
  // Arceus (B21 lo dejó debilitado en la cima: «Esta vez no duerme: vigila.»)
  arceusReady: 'Arceus abre los ojos. Esta vez no hay Tablas entre vosotros.',
  arceusQuestion: '¿Qué eres cuando no queda nada que ganar?', // canon (pregunta de la fase Normal, D22)
  arceusRule: 'Arceus solo se dejará atrapar cuando sus PS bajen de la mitad.',
  arceusCatchReason: 'Arceus aún te está midiendo. Baja sus PS de la mitad antes de lanzar una Poké Ball.',
  arceusAsk: '¿Responder a Arceus?',
  arceusFainted: 'Arceus se tiende otra vez sobre el gran hexágono. Cuando descanses, volverá a medirte.',
  arceusCaught: 'La Poké Ball se queda quieta. Arceus ha decidido acompañarte.',
  arceusLose: 'Arceus espera, inmóvil. Tu equipo se ha recuperado.',
});

/** Mundo Distorsión profundo: la grieta nueva, la Hondura, las caras y el Corazón. */
export const DIST_TEXT = Object.freeze({
  grieta: 'En el borde de la plaza se ha abierto una grieta nueva. El aire gira hacia abajo, más hondo que el aljibe.',
  grietaZygarde: Object.freeze(['Esto no estaba.', 'Abajo está donde vive. Donde nunca bajamos.']),
  grietaAsk: '¿Descender con Zygarde?',
  hondaArrival: 'Aquí abajo no hay techo ni suelo: solo islas de piedra y losas que giran sobre el vacío.',
  hondaZygarde: 'Más hondo que la otra vez.',
  shadowZygarde: 'Ahora sí nos busca.',
  faceIntro: 'Una losa enorme gira sin parar sobre el vacío, como una aguja que no encuentra el norte. Su dibujo no se puede pisar.',
  post: 'Un poste de piedra con un nudo tallado. Al tocarlo, la losa de al lado se detiene un instante.',
  postAsk: (dirs) => `La losa se ha detenido con su camino hacia el ${dirs}. ¿Anclarla así?`,
  postChoices: Object.freeze(['Anclarla así', 'Dejarla girar']),
  anchoredPost: (dirs) => `La losa está anclada con su camino hacia el ${dirs}.`,
  releaseChoices: Object.freeze(['Soltarla', 'Dejarla así']),
  released: 'Zygarde suelta la losa. Vuelve a girar.',
  portalDown: 'Una grieta violeta baja todavía más hondo.',
  portalBack: 'Una grieta violeta sube hacia la explanada del aljibe.',
  corazonArrival: 'Tres losas giran alrededor de un corazón de piedra cerrado. En sus paredes, tres marcas apagadas.',
  corazonZygarde: Object.freeze(['Tres caras.', 'Si las tres miran al corazón a la vez, se abrirá.']),
  markOff: 'Una marca tallada en la pared del corazón. Está apagada.',
  markOn: 'Una marca tallada en la pared del corazón. Brilla: la losa de este lado la mira.',
  wall: 'La pared del corazón está cerrada. Se oye algo girando dentro.',
  opening: 'Las tres marcas se encienden a la vez. Las paredes del corazón se deshacen en polvo violeta.',
  openingZygarde: 'Está dentro.',
  orb: 'Una esfera de oro gris flota sobre el pedestal, girando despacio. El vacío entero parece girar con ella.',
  orbAsk: '¿Coger la esfera?',
  pedestalEmpty: 'Un pedestal vacío en el centro del corazón.',
  rise: 'El suelo tiembla. Del vacío, bajo el corazón, sube una sombra enorme…',
  giratinaZygarde: Object.freeze(['Tres noches.', 'Esta vez no vengo a echarlo. Esta es su casa.']),
  giratinaRule: 'Giratina aún no se ha asentado frente a ti: no se dejará atrapar hasta el tercer turno.',
  giratinaCatchReason: 'Giratina todavía no se ha asentado frente a ti. No se dejará atrapar hasta el tercer turno.',
  giratinaAsk: '¿Te enfrentas a Giratina?',
  giratinaWaits: 'Giratina flota sobre el corazón, inmóvil. Te observa.',
  giratinaFainted: 'Giratina se hunde en el vacío. Cuando descanses, volverá al corazón.',
  giratinaCaught: 'La Poké Ball deja de temblar. Giratina se queda contigo.',
  giratinaLose: 'El vacío te devuelve junto al pedestal. Tu equipo se ha recuperado.',
  exitHeart: 'Una grieta violeta se abre en el suelo del corazón. Sube hacia la explanada del aljibe.',
  exitAsk: '¿Volver a la explanada?',
});

/** El trío del Alma en sus alas (B16). */
export const TRIO_TEXT = Object.freeze({
  uxieNoChronicles: 'Vuelve cuando tu Libreta guarde las quince Crónicas. Lo que se sabe a medias no se pregunta.',
  uxieIntro: Object.freeze([
    'Has vuelto. Lo que sabes ya no cabe en esta sala.',
    'Una última pregunta. Sobre tu viaje, no sobre el mío.',
  ]),
  uxieQuestionCruce: 'En el Cruce, ¿a quién ataste?',
  uxieQuestionMesprit: 'Cuando mi hermana te preguntó por el chico del espejo, ¿qué le dijiste?',
  uxieDontKnow: 'No lo recuerdo',
  uxieWrong: 'No fue así. Lo que se sabe no se pierde: vuelve cuando lo recuerdes.',
  uxieForgot: 'Tu Libreta lo recuerda por ti. Vuelve cuando la hayas leído.',
  uxieRight: Object.freeze(['Lo recuerdas. Entonces ya sabes lo que viniste a saber.', 'Ahora, demuéstramelo.']),
  mespritIntro: 'Entre los reflejos, algo rosa se mueve. Ya no se esconde: va de un espejo a otro.',
  mespritSays: 'Atrápame otra vez. Ahora me muevo.',
  mespritTouch: 'Tu reflejo alcanza al de Mesprit. El cristal se ilumina.',
  azelfIntro: Object.freeze(['Has vuelto sin pararte. Como la otra vez.', 'Esta vez no hay sello. Lo que llevas, úsalo.']),
  azelfAsk: '¿Empezar el combate contra Azelf?',
  ready: (n) => `¿Te enfrentas a ${n}?`,
  fainted: (n) => `${n} se desvanece en un destello. Cuando descanses, volverá a su ala.`,
  caught: (n) => `${n} se queda contigo.`,
  lose: (n) => `${n} espera. Tu equipo se ha recuperado.`,
});

/** Red de Convergencia (CAMPANA §1.7, X12; biblia §8: el Salto no une ciudades). */
export const RED_TEXT = Object.freeze({
  node: 'El hexágono late despacio. Por dentro corre una luz verde, como una corriente.',
  open: Object.freeze([
    'Los caminos viejos siguen abiertos.',
    'Puedo llevarte entre los nodos que ya conoces: el Laberinto, el aljibe, el Origen y la Columna.',
    'Solo esos. Las ciudades tienen sus propios caminos.',
  ]),
  ask: '¿Adónde saltar?',
  stay: 'Quedarse',
  ride: 'Súbete. Esta forma sabe correr por los caminos viejos.', // canon (CAMPANA B21 §1)
  none: 'El hexágono late, pero la red no lleva a ningún otro nodo que conozcas.',
  aljibeNode: 'Junto al brocal, un hexágono pequeño grabado en el estrado late con luz verde.',
});

/** Agente Olmedo en la verja del Laberinto (B01), ya en el postgame. */
export const OLMEDO_TEXT = Object.freeze({
  lines: Object.freeze([
    'Los Arenzana han llamado.',
    'Dicen que tú puedes entrar en el Laberinto cuando quieras. A mí nadie me explica nada.',
  ]),
  again: (s) => byGender(s, '¿Otra vez al Laberinto? Estás hecho todo un explorador. Pasa, pasa.',
    '¿Otra vez al Laberinto? Estás hecha toda una exploradora. Pasa, pasa.'),
});
