// Gala del Museo de las Eras en el Hotel Mirador (docs/CAMPANA.md B09 punto 1; §5.2 primera aparición de Vértice;
// §6.2 «seducción de Genesis»; TABLILLAS §4.6 pista inicial de T06). Automática al llegar a Lúmina: un botones invita
// al jugador de parte del mecenas, el Dr. Aurelio Vértice (Fundación Meridiano). Vértice elogia en público el informe
// de Gael sobre las migraciones de Staravia y se dirige al jugador; Rosalía Quintana, la curadora, le pide que vuelva
// al museo de noche (pista T06). Gael se despide: le espera en la escalinata del museo (B3, b09a_gael.js).
import { F, SPEAKER, SPRITE, MUSIC, when, say, lines, byGender, npc, pause } from './b09a_common.js';
import { innkeeperEvent } from '../services/inn.js';
import { SPOTS, INTERIOR_ENTRY } from '../maps/b09a/lumina_layout.js';

const V = SPEAKER.vertice;
const R = SPEAKER.rosalia;
const G = SPEAKER.gael;

/** Puestos del salón (lumina_hotel, 26×22). */
export const HOTEL = Object.freeze({
  arrival: { x: 13, y: 10, dir: 8 }, // el jugador entra al salón con el botones
  vertice: { x: 13, y: 6, dir: 2 },
  host: { x: 10, y: 6, dir: 2 },
  rosalia: { x: 6, y: 9, dir: 6 },
  gael: { x: 19, y: 9, dir: 4 },
  guests: [[4, 8, 6], [8, 10, 8], [17, 10, 8], [21, 8, 4], [15, 7, 2], [3, 11, 6]],
  receptionist: { x: 20, y: 16, dir: 4 },
});

// ------------------------------------------------------------ invitación (exterior de Lúmina)
async function invitation(ctx) {
  if (ctx.flag(F.galaInvite) || ctx.flag(F.gala)) return;
  const bell = ctx.world.events.find((e) => e.id === 'botones_gala');
  const p = ctx.player;
  if (bell && Math.abs(bell.x - p.x) + Math.abs(bell.y - p.y) <= 14) {
    await ctx.emote(bell, '!');
    await ctx.approach(bell);
    ctx.turnToPlayer(bell);
    ctx.face('player', ctx.directionTo(p, bell));
  }
  await lines(ctx, SPEAKER.bellboy, [
    `¡Perdona! ¿Vienes de Ciudad Estrato? ¿Eres ${byGender(ctx.state, 'el chico', 'la chica')} que viaja con ese… acompañante verde?`,
    'Soy del Hotel Mirador. Está empezando la gala del Museo de las Eras, y el mecenas ha pedido que te invitemos en persona.',
    'El doctor Vértice, de la Fundación Meridiano. Dice que Lúmina le debe mucho a gente como tú. Por favor, acompáñame.',
  ]);
  ctx.setFlag(F.galaInvite);
  await ctx.fade('out', 24);
  await ctx.warp('lumina_hotel', HOTEL.arrival.x, HOTEL.arrival.y, HOTEL.arrival.dir, { fade: false });
  await ctx.fade('in', 24);
}

/** Botones del hotel (invitación) y disparador automático al entrar en Lúmina sin haber ido a la gala. */
export function galaInvitationEvents() {
  const pending = when({ none: [F.galaInvite, F.gala] });
  return [
    { id: 'botones_gala', x: SPOTS.bellboy.x, y: SPOTS.bellboy.y, name: SPEAKER.bellboy, sprite: SPRITE.bellboy, dir: SPOTS.bellboy.dir, move: 'still', when: pending, trigger: 'action', script: invitation },
    { id: 'gala_auto', x: 0, y: 0, trigger: 'auto', when: pending, script: invitation },
  ];
}

// ------------------------------------------------------------ la gala (Hotel Mirador)
const find = (ctx, id) => ctx.world.events.find((e) => e.id === id);

