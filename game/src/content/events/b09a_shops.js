// Interiores de servicio de Ciudad Lúmina (docs/CAMPANA.md B09 «Regalos» y §1.3; POKEDEX §7.4): Iván en el Centro
// (pista T07), la guardería (Piedra Oval; Audinita tras T06), la tienda de trastos (objetos de intercambio; Rotom de
// noche), la pastelería (dulces; Milcery) y la estación central (tren regional tras P4). Los regalos esperan hasta
// recogerse (§2.6). Módulo puro salvo los guiones.
import { F, SPEAKER, SPRITE, when, say, lines, npc, isNight, byGender } from './b09a_common.js';
import { clerkEvent } from '../services/shop.js';
import { runDaycare } from '../services/daycare.js';

const I = SPEAKER.ivan;

// ------------------------------------------------------------ Centro Pokémon: Iván (T07)
async function ivanScene(ctx) {
  if (ctx.flag(F.ivan) || ctx.flag(F.gatePass)) return;
  await lines(ctx, I, [
    'Perdona. ¿Eres entrenador? Soy Iván, guardabosques de la Reserva del Delta, en la Ruta 14.',
    'Tenemos un problema. Un enjambre enorme ha levantado una colmena en mitad de la Reserva, fuera de temporada. Hemos tenido que cerrarla y sacar a los visitantes.',
    'He venido a buscar a alguien con Pokémon fuertes. Si la colmena no se va, tendré que quemarla. Y no quiero.',
    'Si te animas, te espero en la puerta de la Reserva, al sur de la ciudad.',
  ].map((t, i) => (i === 0 ? t.replace('entrenador', byGender(ctx.state, 'entrenador', 'entrenadora')) : t)));
  await ctx.story.openClue('T07');
  ctx.setFlag(F.ivan);
  const ev = ctx.world.events.find((e) => e.id === 'ivan_centro');
  if (ev) {
    await ctx.move(ev, ['down', 'down', 'down', 'right', 'right', 'right'], { through: true, speed: 4 });
    ctx.erase(ev);
  }
}

export function centerEvents() {
  return [
    { id: 'ivan_centro', x: 6, y: 8, name: I, sprite: SPRITE.ivan, dir: 6, move: 'still', trigger: 'action',
      when: when({ none: [F.ivan, F.gatePass, F.t07Done] }), script: ivanScene },
    npc('viajera_centro', 15, 8, SPRITE.neighbor, 'Viajera', (s) => (s.flag(F.p4)
      ? ['He venido en el tren desde Brontia. En la estación central se puede ir a cualquier ciudad que ya hayas visitado.']
      : ['Dicen que el tren volverá cuando Estrato deje de hundirse. Ojalá.']), { dir: 4 }),
    npc('chico_centro', 4, 11, SPRITE.child, 'Chico', ['En el Parque de las Eras salen Ralts. ¡Yo quiero uno que se convierta en Gallade!'], { dir: 8 }),
  ];
}

// ------------------------------------------------------------ Guardería
async function daycareGifts(ctx) {
  const K = SPEAKER.keeperF;
  if (!ctx.flag(F.ovalStone)) {
    await lines(ctx, K, [
      '¡Bienvenido a la guardería! Ahora mismo tenemos el patio lleno: no podemos cuidar más Pokémon hasta la temporada que viene.',
      'Pero toma esto, que aquí sobran. Dicen que ayuda a algunos Pokémon a crecer por la noche… o de día. Nunca me acuerdo.',
    ].map((t) => t.replace('Bienvenido', byGender(ctx.state, 'Bienvenido', 'Bienvenida'))));
    await ctx.giveItem('OVALSTONE', 1);
    ctx.setFlag(F.ovalStone);
    return;
  }
  if (ctx.flag(F.t06Done) && !ctx.flag(F.audinita)) {
    await lines(ctx, K, [
      '¡Tú eres quien ayudó a Rosalía en el museo! Toda la ciudad lo comenta.',
      'Hace años, un Audino venía cada noche a dormir a nuestro patio. Cuando se fue, dejó esta piedra entre la paja. Creo que tú sabrás qué hacer con ella.',
    ]);
    await ctx.giveItem('AUDINITE', 1);
    ctx.setFlag(F.audinita);
    await say(ctx, K, 'Por cierto: con tanta gente nueva en la ciudad, los Pokémon del patio ya tienen dueño. Volvemos a tener sitio para los tuyos.');
    return;
  }
  // DECIDIDO-DEV (docs/DECISIONES.md): la guardería abre cuando el patio se vacía, tras T06.
  if (ctx.flag(F.t06Done)) {
    await runDaycare(ctx, { speaker: K, greeting: 'Los Pokémon del patio se han hecho amigos. ¿Quieres que cuidemos de alguno de los tuyos?' });
    return;
  }
  await say(ctx, K, 'Los Pokémon del patio se han hecho amigos. Hasta el Wooloo, que al principio no dejaba que nadie se le acercara.');
}

export function daycareEvents() {
  return [
    { id: 'criadora', x: 9, y: 5, name: SPEAKER.keeperF, sprite: SPRITE.keeperF, dir: 2, move: 'still', trigger: 'action', script: daycareGifts },
    npc('criador', 5, 5, SPRITE.keeper, SPEAKER.keeper, (s) => (s.flag(F.t06Done)
      ? ['Mi mujer dice que el museo por fin está como tiene que estar. Yo solo sé que ahora viene más gente a ver el patio.']
      : ['Cuidar Pokémon es como cuidar un huerto: paciencia y agua. Y mucha paciencia.']), { dir: 2, move: 'still' }),
    npc('marill_guarderia', 11, 8, 'follower:MARILL:0:0', '', ['¡Marill!'], { move: { wander: 1 }, stepAnime: true }),
  ];
}

