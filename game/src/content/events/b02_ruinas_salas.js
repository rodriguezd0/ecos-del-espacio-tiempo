// Antesala y Galería de los Dinteles de las Ruinas del Dintel (CAMPANA B02, mazmorra 1–2; D08):
// inscripción con la traducción grabada por la madre de Casilda, losa atascada del atajo, entrenadores,
// objetos y el puzzle de las tres piedras giratorias (lógica pura en b02_puzzle.js).
import { F, SPEAKER, SPRITE, GREEN, when, say, strip, examine, fx } from './b02_common.js';
import { ROOM, placeCasilda, walkToRoom, casildaRoom } from './b02_ruinas_casilda.js';
import { STONES, ROTATION, DIR_NAME, stoneDir, isSolved, solvedCount, allSolved, coreNear, turnStone, applyTurn, stoneFlag } from './b02_puzzle.js';
import { ANTESALA, GALERIA, PASSAGES } from '../maps/b02/ruinas_dintel_layout.js';

const C = SPEAKER.casilda;
export const INSCRIPTION = '«El primero mira al alba. El segundo, al agua que no se va. El tercero, a quien entra.»';

// ─── Antesala ───────────────────────────────────────────────────────────────────────────────────

async function antesalaScene(ctx) {
  placeCasilda(ctx);
  await ctx.wait(20);
  ctx.face('casilda', 'up');
  await say(ctx, C, 'Cuarenta años limpiando estas piedras. Son piedras. Muy viejas, nada más.');
  ctx.face('casilda', 'right');
  await say(ctx, C, 'Por la losa del fondo se llegaba a la sala de la caja. Desde los temblores no se mueve.');
  ctx.face('casilda', 'left');
  await say(ctx, C, 'Queda la galería. Tiene tres piedras que giran y no abren nada. Tú verás.');
  ctx.setFlag(F.antesala);
}

async function readInscription(ctx) {
  await ctx.say('Una estela cubierta de glifos antiguos. Debajo, alguien grabó a punzón una traducción:');
  await ctx.say(INSCRIPTION);
  if (casildaRoom(ctx.state) === ROOM.antesala && !ctx.flag(F.exit)) {
    await say(ctx, C, 'Eso lo grabó mi madre. Decía que era lo que ponían las piedras.');
  }
}

/** Losa de un dintel (evento de 3×3 casillas) + bloqueos invisibles a ambos lados mientras está cerrada. */
function slabEvents(prefix, passage, openFlag, text, innerRow) {
  const closed = (s) => !s.flag(openFlag);
  const { x } = passage;
  const outerRow = passage.slab.y;
  const say1 = async (ctx) => { await ctx.say(text); };
  return [
    {
      id: prefix, x: passage.slab.x, y: outerRow, when: closed, sprite: SPRITE.slab, dir: 2, directionFix: true,
      walkAnime: false, stepAnime: true, speed: 1, freq: 1, solid: true, trigger: 'action', script: say1,
    },
    ...[x, x + 2].map((bx) => ({ id: `${prefix}_${bx}`, x: bx, y: outerRow, when: closed, solid: true, trigger: 'action', noOver: true, script: say1 })),
    ...[x, x + 1, x + 2].map((bx) => ({ id: `${prefix}_dentro_${bx}`, x: bx, y: innerRow, when: closed, solid: true, trigger: 'action', noOver: true, script: say1 })),
  ];
}

/** Anima la losa: tiembla, se desliza hacia el dintel y se desvanece. */
export async function slideSlab(ctx, id) {
  const ev = ctx.world?.events?.find((e) => e.id === id);
  ctx.se('PRSFX- Earthquake');
  await ctx.shake(3, 6, 30);
  ctx.se('Door slide');
  if (ev) {
    ctx.move(id, ['up'], { wait: false, speed: 1 });
    for (let i = 0; i <= 16; i++) { ev.opacity = Math.max(0, 255 - i * 16); await ctx.wait(3); }
  } else {
    await ctx.wait(40);
  }
}

