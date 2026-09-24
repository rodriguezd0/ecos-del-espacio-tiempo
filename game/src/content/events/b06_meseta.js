// Eventos de la Meseta del Impulso (docs/CAMPANA.md B06 paso 1; §6.2 Gael «ayuda y curiosidad»): llegada con el
// Parque parado, Gael y los dos técnicos del Consorcio en la puerta (combate doble con Gael de aliado:
// Staravia 24 e inicial evolucionado 25 contra Magnemite 22 y Solosis 22), aerogeneradores (giran tras el P3),
// entrenadores, Cyclizar (visible fijo nv 24), la segunda oveja perdida y objetos.
import { F, V, SPEAKER, SPRITE, OBJ, MUSIC, lines, zygardeSays, gaelAllyParty, scriptedBattle, trainerLater } from './b06_common.js';
import { CYCLIZAR } from '../encounters/b06.js';
import { woolooStray } from './b06_wooloo.js';
import { MESETA, PARQUE } from '../maps/b06/layout.js';

const M = MESETA;

export const MESETA_TEXT = Object.freeze({
  turbineStill: 'Un aerogenerador del Parque. Sopla un viento fuerte, pero las aspas no se mueven.',
  turbineSpin: 'Las aspas giran con un zumbido suave. El Parque vuelve a dar luz.',
  sign: 'MESETA DEL IMPULSO\n↑ Parque Eólico · Anillo de los Vientos →',
  notice: 'CONSORCIO MERIDIANO DE ESTUDIOS GEOFÍSICOS\nParque Eólico de Brontia. Cerrado por mantenimiento.\nDisculpen las molestias.',
  noticeAfter: 'Alguien ha tachado «Consorcio Meridiano» y ha escrito debajo, a rotulador: «Genesis».',
});

// ------------------------------------------------------------ llegada

async function introScene(ctx) {
  if (ctx.flag(F.mesetaIntro)) return;
  ctx.setFlag(F.mesetaIntro);
  ctx.se('PRSFX- Gust', { volume: 60 });
  await ctx.camera.pan(M.colector.door.x, M.colector.door.y + 2, 50);
  await ctx.wait(20);
  await ctx.say('Sopla un viento que tumba. Aun así, los aerogeneradores del Parque están quietos.');
  await ctx.camera.reset(40);
  await zygardeSays(ctx, 'Ahí dentro hay algo mío. Y algo que lo sujeta.');
}

// ------------------------------------------------------------ combate doble

const guardsUp = (s) => Boolean(s) && !s.flag(F.double);

