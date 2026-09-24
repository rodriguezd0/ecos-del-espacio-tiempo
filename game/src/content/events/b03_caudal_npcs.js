// Personajes de Ciudad Caudal (B03): el molinero Anselmo abre la pista T02 (TABLILLAS T02, «pista inicial»), el
// pescador del Mercado fluvial regala la Caña Vieja (OLDROD, X17), el puesto del mercado (Miel y bayas), el tutor
// y los vecinos que cuentan el problema del río (CAMPANA B03: «inundaciones de día y canales secos de noche»).
import { F, SPEAKER, SPRITE, say, core, when } from './b03_common.js';
import { SPOTS } from '../maps/b03/caudal_layout.js';
import { clerkEvent } from '../services/shop.js';
import { moveTutorEvent } from '../services/moveTeaching.js';

const isDay = (s) => (typeof s?.isDay === 'function' ? s.isDay() : true);

// ── Anselmo y la pista T02 ─────────────────────────────────────────────────────────────────
/** Pista inicial exacta de TABLILLAS T02. */
export const T02_CLUE_LINE = '«La muela del Diezmo pesa como un río.»';

export async function anselmoTalk(ctx) {
  const A = SPEAKER.anselmo;
  if (ctx.flag(F.anselmo)) {
    await say(ctx, A, `${T02_CLUE_LINE} Si algún día entiendes qué quería decir mi padre, ven a contármelo.`);
    if (!ctx.flag(F.p2)) await say(ctx, A, 'Con el río así no se puede ni mirar la muela. Cuando el Albo se calme, ya veremos.');
    return;
  }
  await say(ctx, A, '¿Tú también vienes a mirar el molino? Adelante. Es lo único que sale gratis en esta ciudad.');
  await say(ctx, A, 'Es el Molino del Diezmo. Ha molido el grano de todo el valle desde antes de que naciera mi abuelo.');
  await say(ctx, A, 'Ahora el gremio quiere tirarlo. Dicen que el río ya no lo mueve y que estorba.');
  await say(ctx, A, 'Pues que esperen sentados. Mientras yo viva, el Diezmo no se vende ni se tira.');
  await ctx.wait(20);
  await say(ctx, A, 'Mi padre siempre decía una cosa… «La muela del Diezmo pesa como un río.»');
  await say(ctx, A, 'Nunca supe qué quería decir. A lo mejor tú, que tienes cara de preguntar, lo averiguas.');
  ctx.setFlag(F.anselmo);
  await ctx.story.openClue('T02');
  // T02 pide el P2 restaurado: anticipación sin bloqueo con la frase de Zygarde de TABLILLAS §4.2.
  if (ctx.world?.core?.visible && !ctx.flag(F.p2)) await core(ctx, 'Ese molino guarda algo muy antiguo. Allí no llego todavía.');
}

// ── Pescador: Caña Vieja ───────────────────────────────────────────────────────────────────
/** Gyaradosita (POKEDEX_DISTRIBUCION §7.7: «Pescador de Caudal, con Nadar»): una sola vez, con Nadar de Zygarde. */
async function fisherMegaStone(ctx) {
  const P = SPEAKER.fisher;
  if (ctx.flag(F.gyarados) || !ctx.state.zygardeAbility?.('swim')) return false;
  await say(ctx, P, '¡Anda! Ahora tu compañero te lleva por el agua honda, ¿eh? Entonces esto te sirve más a ti que a mí.');
  await ctx.giveItem('GYARADOSITE');
  ctx.setFlag(F.gyarados);
  await say(ctx, P, 'La saqué del fondo del canal hace años, enganchada al anzuelo. Brilla como las escamas de un Gyarados enfadado.');
  await say(ctx, P, 'Dicen que con un aro especial despierta algo en ellos. Yo solo sé pescar.');
  return true;
}

