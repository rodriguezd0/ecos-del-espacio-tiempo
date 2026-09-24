// Eventos exteriores de Villa Alba (B01 §4.2 y §4.4): carteles, vecinos, el policía del camino norte,
// la señal al salir del laboratorio y los límites de la salida sur. Textos del guion; el resto, neutros.
import { F, SPEAKER, SPRITE, CAST, when } from './b01_town_common.js';
import { POLICE_POST } from '../maps/b01/villa_alba_layout.js';

const P = SPEAKER.police;
const say = (ctx, speaker, text) => ctx.say(text, { speaker });
const sign = (id, x, y, text, skin) => ({ id, type: 'sign', x, y, text, ...(skin ? { skin } : {}) });
const TOWN_SKIN = 'sign hgss town';
const ROUTE_SKIN = 'sign hgss dir';

/** Fila de disparadores de contacto invisibles. */
function strip(prefix, xs, y, extra) {
  return xs.map((x) => ({ id: `${prefix}_${x}`, x, y, trigger: 'touch', ...extra }));
}

// ----------------------------------------------------------------------------- carteles

function signs() {
  const out = [
    sign('cartel_pueblo', 20, 30, 'VILLA ALBA\nDonde el bosque guarda sus piedras.', TOWN_SKIN),
    sign('cartel_ruta1', 25, 30, 'RUTA 1\nHacia el sur de Axis.', ROUTE_SKIN),
    sign('cartel_laberinto', 24, 12, `LABERINTO DE LA PROFUNDIDAD\nPropiedad de la familia ${CAST.owners}. Prohibido el paso.`, ROUTE_SKIN),
    sign('panel_lab', 39, 20, 'Laboratorio Pokémon del Prof. Alerce.'),
    sign('panel_lab_2', 39, 19, 'Laboratorio Pokémon del Prof. Alerce.'),
    sign('buzon_prota', 5, 25, 'Casa de \\PN.'),
    sign('buzon_gael', 12, 12, 'Casa de Gael.'),
  ];
  for (const x of [25, 26]) {
    out.push(sign(`tablon_${x}`, x, 24, 'TABLÓN DE ANUNCIOS\n«Mientras duren los temblores, se ruega no acercarse a los muros viejos del bosque.»'));
  }
  return out;
}

// ----------------------------------------------------------------------------- vecinos (§4.2)

async function elderTalk(ctx) {
  await say(ctx, 'Anciano', 'Estas piedras estaban aquí antes que el pueblo. Nadie sabe quién las puso. Mi abuelo decía que no había que moverlas… y aquí siguen.');
}

async function neighborTalk(ctx) {
  await say(ctx, 'Vecina', 'Hace tres noches el cielo del norte se puso verde un momento. Mi marido dice que fue un relámpago. Un relámpago verde, ¿tú has visto alguno?');
}

async function kidTalk(ctx) {
  if (ctx.flag(F.dex)) {
    await say(ctx, 'Niño', '¡Gael ha salido corriendo hacia el sur! Seguro que quiere llegar el primero.');
  } else if (ctx.flag(F.starter)) {
    await say(ctx, 'Niño', '¡Hala, ya tienes un Pokémon! Yo todavía tengo que esperar un montón…');
  } else {
    await say(ctx, 'Niño', '¡Gael ha ido al laboratorio muy temprano! Siempre llega antes que nadie.');
  }
}

function neighbors() {
  return [
    { id: 'anciano', x: 14, y: 14, sprite: 'anciano', dir: 4, move: 'look', trigger: 'action', script: elderTalk },
    { id: 'vecina', x: 28, y: 16, sprite: 'vecina', dir: 2, move: 'look', trigger: 'action', script: neighborTalk },
    { id: 'nino', x: 18, y: 19, sprite: 'nino', dir: 2, move: { wander: 2 }, freq: 4, trigger: 'action', script: kidTalk },
  ];
}

// ----------------------------------------------------------------------------- la señal (§4.4)

/** Al salir del laboratorio con el inicial: señal desde el norte, temblor y el seguidor mira al norte. */
async function signalScene(ctx) {
  await ctx.wait(16);
  ctx.audio?.playCoreSignal?.();
  const quake = ctx.shake(3, 6, 36);
  if (ctx.world.follower?.visible) {
    ctx.face('follower', 'up');
    await ctx.emote('follower', '!');
  }
  await quake;
  ctx.face('player', 'up');
  await ctx.wait(12);
  await ctx.say('Un sonido agudo, como un pitido que no termina de ser un grito, llega desde el norte.');
  ctx.setFlag(F.signal);
}

