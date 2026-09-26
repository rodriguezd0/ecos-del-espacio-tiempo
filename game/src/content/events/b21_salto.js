// Salto de Convergencia (docs/CAMPANA.md B21 §1; biblia §8 «Salto de Convergencia: un sistema distinto»): Zygarde
// adopta a propósito la Forma 10 % y lleva al jugador por los caminos viejos de la red, del Nodo del Origen a Columna
// Lanza (y en el epílogo, de Columna Lanza al nodo del Laberinto). Aviso previo de no retorno; «el nodo espera».
// La cinemática (20–30 s: velocidad, espacio estirado, destellos de ruinas) es la de world/zygarde (convergenceJump),
// con una capa de escritura Unown encima; desde la segunda vez se salta con A/B y deja el mismo estado final.
//
// El Nodo del Origen está en `nucleo_origen` (B20). Este módulo exporta el evento para que ese mapa lo coloque en su
// hexágono con una línea (`...b21NodoOrigenEvents({ x, y })`); mientras B20 no exista, la maqueta de pruebas
// `dev_nodo_origen` lo usa (README del bloque).
import { F, SPRITE, GREEN, zygardeSays, pause } from './b21_common.js';
import { JUMP_TEXT } from './b21_texts.js';
import { COLUMNA } from '../maps/b21/layout.js';

/** Duración de la cinemática del Salto (25 s a 60 fotogramas por segundo). */
export const JUMP_FRAMES = 1500;

/** Textos que pasan escritos en Unown durante el Salto: los diez versos de la profecía (canon, §3.0). */
async function unownLayer() {
  if (typeof document === 'undefined') return null;
  try {
    const [{ unownJumpLayer }, { VERSES }] = await Promise.all([import('./b21_fx.js'), import('../story/verses.js')]);
    return await unownJumpLayer(VERSES.map((v) => v.text));
  } catch (err) {
    console.warn('[b21] capa Unown del Salto', err);
    return null;
  }
}

/**
 * Zygarde adopta a propósito la Forma 10 % ANTES de «Súbete. Esta forma sabe correr…» (CAMPANA B21 §1: la frase
 * habla de la forma que ya tiene): hexágonos, destello verde y la cadena de seguidores al día.
 */
export async function becomeTenPercent(ctx, { text = null } = {}) {
  const { setForm } = await import('../../world/zygarde/progression.js');
  setForm(ctx.state, '10');
  ctx.scene?.refreshFollower?.();
  const at = ctx.world?.core?.visible ? ctx.world.core : ctx.player;
  const burst = at ? ctx.effect?.('zygardeHexBurst', { x: at.x, y: at.y, mode: 'out', count: 18 }) : null;
  ctx.se?.('core_signal', { volume: 50 });
  await ctx.flash?.([...GREEN], 12, 100);
  await pause(ctx, 8);
  burst?.remove?.(20);
  if (text) await ctx.say(text);
}

/**
 * Hace el Salto hasta (to, x, y). Zygarde en 10 % a propósito, montura forzada, cinemática y llegada.
 * El estado final es el mismo se vea entera o se salte.
 */
export async function convergenceTravel(ctx, { to, x, y, dir = 2 }) {
  const [{ convergenceJump }, { unlockCapability }] = await Promise.all([
    import('../../world/zygarde/actions.js'), import('../../world/zygarde/scenes.js'),
  ]);
  await unlockCapability(ctx, 'jump');
  const draw = await unownLayer();
  await convergenceJump(ctx, { to, x, y, dir, frames: JUMP_FRAMES, draw });
}

/** Tras el Salto: baja de la montura y Zygarde vuelve a su Forma Completa (la natural tras el P8). */
export async function landFromJump(ctx, { formText = null } = {}) {
  const [{ setRiding }, { setForm }] = await Promise.all([
    import('../../world/zygarde/mount.js'), import('../../world/zygarde/progression.js'),
  ]);
  setRiding(ctx.world, false);
  setForm(ctx.state, 'complete');
  ctx.scene?.refreshFollower?.();
  const p = ctx.player;
  const burst = ctx.effect?.('zygardeHexBurst', { x: p.x, y: p.y, mode: 'in', count: 22 });
  ctx.se?.('core_signal', { volume: 50 });
  await ctx.flash?.([...GREEN], 14, 110);
  await pause(ctx, 10);
  burst?.remove?.(20);
  if (formText) await ctx.say(formText);
}

/** Guion del Nodo del Origen: aviso, «¿Saltar?», Forma 10 % y Salto hasta la antecámara de Columna Lanza. */
export async function nodoOrigenScript(ctx) {
  if (!ctx.flag(F.p10Restored)) {
    await ctx.say(JUMP_TEXT.node);
    await ctx.say(JUMP_TEXT.noJump);
    return;
  }
  if (ctx.flag(F.jumpDone)) {
    await ctx.say(JUMP_TEXT.noJump);
    return;
  }
  await ctx.say(JUMP_TEXT.node);
  await ctx.say(JUMP_TEXT.warn);
  ctx.setFlag(F.jumpWarned);
  const go = await ctx.choice(['Sí', 'Todavía no'], { message: JUMP_TEXT.ask, cancel: 1 });
  if (go !== 0) {
    await ctx.say(JUMP_TEXT.wait);
    return;
  }
  await becomeTenPercent(ctx, { text: JUMP_TEXT.form });
  await zygardeSays(ctx, JUMP_TEXT.ride);
  await convergenceTravel(ctx, { to: 'columna_lanza', x: COLUMNA.arrival.x, y: COLUMNA.arrival.y, dir: COLUMNA.arrival.dir });
  ctx.setFlag(F.jumpDone);
}

/**
 * Evento del Nodo del Origen para `nucleo_origen` (B20) u otro mapa: hexágono del suelo que late en verde (se pisa;
 * A encima o delante). opts: { id = 'b21_nodo_origen', x, y }.
 */
export function b21NodoOrigenEvents({ id = 'b21_nodo_origen', x, y } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('b21NodoOrigenEvents: faltan x, y del hexágono');
  return [{
    id, x, y, name: 'Nodo del Origen',
    pages: [
      {
        when: (s) => s.flag(F.p10Restored) && !s.flag(F.jumpDone), trigger: 'action', through: true,
        glow: { name: 'softLight', radius: 70, intensity: 0.5, pulse: 0.45, color: [...GREEN] },
        script: nodoOrigenScript,
      },
      { when: (s) => s.flag(F.jumpDone), trigger: 'action', through: true, script: async (ctx) => { await ctx.say(JUMP_TEXT.noJump); } },
    ],
  }];
}

/** Gráfico de la Honor Ball y de los destellos (para escenas del bloque). */
export const OBJECT_SPRITE = SPRITE.objects;

// B20 deja el sello del Núcleo del Origen como Nodo y ofrece `registerOriginNode(fn)` (content/events/b20_nucleo.js):
// al cargarse este módulo se registra el guion del Salto. Import dinámico y tolerante: si B20 aún no está (o falla), el
// nodo de B20 solo late y la maqueta dev_nodo_origen sigue sirviendo para probar.
import('./b20_nucleo.js')
  .then((m) => { if (typeof m.registerOriginNode === 'function') m.registerOriginNode(nodoOrigenScript); })
  .catch(() => {});