function antesalaEvents() {
  const read = ANTESALA.read.map((p, i) => ({ id: `estela_${i}`, x: p.x, y: p.y, trigger: 'action', noOver: true, solid: true, script: readInscription }));
  return [
    { id: 'escena_antesala', x: 1, y: 1, trigger: 'auto', when: (s) => s.flag(F.casildaJoined) && casildaRoom(s) === ROOM.antesala && !s.flag(F.antesala), script: antesalaScene },
    ...read,
    ...slabEvents('losa_atajo', PASSAGES.atajo, F.shortcut, 'Una losa de piedra cierra el paso bajo el dintel. No se mueve ni un palmo.', PASSAGES.atajo.rows[0]),
    { id: 'repelente', type: 'item', x: 29, y: 33, item: 'REPEL' },
    { id: 'pocion_oculta', type: 'item', x: 9, y: 34, item: 'POTION', hidden: true },
  ];
}

// ─── Galería de los Dinteles ─────────────────────────────────────────────────────────────────────

async function galeriaScene(ctx) {
  // Casilda viene andando desde la antesala por el paso del dintel (antes aparecía de golpe bajo el dintel).
  await walkToRoom(ctx, ROOM.galeria, { speed: 4 });
  ctx.face('casilda', 'up');
  await say(ctx, C, 'La galería. Una piedra en cada alcoba. Giran, sí: las engraso cada primavera. No abren nada.');
  ctx.setFlag(F.galeria);
}

/** Muescas talladas en el zócalo: dicen qué piedra es la primera, la segunda y la tercera de la inscripción. */
const NOTCHES = Object.freeze({ 1: 'grabada una sola muesca', 2: 'grabadas dos muescas', 3: 'grabadas tres muescas' });
export const stoneIntro = (stone) => [
  'Una piedra redonda sobre un zócalo, con una ranura tallada que apunta a un lado. Gira sobre su eje.',
  `En el zócalo hay ${NOTCHES[stone.n] || 'una muesca'}.`,
];

async function reactToLight(ctx, count) {
  if (casildaRoom(ctx.state) !== ROOM.galeria) return;
  if (count === 1) {
    await ctx.emote('casilda', '!');
    await say(ctx, C, '…Eso no lo había hecho nunca.');
  } else if (count === 2) {
    await ctx.emote('casilda', '…');
  }
}

async function openGallerySlab(ctx) {
  await ctx.wait(20);
  await ctx.camera.pan(PASSAGES.losa.slab.x, PASSAGES.losa.slab.y - 1, 30);
  await slideSlab(ctx, 'losa_galeria');
  ctx.setFlag(F.dinteles);
  await ctx.wait(20);
  await ctx.camera.reset(24);
  if (casildaRoom(ctx.state) === ROOM.galeria) {
    ctx.face('casilda', 'up');
    await say(ctx, C, 'Cuarenta años aquí. Y eso era una puerta.');
  }
}

/** Guion de una piedra giratoria: gira 90° en cada pulsación; si acierta y el Core está cerca, se enciende. */
export async function stoneScript(ctx, stone) {
  const st = ctx.state;
  const result = turnStone(st, stone, { coreClose: coreNear(ctx.world?.core, stone) });
  if (result.already) { await ctx.say('La piedra ya no gira. Su ranura sigue brillando en verde.'); return; }
  if (!ctx.selfSwitch('B')) {
    for (const line of stoneIntro(stone)) await ctx.say(line);
    ctx.setSelfSwitch('B', true);
  }
  ctx.se('Strength push');
  applyTurn(st, stone, result);
  ctx.requestRefresh();
  await ctx.wait(16);
  if (result.lit) {
    ctx.se('Mining ping');
    const glow = fx(ctx, 'softLight', { x: stone.x, y: stone.y, radius: 40, color: [...GREEN], intensity: 0.8, pulse: 0.4, fadeIn: 10 });
    await ctx.flash(GREEN, 10, 70);
    await ctx.say('La ranura se enciende con una luz verde.');
    glow?.remove?.(30);
    await reactToLight(ctx, solvedCount(st));
    if (allSolved(st)) await openGallerySlab(ctx);
  } else if (result.correct) {
    await ctx.say(`La ranura mira hacia ${DIR_NAME[result.dir]}. Por un momento parece esperar algo.`);
  }
}