export async function fisherTalk(ctx) {
  const P = SPEAKER.fisher;
  if (ctx.flag(F.oldRod)) {
    if (await fisherMegaStone(ctx)) return;
    await say(ctx, P, 'Ponte mirando al agua y saca la caña desde la Mochila. Cuando pique, ¡tira enseguida!');
    await say(ctx, P, isDay(ctx.state)
      ? 'Hoy el canal va crecido. Los peces suben a respirar a la orilla.'
      : 'De noche el canal baja tanto que da pena. Los peces se esconden en el barro.');
    return;
  }
  await say(ctx, P, '¡Chsss! No espantes a los Magikarp… Bah, da igual, hoy no pican.');
  await say(ctx, P, 'El Albo anda loco. Por la mañana se sale de los canales y por la noche se queda en nada. Así no hay quien pesque.');
  await say(ctx, P, 'Pero pican, ¿eh? Poco, pero pican. ¿Te gusta pescar? Seguro que sí: tienes cara de paciencia.');
  await ctx.giveItem('OLDROD');
  ctx.setFlag(F.oldRod);
  await say(ctx, P, 'Es una caña vieja, pero es honrada. Ponte mirando al agua y úsala desde la Mochila.');
  await say(ctx, P, 'Cuando notes el tirón, ¡pulsa rápido! Si no, se escapan. Como todo en esta ciudad.');
}

// ── Vecinos ────────────────────────────────────────────────────────────────────────────────
/** NPC con frases de día y de noche (el problema del río cambia con la hora, TEC-06). */
function neighbor(id, x, y, sprite, dir, speaker, dayLines, nightLines, extra = {}) {
  return {
    id, x, y, sprite, dir, move: extra.move || 'look', trigger: 'action', when: extra.when,
    script: async (ctx) => {
      const lines = isDay(ctx.state) || !nightLines ? dayLines : nightLines;
      const after = ctx.flag(F.p2) && extra.afterP2 ? extra.afterP2 : lines;
      for (const l of after) await say(ctx, speaker, l);
    },
  };
}

export function caudalNeighbors() {
  return [
    neighbor('vecina_plaza', 32, 24, 'vecina', 2, 'Vecina',
      ['¿Vienes de la Ruta 2? Pues has llegado en mala semana. El Albo crece cada mañana y baja cada noche.',
        'El Maestre de Esclusas dice que lo tiene controlado. Lleva tres noches sin dormir girando manivelas.'],
      ['Mira los canales: medio vacíos. Mañana volverán a desbordarse. Así llevamos semanas.'],
      { afterP2: ['El río vuelve a ir por donde debe. Hasta los Magikarp parecen contentos.'] }),
    neighbor('nino_plaza', 22, 32, 'nino', 8, 'Niño',
      ['¡He visto un Buizel nadando en la fuente! Bueno, a lo mejor era un pato. Pero naranja.'],
      null),
    neighbor('anciano_paseo', 20, 9, 'anciano', 2, 'Anciano',
      ['Caudal lleva el río a mano desde hace siglos. Esclusas, compuertas, canales… Todo lo mueve una familia: los Alcántara.',
        'Dicen que la casa grande del paseo, junto a la Esclusa mayor, es tan vieja como la ciudad.'],
      null),
    neighbor('vecino_bajo', 36, 50, 'vecino', 8, 'Vecino',
      ['Aquí abajo nos entra el agua por las puertas cada mañana. Ya ni recogemos los sacos.',
        'El Maestre dice que no hace falta ayuda. Él sabrá. Nosotros achicamos.'],
      ['De noche el canal se queda tan bajo que se ven las piedras del fondo. Y a la mañana… otra vez arriba.'],
      { afterP2: ['El agua ya no entra en casa. Hemos quitado los sacos y todo. ¡Qué gusto dormir seco!'] }),
    neighbor('nina_bajo', 26, 50, 'nina', 6, 'Niña',
      ['Mi mamá dice que el río está enfadado. Yo creo que está asustado. Cuando algo se asusta, corre y luego se esconde.'],
      null),
    neighbor('molinera', 3, 29, 'vecina', 6, 'Molinera',
      ['Las ruedas giran a trompicones: un rato sí, un rato no. La harina sale gruesa y el gremio se queja.',
        'El único que no se queja es el viejo Anselmo, el del Diezmo. Ese ni gira ni deja que lo toquen.'],
      ['De noche las ruedas se paran del todo. Da miedo el silencio en el barrio.'],
      { afterP2: ['¡Las ruedas giran como antes! Bueno… todas menos la del Diezmo, que va al revés.'] }),
    neighbor('marinera', 47, 17, 'anil:marinero', 4, 'Barquero',
      ['El río tiene carácter, pero así no lo había visto nunca. Al sur, hacia la Sima, se oye rugir de noche.',
        'Por eso la Senda del Mirador está cerrada. Nadie baja hasta allí desde los desprendimientos.'],
      null),
    neighbor('jardinero_canal', 10, 49, 'anciano', 4, 'Jardinero',
      ['Este jardín se riega con el agua del canal. Con el río así, un día se ahoga y al siguiente se seca.'],
      null),
    neighbor('viajera_este', 58, 27, 'anil:fotografa', 4, 'Fotógrafa',
      ['Iba hacia Villa Brontia, pero la vega está inundada. El camino del este desaparece bajo el agua.',
        'Cuando baje el río, dicen que el vado vuelve a asomar.'],
      null),
  ];
}

