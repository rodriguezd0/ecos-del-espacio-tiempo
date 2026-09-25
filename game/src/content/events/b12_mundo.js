// Cambios en el mundo del Bloque 12 (docs/CAMPANA.md B12): antes del P6 «vuelven los temblores nocturnos a Villa Alba»
// (el aljibe filtra lo que viene del otro lado); tras restaurarlo cesan. «Al volver a Zaguán, Casilda entrega la
// Lucarita (LUCARIONITE): "Mi marido la encontró hace años. Ahora sé para quién era."»
// Se añaden a villa_alba (B01) y villa_zaguan (B02) con una línea cada uno (ediciones mínimas y aditivas).
import { F, EXT, SPEAKER, SPRITE, when, isNight, lines, zygardeSays, pause, eventById } from './b12_common.js';
import { stageRoute } from './b07_path.js';

// ───────────────────────────── Villa Alba: temblores nocturnos antes del P6 ─────────────────────────────

const TREMOR_EVERY = 1500; // fotogramas entre temblores (≈25 s)

async function nightTremor(ctx) {
  const scene = ctx.scene;
  if (!scene || ctx.world?.scriptBusy?.()) return;
  scene.__b12Tremor = (scene.__b12Tremor ?? 600) - 1;
  if (scene.__b12Tremor > 0) return;
  scene.__b12Tremor = TREMOR_EVERY;
  ctx.se('PRSFX- Earthquake', { volume: 35 });
  ctx.shake(2, 4, 50);
  if (!ctx.flag(F.temblorAlba)) {
    ctx.setFlag(F.temblorAlba);
    await scene.runScript(async (c) => {
      await pause(c, 30);
      await zygardeSays(c, 'Tiembla otra vez. Viene del Monte, del aljibe.');
    }, null, 'b12:temblor');
  }
}

export function b12VillaAlbaEvents() {
  return [{
    id: 'b12_temblor_nocturno', x: 0, y: 0, trigger: 'parallel',
    when: when({ all: [EXT.gaelB4], none: [EXT.restored], test: isNight }),
    script: nightTremor,
  }];
}

// ───────────────────────────── Villa Zaguán: la Lucarita de Casilda ─────────────────────────────

/** Tras el P6, Casilda espera en la calle mayor, junto a la Arboleda (su casa es la Casa del Dintel, 6,23). */
export const CASILDA_SPOT = Object.freeze({ x: 19, y: 16 });
const CASILDA_HOME = Object.freeze({ x: 6, y: 24 });

async function lucaritaScene(ctx) {
  const sp = SPEAKER.casilda;
  const ev = eventById(ctx, 'b12_casilda');
  if (!ev) return;
  await ctx.say('¡Eh! Tú. Espera ahí.', { speaker: sp });
  const p = ctx.player;
  const target = [[p.x, p.y + 1], [p.x - 1, p.y], [p.x + 1, p.y], [p.x, p.y - 1]]
    .find(([x, y]) => ctx.map.valid(x, y) && ctx.map.passable(x, y, 0, null, {})) || [p.x, p.y + 1];
  const route = stageRoute(ctx, ev, target[0], target[1]);
  if (route?.length) await ctx.move(ev, route.slice(0, 40), { through: false, speed: 3.5 });
  ev.turnToward(ctx.player);
  ctx.face('player', ctx.directionTo(ctx.player, ev));
  await lines(ctx, sp, [
    'La tierra se ha quedado quieta del todo. Hasta las puertas han dejado de crujir.',
    'Algo has hecho allá arriba, en el Monte. No me lo cuentes, que no lo entendería.',
    'Toma. Mi marido la encontró hace años. Ahora sé para quién era.',
  ]);
  await ctx.giveItem('LUCARIONITE', 1);
  ctx.setFlag(F.lucaritaCasilda);
  await lines(ctx, sp, ['Y ahora vete, que se me enfría el café.']);
  const back = stageRoute(ctx, ev, CASILDA_HOME.x, CASILDA_HOME.y);
  if (back?.length) await ctx.move(ev, back.slice(0, 6), { through: false, speed: 3.5 });
  ctx.erase(ev);
}

export function b12ZaguanEvents() {
  const show = when({ all: [EXT.restored, EXT.zaguanExit], none: [F.lucaritaCasilda] });
  return [
    {
      id: 'b12_casilda', x: CASILDA_SPOT.x, y: CASILDA_SPOT.y, name: SPEAKER.casilda,
      pages: [{ when: show, sprite: SPRITE.casilda, dir: 2, move: 'still', trigger: 'action', script: lucaritaScene }],
    },
    { id: 'b12_casilda_aviso', x: CASILDA_SPOT.x, y: CASILDA_SPOT.y, through: true, trigger: 'auto', when: show, script: lucaritaScene },
  ];
}
