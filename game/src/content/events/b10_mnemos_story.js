// Historia exterior de Aldea Mnemos (docs/CAMPANA.md B10): llegada con la niebla del olvido (Fausta), Olvido Arrieta
// en la plaza (fascinación) y su encargo de las cinco notas de nombres, la apertura del Archivo, la niebla como capa
// visual hasta el P5 y la aldea sin niebla después (onEnter). Los vecinos de las notas están en b10_notes.js.
import { F, NOTES, SPEAKER, SPRITE, byGender, when, lines, eventById, notesDelivered } from './b10_common.js';
import { pendingNotes, notesReminder } from './b10_notes.js';
import { NPC, BUILDINGS } from '../maps/b10/mnemos_layout.js';

/** Niebla del olvido (Graphics/Fogs de Añil) hasta el P5. */
export const FOG = Object.freeze({ name: '001-Fog01', opacity: 96, sx: 10, sy: 3, zoom: 1 });

export const STORY_TEXT = Object.freeze({
  arrival: 'Una niebla fina cubre la aldea. No moja: se queda pegada a las cosas, como el polvo en un libro cerrado.',
  lifted: 'La niebla se ha levantado. Al norte, por encima del torii, asoman las copas lilas del Bosque Neblino.',
  notesNote: (list) => `Notas de nombres de Olvido: ${list}.`,
  archivoLocked: 'La puerta del Archivo está atada con una cinta. Hay un papel clavado: «Cerrado mientras dure la niebla. — O. A.»',
});

/** Texto de la nota de la Libreta (misión de las notas). */
export function notesLibretaText() {
  return STORY_TEXT.notesNote(NOTES.map((n) => `${n.who} (${n.where})`).join(', '));
}

// ------------------------------------------------------------ llegada

/** Escena de llegada (franja de la calle sur o al entrar al mapa por primera vez). */
export async function arrivalScene(ctx) {
  if (ctx.flag(F.arrival)) return;
  ctx.setFlag(F.arrival);
  await ctx.say(STORY_TEXT.arrival);
  const fausta = eventById(ctx, 'fausta');
  if (fausta) {
    ctx.face(fausta, ctx.directionTo(fausta, ctx.player));
    await ctx.emote(fausta, '?');
  }
  await lines(ctx, SPEAKER.fausta, [
    '¡Hola! ¿Nos conocemos? …Perdona. Últimamente saludo a todo el mundo, por si acaso.',
    'Me llamo… eh… Fausta. Creo. Lo pone en mi delantal, mira.',
  ]);
  await lines(ctx, SPEAKER.fausta, [
    'Si buscas a alguien que se acuerde de algo, ve a ver a Olvido. Está en la plaza, con sus libretas.',
    'Es la única a la que la niebla no le hace nada. Lo apunta todo antes de que se le escape.',
  ]);
}

export async function faustaTalk(ctx) {
  if (ctx.flag(F.restored)) {
    await lines(ctx, SPEAKER.fausta, ['¡Fausta! Me llamo Fausta, y hoy es jueves, y ayer hice croquetas. Me acuerdo de todo.']);
    return;
  }
  if (!ctx.flag(F.arrival)) { await arrivalScene(ctx); return; }
  await lines(ctx, SPEAKER.fausta, ['Fausta, Fausta. Me lo repito como una canción, a ver si se queda.']);
}

// ------------------------------------------------------------ Olvido en la plaza

async function olvidoFirstMeeting(ctx) {
  const ev = ctx.event;
  await ctx.emote(ev, '!');
  const sp = SPEAKER.olvido;
  await lines(ctx, sp, [
    '¡Quieto! No te muevas. …Ya está. Apuntado.',
    `${byGender(ctx.state, 'Un forastero', 'Una forastera')} que llega con la niebla y no pregunta cómo se llama. Eso no se ve todos los días.`,
    'Olvido Arrieta. Setenta y ocho años, y todos apuntados. Las libretas están en mi casa; la memoria, aquí.',
    'Esta niebla baja del Bosque Neblino desde hace unas semanas. Se lleva los nombres: primero los de las cosas, luego los de la gente.',
    'A mí no me alcanza. Lo escribo todo antes de que se vaya. La tinta del Archivo, en cambio, se está borrando.',
  ]);
  await lines(ctx, sp, [
    'Hagamos un trato. Tengo cinco notas de nombres para cinco vecinos que ya no se acuerdan. Las piernas no me dan para repartirlas.',
    'Sabina, en la casa de té. Tomé, en el herbolario. Jacinta, en la casa rosa. Amaro, en el Santuario de los Glifos. Y Bruno, el crío del estanque.',
    'Repártelas y te abro el Archivo. Lo que duerme abajo lleva demasiado tiempo sin visitas.',
  ]);
  ctx.setFlag(F.olvidoMet);
  ctx.state.addClue(F.notesNote, notesLibretaText());
  ctx.requestRefresh();
  ctx.se('GUI trainer card flip');
  ctx.ui?.toast?.('Nota añadida a la Libreta.');
}

async function olvidoOpensArchivo(ctx) {
  const sp = SPEAKER.olvido;
  await lines(ctx, sp, [
    'Cinco de cinco. Lo sé porque lo he apuntado.',
    'Sabina ha vuelto a poner el agua a hervir. Se nota desde aquí.',
    'Trato es trato. Vamos al Archivo: arriba está el de papel; abajo, el Hondo. Te espero en la puerta.',
  ]);
  ctx.setFlag(F.notes);
  ctx.setFlag(F.archivoOpen);
  try { ctx.state.solveClue?.(F.notesNote); } catch { /* la nota puede no existir en partidas de prueba */ }
  const ev = ctx.event;
  if (ev) {
    await ctx.move(ev, ['up', 'up', 'up', 'left', 'left', 'left'], { speed: 4 });
    ctx.erase(ev);
  }
  ctx.requestRefresh();
}

