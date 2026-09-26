// Núcleo del Pilar del Origen (docs/CAMPANA.md B20; D19; biblia §6.10):
//   · El núcleo responde (cadena de resonancia: hace falta el Fragmento 9) y libera el Fragmento 10: restorePillar(10).
//   · Los diez Fragmentos se elevan y se unen solos por resonancia con Zygarde, sin artesano: la Flauta Azur
//     (story.forgeAzureFlute → AZUREFLUTE; música Pokeflauta, CAMPANA §1.8).
//   · La profecía se lee entera, de corrido (los diez versos).
//   · Falsa calma (D19): se cierran las grietas del cielo, pero la luna sigue grande y el cielo zumba. Zygarde: «El Eje
//     está entero. Pero quien lo sostiene duerme.» La crisis pasa sola a la fase 4 (content/story/crisis.js, p10_restored).
//   · Salida del bloque: p10_restored y b20_flute. El sello del suelo queda como Nodo del Origen para el Salto de
//     Convergencia (B21 lo engancha con registerOriginNode).
import { F, OBJ, GOLD, MUSIC, zygardeSays, zygardeLines, pause, lines } from './b20_common.js';
import { NUCLEO } from '../maps/b20/layout.js';
import { VERSES } from '../story/verses.js';
import { FLUTE_ITEM } from '../story/fragments.js';

export const NUCLEO_TEXT = Object.freeze({
  enter: ['Una sala dorada, en silencio. En el suelo, un gran sello hexagonal late despacio, como un corazón dormido.'],
  core: 'El sello del suelo late despacio.',
  coreCold: 'El sello del suelo guarda un calor tranquilo.',
  rise: 'Los Fragmentos Azur salen solos de tu Mochila y se elevan sobre el sello. Zygarde resuena, y ellos le responden…',
  join: '…giran cada vez más deprisa, se acercan… y se unen en una sola pieza.',
  prophecyIntro: 'Con la Flauta en la mano, los diez versos se leen de corrido, como una sola frase:',
  calm: [
    'Arriba, muy lejos, algo se cierra: las grietas del cielo, una tras otra.',
    'Pero la luna no se encoge. Y el cielo zumba, como una cuerda demasiado tensa.',
  ],
  // Canónica (CAMPANA B20, falsa calma): la única línea de Zygarde en el núcleo (autor, 25-09-2026).
  calmCore: 'El Eje está entero. Pero quien lo sostiene duerme.',
  node: 'El sello del suelo late con una luz verde y dorada. Zygarde lo mira en silencio.',
});

const restored = (s) => Boolean(s?.flag(F.restored));
const fluted = (s) => Boolean(s?.flag(F.flute));

/** Los diez Fragmentos se elevan alrededor del núcleo y convergen en el centro (eventos creados para la escena). */
async function fragmentsRise(ctx) {
  const { x: cx, y: cy } = NUCLEO.core;
  const shards = [];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const x = cx + Math.round(Math.cos(a) * 3);
    const y = cy + Math.round(Math.sin(a) * 2);
    const ev = ctx.world?.spawnEvent?.({ id: `fragmento_${k}`, x, y, sprite: OBJ.shard, dir: 2, directionFix: true, stepAnime: true, speed: 4, through: true, shadow: false });
    if (ev) { ev.opacity = 0; shards.push(ev); }
  }
  await ctx.say(NUCLEO_TEXT.rise);
  ctx.se('Anim/Saint9', { volume: 70 });
  for (let o = 0; o <= 255; o += 32) { for (const ev of shards) ev.opacity = Math.min(255, o); await pause(ctx, 2); }
  for (const ev of shards) {
    const route = [];
    let x = ev.x;
    let y = ev.y;
    while (x !== cx || y !== cy) {
      if (x < cx) { route.push('right'); x += 1; } else if (x > cx) { route.push('left'); x -= 1; } else if (y < cy) { route.push('down'); y += 1; } else { route.push('up'); y -= 1; }
    }
    ctx.move(ev, [{ speed: 3 }, ...route], { through: true, wait: false });
  }
  await pause(ctx, 70);
  await ctx.say(NUCLEO_TEXT.join);
  await ctx.flash([160, 210, 255], 30, 255);
  for (const ev of shards) ctx.world?.removeEvent?.(ev);
  ctx.requestRefresh();
}

