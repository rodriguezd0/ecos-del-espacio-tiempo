// Registeel (docs/CAMPANA.md B22: «Cueva Sellada del Engranaje (túneles viejos de Lúmina) · Reloj restaurado con
// Rosalía · Nv 70»). Postgame:
//   1. Sala de las Crónicas (auto): Rosalía Quintana, la curadora, recuerda una entrada del inventario de 1962 —«Reloj
//      de la galería vieja. No se traslada. No se toca.»— y un «tic» que oyó bajo el sótano. Baja al muelle.
//   2. Sótano (muelle de carga): Rosalía abre el montacargas viejo de los túneles de servicio.
//   3. Túneles viejos (lumina_tuneles): el reloj de pie está sin maquinaria. Hay que encontrar el péndulo, la rueda de
//      escape y la pesa (una galería sur tapada por cascotes: Embestida). Rosalía lo restaura; su maquinaria mueve el
//      engranaje de la puerta de acero, que se abre: la Cueva Sellada del Engranaje, con Registeel.
// El museo es de B09a: se añaden estos eventos con una línea en cada mapa (cambios mínimos y aditivos).
import {
  F, V, LEGENDS, SPEAKER, SPRITE, OBJ, MUSIC, postgame, lines, zygardeSays, pause, eventById, legendPresent, examine,
} from './b22d_common.js';
import { CLOCK_PARTS, PART_NAMES, hasPart, addPart, clockComplete, missingParts } from './b22d_logic.js';
import { legendBattle } from './b22d_battle.js';
import { steleEvents } from './b22d_regirock.js';
import { HOOKS, TUNELES } from '../maps/b22d/layout.js';

const T = TUNELES;
const ROS = { speaker: SPEAKER.rosalia };

export const REGISTEEL_TEXT = Object.freeze({
  gallery: [
    'Ah, justo a tiempo. Tranquilidad: no es un discurso. Es un inventario.',
    'En el inventario de 1962 hay una entrada que nunca he entendido: «Reloj de la galería vieja. No se traslada. No se toca.»',
    'La galería vieja son los túneles de servicio de debajo del museo, de antes del tren. Los cerraron hace décadas, pero el montacargas del muelle todavía baja.',
    'Anoche, con el sótano en silencio, oí algo ahí abajo. Tic. Solo uno. Un reloj parado no hace tic.',
    'Los relojes antiguos son mi debilidad. Te espero en el muelle de carga, junto al montacargas.',
  ],
  dock: [
    'El montacargas de la galería vieja. Hace treinta años que nadie lo usa.',
    'Baja tú primero. Yo voy detrás: con estas rodillas, la escalerilla es un asunto serio.',
  ],
  lift: 'La reja del montacargas viejo. Debajo, una escalerilla de hierro se pierde en la oscuridad.',
  liftClosed: 'Una reja de hierro cerrada con un candado oxidado. Pone «SERVICIO».',
  liftAsk: '¿Bajar a los túneles viejos?',
  arrive: 'Túneles de servicio abandonados. Huele a hierro viejo y a polvo. Al fondo, algo hace tic.',
  clockBroken: 'Un reloj de pie enorme, empotrado en la pared. Las agujas se pararon a las cuatro menos trece… y por dentro está vacío.',
  clockRunning: 'El reloj de la galería vieja. Tic, tac. Da la hora con una voz grave que se oye en todos los túneles.',
  rosaliaFirst: [
    'Aquí está. «No se traslada. No se toca.» Pues alguien lo tocó: le falta toda la maquinaria de dentro.',
    'El péndulo, la rueda de escape y una pesa. Sin eso, un reloj es un mueble muy caro.',
    'Tienen que estar por los túneles: con los derrumbes se desperdigaría todo. Tráemelas y yo me encargo del resto.',
    'Y mira esa puerta de acero, al este. Tiene un engranaje en medio, partido en dos. Apostaría a que va unida al reloj.',
  ],
  rosaliaMissing: (list) => `Aún faltan ${list}. Sin eso no hay nada que hacer.`,
  rosaliaReady: 'El péndulo, la rueda y la pesa. Bien. Ahora, silencio, por favor: esto es lo mío.',
  restored: 'Listo. Le he dado cuerda. Escucha.',
  chime: 'El reloj da la hora. Detrás de la pared, algo muy grande empieza a girar.',
  door: [
    '¿Lo ves? «No se traslada. No se toca.» No era un reloj: era una cerradura con horario.',
    'Yo me quedo con él. Hace muchos años que nadie le escucha dar la hora.',
  ],
  core: 'Detrás de esa puerta duerme algo hecho de acero. Oye el reloj.',
  waiting: 'Ve. Yo me quedo escuchando el reloj. Tic, tac. Qué maravilla.',
  after: 'Habrá que actualizar el inventario: «Reloj de la galería vieja. Funciona.» Me vuelvo arriba, que el museo no se cuida solo.',
  part: (name) => `¡Has encontrado ${name}! Lo guardas para Rosalía.`,
  doorClosed: 'Una puerta de acero con un engranaje en relieve partido por la mitad. No tiene cerradura: no hay dónde meter una llave.',
  sign: 'Un cartel esmaltado, medio borrado: «GALERÍA DE SERVICIO · PROHIBIDO EL PASO AL PERSONAL AJENO».',
  rails: 'Raíles de una vagoneta de servicio. Acaban contra la pared, donde el túnel se derrumbó.',
  // Registeel
  sleeping: 'Una figura de acero pulido, inmóvil entre engranajes parados. En su cara hay siete puntos, apagados.',
  wake: 'Con cada campanada del reloj, uno de los puntos se enciende. ¡La figura de acero se mueve!',
  gone: 'Los engranajes de la sala giran solos, despacio, al ritmo del reloj.',
  steleRead: '«Acero soy. Roca y hielo son mis hermanos. El que nos dio forma duerme bajo la memoria.»',
});