// ------------------------------------------------------------ Tienda de trastos (Rotom de noche)
/** Objetos de intercambio (POKEDEX §7.4: «tiendas y objetos en el suelo desde B09»). */
export const JUNK_STOCK = Object.freeze(['METALCOAT', 'PROTECTOR', 'ELECTIRIZER', 'MAGMARIZER', 'UPGRADE', 'DUBIOUSDISC',
  'REAPERCLOTH', 'PRISMSCALE', 'DEEPSEATOOTH', 'DEEPSEASCALE', 'WHIPPEDDREAM', 'SACHET']);

async function oldTv(ctx) {
  if (ctx.flag(F.rotom) || !isNight(ctx.state)) {
    await ctx.say(ctx.flag(F.rotom) ? 'La tele vieja. Desde que se fue el Rotom, ni se enciende.' : 'Una tele vieja con la pantalla rayada. No enciende.');
    return;
  }
  ctx.se?.('PC open');
  await ctx.flash?.([200, 120, 255], 12, 120);
  await ctx.say('¡La tele se enciende sola! En la pantalla aparece una cara naranja que sonríe…');
  ctx.cry?.('ROTOM');
  await ctx.say('¡Un Rotom sale de la tele y da vueltas a tu alrededor!');
  await lines(ctx, SPEAKER.dealer, [
    '¡Otra vez! Cada noche lo mismo: la tele, la nevera, el ventilador… Me funde las bombillas.',
    `Parece que le caes bien. Llévatelo, ${byGender(ctx.state, 'chaval', 'chavala')}, te lo regalo. Pero cuídalo: es un bicho listo.`,
  ]);
  if (!await ctx.givePokemon({ species: 'ROTOM', level: 20 })) return;
  ctx.setFlag(F.rotom);
}

export function junkShopEvents() {
  return [
    clerkEvent({
      id: 'chamarilero', x: 10, y: 5, dir: 2, sprite: SPRITE.dealer, items: JUNK_STOCK,
      greeting: 'Los Trastos de Lúmina. Cosas raras para Pokémon raros. Aquí nada tiene garantía.',
    }),
    { id: 'tele_vieja', x: 3, y: 4, trigger: 'action', noOver: true, solid: true, script: oldTv },
    { id: 'rotom_tele', x: 2, y: 5, name: 'Rotom',
      pages: [{ when: (s) => Boolean(s) && isNight(s) && !s.flag(F.rotom), sprite: SPRITE.rotom, dir: 2, move: 'still', stepAnime: true, through: true, trigger: 'action', script: oldTv }] },
    npc('cliente_trastos', 8, 8, SPRITE.neighborM, 'Cliente', ['Busco un Revestimiento Metálico para mi Onix. Aquí tienen de todo, pero nunca lo que buscas a la primera.'], { dir: 8 }),
  ];
}

// ------------------------------------------------------------ Pastelería (Milcery)
export const BAKERY_STOCK = Object.freeze(['CASTELIACONE', 'LAVACOOKIE', 'OLDGATEAU', 'LUMIOSEGALETTE', 'SHALOURSABLE',
  'STRAWBERRYSWEET', 'LOVESWEET', 'BERRYSWEET', 'CLOVERSWEET', 'FLOWERSWEET', 'STARSWEET', 'RIBBONSWEET']);

async function milcery(ctx) {
  ctx.cry?.('MILCERY');
  await lines(ctx, SPEAKER.baker, [
    'Ese Milcery se cuela cada mañana por la ventana de la cocina y se come la nata de los pasteles.',
    'Ya no sé si es mío o yo soy suyo. ¿Te lo llevas? Aquí se va a poner como una bola.',
  ]);
  if (!await ctx.givePokemon({ species: 'MILCERY', level: 15 })) return;
  ctx.setFlag(F.milcery);
}

export function bakeryEvents() {
  return [
    clerkEvent({
      id: 'pastelero', x: 10, y: 5, dir: 2, sprite: SPRITE.baker, items: BAKERY_STOCK,
      greeting: '¡El Horno de las Eras! Dulces para ti y para tus Pokémon. Recién hechos.',
    }),
    { id: 'milcery', x: 5, y: 6, name: 'Milcery',
      pages: [{ when: (s) => Boolean(s) && !s.flag(F.milcery), sprite: SPRITE.milcery, dir: 2, move: { wander: 1 }, stepAnime: true, trigger: 'action', script: milcery }] },
    npc('clienta_pasteleria', 4, 9, SPRITE.neighbor, 'Clienta', ['Los dulces de aquí tienen fama en todo Axis. Dicen que a algunos Pokémon les gustan tanto que cambian de forma.'], { dir: 6 }),
  ];
}

// ------------------------------------------------------------ Estación central
export function stationNpcEvents() {
  return [
    npc('revisor_lumina', 5, 11, 'anil:asistenta', 'Revisora', (s) => (s.flag(F.p4)
      ? ['Tren regional: Caudal, Brontia, Estrato, Lúmina y Nexo. Cada estación se activa en cuanto la visitas.']
      : ['El tren de Estrato no viene desde que se cerró el Paso del Derrumbe. La vía está cortada.']), { dir: 2 }),
    npc('viajero_lumina', 8, 12, 'anil:empresario', 'Viajero', ['Lúmina es la última parada antes del sur. Desde aquí, el delta y Ciudad Nexo.'], { dir: 8 }),
  ];
}
