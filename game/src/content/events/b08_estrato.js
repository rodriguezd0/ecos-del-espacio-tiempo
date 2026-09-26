// Ciudad Estrato (docs/CAMPANA.md B08): la llegada (un temblor), la discusión de Fermín y Sol Galena con la
// representante del Consorcio ante la mina («Problema humano»), Sol pidiendo que alguien baje con su padre, y tras el
// P4 la escena de la cooperativa: la opción de compra caduca («exigía estabilidad del suelo y el suelo ya es estable
// por el Pilar, no por ellos»), Fermín y Sol eligen una cooperativa minera y Fermín regala los fósiles y da la segunda
// pista de T05. Vecinos, mercado de minerales (tras el P4), vía y enlaces pendientes. Noche y temblores:
// b08_estrato_night.js · Torneo del Pulso (T05): b08_t05.js.
import { F, SPEAKER, SPRITE, OBJ, lines, byGender, examine, findEvent, blockedLink, rectCells } from './b08_common.js';
import { estratoNightEvents } from './b08_estrato_night.js';
import { t05Events } from './b08_t05.js';
import { clerkEvent } from '../services/shop.js';
import { ESTRATO as E } from '../maps/b08/layout.js';
import { mapRegistered, blockedText } from '../maps/b08/links.js';

const A = E.argument;
const C = E.coop;

export const ESTRATO_TEXT = Object.freeze({
  townSign: 'CIUDAD ESTRATO\nLa ciudad de las vetas.',
  mineSign: 'MINA GALENA\nExplotación de la familia Galena.',
  schoolSign: 'ESCUELA DEL PICO\nFundada por los mineros para sus hijos.',
  consorcioSign: 'CONSORCIO MERIDIANO DE ESTUDIOS GEOFÍSICOS\nOficina de campo de Estrato.',
  stationSign: 'ESTACIÓN DE ESTRATO\nLínea regional: Caudal · Brontia · Estrato · Lúmina · Nexo.',
  marketClosed: 'MERCADO DE MINERALES\nCerrado hasta nuevo aviso. «Mientras la tierra se mueva, no se vende piedra.»',
  rail: 'La vía del tren. Las traviesas están torcidas por los temblores.',
  railAfter: 'La vía del tren, recién enderezada. Huele a grasa nueva.',
});

// ───────────────────────────── Llegada ─────────────────────────────

async function arrival(ctx) {
  ctx.setFlag(F.arrival);
  await ctx.wait(20);
  ctx.se('PRSFX- Earthquake', { volume: 55 });
  ctx.shake(3, 5, 50);
  await ctx.wait(40);
  await ctx.say('El suelo tiembla bajo tus pies… y vuelve a quedarse quieto. Nadie en la calle parece sorprendido.');
}

// ───────────────────────────── La discusión ante la mina ─────────────────────────────

async function argumentScene(ctx) {
  if (ctx.flag(F.argument)) return;
  const fermin = findEvent(ctx, 'fermin_discusion');
  const sol = findEvent(ctx, 'sol_discusion');
  const rep = findEvent(ctx, 'rep_discusion');
  if (rep) rep.turnToward(fermin || ctx.player);
  await lines(ctx, SPEAKER.rep, [
    'La oferta sigue en pie, señor Galena. La mina y los terrenos del Cerro Plomo.',
    'El Consorcio se ocupa de estabilizar el suelo. Ustedes, de nada más. Es una oferta muy generosa.',
  ]);
  await lines(ctx, SPEAKER.fermin, ['Le prometí a mi padre que la Galena no se vende. Y él se lo prometió al suyo.']);
  if (sol && fermin) sol.turnToward(fermin);
  await lines(ctx, SPEAKER.sol, [
    '¿Y a los cuarenta mineros qué les prometes, papá? El techo baja un dedo cada noche.',
    'Si vendemos, al menos este año cobran todos.',
  ]);
  await lines(ctx, SPEAKER.fermin, ['Lo que prometo es que nadie de fuera va a meter una broca en mi mina.']);
  await lines(ctx, SPEAKER.rep, ['Ya hay un equipo trabajando en la galería lateral. Estudio del terreno. Con permiso municipal.']);
  if (fermin) await ctx.emote(fermin, '!');
  await lines(ctx, SPEAKER.fermin, ['¿Cómo que en la galería lateral?']);
  if (fermin) {
    await ctx.move(fermin, ['up', 'up'], { through: true, speed: 4.5 });
    ctx.se('Door enter');
    ctx.erase(fermin);
  }
  if (rep) {
    rep.turnToward(ctx.player);
    await lines(ctx, SPEAKER.rep, ['Consorcio Meridiano de Estudios Geofísicos. Que tenga un buen día.']);
    await ctx.move(rep, ['left', 'left', 'left', 'down', 'down', 'down'], { through: true, speed: 4 });
    ctx.erase(rep);
  }
  if (sol) sol.turnToward(ctx.player);
  await lines(ctx, SPEAKER.sol, [
    '…Perdona el espectáculo. Soy Sol. Sol Galena.',
    'Mi padre no escucha a nadie. A lo mejor a ti sí: tú no eres de aquí.',
    (s) => `Baja con él, por favor. ${byGender(s, 'Si eres entrenador', 'Si eres entrenadora')}, allí abajo te va a hacer falta. Si se pelea con esa gente…`,
  ]);
  ctx.setFlag(F.argument);
}