async function doubleScene(ctx) {
  if (ctx.flag(F.double)) return;
  const gael = ctx.world.events.find((e) => e.id === 'gael_puerta');
  const [ga, gb] = ['guarda_a', 'guarda_b'].map((id) => ctx.world.events.find((e) => e.id === id));
  await ctx.movePlayerTo(M.doubleSpot.x, M.doubleSpot.y, { through: false, speed: 3 });
  ctx.face('player', 'up');
  if (!ctx.flag(F.gaelMet)) {
    ctx.bgm(MUSIC.rival, { fadeOutPrevious: 20 });
    if (gael) {
      await ctx.move(gael, ['right', 'down'], { through: true, speed: 3.5 });
      gael.turnToward(ctx.player);
    }
    await lines(ctx, SPEAKER.gael, [
      'Tú también lo has notado.',
      'El Parque lleva semanas parado. Dicen que es mantenimiento. Mantenimiento de qué, si no hay nadie arreglando nada.',
    ]);
    if (gael) ctx.face(gael, 'up');
    await ctx.say('Zona de mantenimiento del Consorcio Meridiano. No se puede pasar.', { speaker: SPEAKER.tecnico });
    await ctx.say('Eso ya lo has dicho tres veces.', { speaker: SPEAKER.gael });
    await ctx.say('Y lo diremos una cuarta. Por favor, dense la vuelta.', { speaker: SPEAKER.tecnica });
    if (gael) gael.turnToward(ctx.player);
    await ctx.say('Yo me encargo de uno. Tú, del otro. Y no me estorbes.', { speaker: SPEAKER.gael });
    await ctx.say('Dos entrenadores. Bien. Procedimiento de contención.', { speaker: SPEAKER.tecnico });
    ctx.setFlag(F.gaelMet);
  } else {
    if (gael) gael.turnToward(ctx.player);
    await ctx.say('Otra vez. Esta vez, atento.', { speaker: SPEAKER.gael });
  }
  const outcome = await scriptedBattle(ctx, {
    type: 'trainer', format: 'double', trainers: ['b06_tecnico_puerta', 'b06_tecnica_puerta'],
    ally: { name: 'Gael', party: gaelAllyParty(ctx.state), skill: 48 }, bgm: MUSIC.grunt,
  }, M.doubleSpot);
  if (outcome !== 'win') return;
  ctx.setFlag(F.double);
  await ctx.say('Incidencia registrada. Nos retiramos al interior.', { speaker: SPEAKER.tecnica });
  for (const g of [ga, gb]) if (g) ctx.move(g, ['up', 'up', 'up', 'up', 'up'], { through: true, speed: 4, wait: false });
  await ctx.wait(40);
  for (const g of [ga, gb]) if (g) ctx.erase(g);
  if (gael) {
    gael.turnToward(ctx.player);
    await lines(ctx, SPEAKER.gael, [
      'No ha estado mal.',
      'Voy a dar la vuelta por detrás. Tú, por la puerta grande. Si hay algo ahí dentro, lo veremos antes que nadie.',
    ]);
    // Se va por el oeste, a lo largo de la valla (sin atravesarla), para dar la vuelta al recinto.
    await ctx.move(gael, ['left', 'left', 'left', 'left', 'left', 'left', 'left'], { through: true, speed: 4 });
    ctx.erase(gael);
  }
  ctx.bgm(MUSIC.wind, { fadeOutPrevious: 30 });
}

function gateEvents() {
  const strip = [M.gate.x0, (M.gate.x0 + M.gate.x1) / 2, M.gate.x1].map((x) => ({
    id: `puerta_parque_${x}`, x, y: M.gate.y + 2, trigger: 'touch', through: true, when: guardsUp, script: doubleScene,
  }));
  strip.push({ id: 'puerta_parque_dentro', x: (M.gate.x0 + M.gate.x1) / 2, y: M.gate.y + 1, trigger: 'touch', through: true, when: guardsUp, script: doubleScene });
  return [
    {
      id: 'gael_puerta', x: M.gael.x, y: M.gael.y, name: SPEAKER.gael,
      pages: [{ when: guardsUp, sprite: SPRITE.gael, dir: M.gael.dir, move: 'still', trigger: 'action', script: doubleScene }],
    },
    ...M.guards.map((g, i) => ({
      id: i === 0 ? 'guarda_a' : 'guarda_b', x: g.x, y: g.y, name: i === 0 ? SPEAKER.tecnico : SPEAKER.tecnica,
      pages: [{
        when: guardsUp, sprite: i === 0 ? SPRITE.tecnico : SPRITE.tecnica, dir: g.dir, move: 'still', trigger: 'action', script: doubleScene,
      }],
    })),
    ...strip,
  ];
}

// ------------------------------------------------------------ Parque, Cyclizar y detalles

function turbineEvents() {
  return M.turbines.map(([x, y], i) => ({
    id: `aerogenerador_${i}`, x, y, name: 'Aerogenerador',
    pages: [
      { sprite: OBJ.turbine, dir: 2, directionFix: true, stepAnime: false, pattern: i % 4, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MESETA_TEXT.turbineStill); } },
      { when: (s) => Boolean(s) && s.flag(F.restored), sprite: OBJ.turbine, dir: 2, directionFix: true, stepAnime: true, speed: 3 + (i % 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MESETA_TEXT.turbineSpin); } },
    ],
  }));
}

