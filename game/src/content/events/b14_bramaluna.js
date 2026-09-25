// Bramaluna Alfa (ROARINGMOON) en la era primigenia de las salas 3–4 (docs/CAMPANA.md B14): patrulla visible con cono
// de visión de 5 casillas y aviso de rugido; si ve al jugador, embiste: fundido y regreso a la última caracola, sin
// combate ni daño. La patrulla es DETERMINISTA: su posición es una función del fotograma del mapa (patrolAt), lo que
// permite probar en tests que las caracolas nunca quedan a la vista y planificar el paso en el E2E.
// Módulo puro salvo los guiones.
import { dx, dy } from '../../world/gameMap.js';
import { sightReach } from './b01_north_stealth.js';
import { BRAMALUNA, PATROLS } from '../maps/b14/layout.js';
import { F, V, SPRITE, COLOR, zygardeSays, pause } from './b14_common.js';
import { returnToCaracola } from './b14_caracolas.js';

export const SIGHT = BRAMALUNA.sight;

/** Segmentos de una patrulla: { t0, t1, x0, y0, x1, y1, dir, kind: 'move' | 'wait' } y su periodo en fotogramas. */
export function compilePatrol(patrol, stepFrames = BRAMALUNA.stepFrames) {
  let t = 0;
  let { x, y, dir } = patrol.start;
  const segs = [];
  for (const cmd of patrol.route) {
    if (Array.isArray(cmd)) {
      const [d, n] = cmd;
      for (let i = 0; i < n; i++) {
        const nx = x + dx(d); const ny = y + dy(d);
        segs.push({ t0: t, t1: t + stepFrames, x0: x, y0: y, x1: nx, y1: ny, dir: d, kind: 'move' });
        t += stepFrames; x = nx; y = ny; dir = d;
      }
    } else {
      segs.push({ t0: t, t1: t + cmd.wait, x0: x, y0: y, x1: x, y1: y, dir: cmd.turn, kind: 'wait' });
      t += cmd.wait; dir = cmd.turn;
    }
  }
  if (x !== patrol.start.x || y !== patrol.start.y) throw new Error('compilePatrol: la ruta no vuelve a su inicio');
  return Object.freeze({ segs: Object.freeze(segs), period: t });
}

const COMPILED = new Map();
function compiled(mapId) {
  if (!COMPILED.has(mapId)) COMPILED.set(mapId, compilePatrol(PATROLS[mapId]));
  return COMPILED.get(mapId);
}

/** Estado de la patrulla de un mapa en un fotograma: { x, y, dir, from: { x, y }, kind, seg }. */
export function patrolAt(mapId, frame) {
  const c = compiled(mapId);
  const t = ((frame % c.period) + c.period) % c.period;
  const seg = c.segs.find((s) => t >= s.t0 && t < s.t1) || c.segs[c.segs.length - 1];
  return { x: seg.x1, y: seg.y1, dir: seg.dir, from: { x: seg.x0, y: seg.y0 }, kind: seg.kind, seg };
}

/** Periodo (fotogramas) de la patrulla de un mapa. */
export const patrolPeriod = (mapId) => compiled(mapId).period;

export const BRAMALUNA_TEXT = Object.freeze({
  roar: '¡La Bramaluna ruge y se lanza contra ti!',
  charged: 'Una embestida brutal… y el eco te devuelve junto a la caracola.',
  firstCaught: [
    'Nos ha visto. Aquí somos un eco para ella, pero su furia es real.',
    'Espera a que mire hacia otro lado.',
  ],
  growl: 'Un rugido grave hace temblar los helechos.',
});

const CONE = Object.freeze({ name: 'visionCone', reach: (ev) => sightReach(ev, SIGHT), color: [255, 90, 140], width: 30 });

/** La Bramaluna te ha visto: rugido, embestida corta y regreso a la última caracola (sin combate ni daño). */
async function caught(ctx) {
  const ev = ctx.event;
  ctx.cry('ROARINGMOON');
  ctx.shake(8, 9, 30);
  await ctx.emote(ev, '!');
  await ctx.say(BRAMALUNA_TEXT.roar);
  const toward = ctx.directionTo(ev, ctx.player);
  const name = { 2: 'down', 4: 'left', 6: 'right', 8: 'up' }[toward] || 'down';
  await ctx.move(ev, [name], { through: true, speed: 5.5, wait: true }).catch(() => {});
  ctx.se('PRSFX- Head Smash');
  await ctx.flash([255, 255, 255], 8, 190);
  await ctx.fade('out', 16, [30, 10, 24]);
  const n = Number(ctx.var(V.caught, 0)) + 1;
  ctx.setVar(V.caught, n);
  await returnToCaracola(ctx);
  await pause(ctx, 10);
  await ctx.fade('in', 20);
  await ctx.say(BRAMALUNA_TEXT.charged);
  if (!ctx.flag(F.bramalunaSeen)) {
    ctx.setFlag(F.bramalunaSeen);
    for (const t of BRAMALUNA_TEXT.firstCaught) await zygardeSays(ctx, t);
  }
}

/** Mueve el evento de la patrulla hacia su posición según el reloj (paso animado; si se desincroniza, salta). */
export function drivePatrol(ev, mapId, frame) {
  if (!ev || ev.erased || !ev.page || ev.moving()) return;
  const want = patrolAt(mapId, frame);
  if (ev.x === want.x && ev.y === want.y) {
    if (ev.direction !== want.dir) ev.turnGeneric(want.dir);
    return;
  }
  if (ev.x === want.from.x && ev.y === want.from.y && want.kind === 'move') {
    if (ev.direction !== want.dir) ev.turnGeneric(want.dir);
    ev.moveGeneric(want.dir);
    if (ev.moving()) return;
  }
  ev.moveTo(want.x, want.y);
  ev.direction = want.dir;
}

const WARN_EVERY = 200;

/** Eventos de la patrulla de un mapa primigenio (salas 3–4): la Bramaluna y su reloj. */
export function bramalunaPatrolEvents(mapId) {
  const P = PATROLS[mapId];
  if (!P) return [];
  const id = `bramaluna_${mapId}`;
  const warn = { last: -Infinity };
  return [
    {
      id, x: P.start.x, y: P.start.y, name: 'Bramaluna Alfa',
      pages: [{
        sprite: SPRITE.bramaluna, dir: P.start.dir, move: 'still', speed: 3, stepAnime: true, walkAnime: true,
        trigger: 'eventTouch', sight: SIGHT, glow: CONE, script: caught,
      }],
    },
    {
      id: `${id}_reloj`, x: 0, y: 0,
      pages: [{
        trigger: 'parallel',
        script: async (ctx) => {
          if (ctx.world.scriptBusy()) { await pause(ctx, 2); return; }
          const frame = ctx.scene?.frame ?? 0;
          const ev = ctx.world.events.find((e) => e.id === id);
          drivePatrol(ev, mapId, frame);
          // Aviso de rugido cuando anda cerca (lectura del peligro sin cifras).
          const p = ctx.player;
          if (frame < warn.last) warn.last = -Infinity; // otra sesión de la escena
          if (ev && frame - warn.last >= WARN_EVERY && Math.abs(ev.x - p.x) + Math.abs(ev.y - p.y) <= BRAMALUNA.warnRange) {
            warn.last = frame;
            ctx.cry('ROARINGMOON');
            ctx.shake(2, 4, 24);
          }
          await pause(ctx, 1);
        },
      }],
    },
  ];
}