async function solYard(ctx) {
  if (!ctx.flag(F.garrido)) {
    await ctx.say('Baja con él, por favor. La galería lateral está al este, pasada la galería grande.', { speaker: SPEAKER.sol });
    return;
  }
  await ctx.say('¿Mi padre? ¿Al Cerro Plomo? …Siempre el Cerro. Toda la vida con el Cerro.', { speaker: SPEAKER.sol });
}

function argumentEvents() {
  const before = (s) => Boolean(s) && !s.flag(F.argument);
  const script = argumentScene;
  return [
    { id: 'fermin_discusion', x: A.fermin.x, y: A.fermin.y, name: SPEAKER.fermin, pages: [{ when: before, sprite: SPRITE.fermin, dir: A.fermin.dir, trigger: 'action', script }] },
    {
      id: 'sol_discusion', x: A.sol.x, y: A.sol.y, name: SPEAKER.sol,
      pages: [
        { when: before, sprite: SPRITE.sol, dir: A.sol.dir, trigger: 'action', script },
        { when: (s) => Boolean(s) && s.flag(F.argument) && !s.flag(F.ferminCerro), sprite: SPRITE.sol, dir: 8, trigger: 'action', script: solYard },
      ],
    },
    { id: 'rep_discusion', x: A.rep.x, y: A.rep.y, name: SPEAKER.rep, pages: [{ when: before, sprite: SPRITE.rep, dir: A.rep.dir, trigger: 'action', script }] },
    // Antes de la discusión, la boca de la mina no deja pasar: se dispara la escena (empujar contra la puerta).
    { id: 'boca_mina', x: E.mine.door.x, y: E.mine.door.y, pages: [{ when: before, trigger: 'touch', script }] },
    // Y también al acercarse por delante de la boca.
    ...rectCells(E.mine.door.x - 1, E.mine.door.y + 2, 3, 1).map(([x, y]) => ({
      id: `frente_mina_${x}`, x, y, pages: [{ when: before, through: true, trigger: 'touch', script }],
    })),
  ];
}

// ───────────────────────────── La cooperativa (tras el P4) ─────────────────────────────

async function coopScene(ctx) {
  if (ctx.flag(F.coop)) return;
  await ctx.fade('out', 20);
  ctx.player.moveTo(C.player.x, C.player.y);
  ctx.player.direction = C.player.dir;
  for (const f of ctx.world.followers || []) f.moveTo?.(C.player.x, C.player.y + 1);
  await ctx.wait(4);
  await ctx.fade('in', 20);
  const fermin = findEvent(ctx, 'coop_fermin');
  const sol = findEvent(ctx, 'coop_sol');
  const rep = findEvent(ctx, 'coop_rep');
  await lines(ctx, SPEAKER.fermin, [(s) => `¡Ahí ${byGender(s, 'está el chaval', 'está la chavala')} del Cerro! Ven, ven. Estábamos esperándote.`]);
  if (rep) rep.turnToward(fermin || ctx.player);
  await lines(ctx, SPEAKER.rep, [
    'Señor Galena. Señorita Galena. Traigo una comunicación del Consorcio.',
    'La opción de compra incluía una cláusula: el Consorcio adquiría la mina y los terrenos para estabilizar el suelo.',
    'El suelo es estable desde esta mañana. Sin intervención nuestra.',
    'La opción ha caducado. Nuestro estudio, en cambio, ha concluido: esta mañana registramos todo lo que necesitábamos.',
    'El Consorcio agradece a Estrato su colaboración. Buenos días.',
  ]);
  if (rep) { await ctx.move(rep, ['right', 'right', 'right', 'down', 'down', 'down', 'down'], { through: true, speed: 4 }); ctx.erase(rep); }
  await lines(ctx, SPEAKER.sol, ['…Se van.']);
  if (fermin) fermin.turnToward(ctx.player);
  await lines(ctx, SPEAKER.fermin, ['No ha sido gracias a ellos.']);
  if (sol && fermin) { sol.turnToward(fermin); fermin.turnToward(sol); }
  await lines(ctx, SPEAKER.sol, [
    'Papá. La mina no la vendemos. Pero tampoco la vas a llevar tú solo, cargando con todo como el abuelo.',
  ]);
  await lines(ctx, SPEAKER.fermin, ['¿Y qué propones?']);
  await lines(ctx, SPEAKER.sol, ['Una cooperativa. Cada minero, una parte. Las decisiones, entre todos. Y la promesa, también entre todos.']);
  await lines(ctx, SPEAKER.fermin, [
    '…Una cooperativa. Mi padre se habría enfadado muchísimo.',
    '…Y luego habría dicho que sí.',
  ]);
  ctx.se('Exclaim');
  await ctx.say('¡Por la Galena!', { speaker: 'Mineros' });
  if (fermin) fermin.turnToward(ctx.player);
  await lines(ctx, SPEAKER.fermin, [
    'Ten. Esta mañana, cuando dejó de temblar, aparecieron estos en la galería honda.',
    'Mi padre decía que eran huesos de bichos de antes de que hubiera Estrato. En el museo de Lúmina dicen que saben despertarlos.',
  ]);
  await ctx.giveItem('SKULLFOSSIL');
  await ctx.giveItem('ARMORFOSSIL');
  ctx.setFlag(F.fossils);
  await lines(ctx, SPEAKER.fermin, [
    'Y lo de la inscripción del Pilar: «La quinta tabla se gana con las manos».',
    'Aquí eso solo puede ser una cosa: la Losa del Pulso. Esa piedra de la plaza donde los mineros echan pulsos desde hace siglos.',
  ]);
  await ctx.story.advanceClue('T05', 2);
  ctx.setFlag(F.t05Hint);
  await lines(ctx, SPEAKER.sol, [
    'Y hay más: con el suelo quieto, la vía vuelve a estar derecha. Esta tarde sale el primer tren.',
    'Los mineros ya han bajado al Paso del Derrumbe de la Ruta 7 a despejarlo. Por fin se podrá ir a Lúmina.',
  ]);
  ctx.setFlag(F.coop);
}