async function galaScene(ctx) {
  if (ctx.flag(F.gala)) return;
  const vertice = find(ctx, 'gala_vertice');
  const rosalia = find(ctx, 'gala_rosalia');
  const gael = find(ctx, 'gala_gael');
  ctx.bgm(MUSIC.gala, { fadeOutPrevious: 20 });
  ctx.face('player', 'up');
  await ctx.camera?.pan?.(HOTEL.vertice.x, HOTEL.vertice.y + 2, 30);
  await pause(ctx, 20);
  await lines(ctx, SPEAKER.host, [
    'Damas y caballeros: gracias a la Fundación Meridiano, el Museo de las Eras reabrirá muy pronto la sala «Antea, la ciudad de antes».',
    'Con ustedes, el mecenas de esta gala: el doctor Aurelio Vértice.',
  ]);
  await ctx.say('(Aplausos.)');
  await pause(ctx, 20);
  await lines(ctx, V, [
    'Gracias. Seré breve: los discursos largos son una forma de no escuchar.',
    'Un museo es una promesa. Lo que se guarda aquí no se pierde, y lo que no se pierde se puede entender.',
    'La Fundación solo quiere ayudar a entender. Comprender primero; decidir después.',
    'Permítanme una mención. Entre nosotros hay un joven que ha escrito el informe más riguroso que he leído sobre las migraciones de Staravia en Axis.',
    'Tres años de observaciones. Ni una sola suposición. Gael, ¿verdad? Eso es saber escuchar.',
  ]);
  if (gael) { ctx.face(gael, 'up'); await ctx.emote(gael, '…'); }
  await say(ctx, G, '…Gracias.');
  await say(ctx, V, 'Hay quien espera a que alguien le dé la palabra. Este informe no esperó. Disfruten de la gala.');
  await ctx.say('(Aplausos.)');
  await pause(ctx, 20);
  await ctx.camera?.reset?.(30);
  // Vértice baja del estrado y se acerca al jugador.
  if (vertice) {
    await ctx.move(vertice, ['down', 'down', 'down'], { through: true, speed: 3 });
    ctx.turnToPlayer(vertice);
  }
  await say(ctx, V, 'Así que tú eres quien lleva a ese… acompañante. Lúmina le debe mucho a la gente que escucha a las piedras.');
  await say(ctx, V, 'Espero que disfrutes de la ciudad. Tiene mucho que enseñar a quien sabe mirar.');
  if (vertice) {
    await ctx.move(vertice, ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'up', 'up', 'up', 'up', 'up', 'up', 'up'], { through: true, speed: 3.5 });
    ctx.erase(vertice);
  }
  // Rosalía, la curadora.
  if (rosalia) {
    await ctx.approach(rosalia);
    ctx.turnToPlayer(rosalia);
    ctx.face('player', ctx.directionTo(ctx.player, rosalia));
  }
  await lines(ctx, R, [
    'Rosalía Quintana, curadora del museo. Tranquilidad: yo no doy discursos.',
    'La Fundación paga la reapertura de la sala de Antea. Y se ha ofrecido a «restaurar» nuestra losa votiva en su laboratorio. Mañana mismo.',
    'Llevo cuarenta años en esto. No me fío de nadie que restaure con prisas.',
    'Aquí no puedo hablar. Ven al museo de noche, cuando cierre. Te abriré yo.',
  ]);
  await ctx.story.openClue('T06');
  // Gael se despide.
  if (gael) {
    await ctx.approach(gael);
    ctx.turnToPlayer(gael);
    ctx.face('player', ctx.directionTo(ctx.player, gael));
  }
  await lines(ctx, G, [
    'No he venido a mirar cuadros.',
    'Te espero en la escalinata del museo.',
  ]);
  if (gael) {
    await ctx.move(gael, ['down', 'down', 'down', 'down', 'down', 'down', 'down', 'down'], { through: true, speed: 4 });
    ctx.erase(gael);
  }
  if (rosalia) ctx.erase(rosalia);
  ctx.setFlag(F.gala);
  ctx.bgm(MUSIC.lumina, { fadeOutPrevious: 30 });
}

/** Eventos del Hotel Mirador. */
export function hotelEvents(h = HOTEL) {
  const during = when({ all: [F.galaInvite], none: [F.gala] });
  const guests = h.guests.map(([x, y, dir], i) => npc(`invitado_${i}`, x, y, SPRITE.guests[i % SPRITE.guests.length], 'Invitado', (s) => (s.flag(F.gala)
    ? [['La gala ha estado muy bien. El doctor Vértice ha pagado hasta los canapés.', 'Dicen que el museo va a reabrir la sala de Antea. Yo la visité de pequeño: había una losa que daba escalofríos.', 'El chico del informe de los Staravia se ha ido sin probar el postre.'][i % 3]]
    : ['Chist. Va a empezar el discurso.']), { dir, move: 'still', when: i < 3 ? undefined : during }));
  return [
    { id: 'gala_auto', x: 0, y: 0, trigger: 'auto', when: during, script: galaScene },
    { id: 'gala_vertice', x: h.vertice.x, y: h.vertice.y, name: V, sprite: SPRITE.vertice, dir: h.vertice.dir, move: 'still', when: during, trigger: 'action', script: galaScene },
    { id: 'gala_presentadora', x: h.host.x, y: h.host.y, name: SPEAKER.host, sprite: SPRITE.host, dir: h.host.dir, move: 'still', when: during, trigger: 'action', script: galaScene },
    { id: 'gala_rosalia', x: h.rosalia.x, y: h.rosalia.y, name: R, sprite: SPRITE.rosalia, dir: h.rosalia.dir, move: 'still', when: during, trigger: 'action', script: galaScene },
    { id: 'gala_gael', x: h.gael.x, y: h.gael.y, name: G, sprite: SPRITE.gael, dir: h.gael.dir, move: 'still', when: during, trigger: 'action', script: galaScene },
    ...guests,
    innkeeperEvent({
      id: 'recepcionista', x: h.receptionist.x, y: h.receptionist.y, dir: h.receptionist.dir, sprite: SPRITE.receptionist, storm: true,
      speaker: SPEAKER.receptionist, greeting: 'Hotel Mirador, buenas. Si quieres descansar, tenemos habitaciones con vistas a la Sima.',
    }),
    npc('botones_hotel', 11, 17, SPRITE.bellboy, SPEAKER.bellboy, (s) => (s.flag(F.gala)
      ? ['Si descansas hasta la noche, el museo ya habrá cerrado. Aunque la curadora siempre se queda la última.']
      : ['Pase, pase. La gala es en el salón.']), { dir: 2 }),
  ];
}

export { INTERIOR_ENTRY };
