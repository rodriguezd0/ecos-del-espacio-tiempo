// Núcleo del Pilar Invertido (docs/CAMPANA.md B12 «Núcleo», §2.4 N3, §3.0 verso VI): N3 está fundido con el sello de
// la brecha. El jugador toca tres Anclas en orden —el del camino: La Cara Vuelta (veta), La Mirada (ojo), El
// Sumidero (gota)— mientras el sello se vuelve a formar sin N3. Equivocarse no penaliza: el sello vuelve a abrirse
// y se empieza de nuevo. Al cerrarse: restorePillar(6) (Fragmento 6 y verso VI), N3 se libera y se une (50 % y Nadar
// con 50 células; si faltan, «Me faltan N partes») y se abre el portal de regreso a la explanada interior.
import { F, V, EXT, OBJ, ANCHOR_ART, VIOLET, GREEN, when, pause, eventById } from './b12_common.js';
import { NUCLEO, VESTIBULO } from '../maps/b12/layout.js';
import { portalEvent } from './b12_distorsion.js';

export const NUCLEO_TEXT = Object.freeze({
  sealOpen: 'Un anillo de piedra rota alrededor de un remolino oscuro. En el centro late una luz verde, atrapada.',
  sealDone: 'Un sello hexagonal de piedra, entero. Los glifos violetas laten despacio, en calma.',
  anchor: 'Un poste de piedra con un símbolo tallado en la base.',
  local: 'Arriba, muy lejos, el aljibe deja de gemir. Ya no se filtra nada por él.',
  // Antes lo decía Zygarde; ahora es narración (Zygarde habla muy poco (autor, 25-09-2026)).
  arrival: 'Alrededor del sello, tres postes con un símbolo tallado en la base. En el anillo roto, unos glifos gastados: «En el orden en que se cruza este lugar, el sello aprende a cerrarse».',
  wrong: 'El sello se abre un poco más y los postes se apagan. Hay que empezar desde el principio.',
});

const SYMBOL_NAME = Object.freeze({ veta: 'una veta que dobla', ojo: 'un ojo abierto', gota: 'una gota que sube' });

const progress = (s) => Number(s?.var?.(V.nucleoOrden, 0)) || 0;

async function nucleoArrival(ctx) {
  ctx.setFlag(F.nucleoVisto);
  await pause(ctx, 30);
  await ctx.say(NUCLEO_TEXT.arrival);
}

async function wrongOrder(ctx) {
  ctx.setVar(V.nucleoOrden, 0);
  ctx.se('PRSFX- Shadow Sneak1', { volume: 70 });
  await ctx.flash?.([...VIOLET], 16, 170);
  await ctx.shake?.(4, 7, 24);
  await ctx.say(NUCLEO_TEXT.wrong);
}

/** Cierre del sello, restauración del Pilar y liberación de N3. */
async function sealScene(ctx) {
  ctx.setFlag(F.selloCerrado);
  const seal = NUCLEO.seal;
  ctx.se('Anim/Saint9', { volume: 70 });
  await ctx.shake?.(3, 6, 40);
  await pause(ctx, 40);
  let ok = false;
  try {
    ok = await ctx.story.restorePillar(6, {
      core: { x: seal.x, y: seal.y - 2 },
      onRestored: async (c) => {
        await freeN3(c);
        await c.say(NUCLEO_TEXT.local);
      },
    });
  } catch (err) {
    console.error('[b12] Restauración del P6', err);
  }
  if (ctx.flag(EXT.restored)) {
    // N3 es la llave de Nadar (G9): si algo falló a mitad de la escena, se une igualmente (sin bloqueo posible).
    if (!ctx.state.hasCore('N3')) {
      try {
        const { grantCore } = await import('../../world/zygarde/scenes.js');
        await grantCore(ctx, 'N3', { scenes: true });
      } catch (err) {
        console.error('[b12] N3 tras el P6', err);
      }
    }
    return;
  }
  if (!ok) {
    // Sin el Fragmento 5 el núcleo no responde (cadena de resonancia), o la escena falló: el sello queda abierto
    // para volver a intentarlo.
    ctx.setFlag(F.selloCerrado, false);
    ctx.setVar(V.nucleoOrden, 0);
  }
}