// ── Mercado fluvial: puesto, tutor y pescador ──────────────────────────────────────────────
export function marketEvents() {
  const stall = (id, spot, speaker, lines) => ({
    id, x: spot.x, y: spot.y, trigger: 'action', noOver: true,
    script: async (ctx) => { for (const l of lines) await say(ctx, speaker, l); },
  });
  return [
    // El tendero lo dibuja el stamp del puesto: el evento es el mostrador (se habla desde la fila de delante).
    clerkEvent({
      id: 'mercader', x: SPOTS.mercader.x, y: SPOTS.mercader.y, dir: SPOTS.mercader.dir, sprite: '',
      items: ['HONEY', 'ORANBERRY', 'PECHABERRY', 'CHESTOBERRY', 'REPEL'],
      greeting: '¡Miel de la pradera y bayas del valle! Todo fresco, aunque el río no lo esté.',
    }),
    stall('puesto_pescado', SPOTS.puestoPescado, 'Pescadera', [
      'Pescado del Albo… Bueno, lo que el Albo quiera dar. Hoy, tres Magikarp y un zapato.',
      'Cuando el río se calme volveré a llenar el puesto. Si se calma.',
    ]),
    stall('puesto_canas', SPOTS.puestoCanas, 'Tendero', [
      'Redes, anzuelos, cebos… Cañas no vendo: la mejor caña de Caudal es la vieja del pescador del embarcadero.',
      'Y la regala, el muy tonto. Así no hay quien haga negocio.',
    ]),
    moveTutorEvent({
      id: 'tutor', x: SPOTS.tutor.x, y: SPOTS.tutor.y, dir: SPOTS.tutor.dir, sprite: 'anil:veterano',
      moves: ['MUDSLAP', 'SWIFT', 'HEADBUTT', 'ICYWIND'], cost: { money: 800 }, speaker: 'Tutor del canal',
      greeting: 'Enseño lo que aprendí remando. ¿Quieres que tus Pokémon aprendan algo nuevo?',
    }),
    {
      id: 'pescador', x: SPOTS.pescador.x, y: SPOTS.pescador.y, sprite: SPRITE.fisher, dir: SPOTS.pescador.dir,
      move: 'still', trigger: 'action', script: fisherTalk,
    },
  ];
}

export function anselmoEvent() {
  return {
    id: 'anselmo', x: SPOTS.anselmo.x, y: SPOTS.anselmo.y, sprite: SPRITE.anselmo, dir: SPOTS.anselmo.dir,
    move: 'still', trigger: 'action', when: when({}), script: anselmoTalk,
  };
}