/** Rosalía está fuera de la Sala de las Crónicas mientras dura la búsqueda. Lo consulta el museo (B09a). */
export const rosaliaAway = (s) => Boolean(s) && postgame(s) && s.flag(F.rosaliaAsk) && !s.flag(LEGENDS.registeel.caught);

const restored = (s) => Boolean(s?.flag(F.clockRestored));
const parts = (s) => Number(s?.var?.(V.clockParts, 0)) || 0;

// ───────────────────────────── museo: Sala de las Crónicas y sótano ─────────────────────────────

async function galleryScene(ctx) {
  const ros = eventById(ctx, 'rosalia_cronicas');
  if (ros) { ctx.face(ros, ctx.player); await ctx.emote(ros, '!'); }
  await lines(ctx, SPEAKER.rosalia, REGISTEEL_TEXT.gallery);
  await ctx.fade('out', 20);
  ctx.setFlag(F.rosaliaAsk);
  await pause(ctx, 20);
  await ctx.fade('in', 20);
}

/** Eventos que añade la galería del museo (lumina_museo_galeria.js). */
export function b22dGaleriaEvents() {
  return [{
    id: 'b22d_rosalia_aviso', x: 0, y: 15, trigger: 'auto',
    when: (s) => postgame(s) && !s.flag(F.rosaliaAsk),
    script: galleryScene,
  }];
}

async function dockRosalia(ctx) {
  await lines(ctx, SPEAKER.rosalia, REGISTEEL_TEXT.dock);
  ctx.se?.('Door exit');
  await ctx.fade('out', 16);
  ctx.setFlag(F.liftOpen);
  await pause(ctx, 16);
  await ctx.fade('in', 16);
}

async function liftScript(ctx) {
  if (!ctx.flag(F.liftOpen)) { await ctx.say(REGISTEEL_TEXT.liftClosed); return; }
  await ctx.say(REGISTEEL_TEXT.lift);
  if (!(await ctx.confirm(REGISTEEL_TEXT.liftAsk))) { await ctx.move('player', ['up'], { through: false }); return; }
  ctx.se?.('Door enter');
  await ctx.warp(T.id, T.arrive.x, T.arrive.y, T.arrive.dir);
}