/** N3 sale del sello y se une a Zygarde (50 % y Nadar si hay 50 células; si no, dice cuántas partes faltan). */
async function freeN3(ctx) {
  const seal = NUCLEO.seal;
  let fx = null;
  try {
    fx = ctx.effect?.('zygardeCell', { x: seal.x, y: seal.y - 2, size: 96, color: [...GREEN] });
  } catch { fx = null; }
  ctx.se('core_signal', { volume: 80 });
  await pause(ctx, 50);
  fx?.remove?.(40);
  ctx.se('Mining item get');
  await ctx.flash?.([...GREEN], 24, 200);
  const { grantCore, sayMissingParts } = await import('../../world/zygarde/scenes.js');
  const { missingParts } = await import('../../world/zygarde/progression.js');
  await grantCore(ctx, 'N3', { scenes: true });
  const missing = missingParts(ctx.state, 'swim');
  if (missing > 0 && !ctx.state.zygardeAbility('swim')) await sayMissingParts(ctx, missing);
}

function anchorEvent(a) {
  const sprite = ANCHOR_ART[a.symbol];
  const touch = async (ctx) => {
    if (ctx.flag(F.selloCerrado) || ctx.flag(EXT.restored)) {
      await ctx.say(`${NUCLEO_TEXT.anchor} Es ${SYMBOL_NAME[a.symbol]}.`);
      return;
    }
    const n = progress(ctx.state);
    if (n >= a.order) {
      await ctx.say(`${NUCLEO_TEXT.anchor} Es ${SYMBOL_NAME[a.symbol]}. Ya brilla.`);
      return;
    }
    if (a.order !== n + 1) { await wrongOrder(ctx); return; }
    ctx.setVar(V.nucleoOrden, n + 1);
    ctx.se('PRSFX- Ally Switch', { volume: 70 });
    await ctx.flash?.([...VIOLET], 12, 110);
    const seal = eventById(ctx, 'b12_sello');
    if (seal) seal.refresh();
    if (a.order === 3) await sealScene(ctx);
  };
  const lit = (s) => progress(s) >= a.order || Boolean(s?.flag(F.selloCerrado)) || Boolean(s?.flag(EXT.restored));
  return {
    id: a.id, x: a.x, y: a.y, name: 'Ancla',
    pages: [
      { sprite, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'touch', script: touch },
      { when: lit, sprite, dir: 4, directionFix: true, walkAnime: false, stepAnime: true, solid: true, trigger: 'touch', script: touch, light: { radius: 60, intensity: 0.8 } },
    ],
  };
}

function sealEvent() {
  const s = NUCLEO.seal;
  const describe = async (ctx) => { await ctx.say(ctx.flag(F.selloCerrado) || ctx.flag(EXT.restored) ? NUCLEO_TEXT.sealDone : NUCLEO_TEXT.sealOpen); };
  const base = { sprite: OBJ.seal, directionFix: true, walkAnime: false, solid: true, shadow: false, trigger: 'action', script: describe };
  const glow = { name: 'softLight', radius: 120, intensity: 0.6, pulse: 0.5, color: [...GREEN] };
  return {
    id: 'b12_sello', x: s.x, y: s.y,
    pages: [
      { ...base, dir: 2, stepAnime: true, glow },
      { ...base, when: (st) => progress(st) === 1, dir: 4, pattern: 1, stepAnime: false, glow },
      { ...base, when: (st) => progress(st) === 2, dir: 4, pattern: 3, stepAnime: false, glow },
      { ...base, when: (st) => progress(st) >= 3 || Boolean(st?.flag(F.selloCerrado)) || Boolean(st?.flag(EXT.restored)), dir: 6, stepAnime: true },
    ],
  };
}

/** El sprite del sello ocupa 5×4 casillas: eventos invisibles que no dejan pisarlo. */
function sealBlockers() {
  const s = NUCLEO.seal;
  const out = [];
  for (let y = s.y - 3; y <= s.y; y++) {
    for (let x = s.x - 2; x <= s.x + 2; x++) {
      if (x === s.x && y === s.y) continue;
      out.push({ id: `b12_sello_${x}_${y}`, x, y, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(ctx.flag(F.selloCerrado) || ctx.flag(EXT.restored) ? NUCLEO_TEXT.sealDone : NUCLEO_TEXT.sealOpen); } });
    }
  }
  return out;
}

export function nucleoEvents() {
  const N = NUCLEO;
  const back = { map: 'pilar_invertido', ...VESTIBULO.returnArrival };
  return [
    { id: 'b12_llegada_nucleo', x: N.arrival.x, y: N.arrival.y, through: true, trigger: 'auto', when: when({ none: [F.nucleoVisto] }), script: nucleoArrival },
    sealEvent(),
    ...sealBlockers(),
    ...N.anchors.map(anchorEvent),
    portalEvent('b12_portal_regreso', N.portalBack.x, N.portalBack.y, back, { when: when({ all: [EXT.restored] }) }),
  ];
}