/** Evento de una piedra: una página por orientación (sin encender) y la página encendida. */
function stoneEvent(stone) {
  const unlit = ROTATION.map((dir) => ({
    when: (s) => !isSolved(s, stone) && stoneDir(s, stone) === dir,
    sprite: SPRITE.stone, dir, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
    script: (ctx) => stoneScript(ctx, stone),
  }));
  const lit = {
    when: (s) => isSolved(s, stone), sprite: SPRITE.stoneLit, dir: stone.answer, directionFix: true, walkAnime: false,
    stepAnime: true, speed: 2, solid: true, trigger: 'action', light: { radius: 44, intensity: 0.7 },
    script: (ctx) => stoneScript(ctx, stone),
  };
  return { id: stone.id, x: stone.x, y: stone.y, name: `Piedra ${stone.n}`, pages: [...unlit, lit] };
}

function galeriaEvents() {
  const s = GALERIA.stream;
  return [
    ...strip('escena_galeria', GALERIA.entry, { when: (st) => st.flag(F.casildaJoined) && !st.flag(F.galeria), script: galeriaScene }),
    ...STONES.map(stoneEvent),
    // Red de seguridad: si las tres ranuras quedaron encendidas pero la losa no llegó a abrirse (partida cortada a
    // mitad de la animación, estado de prueba…), una piedra resuelta ya no vuelve a girar y el jugador se quedaba sin
    // salida. Al volver a la galería la losa se desliza sola.
    {
      id: 'escena_losa_galeria', x: 0, y: 2, trigger: 'auto',
      when: (st) => allSolved(st) && !st.flag(F.dinteles), script: openGallerySlab,
    },
    {
      id: 'tragaluz', x: GALERIA.skylight.x, y: GALERIA.skylight.y, sprite: SPRITE.skylight, dir: 2, directionFix: true,
      walkAnime: false, stepAnime: true, speed: 1, through: true, light: { radius: 88, intensity: 0.9 },
      trigger: 'action', script: async (ctx) => { await ctx.say('Por un tragaluz abierto en la roca entra la luz de la mañana. Llega del este.'); },
    },
    // sobre el agua (casillas no pisables): se leen mirando al estanque desde (6,19) o desde abajo, y al arroyo
    // desde el puente o desde (12,20)
    examine('estanque_quieto', GALERIA.pond.x + GALERIA.pond.w - 1, GALERIA.pond.y + GALERIA.pond.h - 1, 'El agua del estanque está quieta. No entra ni sale nada: no se va a ninguna parte.'),
    examine('arroyo', s.x + s.w - 1, s.bridge - 1, 'Un arroyo brota de la pared, cruza la galería y se escapa por debajo de la roca, fuera de la sala.'),
    ...slabEvents('losa_galeria', PASSAGES.losa, F.dinteles, 'Una losa de piedra cierra el paso bajo el dintel. No hay de dónde tirar.', PASSAGES.losa.rows[0]),
    { id: 'pokeball_galeria', type: 'item', x: 23, y: 23, item: 'POKEBALL' },
    { id: 'pocion_estanque', type: 'item', x: 3, y: 21, item: 'POTION', hidden: true },
  ];
}

/** Eventos de la antesala y la galería. */
export function salasEvents() {
  return [...antesalaEvents(), ...galeriaEvents()];
}

export { stoneFlag, when };