/** Eventos que añade el sótano del museo (lumina_museo_taller.js). */
export function b22dTallerEvents() {
  const H = HOOKS.taller;
  return [
    {
      id: 'b22d_rosalia_muelle', x: H.rosalia.x, y: H.rosalia.y, name: SPEAKER.rosalia,
      pages: [{ when: (s) => postgame(s) && s.flag(F.rosaliaAsk) && !s.flag(F.liftOpen), sprite: SPRITE.rosalia, dir: H.rosalia.dir, move: 'still', trigger: 'action', script: dockRosalia }],
    },
    {
      id: 'b22d_montacargas', x: H.lift.x, y: H.lift.y, name: 'Montacargas viejo',
      pages: [
        { when: (s) => postgame(s) && s.flag(F.rosaliaAsk), sprite: OBJ.hatch, dir: 6, directionFix: true, walkAnime: false, shadow: false, through: true, trigger: 'action', script: liftScript },
        { when: (s) => postgame(s) && s.flag(F.liftOpen), sprite: OBJ.hatch, dir: 8, directionFix: true, walkAnime: false, shadow: false, through: true, trigger: 'touch', script: liftScript },
      ],
    },
  ];
}

// ───────────────────────────── túneles viejos ─────────────────────────────

const partsList = (mask) => {
  const names = missingParts(mask).map((p) => PART_NAMES[p]);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0];
};

async function restoreScene(ctx) {
  const ros = eventById(ctx, 'b22d_rosalia_tuneles');
  const clock = eventById(ctx, 'b22d_reloj');
  await ctx.say(REGISTEEL_TEXT.rosaliaReady, ROS);
  if (ros) await ctx.move(ros, ['left', 'turn_up'], { through: true });
  await ctx.fade('out', 24);
  ctx.se?.('GUI trainer card flip', { volume: 70 });
  await pause(ctx, 30);
  ctx.se?.('Anim/Saint7', { volume: 50 });
  ctx.setFlag(F.clockRestored);
  await pause(ctx, 30);
  await ctx.fade('in', 24);
  if (ros) await ctx.move(ros, ['right', 'turn_left'], { through: true });
  await ctx.say(REGISTEEL_TEXT.restored, ROS);
  if (clock) { clock.direction = 4; clock.stepAnime = true; }
  ctx.se?.('Bell', { volume: 90 });
  await pause(ctx, 30);
  await ctx.say(REGISTEEL_TEXT.chime);
  await ctx.camera.pan(T.door.x, T.door.y, 40);
  ctx.shake(3, 5, 40);
  ctx.se?.('Earth2', { volume: 70 });
  await pause(ctx, 40);
  await ctx.camera.reset(40);
  await lines(ctx, SPEAKER.rosalia, REGISTEEL_TEXT.door);
  await zygardeSays(ctx, REGISTEEL_TEXT.core);
}

async function rosaliaScript(ctx) {
  if (restored(ctx.state)) { await ctx.say(REGISTEEL_TEXT.waiting, ROS); return; }
  if (!ctx.flag(F.clockSeen)) {
    ctx.setFlag(F.clockSeen);
    await lines(ctx, SPEAKER.rosalia, REGISTEEL_TEXT.rosaliaFirst);
    return;
  }
  const mask = parts(ctx.state);
  if (!clockComplete(mask)) { await ctx.say(REGISTEEL_TEXT.rosaliaMissing(partsList(mask)), ROS); return; }
  await restoreScene(ctx);
}

async function clockScript(ctx) {
  if (restored(ctx.state)) { await ctx.say(REGISTEEL_TEXT.clockRunning); return; }
  await ctx.say(REGISTEEL_TEXT.clockBroken);
  if (!ctx.flag(F.clockSeen) && eventById(ctx, 'b22d_rosalia_tuneles')) await rosaliaScript(ctx);
}

function partScript(part) {
  return async (ctx) => {
    ctx.me?.('Item get');
    ctx.setVar(V.clockParts, addPart(parts(ctx.state), part));
    await ctx.say(REGISTEEL_TEXT.part(PART_NAMES[part]));
  };
}