/** Junto al camino norte, tras la señal: el policía oye la segunda señal y entra en el laberinto. */
async function policeEntersScene(ctx) {
  ctx.face('player', 'up');
  ctx.face('policia', 'up');
  await ctx.wait(10);
  ctx.audio?.playCoreSignal?.();
  await ctx.shake(2, 6, 24);
  await ctx.emote('policia', '!');
  await say(ctx, P, '…¿Otra vez? Eso no es ningún muro cayéndose.');
  ctx.face('policia', 'down');
  await ctx.wait(10);
  await say(ctx, P, 'Tú, quédate aquí. Voy a echar un vistazo. Y ni se te ocurra seguirme.');
  const cop = ctx.world.events.find((e) => e.id === 'policia');
  const route = [];
  for (let y = cop ? cop.y : POLICE_POST.y; y > 0; y--) route.push('up');
  await ctx.move('policia', route, { speed: 4 });
  ctx.erase('policia');
  ctx.setFlag(F.policeIn);
}

// ----------------------------------------------------------------------------- el policía (§4.2, §4.4)

const POLICE_LINES = [
  'Alto ahí. Al otro lado está el Laberinto de la Profundidad. Es propiedad privada.',
  `Los dueños, los ${CAST.owners}, no viven en Villa Alba, y desde los temblores nos pidieron que nadie entre. Hay muros que no aguantan ni una mirada.`,
];

async function policeTalk(ctx) {
  if (ctx.flag(F.escorted)) {
    await say(ctx, P, 'El laberinto vuelve a estar cerrado. Y esta vez no pienso moverme de aquí.');
    return;
  }
  for (const line of POLICE_LINES) await say(ctx, P, line);
}

/** Casilla libre junto al policía: te detiene y te devuelve un paso. */
async function policeBlocks(ctx) {
  ctx.face('policia', ctx.player);
  await ctx.emote('policia', '!');
  await policeTalk(ctx);
  await ctx.move('player', ['down'], { through: false });
}

function police() {
  const guarding = (s) => !s.flag(F.policeIn) || s.flag(F.escorted);
  const listening = when({ all: [F.signal], none: [F.policeIn] });
  return [
    {
      id: 'policia', x: POLICE_POST.x, y: POLICE_POST.y, sprite: SPRITE.police, dir: 2, trigger: 'action',
      pages: [
        { when: guarding, dir: 2, move: 'still', script: policeTalk },
        { when: listening, dir: 8, move: 'still', script: policeEntersScene },
        { when: when({ all: [F.escorted] }), dir: 2, move: 'still', script: policeTalk },
      ],
    },
    { id: 'paso_policia', x: POLICE_POST.free.x, y: POLICE_POST.free.y, trigger: 'touch', when: guarding, script: policeBlocks },
    ...strip('escena_policia', [21, 22, 23, 24], POLICE_POST.y + 2, { when: listening, script: policeEntersScene }),
  ];
}

// ----------------------------------------------------------------------------- salida sur

async function southBlocked(ctx) {
  ctx.face('player', 'up');
  if (!ctx.flag(F.starter) || !ctx.state.party.length) {
    await ctx.say('Al sur empieza la Ruta 1, con su hierba alta llena de Pokémon salvajes. Sin un Pokémon, mejor no alejarse del pueblo.');
  } else {
    await ctx.say('El profesor Alerce os pidió que no os alejarais del pueblo todavía.');
  }
  await ctx.move('player', ['up'], { through: false });
}

function southExit() {
  return [
    ...strip('salida_sur', [20, 21, 22, 23, 24, 25], 32, { when: when({ none: [F.dex] }), script: southBlocked }),
    ...strip('sale_pueblo', [20, 21, 22, 23, 24, 25], 34, {
      when: when({ all: [F.dex], none: [F.leftTown] }),
      script: async (ctx) => { ctx.setFlag(F.leftTown); },
    }),
  ];
}

/** Todos los eventos exteriores de Villa Alba. */
export function villageEvents() {
  return [
    ...signs(),
    ...neighbors(),
    ...police(),
    ...southExit(),
    { id: 'senal', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.starter], none: [F.signal] }), script: signalScene },
  ];
}
