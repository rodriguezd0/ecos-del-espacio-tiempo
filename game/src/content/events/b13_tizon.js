// T12 · «La forja fría» en el Volcán Tizón (docs/TABLILLAS.md T12; CAMPANA B13, §2.3 C067 «Forja fría»; §5.4 B13
// «perforación del volcán»): el caserío con la forja apagada, la Maestra Brasa (segunda pista), herreros, la ladera con
// entrenadores y la bocamina de las galerías (Cueva del Tizón). Cuando los tres respiraderos vuelven a respirar, la forja
// arde; con la Tabla Llama y la sonda de Genesis retirada, Brasa enseña el crisol «que ningún fuego funde» y regala la
// Houndoomita. Si se llega sin la pista, el arco empieza igual (descubrimiento directo).
import { cellEvent } from './b01_cells.js';
import { F, SPEAKER, SPRITE, OBJ, when, lines, zygardeSays, examine, byGender, findEvent, objectPage, blockers } from './b13_common.js';
import { BUILDINGS, FORGE, NPCS, TRAINERS, ITEMS, MINE, HOUSE_ENTRY, MESA_EDGE } from '../maps/b13/tizon_layout.js';

const B = { speaker: SPEAKER.brasa };
const ANVIL = 'asset:objects/b07_yunque.png'; // yunque de la herrería de la Cantería (arte de B07, solo lectura)

export const TIZON_TEXT = Object.freeze({
  arrival: 'Un caserío de piedra en la falda del volcán. Martillos colgados, yunques fríos y nadie trabajando.',
  forgeCold: 'La gran fragua del caserío. Las brasas están grises y frías.',
  forgeLit: 'La fragua arde otra vez. El aire tiembla de calor sobre las brasas.',
  anvil: 'Un yunque ennegrecido por siglos de golpes.',
  locked: 'La puerta está cerrada.',
  store: 'El almacén del carbón. Sin fuego, nadie lo abre.',
  sign: 'CASERÍO DEL TIZÓN\nForja de la familia Brasa.\n«Aquí se hacen picos, no espadas.»',
  mine: 'La bocamina de las galerías de la forja. Por ahí bajan los respiraderos.',
});

async function arrival(ctx) {
  ctx.setFlag(F.tizArrival);
  const status = ctx.story.clueStatus('T12');
  if (status !== 'active' && status !== 'solved') await ctx.story.openClue('T12', { direct: true });
  await ctx.say(TIZON_TEXT.arrival);
  await zygardeSays(ctx, 'La montaña respira mal. Como si alguien le tapara la boca.');
}

// ───────────────────────────── Maestra Brasa ─────────────────────────────

async function brasaTalk(ctx) {
  const brasa = findEvent(ctx, 'brasa');
  if (brasa) ctx.turnToPlayer(brasa);
  if (ctx.flag(F.tizForge)) {
    await lines(ctx, SPEAKER.brasa, ['La forja ya canta. Vuelve cuando quieras: aquí siempre habrá fuego.']);
    return;
  }
  if (ctx.flag(F.tizPlate) && ctx.flag(F.tizVents) && ctx.flag(F.tizChief)) { await forgeScene(ctx); return; }
  if (!ctx.flag(F.tizBrasa)) {
    await lines(ctx, SPEAKER.brasa, [
      `¿${byGender(ctx.state, 'Un forastero', 'Una forastera')} en el Tizón? Soy Brasa, maestra de esta forja.`,
      'Hace un mes que no arde. Nuestro fuego se alimenta del respiradero del volcán, y el volcán ha dejado de respirar.',
      'Sin fuego no hay picos. Ya no mandamos ni uno a Nexo.',
      'Arriba, en el cráter, hay gente del Consorcio con una máquina que no para de agujerear.',
      'Las galerías de la forja bajan por la bocamina de arriba. Los respiraderos están dentro: tres. Si están tapados, no volveremos a encender.',
    ]);
    const status = ctx.story.clueStatus('T12');
    if (status !== 'active' && status !== 'solved') await ctx.story.openClue('T12', { direct: true });
    await ctx.story.advanceClue('T12', 2);
    ctx.setFlag(F.tizBrasa);
    return;
  }
  if (ctx.flag(F.tizVents)) {
    await lines(ctx, SPEAKER.brasa, [
      '¡La forja respira! Lo he notado en las manos antes que en la cara.',
      'Pero arriba sigue esa máquina. Mientras chupe del volcán, el fuego no será nuestro del todo.',
    ]);
    return;
  }
  await ctx.say('Sube por la ladera hasta la bocamina. Y ten cuidado con la lava: no se pisa, se rodea.', B);
}

