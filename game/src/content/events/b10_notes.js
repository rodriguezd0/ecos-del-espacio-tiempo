// Misión de las «notas de nombres» de Olvido (docs/CAMPANA.md B10, secuencia 1): cinco vecinos de Mnemos que la
// niebla del olvido ha dejado sin un nombre. Cada nota se entrega hablando con su destinatario (el orden es libre); al
// volver con Olvido con las cinco, ella abre el Archivo (b10_mnemos_story.js). Cada vecino tiene cuatro momentos:
// antes de conocer a Olvido, con la nota en la mano, ya entregada y tras el P5 (la niebla se levanta).
// Textos DECIDIDO-DEV (los nombres de los vecinos son de este bloque; ver README).
import { F, NOTES, SPEAKER, noteFor, notesDelivered, byGender, lines } from './b10_common.js';
import { SINISTEA_GIFT } from '../encounters/b10.js';
import { PARTY_MAX } from '../../core/state.js';

/** Texto de cada nota (lo que escribió Olvido) y lo que dice el vecino al leerla. */
export const NOTE_TEXT = Object.freeze({
  sabina: '«Te llamas Sabina. La casa de té es tuya desde hace treinta años. Pon el agua a hervir; lo demás vendrá solo.»',
  tome: '«Tu aprendiz se llama Elio. Lleva dos inviernos contigo y todavía confunde la manzanilla con la milenrama.»',
  jacinta: '«Tu nieta se llama Nerea. Tiene nueve años, come contigo todos los días y le gustan los Chingling.»',
  amaro: '«Te llamas Amaro. Cuidas el Santuario de los Glifos. Los glifos son de todos: tú solo les quitas el polvo.»',
  bruno: '«Tu Pancham se llama Bambú. Se lo pusiste tú, porque siempre muerde el bambú de la casa de té.»',
});

const HAND = 'Le das la nota de Olvido. Lee en voz alta:';

/** ¿Lleva el jugador la nota de `key` sin entregar? */
export const carriesNote = (s, key) => Boolean(s?.flag(F.olvidoMet)) && !s.flag(F.notes) && !s.flag(noteFor(key).flag);

/** Entrega una nota: la lee el vecino, se marca y se actualiza la nota de la Libreta. */
async function handNote(ctx, key, speaker, reaction) {
  const n = noteFor(key);
  ctx.se('GUI trainer card flip');
  await ctx.say(HAND);
  await ctx.say(NOTE_TEXT[key], { speaker });
  await ctx.wait?.(20);
  await lines(ctx, speaker, reaction);
  ctx.setFlag(n.flag);
  const left = NOTES.length - notesDelivered(ctx.state);
  const words = ['', 'una', 'dos', 'tres', 'cuatro'];
  await ctx.say(left > 0
    ? `Te ${left === 1 ? 'queda una nota' : `quedan ${words[left] || left} notas`} de Olvido por repartir.`
    : 'Has repartido las cinco notas. Olvido estará en la plaza.');
}

// ------------------------------------------------------------ Sabina (casa de té)

export async function sabinaTalk(ctx) {
  const s = ctx.state;
  const sp = SPEAKER.sabina;
  if (s.flag(noteFor('sabina').flag) && !s.flag(F.sinistea)) {
    await sinisteaGift(ctx);
    return;
  }
  if (s.flag(F.restored)) {
    await lines(ctx, sp, ['Esta mañana me he acordado de todo. Hasta de lo que no quería. Así es la memoria: viene entera o no viene.', '¿Un té? Invita la casa.']);
    return;
  }
  if (carriesNote(s, 'sabina')) {
    await lines(ctx, sp, ['¿Una nota? ¿Para mí? Déjame las gafas…']);
    await handNote(ctx, 'sabina', sp, ['…Sabina. Sí. Sabina. Me lo puso mi abuela, que también se llamaba así.', 'Qué cosa más tonta, olvidarse de una misma. Gracias, de verdad.']);
    await sinisteaGift(ctx);
    return;
  }
  if (s.flag(noteFor('sabina').flag)) {
    await lines(ctx, sp, ['Sabina, Sabina. Lo repito cada vez que sirvo un té, por si acaso.']);
    return;
  }
  await lines(ctx, sp, [
    `${byGender(s, 'Bienvenido', 'Bienvenida')} a la casa de… de… Sé que esto es mío. Las tazas, el hervidor, todo.`,
    'Lo que no sé es cómo me llamo. No se lo digas a nadie, ¿quieres?',
  ]);
}

