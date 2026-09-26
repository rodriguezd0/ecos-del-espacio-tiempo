// Estrato hasta el P4 (docs/CAMPANA.md §3.1, fase 1: «Estrato se hunde y las piedras flotan un palmo de noche»; B08
// «casas agrietadas»): grietas en el suelo y en las fachadas, piedras que flotan de noche, temblores de vez en cuando
// y un vigilante que refresca las páginas al caer la noche o al amanecer. Tras el P4 cesan los temblores y las piedras
// ya no flotan (las grietas quedan: el daño está hecho).
import { F, OBJ, isNight } from './b08_common.js';

/** Grietas: [x, y, variante, en fachada]. */
const CRACKS = Object.freeze([
  [20, 10, 0, false], [33, 10, 1, false], [9, 23, 2, false], [15, 24, 3, false], [27, 17, 1, false], [22, 27, 0, false],
  [31, 21, 2, false], [36, 23, 3, false], [11, 39, 1, false], [24, 40, 2, false], [40, 39, 0, false], [46, 26, 3, false],
  [18, 7, 0, true], [21, 5, 2, true], [7, 6, 1, true], [38, 5, 3, true], [44, 7, 1, true], [19, 37, 0, true], [9, 37, 2, true],
]);

/** Piedras que flotan de noche (antes del P4). */
const PEBBLES = Object.freeze([[18, 18], [23, 26], [29, 24], [32, 18], [12, 24], [6, 10], [28, 9], [41, 40], [16, 40], [47, 27]]);

const floating = (s) => Boolean(s) && !s.flag(F.restored) && isNight(s);

async function pebbleTalk(ctx) {
  await ctx.say('Una piedra flota a un palmo del suelo, girando despacio. Cuando alargas la mano, se aparta.');
}

/** Temblor de fondo (sin bloquear): cada cierto tiempo la ciudad cruje. */
async function tremorLoop(ctx) {
  await ctx.wait(1800 + Math.floor(Math.random() * 2400));
  if (ctx.flag(F.restored) || ctx.scene?.runner?.busy) return;
  ctx.se('PRSFX- Earthquake', { volume: 35 });
  ctx.shake(2, 4, 36);
}

/** Refresca las páginas al pasar de día a noche (las piedras flotantes y la defensa de la Losa dependen de la hora). */
function nightWatcher() {
  let last = null;
  return {
    id: 'vigia_noche', x: 0, y: 1, trigger: 'parallel',
    script: async (ctx) => {
      const night = isNight(ctx.state);
      if (last !== null && night !== last) ctx.requestRefresh();
      last = night;
      await ctx.wait(60);
    },
  };
}

export function estratoNightEvents() {
  return [
    ...CRACKS.map(([x, y, v, wall]) => ({
      id: `grieta_${x}_${y}`, x, y, sprite: OBJ.crack, dir: wall ? 4 : 2, pattern: v, directionFix: true, walkAnime: false, shadow: false, through: true,
    })),
    ...PEBBLES.map(([x, y]) => ({
      id: `piedra_flotante_${x}_${y}`, x, y,
      pages: [{ when: floating, sprite: OBJ.pebble, dir: 2, directionFix: true, stepAnime: true, speed: 2, walkAnime: false, shadow: false, through: true, trigger: 'action', script: pebbleTalk }],
    })),
    { id: 'temblores', x: 0, y: 0, pages: [{ when: (s) => Boolean(s) && !s.flag(F.restored), trigger: 'parallel', script: tremorLoop }] },
    nightWatcher(),
  ];
}