async function forgeScene(ctx) {
  await lines(ctx, SPEAKER.brasa, ['Has vuelto. Mira.']);
  const forge = findEvent(ctx, 'fragua');
  ctx.se('Anim/Fire1', { volume: 80 });
  if (forge) forge.direction = 4;
  await ctx.flash([255, 170, 80], 16, 130);
  const smith = findEvent(ctx, 'herrero');
  if (smith) await ctx.emote(smith, '♪');
  await ctx.say('¡Arde! ¡La forja arde!', { speaker: SPEAKER.smith });
  await lines(ctx, SPEAKER.brasa, [
    'Cuarenta generaciones de herreros y el fuego nunca había tardado tanto en volver.',
    'Ven. Quiero enseñarte algo que no sale de esta casa.',
  ]);
  await ctx.say('Brasa vuelve de casa con un crisol de piedra oscura, liso como un canto de río.');
  await lines(ctx, SPEAKER.brasa, [
    'Es lo más viejo que tenemos. Un crisol que ningún fuego funde. Mi abuela decía que estaba esperando a algo que todavía no ha nacido.',
    'Yo solo sé que aguanta. Como esta forja.',
    'Y esto es para ti. Los Houndour de la ladera la desentierran de vez en cuando. Te la has ganado.',
  ]);
  await ctx.giveItem('HOUNDOOMINITE', 1);
  ctx.setFlag(F.tizForge);
}

// ───────────────────────────── Eventos ─────────────────────────────

function forgeEvents() {
  const lit = (s) => Boolean(s?.flag(F.tizVents));
  return [
    {
      id: 'fragua', x: FORGE.fragua.x, y: FORGE.fragua.y, name: 'Fragua',
      pages: [
        { ...objectPage(OBJ.forge, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TIZON_TEXT.forgeCold); } },
        { when: lit, ...objectPage(OBJ.forge, 4, { stepAnime: true }), solid: true, light: { radius: 80, intensity: 1 }, trigger: 'action', script: async (ctx) => { await ctx.say(TIZON_TEXT.forgeLit); } },
      ],
    },
    ...[FORGE.fragua.x - 1, FORGE.fragua.x + 1].map((x) => examine(`fragua_${x}`, x, FORGE.fragua.y, (s) => (lit(s) ? TIZON_TEXT.forgeLit : TIZON_TEXT.forgeCold), { solid: true })),
    ...FORGE.anvils.map(([x, y], i) => ({ id: `yunque_${i}`, x, y, name: 'Yunque', ...objectPage(ANVIL, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TIZON_TEXT.anvil); } })),
    { id: 'brasa', x: FORGE.brasa.x, y: FORGE.brasa.y, name: SPEAKER.brasa, sprite: SPRITE.brasa, dir: FORGE.brasa.dir, move: 'look', solid: true, trigger: 'action', script: brasaTalk },
    cellEvent({ id: FORGE.cell.key, x: FORGE.cell.x, y: FORGE.cell.y }),
  ];
}