export const REGISTEEL_SPEC = Object.freeze({ species: 'REGISTEEL', level: 70, moves: Object.freeze(['IRONHEAD', 'HAMMERARM', 'IRONDEFENSE', 'FLASHCANNON']) });

async function registeelScript(ctx) {
  ctx.face('player', 'up');
  await ctx.say(REGISTEEL_TEXT.sleeping);
  ctx.se?.('Bell', { volume: 60 });
  const ev = eventById(ctx, 'registeel');
  if (ev) ev.stepAnime = true;
  ctx.cry('REGISTEEL');
  await ctx.say(REGISTEEL_TEXT.wake);
  await legendBattle(ctx, 'registeel', REGISTEEL_SPEC, { retry: { ...T.battle }, bgm: MUSIC.legend, battleback: 'InteriorOscuro' });
  if (ctx.flag(LEGENDS.registeel.caught)) await ctx.say(REGISTEEL_TEXT.after, ROS);
}

/** Eventos del mapa lumina_tuneles. */
export function tunelesEvents() {
  const G = T.registeel;
  const rosaliaHere = (s) => rosaliaAway(s) && s.flag(F.liftOpen);
  return [
    {
      id: 'b22d_tuneles_llegada', x: 0, y: 0, trigger: 'auto', when: (s) => postgame(s) && !s.flag('b22d_tuneles_llegada'),
      script: async (ctx) => { ctx.setFlag('b22d_tuneles_llegada'); await ctx.say(REGISTEEL_TEXT.arrive); },
    },
    {
      id: 'b22d_reloj', x: T.clock.x, y: T.clock.y, name: 'Reloj de la galería vieja',
      pages: [
        { sprite: OBJ.clock, dir: 6, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: clockScript },
        { when: restored, sprite: OBJ.clock, dir: 4, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, shadow: false, solid: true, trigger: 'action', script: clockScript },
      ],
    },
    {
      id: 'b22d_rosalia_tuneles', x: T.rosalia.x, y: T.rosalia.y, name: SPEAKER.rosalia,
      pages: [{ when: rosaliaHere, sprite: SPRITE.rosalia, dir: T.rosalia.dir, move: 'still', trigger: 'action', script: rosaliaScript }],
    },
    ...CLOCK_PARTS.map((part, i) => ({
      id: `b22d_pieza_${part}`, x: T.parts[part].x, y: T.parts[part].y, name: PART_NAMES[part],
      pages: [{
        when: (s) => postgame(s) && !hasPart(parts(s), part) && !restored(s),
        sprite: OBJ.parts, dir: 2 + 2 * i, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, shadow: false,
        through: true, trigger: 'action', script: partScript(part),
      }],
    })),
    ...T.rubble.map(([x, y], i) => ({
      id: `b22d_derrumbe_${i}`, type: 'ramRock', x, y, group: 'b22d_derrumbe',
      sprite: 'asset:objects/barreras.png', dir: 2, directionFix: true, stepAnime: true,
    })),
    {
      id: 'b22d_puerta_acero', x: T.door.x, y: T.door.y, name: 'Puerta de acero',
      pages: [
        { sprite: OBJ.steelDoor, dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(REGISTEEL_TEXT.doorClosed); } },
        { when: restored, sprite: OBJ.steelDoor, dir: 6, directionFix: true, walkAnime: false, shadow: false, through: true },
      ],
    },
    {
      id: 'registeel', x: G.x, y: G.y, name: 'Registeel',
      pages: [
        { when: (s) => postgame(s), trigger: 'action', through: true, script: async (ctx) => { await ctx.say(REGISTEEL_TEXT.gone); } },
        { when: (s) => legendPresent(s, 'registeel'), sprite: SPRITE.registeel, dir: G.dir, move: 'still', stepAnime: false, solid: true, trigger: 'action', script: registeelScript },
      ],
    },
    ...steleEvents('estela_engranaje', T.stele.x, T.stele.y, REGISTEEL_TEXT.steleRead),
    examine('cartel_servicio', 9, 4, REGISTEEL_TEXT.sign),
    examine('railes_anden', T.rails.x0, T.rails.y + 1, REGISTEEL_TEXT.rails),
    ...T.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) })),
  ];
}