function coopEvents() {
  const scene = (s) => Boolean(s) && s.flag(F.restored) && !s.flag(F.coop);
  const actor = (id, sprite, p, name) => ({ id, x: p.x, y: p.y, name, pages: [{ when: scene, sprite, dir: p.dir, trigger: 'action', script: coopScene }] });
  return [
    { id: 'escena_cooperativa', x: 1, y: 1, pages: [{ when: scene, trigger: 'auto', script: coopScene }] },
    actor('coop_fermin', SPRITE.fermin, C.fermin, SPEAKER.fermin),
    actor('coop_sol', SPRITE.sol, C.sol, SPEAKER.sol),
    actor('coop_rep', SPRITE.rep, C.rep, SPEAKER.rep),
    ...C.miners.map(([x, y, dir], i) => actor(`coop_minero_${i}`, i % 2 ? SPRITE.minera : SPRITE.minero, { x, y, dir }, 'Minero')),
  ];
}

// ───────────────────────────── Vecinos ─────────────────────────────

function npc(id, x, y, sprite, dir, speaker, before, after, extra = {}) {
  return {
    id, x, y, name: speaker, sprite, dir, move: extra.move || 'look', ...extra,
    script: async (ctx) => {
      const list = ctx.flag(F.restored) ? after : before;
      for (const t of [].concat(list)) await ctx.say(typeof t === 'function' ? t(ctx.state) : t, { speaker });
    },
  };
}

function neighborEvents() {
  return [
    npc('vecina_plaza', 21, 23, SPRITE.vecina, 6, SPEAKER.vecina,
      ['Mi casa se ha hundido dos dedos esta semana. El marco de la puerta ya no cierra.', 'Dicen que es la mina. Los de la mina dicen que es el Cerro. Y el Cerro no dice nada.'],
      ['Esta mañana la puerta ha vuelto a cerrar. ¡Sola! Como si la casa hubiera suspirado.']),
    npc('anciano_plaza', 31, 23, SPRITE.anciano, 4, SPEAKER.vecino,
      ['De noche las piedras de la calle se levantan un palmo. Flotan un rato y vuelven a caer. Mi nieto dice que es magia. Yo digo que es mala señal.'],
      ['Anoche me quedé despierto esperando a las piedras. No flotó ni una. Menos mal: no pegué ojo por nada.']),
    npc('nino_escuela', 30, 10, SPRITE.nino, 2, SPEAKER.nino,
      ['La maestra Herminia dice que cuando sea mayor me iré de Estrato, como todos. Yo no quiero irme.'],
      [(s) => `¡Dicen que ${byGender(s, 'un entrenador', 'una entrenadora')} ha arreglado el suelo! ¿Eras tú? ¿Me enseñas tu Pokédex?`]),
    npc('minero_calle', 12, 39, SPRITE.minero, 6, SPEAKER.minero,
      ['El Consorcio ofrece comprarlo todo: la mina, el Cerro, hasta el aire. Y a nosotros, «recolocarnos».'],
      ['Cooperativa. Yo, dueño de un trocito de la Galena. Mi mujer no se lo cree.']),
    npc('minera_patio', 42, 27, SPRITE.minera, 4, SPEAKER.minera,
      ['Esa vía la tendió el abuelo de Fermín. Ahora las vagonetas descarrilan cada dos por tres: el suelo se tuerce.'],
      ['Vía enderezada, vagonetas en marcha. ¡Así da gusto!']),
    npc('viajero_estacion', 14, 10, SPRITE.vecino, 4, 'Viajero',
      ['El tren no pasa desde que se hundió la vía. Llevo dos semanas esperando para ir a Lúmina.'],
      ['¡Vuelve el tren! Estrato, Lúmina, Nexo… Y de Caudal a Brontia sin pisar el cañón.']),
    npc('mujer_baja', 27, 40, SPRITE.vecina, 8, SPEAKER.vecina,
      ['Mi hija se fue a Nexo el año pasado. Aquí ya no queda trabajo… y ahora ni suelo.'],
      ['Le he escrito a mi hija. Que vuelva a ver la ciudad: ya no tiembla.']),
  ];
}