function npcEvents() {
  const say = (speaker, before, after) => async (ctx) => { await lines(ctx, speaker, ctx.flag(F.tizVents) ? after : before); };
  return [
    {
      id: 'herrero', x: NPCS.smith.x, y: NPCS.smith.y, name: SPEAKER.smith, sprite: SPRITE.smith, dir: NPCS.smith.dir, move: 'look', trigger: 'action',
      script: say(SPEAKER.smith, ['Llevo un mes afilando el mismo martillo. Por hacer algo.'], ['¡Por fin! Mañana salen picos para Nexo.']),
    },
    {
      id: 'herrera', x: NPCS.smithF.x, y: NPCS.smithF.y, name: SPEAKER.smithF, sprite: SPRITE.smithF, dir: NPCS.smithF.dir, move: 'look', trigger: 'action',
      script: say(SPEAKER.smithF, ['El volcán siempre ha humeado. Ahora ni eso. Da miedo, tanto silencio.', 'Los de la máquina subieron por la ladera hace semanas.'], ['Se nota el calor hasta en las piedras del camino. Así debe ser.']),
    },
    {
      id: 'aprendiz', x: NPCS.apprentice.x, y: NPCS.apprentice.y, name: SPEAKER.apprentice, sprite: SPRITE.apprentice, dir: NPCS.apprentice.dir, move: { wander: 2 }, trigger: 'action',
      script: say(SPEAKER.apprentice, ['La maestra dice que la lava de las galerías se puede parar con obsidiana. ¡Pero a mí no me deja entrar!'], ['¡La maestra me ha dejado soplar el fuelle!']),
    },
    {
      id: 'pescador_tizon', x: NPCS.fisher.x, y: NPCS.fisher.y, name: 'Pescador', sprite: 'anil:pescador', dir: NPCS.fisher.dir, move: 'look', trigger: 'action',
      script: async (ctx) => { await lines(ctx, 'Pescador', ['Aquí pescamos para la forja, no para vender.', 'Cuando el volcán se enfría, los peces se van. Este mes no ha picado nada.']); },
    },
    { id: 'cartel_caserio', type: 'sign', x: 10, y: 35, text: TIZON_TEXT.sign },
    examine('bocamina', MINE.door.x - 1, MINE.door.y, TIZON_TEXT.mine, { solid: true }),
    examine('puerta_cupula', BUILDINGS.cupula.door.x, BUILDINGS.cupula.door.y, TIZON_TEXT.locked, { solid: true }),
    examine('puerta_almacen', BUILDINGS.almacen.door.x, BUILDINGS.almacen.door.y, TIZON_TEXT.store, { solid: true }),
  ];
}

function trainerEvents() {
  const TEXT = {
    montanero_blas: { intro: 'Subo al Tizón cada año a ver humear el cráter. ¡Este año, nada! Al menos combatamos.', after: 'Arriba, en la bocamina, hay un técnico del Consorcio que no deja pasar a nadie.' },
    excursionista_carmen: { intro: 'La ceniza se te mete en las botas. ¡Y los combates, en la cabeza!', after: 'Desde aquí se ve Nexo en los días claros. Hoy no.' },
    tecnico_perforacion: { intro: 'La bocamina está precintada. Orden de la jefa de perforación.', after: 'Dentro hay coladas por todas partes desde que empezamos a perforar. No es culpa mía.' },
  };
  return TRAINERS.map((t) => ({
    id: t.id, type: 'trainer', trainer: t.trainer, name: t.name, sprite: t.sprite, x: t.x, y: t.y, dir: t.dir, sight: t.sight,
    intro: TEXT[t.id].intro, after: TEXT[t.id].after,
  }));
}

export function tizonEvents() {
  return [
    { id: 'llegada_tizon', x: 0, y: 0, trigger: 'auto', when: when({ none: [F.tizArrival] }), script: arrival },
    ...forgeEvents(),
    ...npcEvents(),
    ...trainerEvents(),
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    ...blockers('flanco_noroeste', MESA_EDGE),
  ];
}

/** Casa de Brasa (tizon_casa): cama para descansar (cura) y el arcón del crisol. */
export function houseEvents() {
  return [
    {
      id: 'cama_brasa', x: 9, y: 4, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => {
        const { runRest } = await import('../services/inn.js');
        await runRest(ctx, { kind: 'bed', message: '«Descansa, que la ladera cansa», te dijo Brasa. ¿Quieres descansar?' });
      },
    },
    examine('arcon_crisol', 1, 6, (s) => (s.flag(F.tizForge)
      ? 'El mueble de Brasa. En el cajón de abajo, envuelto en un paño, el crisol que ningún fuego funde.'
      : 'Un mueble viejo de cajones. El de abajo está cerrado con un cerrojo de hierro.'), { solid: true }),
    {
      id: 'abuelo_brasa', x: 10, y: 7, name: 'Abuelo', sprite: 'anil:anciano2', dir: 2, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await lines(ctx, 'Abuelo', ctx.flag(F.tizVents)
          ? ['¿Oyes el fuelle? Ese ruido es el que me ha dormido toda la vida.']
          : ['Mi nieta Brasa no duerme desde que se apagó la forja. Yo tampoco, pero yo ya no duermo por viejo.']);
      },
    },
  ];
}

export { HOUSE_ENTRY };
