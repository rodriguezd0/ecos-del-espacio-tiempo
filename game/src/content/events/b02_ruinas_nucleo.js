// Núcleo del Pilar del Umbral (CAMPANA B02, paso 5; §3.0; X15): el jugador acerca el Core a la columna hueca, sale
// el Fragmento Azur 1 (ctx.story.restorePillar), se abre el Arca de Zygarde que Casilda «siempre vio cerrada» y se
// enciende el verso I. Después Casilda abre desde dentro la losa del atajo hacia la antesala (camino de salida).
import { F, SPEAKER, SPRITE, GREEN, say, core, fx, walk } from './b02_common.js';
import { ROOM, placeCasilda, setRoom, casildaRoom } from './b02_ruinas_casilda.js';
import { slideSlab } from './b02_ruinas_salas.js';
import { NUCLEO, PASSAGES } from '../maps/b02/ruinas_dintel_layout.js';

const C = SPEAKER.casilda;
/** Flag auxiliar: el Arca ya se abrió (cambia el gráfico de la caja durante la escena). */
export const ARCA_OPEN = 'b02_arca_abierta';

/** Lleva al Core junto a la columna (a su izquierda) y lo pone mirándola. */
async function coreToColumn(ctx) {
  const c = ctx.world?.core;
  if (!c?.visible) return;
  const target = { x: NUCLEO.column.x - 1, y: NUCLEO.column.y };
  const route = [];
  for (let x = c.x; x > target.x; x--) route.push('left');
  for (let x = c.x; x < target.x; x++) route.push('right');
  for (let y = c.y; y > target.y; y--) route.push('up');
  for (let y = c.y; y < target.y; y++) route.push('down');
  await ctx.move('core', route, { through: true, speed: 3 });
  ctx.face('core', 'right');
}

/** Efecto local del P1 tras restaurarse (lo llama restorePillar): el Arca, el verso I y las voces. */
async function onRestored(ctx) {
  await ctx.wait(20);
  ctx.se('Anim/Saint6');
  ctx.setFlag(ARCA_OPEN);
  const glow = fx(ctx, 'softLight', { x: NUCLEO.arca.x, y: NUCLEO.arca.y, radius: 56, color: [...GREEN], intensity: 0.8, pulse: 0.5, fadeIn: 20 });
  await ctx.wait(30);
  if (casildaRoom(ctx.state) === ROOM.nucleo) {
    ctx.face('casilda', 'right');
    await ctx.emote('casilda', '!');
    await say(ctx, C, '¿La caja? …Siempre la vi cerrada.');
  }
  await ctx.giveItem('ZYGARDECUBE');
  await ctx.say('Una caja hexagonal de piedra y bronce. Dentro late una luz verde, como la del Core.');
  glow?.remove?.(40);
  await ctx.wait(10);
  await ctx.story.revealVerse(1);
  await core(ctx, 'Cien. Y cinco. …Soy yo.');
  if (casildaRoom(ctx.state) === ROOM.nucleo) await say(ctx, C, 'Serán números.');
  ctx.setFlag(F.nucleo);
}

/** Casilda abre desde dentro la losa atascada del atajo (salida a la antesala). */
async function openShortcut(ctx) {
  if (ctx.flag(F.shortcut)) return;
  if (casildaRoom(ctx.state) === ROOM.nucleo) {
    await say(ctx, C, 'Por aquí se sale antes. Desde dentro, la losa se abre; mi madre me lo enseñó.');
    const ev = ctx.world?.events?.find((e) => e.id === 'casilda');
    if (ev) {
      const route = [];
      for (let y = ev.y; y < NUCLEO.lever.y - 1; y++) route.push('down');
      for (let x = ev.x; x < NUCLEO.lever.x; x++) route.push('right');
      for (let x = ev.x; x > NUCLEO.lever.x; x--) route.push('left');
      await walk(ctx, 'casilda', route, 3.5);
      ctx.face('casilda', 'down');
    }
  }
  await ctx.camera.pan(PASSAGES.atajo.slab.x, PASSAGES.atajo.slab.y - 2, 30);
  await slideSlab(ctx, 'losa_atajo');
  ctx.setFlag(F.shortcut);
  await ctx.camera.reset(24);
  if (casildaRoom(ctx.state) === ROOM.nucleo) {
    await say(ctx, C, 'Ya está. Fuera tiene que ser tarde. Vamos.');
    await ctx.fade('out', 12);
    setRoom(ctx, ROOM.fuera);
    await ctx.fade('in', 12);
  }
}

/** La columna hueca: el Core se acerca y el Pilar responde. */
async function columnScript(ctx) {
  if (ctx.flag(F.nucleo)) {
    await ctx.say('La columna hueca está en silencio. En el fondo brilla un resto de luz ocre.');
    return;
  }
  await ctx.say('Una columna hueca en el centro del hexágono tallado.');
  await coreToColumn(ctx);
  await ctx.wait(10);
  await core(ctx, '…');
  const ok = await ctx.story.restorePillar(1, { core: { ...NUCLEO.column }, showVerse: false, onRestored });
  if (!ok && !ctx.flag(F.nucleo)) {
    // restorePillar no vuelve a actuar si p1_restored ya estaba (p. ej. partida de prueba): la escena termina igual.
    await onRestored(ctx);
  }
  await openShortcut(ctx);
}

/** Si la partida se cortó entre el Fragmento y la losa, la losa del atajo se abre al volver al Núcleo. */
async function resumeShortcut(ctx) {
  placeCasilda(ctx);
  await openShortcut(ctx);
}

export function nucleoEvents() {
  const arcaPage = (dir, extra) => ({ sprite: SPRITE.arca, dir, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, ...extra });
  return [
    { id: 'columna_hueca', x: NUCLEO.column.x, y: NUCLEO.column.y, solid: true, trigger: 'action', noOver: true, light: { radius: 52, intensity: 0.6 }, script: columnScript },
    {
      id: 'arca', x: NUCLEO.arca.x, y: NUCLEO.arca.y, name: 'Arca',
      pages: [
        arcaPage(2, { when: (s) => !s.flag(ARCA_OPEN), trigger: 'action', script: async (ctx) => {
          await ctx.say('Una caja hexagonal de piedra y bronce, cerrada. No tiene cerradura ni bisagras a la vista.');
          if (casildaRoom(ctx.state) === ROOM.nucleo) await say(ctx, C, 'Siempre ha estado ahí. Cerrada. La limpio por fuera.');
        } }),
        arcaPage(6, { when: (s) => s.flag(ARCA_OPEN) && !s.flag(F.nucleo) }),
        { when: (s) => s.flag(F.nucleo) },
      ],
    },
    { id: 'escena_atajo', x: 1, y: 2, trigger: 'auto', when: (s) => s.flag(F.nucleo) && !s.flag(F.shortcut), script: resumeShortcut },
  ];
}
