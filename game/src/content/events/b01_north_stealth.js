// Sigilo en el Laberinto de la Profundidad (B01 §4.5). El policía patrulla dos tramos (el pasillo central
// y el jardín del este) con un cono de visión de 4 casillas en línea recta que los setos cortan: se ve como
// el haz de su linterna. Si te ve: "!", "¡Eh! ¿Qué te he dicho?", fundido y vuelta al punto seguro de la
// entrada mirando al norte; el policía vuelve a su ruta. Tras 3 detecciones patrulla un tramo más corto.
// La visión usa el mecanismo de entrenadores (eventTouch + sight → MapEvent.canReachPlayer).
import { F, SPEAKER, SPRITE, CAST } from './b01_town_common.js';
import { placeChainBehind } from '../../world/follower.js';
import { dx, dy } from '../../world/gameMap.js';

/** Punto seguro (acceso sur del laberinto), mirando al norte. */
export const SAFE_SPOT = Object.freeze({ x: 19, y: 30, dir: 8 });
/** Variable con el número de detecciones. */
export const CAUGHT_VAR = 'b01_stealth_caught';
/** A partir de estas detecciones la patrulla se acorta (accesibilidad). */
export const SHORT_AFTER = 3;
export const SIGHT = 4;

const rep = (cmd, n) => Array(n).fill(cmd);

/** Ruta completa: pasillo central (x 5 → 32, y 16) y jardín del este (x 32, y 16 → 10), ida y vuelta. */
export const FULL_PATROL = Object.freeze({
  start: { x: 5, y: 16, dir: 6 },
  route: [
    ...rep('right', 27), { wait: 30 }, 'turn_up', { wait: 20 },
    ...rep('up', 6), { wait: 40 }, 'turn_left', { wait: 30 }, 'turn_right', { wait: 30 }, 'turn_down', { wait: 16 },
    ...rep('down', 6), 'turn_left', { wait: 30 },
    ...rep('left', 27), { wait: 40 }, 'turn_right', { wait: 24 },
  ],
});

/** Ruta corta (tras 3 detecciones): solo el extremo este; el hueco de la cámara (x 19–20) queda fuera de su vista. */
export const SHORT_PATROL = Object.freeze({
  start: { x: 26, y: 16, dir: 6 },
  route: [
    ...rep('right', 6), { wait: 30 }, 'turn_up', { wait: 20 },
    ...rep('up', 6), { wait: 40 }, 'turn_left', { wait: 30 }, 'turn_right', { wait: 30 }, 'turn_down', { wait: 16 },
    ...rep('down', 6), 'turn_left', { wait: 30 },
    ...rep('left', 6), { wait: 50 }, 'turn_right', { wait: 24 },
  ],
});

/** Casillas visibles delante del personaje (hasta `max`), cortadas por muros y setos. */
export function sightReach(ev, max = SIGHT) {
  const dir = ev.direction;
  let x = ev.x;
  let y = ev.y;
  let n = 0;
  while (n < max && ev.canMoveFromCoordinate(x, y, dir)) {
    x += dx(dir);
    y += dy(dir);
    n += 1;
  }
  return n;
}

/** Recorrido lógico de una ruta desde su inicio (para tests): casillas que pisa el policía. */
export function patrolPath(patrol) {
  const out = [[patrol.start.x, patrol.start.y]];
  let { x, y } = patrol.start;
  const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  for (const cmd of patrol.route) {
    if (typeof cmd !== 'string' || !step[cmd]) continue;
    x += step[cmd][0];
    y += step[cmd][1];
    out.push([x, y]);
  }
  return out;
}

const BEAM = Object.freeze({ name: 'visionCone', reach: (ev) => sightReach(ev) });
// Patrulla desde que el policía entra (§4.4) hasta la escolta (§4.6): en la escena del Core es él quien llega.
const active = (s) => Boolean(s) && s.flag(F.policeIn) && !s.flag(F.escorted);
const caughtCount = (s) => Number(s?.var(CAUGHT_VAR, 0)) || 0;

/** Te ha visto: aviso, fundido y vuelta al punto seguro; él retoma su ruta desde el principio. */
async function caught(ctx) {
  const ev = ctx.event;
  ctx.se('exclaim');
  await ctx.emote(ev, '!');
  await ctx.say('¡Eh! ¿Qué te he dicho?', { speaker: SPEAKER.police });
  await ctx.fade('out', 18);
  const count = caughtCount(ctx.state) + 1;
  ctx.setVar(CAUGHT_VAR, count);
  const p = ctx.player;
  p.moveTo(SAFE_SPOT.x, SAFE_SPOT.y);
  p.direction = SAFE_SPOT.dir;
  p.straighten();
  placeChainBehind(p, ctx.world.followers);
  ctx.scene.camera.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
  const patrol = count >= SHORT_AFTER ? SHORT_PATROL : FULL_PATROL;
  ev.moveTo(patrol.start.x, patrol.start.y);
  ev.direction = patrol.start.dir;
  ev.prelockDirection = 0;
  if (ev.page) ev.applyMove(ev.page.move);
  await ctx.wait(12);
  await ctx.fade('in', 18);
}

function guard(id, patrol, when) {
  return {
    id,
    x: patrol.start.x,
    y: patrol.start.y,
    name: CAST.police,
    pages: [{
      when,
      sprite: SPRITE.police,
      dir: patrol.start.dir,
      move: { route: patrol.route, repeat: true },
      speed: 3,
      freq: 6,
      trigger: 'eventTouch',
      sight: SIGHT,
      glow: BEAM,
      script: caught,
    }],
  };
}

/** Eventos del sigilo: el policía con la ruta completa y, tras 3 detecciones, con la corta (nunca los dos). */
export function stealthEvents() {
  return [
    guard('policia_patrulla', FULL_PATROL, (s) => active(s) && caughtCount(s) < SHORT_AFTER),
    guard('policia_patrulla_corta', SHORT_PATROL, (s) => active(s) && caughtCount(s) >= SHORT_AFTER),
    {
      id: 'cartel_laberinto', type: 'sign', x: 17, y: 27,
      text: `LABERINTO DE LA PROFUNDIDAD\nPropiedad de la familia ${CAST.owners}. Se ruega no pasar.`,
    },
  ];
}