/** La profecía entera, de corrido (§3.0): los diez versos seguidos, tal como los lee la Clave Glífica. */
async function readProphecy(ctx) {
  await ctx.tone?.([-40, -30, -10, 40], 30);
  await ctx.say(NUCLEO_TEXT.prophecyIntro);
  for (const v of VERSES) await ctx.say(`${v.numeral}. ${v.text}`);
  await ctx.tone?.([0, 0, 0, 0], 30);
  ctx.setFlag(F.prophecy);
}

/** Falsa calma (D19). */
async function falseCalm(ctx) {
  ctx.se('PRSFX- Earthquake', { volume: 60 });
  await ctx.shake(2, 4, 40);
  for (const t of NUCLEO_TEXT.calm) await ctx.say(t);
  await zygardeSays(ctx, NUCLEO_TEXT.calmCore);
  ctx.story?.setCrisisPhase?.(null); // derivada: fase 4 (falsa calma) con p10_restored
  ctx.setFlag(F.calm);
}

/** Efecto local del P10 (restorePillar.onRestored): la Flauta, la profecía y la falsa calma. */
async function onRestored(ctx) {
  await pause(ctx, 20);
  await fragmentsRise(ctx);
  ctx.bgm(MUSIC.flute, { fadeOutPrevious: 20 });
  await ctx.story.forgeAzureFlute();
  await readProphecy(ctx);
  await falseCalm(ctx);
}

async function coreScene(ctx) {
  const C = NUCLEO.core;
  const ok = await ctx.story.restorePillar(10, { core: { x: C.x, y: C.y }, onRestored, showVerse: false, bgmAfter: null });
  if (!ok) return;
  if (!ctx.state.hasKeyItem?.(FLUTE_ITEM)) await ctx.story.forgeAzureFlute();
  ctx.setFlag(F.flute);
  ctx.requestRefresh();
}

/**
 * Nodo del Origen tras la Flauta. El Salto de Convergencia es de B21 (CAMPANA B21.1): B21 puede sustituir este guion
 * registrando el suyo con `registerOriginNode(fn)` desde un módulo que cargue el mapa (p. ej. añadiéndolo a
 * nucleo_origen.js de forma aditiva). Sin él, el nodo solo late.
 */
let nodeHook = null;
export function registerOriginNode(fn) { nodeHook = typeof fn === 'function' ? fn : null; }
async function nodeScript(ctx) {
  if (nodeHook) { await nodeHook(ctx); return; }
  await ctx.say(NUCLEO_TEXT.node);
}

export function nucleoEvents() {
  const C = NUCLEO.core;
  return [
    {
      id: 'nucleo_origen', x: C.x, y: C.y, name: 'Núcleo',
      pages: [
        {
          solid: true, trigger: 'action', glow: { name: 'softLight', radius: 110, intensity: 0.75, pulse: 0.6, color: [...GOLD] },
          script: async (ctx) => { await ctx.say(NUCLEO_TEXT.core); await coreScene(ctx); },
        },
        {
          when: (s) => restored(s) && !fluted(s), solid: true, trigger: 'action', glow: { name: 'softLight', radius: 90, intensity: 0.6, pulse: 0.4, color: [...GOLD] },
          script: async (ctx) => {
            if (!ctx.state.hasKeyItem?.(FLUTE_ITEM)) { await fragmentsRise(ctx); await ctx.story.forgeAzureFlute(); }
            if (!ctx.flag(F.prophecy)) await readProphecy(ctx);
            if (!ctx.flag(F.calm)) await falseCalm(ctx);
            ctx.setFlag(F.flute);
          },
        },
        { when: fluted, solid: true, trigger: 'action', glow: { name: 'softLight', radius: 80, intensity: 0.5, pulse: 0.3, color: [110, 230, 150] }, script: nodeScript },
      ],
    },
  ];
}

export async function nucleoOnEnter(ctx) {
  if (ctx.flag('b20_nucleo_visto')) return;
  ctx.setFlag('b20_nucleo_visto');
  await pause(ctx, 16);
  for (const t of NUCLEO_TEXT.enter) await ctx.say(t);
}

export { lines, zygardeLines };