// ───────────────────────────── Mercado, vía, carteles y enlaces ─────────────────────────────

function marketEvents() {
  const v = E.market.vendor;
  const open = (s) => Boolean(s?.flag(F.restored));
  return [
    { ...clerkEvent({ id: 'mercader_minerales', x: v.x, y: v.y, dir: v.dir, sprite: SPRITE.mercader, items: ['DAWNSTONE', 'DUSKSTONE', 'SHINYSTONE', 'EVERSTONE', 'HARDSTONE'], greeting: '¡Mercado de minerales! Piedras de evolución y minerales recién sacados de la veta.' }), name: SPEAKER.mercader, when: open },
    { id: 'cartel_mercado', x: v.x, y: v.y, pages: [{ when: (s) => !open(s), trigger: 'action', solid: true, noOver: true, script: async (ctx) => { await ctx.say(ESTRATO_TEXT.marketClosed); } }] },
  ];
}

function railEvents() {
  const out = [];
  for (let x = E.rail.x0; x <= E.rail.x1; x++) {
    const stop = x === E.rail.x1;
    out.push({
      id: `via_${x}`, x, y: E.rail.y, sprite: OBJ.rail, dir: 2, pattern: stop ? 1 : 0, directionFix: true, walkAnime: false, shadow: false, solid: true,
      trigger: 'action', script: async (ctx) => { await ctx.say(ctx.flag(F.restored) ? ESTRATO_TEXT.railAfter : ESTRATO_TEXT.rail); },
    });
  }
  return out;
}

function signEvents() {
  return [
    examine('cartel_ciudad', 23, 3, ESTRATO_TEXT.townSign, { solid: true }),
    examine('cartel_ciudad_oeste', 3, 21, ESTRATO_TEXT.townSign, { solid: true }),
    examine('cartel_escuela', 32, 8, ESTRATO_TEXT.schoolSign, { solid: true }),
  ];
}

function pendingLinkEvents() {
  const out = [];
  if (!mapRegistered('ruta_6')) {
    out.push(...blockedLink('enlace_ruta6', rectCells(E.north.x0, 0, E.north.x1 - E.north.x0 + 1, 1), blockedText('ciudad_estrato', 'ruta_6'), 'down', 8));
  }
  if (!mapRegistered('ruta_7')) {
    out.push(...blockedLink('enlace_ruta7', rectCells(0, E.west.y0, 1, E.west.y1 - E.west.y0 + 1), blockedText('ciudad_estrato', 'ruta_7'), 'right', 4));
  }
  return out;
}

export async function estratoOnEnter(ctx) {
  // La estación se activa al visitar la ciudad (world/transport.js lee state.visited); nada más que hacer al entrar.
  if (!ctx.state.data.visited?.includes('ciudad_estrato')) ctx.requestRefresh();
}

export function estratoEvents() {
  return [
    { id: 'escena_llegada', x: 1, y: 2, pages: [{ when: (s) => Boolean(s) && !s.flag(F.arrival), trigger: 'auto', script: arrival }] },
    ...argumentEvents(),
    ...coopEvents(),
    ...neighborEvents(),
    ...marketEvents(),
    ...railEvents(),
    ...signEvents(),
    ...pendingLinkEvents(),
    ...estratoNightEvents(),
    ...t05Events(),
    { id: 'objeto_estrato_1', type: 'item', x: 3, y: 30 - 2, item: 'ETHER', hidden: true },
    { id: 'objeto_estrato_2', type: 'item', x: 51, y: 28, item: 'HARDSTONE' },
    { id: 'objeto_estrato_3', type: 'item', x: 5, y: 41, item: 'GREATBALL', count: 3 },
  ];
}
