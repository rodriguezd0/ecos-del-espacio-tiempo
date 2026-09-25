// Telar del Alma (docs/CAMPANA.md B16: «en el Telar del Alma el trío trenza las tres Hebras. Ritual breve (secuencia de
// tres pulsaciones). No hay herrero.» · «El trío presta su poder, recita el verso VIII y vuelve a sus alas»; §3.0 verso
// VIII; restauración con la API de historia). C100 está en la única casilla desde la que se alcanza el Telar, así que
// se recoge ANTES del núcleo: la Forma Completa llega al salir (b16_hito.js), nunca aquí dentro.
import { F, V, SPEAKER, SPRITE, OBJ, TRIO_COLORS, PINK, lines, zygardeSays, when, pause } from './b16_common.js';
import { TELAR, PATIO } from '../maps/b16/santuario_layout.js';
import { VERSES } from '../story/verses.js';
import { pilarTone } from '../stamps/pilar.js';

const THREADS = Object.freeze([
  Object.freeze({ item: 'KNOWLEDGETHREAD', color: TRIO_COLORS.saber, name: 'la Hebra del Saber' }),
  Object.freeze({ item: 'EMOTIONTHREAD', color: TRIO_COLORS.sentir, name: 'la Hebra del Sentir' }),
  Object.freeze({ item: 'WILLTHREAD', color: TRIO_COLORS.querer, name: 'la Hebra del Querer' }),
]);
const DARK_FRAMES = 40; // espera con la hebra apagada (pulsar antes = fallar esa hebra)
const LIT_FRAMES = 50; // ventana para pulsar A con la hebra encendida

export const TELAR_TEXT = Object.freeze({
  arrive: 'Una sala dorada. En el centro, un telar de piedra con la urdimbre vacía. El aire vibra como una cuerda tensa.',
  loom: 'Un telar de piedra antigua. La urdimbre espera.',
  loomAfter: 'En el telar quedan las marcas de la Cadena: tres hilos trenzados, rojos como brasas.',
  howTo: 'Pulsa A cuando brille cada hebra: la dorada, la rosa y la azul.',
  // Avisos breves (ui.toast: una línea corta)
  early: 'Demasiado pronto. Otra vez.',
  missed: 'La hebra se apagó. Otra vez.',
  woven: (name) => `${name.replace(/^la /, '').replace(/^./, (c) => c.toUpperCase())}: tejida.`,
  chain: 'Las tres hebras se trenzan solas. Del telar cae una cadena roja, tibia al tacto.',
});

/** Estado del ritual para el recorrido E2E (solo en el navegador). */
function publish(state) {
  if (typeof window !== 'undefined') window.__b16Ritual = state;
}

/**
 * Espera una pulsación de A durante `frames`: → true si se pulsó. Sin escena (pruebas sin navegador) devuelve
 * `headless`: nadie pulsa con la hebra apagada y se pulsa a tiempo con ella encendida.
 */
async function pressWithin(ctx, frames, headless) {
  const runner = ctx.scene?.runner;
  const inp = ctx.world?.input;
  if (!runner?.until || !inp) return headless;
  let pressed = false;
  let left = frames;
  await runner.until(() => {
    if (inp.pressed('A')) { pressed = true; return true; }
    left -= 1;
    return left <= 0;
  });
  return pressed;
}

/** Una pulsación: la hebra i se enciende; hay que pulsar A con ella encendida (antes o después, se repite). */
async function pulse(ctx, i) {
  const t = THREADS[i];
  for (;;) {
    publish({ index: i, lit: false });
    if (await pressWithin(ctx, DARK_FRAMES, false)) { ctx.se('buzzer'); ctx.ui?.toast?.(TELAR_TEXT.early); await pause(ctx, 20); continue; }
    publish({ index: i, lit: true });
    ctx.se('PRSFX- Heal Bell', { volume: 70 });
    const glow = ctx.effect?.('softLight', { x: TELAR.loom.x, y: TELAR.loom.y - 1, radius: 90, color: [...t.color], intensity: 0.85, fadeIn: 4 });
    const ok = await pressWithin(ctx, LIT_FRAMES, true);
    glow?.remove?.(10);
    if (ok) {
      ctx.se('Mining item get');
      ctx.setVar(V.weaves, i + 1);
      ctx.ui?.toast?.(TELAR_TEXT.woven(t.name));
      publish({ index: i, lit: false, done: true });
      return;
    }
    ctx.ui?.toast?.(TELAR_TEXT.missed);
  }
}

async function ritual(ctx) {
  await lines(ctx, null, [TELAR_TEXT.howTo]);
  ctx.setVar(V.weaves, 0);
  for (let i = 0; i < THREADS.length; i++) await pulse(ctx, i);
  publish(null);
  ctx.se('PRSFX- Healing Wish');
  await ctx.flash([224, 48, 72], 24, 200);
  for (const t of THREADS) ctx.state.removeKeyItem?.(t.item);
  ctx.setFlag(F.telar);
  await ctx.say(TELAR_TEXT.chain);
  await ctx.giveItem('REDCHAIN', 1);
}