export async function olvidoPlazaTalk(ctx) {
  const s = ctx.state;
  if (!s.flag(F.olvidoMet)) { await olvidoFirstMeeting(ctx); return; }
  if (!pendingNotes(s).length) { await olvidoOpensArchivo(ctx); return; }
  const n = notesDelivered(s);
  await lines(ctx, SPEAKER.olvido, [
    n ? `Llevas ${['', 'una', 'dos', 'tres', 'cuatro'][n] || n} de cinco. Voy tachando en mi libreta a medida que se acuerdan: lo noto en el aire.` : 'Las notas no se reparten solas. Venga, que la niebla no espera.',
  ]);
  await notesReminder(ctx);
}

/** Olvido tras el P5 (en la plaza): la Losa del Olvido y lo que queda por apuntar. */
export async function olvidoAfterTalk(ctx) {
  const sp = SPEAKER.olvido;
  if (!ctx.flag(F.informe)) {
    await lines(ctx, sp, ['Sube al Archivo de papel, que te quiero enseñar lo que nos ha devuelto la tinta.']);
    return;
  }
  await lines(ctx, sp, [
    'Los vecinos vuelven a saber quiénes son. Yo sigo apuntando, por costumbre.',
    'La Losa del Olvido está en el risco del Santuario. De noche, con la Piedra Espíritu, dicen que alguien contesta desde dentro.',
    'Ahora que tu acompañante sabe trepar, ya no tienes excusa. Apúntalo tú, esta vez.',
  ]);
  // Pista verbal de la Guardiana sobre la célula más escondida de su comarca (CAMPANA §2.2).
  const hint = cellHint(ctx.state);
  if (hint) await lines(ctx, sp, [hint]);
}

/** Pista de Olvido: primero el claro del bambú (C045); cuando ya está, el islote del estanque (C074, con Nadar). */
export function cellHint(state) {
  if (!state?.hasCell?.('cell_mnemos_1')) {
    return 'Otra cosa para tu libreta: detrás de la casa de té, entre el bambú, hay un claro donde algo verde brilla de noche. Se entra por el hueco de las cañas, junto al camino del Archivo.';
  }
  if (!state.hasCell('cell_mnemos_2')) {
    return 'Y el brillo verde del islote del estanque sigue ahí. Apuntado: sin nadar, no se llega.';
  }
  return null;
}

/** Eventos de Olvido en el exterior. */
export function olvidoEvents() {
  return [
    {
      id: 'olvido_plaza', x: NPC.olvido.x, y: NPC.olvido.y, name: SPEAKER.olvido,
      pages: [
        { when: when({ none: [F.archivoOpen] }), sprite: SPRITE.olvido, dir: NPC.olvido.dir, move: 'look', trigger: 'action', script: olvidoPlazaTalk },
        { when: when({ all: [F.restored, F.informe] }), sprite: SPRITE.olvido, dir: 2, move: 'look', trigger: 'action', script: olvidoAfterTalk },
      ],
    },
    {
      id: 'olvido_puerta', x: NPC.olvidoPuerta.x, y: NPC.olvidoPuerta.y, name: SPEAKER.olvido,
      pages: [{
        when: when({ all: [F.archivoOpen], none: [F.casia] }), sprite: SPRITE.olvido, dir: NPC.olvidoPuerta.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await lines(ctx, SPEAKER.olvido, ['Pasa, pasa. Y no toques nada que tenga polvo: el polvo también es memoria.']); },
      }],
    },
  ];
}

// ------------------------------------------------------------ la niebla (capa visual) y la puerta del Archivo

/** Evento paralelo: pone la niebla del mapa mientras no se restaure el P5 y la quita después (sin DOM, no hace nada). */
export function fogEvent() {
  return {
    id: 'niebla', x: 0, y: 0, trigger: 'parallel',
    script: async (ctx) => {
      const weather = ctx.scene?.weather;
      if (weather && typeof weather.setMapFog === 'function') {
        const want = ctx.flag(F.restored) ? null : FOG;
        const has = weather.mapFog?.name || null;
        if ((want?.name || null) !== has) await weather.setMapFog(want);
      }
      await ctx.wait?.(20);
    },
  };
}

/** Puerta del Archivo: cerrada (evento sólido encima del warp) hasta que Olvido la abre. */
export function archivoDoorEvent() {
  const d = BUILDINGS.archivo.door;
  return {
    id: 'puerta_archivo', x: d.x, y: d.y,
    pages: [
      { when: when({ none: [F.archivoOpen] }), solid: true, trigger: 'touch', noOver: true, script: async (ctx) => { await ctx.say(STORY_TEXT.archivoLocked); } },
      { when: when({ all: [F.archivoOpen] }), through: true },
    ],
  };
}

/** Al entrar en Mnemos: la llegada (primera vez) y, tras el P5, la aldea sin niebla. */
export async function mnemosOnEnter(ctx) {
  if (!ctx.flag(F.arrival)) {
    await ctx.wait?.(10);
    await arrivalScene(ctx);
    return;
  }
  if (ctx.flag(F.restored) && !ctx.flag(F.fogLifted)) {
    ctx.setFlag(F.fogLifted);
    await ctx.wait?.(20);
    await ctx.say(STORY_TEXT.lifted);
  }
}

export { notesDelivered };