function cyclizarEvent() {
  const visible = (s) => Boolean(s) && !s.flag('b06_cyclizar_capturado') && s.var('rest_count', 0) > s.var(V.cyclizarRest, -1);
  return {
    id: 'cyclizar', x: 37, y: 30, name: 'Cyclizar',
    pages: [{
      when: visible, sprite: SPRITE.cyclizar, dir: 4, move: { wander: 3 }, speed: 4, freq: 5, stepAnime: true, trigger: 'action',
      script: async (ctx) => {
        ctx.cry(CYCLIZAR.species);
        await ctx.say('¡El Cyclizar te mira con cara de pocos amigos y ruge!');
        const outcome = await ctx.wildBattle({ species: CYCLIZAR.species, level: CYCLIZAR.level });
        if (outcome === 'caught') ctx.setFlag('b06_cyclizar_capturado');
        else if (outcome === 'win') ctx.setVar(V.cyclizarRest, ctx.var('rest_count', 0));
      },
    }],
  };
}

function trainerEvents() {
  const restored = (s) => s.flag(F.restored);
  return [
    trainerLater({
      id: 'veterana_julia', trainer: 'b06_veterana_julia', name: 'Veterana Julia', sprite: 'anil:veterana',
      x: 20, y: 33, dir: 4, sight: 4,
      intro: 'El viento de la meseta pone a prueba a cualquiera. Veamos cuánto aguantas.',
      after: 'Llevo treinta años subiendo aquí. Nunca había visto el Parque tan callado.',
    }, restored, 'Escucha las aspas. Treinta años subiendo aquí, y así es como tiene que sonar la meseta.'),
    trainerLater({
      id: 'mecanica_sonia', trainer: 'b06_mecanica_sonia', name: 'Mecánica Sonia', sprite: 'anil:mecanica',
      x: 34, y: 21, dir: 2, sight: 3,
      intro: '¿Vienes a ver el Parque? Yo trabajaba ahí. Hasta que llegaron esos.',
      after: 'El Consorcio firmó con el ayuntamiento el mantenimiento del Parque. Desde entonces no produce ni una bombilla.',
    }, restored, '¡El Parque vuelve a dar luz! Ya sabía yo que aquello no era mantenimiento.'),
  ];
}

function detailEvents() {
  return [
    { id: 'cartel_meseta', type: 'sign', x: 5, y: 27, text: MESETA_TEXT.sign, skin: 'sign hgss dir' },
    ...[21, 22].map((x) => ({
      id: `aviso_parque_${x}`, x, y: 21, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        await ctx.say(MESETA_TEXT.notice);
        if (ctx.flag(F.casiaMet)) await ctx.say(MESETA_TEXT.noticeAfter);
      },
    })),
    { id: 'objeto_meseta_1', type: 'item', x: 42, y: 44, item: 'SUPERREPEL' },
    // Puerta de la nave del Colector (la casilla de la puerta del stamp no se pisa: se entra al empujarla).
    {
      id: 'puerta_colector', x: M.colector.door.x, y: M.colector.door.y, trigger: 'touch',
      script: async (ctx) => { await ctx.warp('parque_eolico', PARQUE.entry.x, PARQUE.entry.y, PARQUE.entry.dir, { door: true }); },
    },
    { id: 'objeto_meseta_2', type: 'item', x: 44, y: 37, item: 'REVIVE', hidden: true },
    { id: 'objeto_meseta_3', type: 'item', x: 4, y: 5, item: 'PRETTYFEATHER' },
    { id: 'objeto_meseta_4', type: 'item', x: 12, y: 42, item: 'SITRUSBERRY', hidden: true },
    // Llegada desde la Ruta 5 (franja del borde oeste).
    ...[22, 23, 24, 25].map((y) => ({
      id: `llegada_${y}`, x: 2, y, trigger: 'touch', through: true, when: (s) => Boolean(s) && !s.flag(F.mesetaIntro), script: introScene,
    })),
  ];
}

export function mesetaEvents() {
  return [
    ...gateEvents(),
    ...turbineEvents(),
    cyclizarEvent(),
    ...trainerEvents(),
    ...detailEvents(),
    woolooStray(2, { x: 6, y: 33 }),
  ];
}