async function trioRecites(ctx) {
  const v = VERSES[7].text; // «Sabrá, sentirá y querrá, y el guardián volverá a ser entero.»
  await ctx.say('Sabrá,', { speaker: SPEAKER.uxie });
  await ctx.say('sentirá', { speaker: SPEAKER.mesprit });
  await ctx.say('y querrá,', { speaker: SPEAKER.azelf });
  await ctx.say('…y el guardián volverá a ser entero.');
  await zygardeSays(ctx, 'Entero. …Me lo dicen a mí.');
  return v;
}

async function onRestored(ctx) {
  await lines(ctx, SPEAKER.uxie, ['Te prestamos lo que somos. Ya sabes para qué sirve la Cadena.']);
  await ctx.say('Úsala sin miedo. Pero no la uses sola.', { speaker: SPEAKER.mesprit });
  await ctx.say('Y no te pares.', { speaker: SPEAKER.azelf });
  ctx.se('PRSFX- Psych Up');
  await ctx.flash([...PINK], 20, 180);
  await ctx.say('Las tres luces se separan y vuelven cada una a su ala.');
  ctx.requestRefresh();
  await ctx.tone(pilarTone('P8', 0.3), 40);
  // El cielo se rompe al salir (b16_hito.js): hasta entonces se mantiene la fase 2 aunque el P8 ya esté restaurado.
  ctx.story.setCrisisPhase(2);
}

async function telarScene(ctx) {
  if (ctx.flag(F.restored)) { await ctx.say(TELAR_TEXT.loomAfter); return; }
  if (!ctx.flag(F.telar)) {
    await lines(ctx, SPEAKER.uxie, ['Aquí se trenza.']);
    await ctx.say('Tres hebras. Una sola cadena.', { speaker: SPEAKER.mesprit });
    await ctx.say('Sujétalas cuando brillen. Ni antes ni después.', { speaker: SPEAKER.azelf });
    await ritual(ctx);
  }
  await trioRecites(ctx);
  const ok = await ctx.story.restorePillar(8, { core: { x: TELAR.loom.x, y: TELAR.loom.y }, onRestored });
  if (!ok) return;
  await zygardeSays(ctx, 'Afuera. Algo se está rompiendo. Lo noto en todas mis partes.');
}

function loomEvents() {
  const L = TELAR.loom;
  return [
    {
      id: 'telar_alma', x: L.x, y: L.y, name: 'Telar',
      pages: [
        { sprite: OBJ.loom, dir: 2, solid: true, trigger: 'action', directionFix: true, script: telarScene },
        { when: (s) => s.flag(F.telarOpen) && !s.flag(F.telar), sprite: OBJ.loom, dir: 4, stepAnime: true, solid: true, trigger: 'action', directionFix: true, script: telarScene },
        { when: (s) => s.flag(F.telar), sprite: OBJ.loom, dir: 6, stepAnime: true, solid: true, trigger: 'action', directionFix: true, script: telarScene },
      ],
    },
    ...TELAR.loomBlocks.map(([x, y], i) => ({ id: `telar_bloque_${i}`, x, y, solid: true, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(TELAR_TEXT.loom); } })),
  ];
}

function trioEvents() {
  const T = TELAR.trio;
  const present = when({ all: [F.telarOpen], none: [F.restored] });
  return [
    { id: 'telar_uxie', x: T.uxie.x, y: T.uxie.y, name: SPEAKER.uxie, pages: [{ when: present, sprite: SPRITE.uxie, dir: T.uxie.dir, stepAnime: true, solid: true, opacity: 220, script: (ctx) => ctx.say('Delante del telar.', { speaker: SPEAKER.uxie }) }] },
    { id: 'telar_mesprit', x: T.mesprit.x, y: T.mesprit.y, name: SPEAKER.mesprit, pages: [{ when: present, sprite: SPRITE.mesprit, dir: T.mesprit.dir, stepAnime: true, solid: true, opacity: 220, script: (ctx) => ctx.say('Te esperábamos.', { speaker: SPEAKER.mesprit }) }] },
    { id: 'telar_azelf', x: T.azelf.x, y: T.azelf.y, name: SPEAKER.azelf, pages: [{ when: present, sprite: SPRITE.azelf, dir: T.azelf.dir, stepAnime: true, solid: true, opacity: 220, script: (ctx) => ctx.say('No te quedes ahí.', { speaker: SPEAKER.azelf }) }] },
  ];
}

export function telarEvents() {
  return [
    {
      id: 'telar_llegada', x: TELAR.entry.arrive.x, y: TELAR.entry.arrive.y,
      pages: [{ when: (s) => !s.flag('b16_telar_visto'), trigger: 'auto', script: async (ctx) => { ctx.setFlag('b16_telar_visto'); await ctx.say(TELAR_TEXT.arrive); } }],
    },
    ...loomEvents(),
    ...trioEvents(),
    { id: 'celula_alma_4', type: 'zygardeCell', cell: 'cell_alma_4', x: TELAR.cell.x, y: TELAR.cell.y },
  ];
}

/** Warps del Telar: su escalinata baja al hexágono del patio. */
export function telarWarps() {
  const s = PATIO.seal;
  return TELAR.entry.exits.map((e) => ({ x: e.x, y: e.y, dirTrigger: 2, to: 'santuario_alma', tx: s.x, ty: s.y + 1, dir: 2 }));
}