/** Regalo de la casa de té (POKEDEX_DISTRIBUCION §7.4: Sinistea): espera hasta que haya sitio. */
async function sinisteaGift(ctx) {
  const sp = SPEAKER.sabina;
  await lines(ctx, sp, [
    'Espera. Cuando llegó la niebla, un Sinistea se coló en una de mis teteras desportilladas y no ha querido salir.',
    'Dicen que guardan el sabor de lo que se olvida. Contigo aprenderá cosas nuevas. ¿Te lo llevas?',
  ]);
  if (!(await ctx.confirm('¿Aceptas el Sinistea de Sabina?'))) {
    await lines(ctx, sp, ['Como quieras. Seguirá en su tetera, por si cambias de idea.']);
    return;
  }
  if (ctx.state.party.length >= PARTY_MAX && !ctx.state.boxes.some((box) => box.includes(null))) {
    await lines(ctx, sp, ['No tienes sitio en el equipo ni en el PC. Hazle un hueco; seguirá aquí, en su tetera.']);
    return;
  }
  await ctx.givePokemon({ ...SINISTEA_GIFT });
  ctx.setFlag(F.sinistea);
  await lines(ctx, sp, ['Trátalo con cariño. Y no lo metas en agua hirviendo.']);
}

// ------------------------------------------------------------ Tomé (herbolario) y su aprendiz Elio

export async function tomeTalk(ctx) {
  const s = ctx.state;
  const sp = SPEAKER.tome;
  if (s.flag(F.restored)) {
    await lines(ctx, sp, ['Elio, la milenrama. ¡La milenrama, Elio! …Menos mal que te sé el nombre para poder reñirte.']);
    return;
  }
  if (carriesNote(s, 'tome')) {
    await lines(ctx, sp, ['¿Olvido me escribe? Esa mujer lo apunta todo, hasta lo que uno estornuda.']);
    await handNote(ctx, 'tome', sp, ['Elio. …Elio. ¡Elio, muchacho! Llevo una semana llamándote «oye».', 'Perdona a este viejo, muchacho. Y tú, gracias. Dile a Olvido que le debo una infusión.']);
    return;
  }
  if (s.flag(noteFor('tome').flag)) {
    await lines(ctx, sp, ['Los nombres de las hierbas no se me han ido nunca. Los de la gente, sí. Qué cosa.']);
    return;
  }
  await lines(ctx, sp, [
    'Ese chico del mostrador es mi aprendiz. Buen chico. Lleva conmigo… bastante.',
    '¿Su nombre? Pues… Mira, si te lo digo mal se va a ofender. Mejor no digo nada.',
  ]);
}

/** Saludo de Elio en el mostrador del herbolario (cambia cuando Tomé recupera su nombre). */
export function elioGreeting(s) {
  if (s?.flag?.(F.restored) || s?.flag?.(noteFor('tome').flag)) {
    return '¡Buenas! ¡El maestro ya me llama Elio otra vez, aunque sea para reñirme! ¿Hierbas, raíces, remedios?';
  }
  return '¡Buenas! Hierbas, raíces y remedios. El maestro no se acuerda de mi nombre, pero de los precios, sí.';
}

// ------------------------------------------------------------ Jacinta y Nerea

export async function jacintaTalk(ctx) {
  const s = ctx.state;
  const sp = SPEAKER.jacinta;
  if (s.flag(F.restored)) {
    await lines(ctx, sp, ['Nerea ha vuelto a pedirme que le cuente lo de su abuelo. Esta vez me he acordado del final.']);
    return;
  }
  if (carriesNote(s, 'jacinta')) {
    await handNote(ctx, 'jacinta', sp, ['Nerea. …Nerea, claro. Si se lo he dicho mil veces: «Nerea, que se enfría la sopa».', 'Ve, dile que entre. No, espera: ya se lo digo yo. Por su nombre.']);
    return;
  }
  if (s.flag(noteFor('jacinta').flag)) {
    await lines(ctx, sp, ['He escrito «Nerea» en la puerta de la alacena. Por si la niebla vuelve.']);
    return;
  }
  await lines(ctx, sp, [
    'Hay una niña que viene a comer todos los días. Me llama abuela. Yo le pongo el plato…',
    '…y no sé cómo se llama. No se lo digas, que se pone triste.',
  ]);
}

export async function nereaTalk(ctx) {
  const s = ctx.state;
  const sp = SPEAKER.nerea;
  if (s.flag(F.restored)) {
    await lines(ctx, sp, ['¡La niebla se ha ido! Ahora se ve el bosque desde aquí. Mi abuela dice que no me acerque.']);
    return;
  }
  if (s.flag(noteFor('jacinta').flag)) {
    await lines(ctx, sp, ['¡La abuela me ha llamado por mi nombre! Tres veces. Y la tercera me ha reñido, pero me da igual.']);
    return;
  }
  await lines(ctx, sp, ['Mi abuela me mira raro. Como si fuera la primera vez que me ve.', 'Yo le digo «abuela» igual. A ver si se acuerda.']);
}

// ------------------------------------------------------------ Amaro (Santuario de los Glifos)

export async function amaroTalk(ctx) {
  const s = ctx.state;
  const sp = SPEAKER.amaro;
  if (s.flag(F.restored)) { await amaroAfter(ctx); return; }
  if (carriesNote(s, 'amaro')) {
    await lines(ctx, sp, ['¿Es para mí? No sé si soy yo al que buscas. Ya no sé ni…']);
    await handNote(ctx, 'amaro', sp, ['Amaro. …Amaro, guardés del Santuario. ¡Claro!', 'Y estos son los glifos. Los mismos que había en las piedras cuando se fundó la aldea. Nadie los lee ya, pero alguien tiene que quitarles el polvo.']);
    return;
  }
  if (s.flag(noteFor('amaro').flag)) {
    await lines(ctx, sp, ['Amaro. Guardés del Santuario. Me lo he apuntado en la manga, mira.']);
    return;
  }
  await lines(ctx, sp, [
    'Barro este suelo todos los días. Sé que tiene que estar limpio.',
    'No recuerdo para quién. Ni cómo me llamo. Pero el suelo, limpio.',
  ]);
}

/** Tras el P5: la Gardevoirita (POKEDEX_DISTRIBUCION §7.7: Santuario de los Glifos, tras P5). */
async function amaroAfter(ctx) {
  const sp = SPEAKER.amaro;
  if (ctx.flag(F.gardevoirite)) {
    await lines(ctx, sp, ['Los glifos vuelven a estar nítidos. Da gusto barrer así.']);
    return;
  }
  await lines(ctx, sp, [
    'Esta mañana he abierto el cofre del Santuario para ver si seguía todo en su sitio. Creía que la niebla también se había llevado lo que había dentro.',
    'Hay una piedra que responde a quien protege a otros. Aquí dicen que es de los Custodios. Yo digo que es de quien la necesite.',
  ]);
  await ctx.giveItem('GARDEVOIRITE', 1);
  ctx.setFlag(F.gardevoirite);
  await lines(ctx, sp, ['Llévatela. Tú nos has devuelto el nombre de las cosas.']);
}

// ------------------------------------------------------------ Bruno y Bambú (el estanque)

export async function brunoTalk(ctx) {
  const s = ctx.state;
  const sp = SPEAKER.bruno;
  if (s.flag(F.restored)) {
    await lines(ctx, sp, ['Bambú ha vuelto a morder el bambú de la señora Sabina. Esta vez me ha reñido a mí, y eso que me llamo Bruno.']);
    return;
  }
  if (carriesNote(s, 'bruno')) {
    await lines(ctx, sp, ['¿Qué pone? Léelo tú, que yo leo despacio.']);
    await handNote(ctx, 'bruno', sp, ['¡Bambú! ¡BAMBÚ! ¿Lo has visto? ¡Se ha girado!', '¡Se llama Bambú! Claro, porque muerde el bambú. Qué nombre tan bueno le puse.']);
    const pancham = ctx.world?.events?.find((e) => e.id === 'pancham');
    if (pancham) { ctx.cry?.('PANCHAM'); await ctx.emote?.(pancham, '♪'); }
    return;
  }
  if (s.flag(noteFor('bruno').flag)) {
    await lines(ctx, sp, ['Bambú, ven. ¿Ves? Viene cuando lo llamo por su nombre.']);
    return;
  }
  await lines(ctx, sp, ['Este Pancham me sigue a todas partes. Es mío, creo.', '¿Cómo se llama? Lo tengo en la punta de la lengua…']);
}

export async function panchamTalk(ctx) {
  ctx.cry?.('PANCHAM');
  if (ctx.flag(noteFor('bruno').flag)) await ctx.say('Pancham: ¡Pan-cham! (Mordisquea contento una caña de bambú.)');
  else await ctx.say('Pancham: ¿Pan…? (Mira a Bruno como esperando algo.)');
}

/** Resumen de la misión para Olvido y la Libreta. */
export function pendingNotes(state) {
  return NOTES.filter((n) => !state.flag(n.flag));
}

export async function notesReminder(ctx) {
  const left = pendingNotes(ctx.state);
  if (!left.length) return;
  await ctx.say(`Notas pendientes: ${left.map((n) => `${n.who} (${n.where})`).join(', ')}.`);
}
