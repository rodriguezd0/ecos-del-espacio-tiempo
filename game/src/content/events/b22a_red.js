// Red de Convergencia (docs/CAMPANA.md §1.7 y §1.6, X12; biblia §8): en el postgame, Zygarde en 10 % salta entre los
// nodos que ya se conocen —el Laberinto de la Profundidad, el aljibe del Monte del Portal, el Núcleo del Origen y
// Columna Lanza—, nunca entre ciudades. El Salto es el de B21 (convergenceTravel: cinemática que se salta con A desde la
// segunda vez). Nodos:
//   · Laberinto (B01): hexágono sobre la piedra del Core (evento nuevo en laberinto_profundidad).
//   · Aljibe (B01/B12): hexágono pequeño en el estrado, junto al brocal (evento nuevo en montana_portal).
//   · Origen (B20): el sello del Núcleo; B21 le colgó el Salto con registerOriginNode y aquí se envuelve (fuera del
//     postgame sigue haciendo lo de B21).
//   · Columna Lanza (B21): el hexágono de la antecámara (página añadida al evento del nodo).
// Además, en el postgame el Agente Olmedo deja pasar al Laberinto (villa_alba, B01) para poder usar su nodo.
import { F, OBJ, GREEN, SPEAKER, isPostgame, zygardeSays, zygardeLines, when, lines } from './b22a_common.js';
import { RED_TEXT, OLMEDO_TEXT } from './b22a_texts.js';
import { RED_NODES, redNode } from '../maps/b22a/layout.js';

/** ¿Conoce ya el jugador el nodo? (visitó su mapa o vivió la escena que lo prueba). Puro. */
export function nodeKnown(state, node) {
  if (!state || !node) return false;
  const visited = state.data?.visited || [];
  return visited.includes(node.map) || node.story.some((f) => state.flag(f));
}

/** Destinos del Salto desde el nodo `here` (los demás nodos conocidos, en el orden fijo de la Red). Puro. */
export function redDestinations(state, here) {
  return RED_NODES.filter((n) => n.id !== here && nodeKnown(state, n));
}

/** Salto de un nodo a otro con la cinemática de B21 (Forma 10 % a propósito, montura, llegada en Forma Completa). */
export async function jumpTo(ctx, node) {
  const [{ becomeTenPercent, convergenceTravel, landFromJump }] = await Promise.all([import('./b21_salto.js')]);
  await becomeTenPercent(ctx);
  await zygardeSays(ctx, RED_TEXT.ride);
  await convergenceTravel(ctx, { to: node.map, x: node.x, y: node.y, dir: node.dir });
  await landFromJump(ctx);
}

/**
 * Uso de un nodo en el postgame: la primera vez Zygarde explica la Red; después, menú con los demás nodos conocidos.
 * → id del nodo al que se saltó, o null.
 */
export async function useNode(ctx, here) {
  if (!isPostgame(ctx.state)) return null;
  await ctx.say(RED_TEXT.node);
  if (!ctx.flag(F.redAbierta)) {
    ctx.setFlag(F.redAbierta);
    await zygardeLines(ctx, RED_TEXT.open);
  }
  const dests = redDestinations(ctx.state, here);
  if (!dests.length) { await ctx.say(RED_TEXT.none); return null; }
  const labels = [...dests.map((n) => n.label), RED_TEXT.stay];
  const i = await ctx.choice(labels, { message: RED_TEXT.ask, cancel: dests.length });
  const to = dests[i];
  if (!to) return null;
  await jumpTo(ctx, to);
  return to.id;
}

/** Hexágono de un nodo que se usa pisándolo (A encima): Laberinto y aljibe. Solo en el postgame. */
export function nodeEvent(here, { id = `b22a_nodo_${here}`, x, y, text = null } = {}) {
  const node = redNode(here);
  const nx = x ?? node.x;
  const ny = y ?? node.y;
  return {
    id, x: nx, y: ny, name: `Nodo: ${node.label}`,
    pages: [{
      when: (s) => isPostgame(s), sprite: OBJ.objetos, dir: 6, directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
      shadow: false, through: true, trigger: 'action',
      glow: { name: 'softLight', radius: 56, intensity: 0.4, pulse: 0.5, color: [...GREEN] },
      script: async (ctx) => {
        if (text) await ctx.say(text);
        await useNode(ctx, here);
      },
    }],
  };
}

/** Nodo del Laberinto (B01): sobre la piedra donde descansó el Core. */
export const labyrinthNodeEvents = () => [nodeEvent('laberinto')];
/** Nodo del aljibe (B01/B12): hexágono pequeño en el estrado, junto al brocal. */
export const aljibeNodeEvents = () => [nodeEvent('aljibe', { text: RED_TEXT.aljibeNode })];

/** Página añadida al nodo de Columna Lanza (B21): en el postgame, la Red (incluye el salto al Laberinto de B21). */
export function columnaNodePage() {
  return {
    when: (s) => isPostgame(s) && s.flag(F.epilogueBack), trigger: 'action', through: true,
    glow: { name: 'softLight', radius: 70, intensity: 0.4, pulse: 0.4, color: [...GREEN] },
    script: (ctx) => useNode(ctx, 'columna'),
  };
}

// ───────────────────────────── Nodo del Origen (B20/B21) ─────────────────────────────

/**
 * El Núcleo del Origen tiene un solo gancho (b20_nucleo.js#registerOriginNode) que B21 ocupa con el Salto a Columna
 * Lanza. Se envuelve: en el postgame, la Red; si no, el guion de B21. Se registra después del de B21 (su registro es
 * una promesa al importar b21_salto.js), con un tic de margen.
 */
async function registerNetworkOrigin() {
  try {
    const [b20, b21] = await Promise.all([import('./b20_nucleo.js'), import('./b21_salto.js')]);
    if (typeof b20.registerOriginNode !== 'function') return;
    await new Promise((r) => setTimeout(r, 0));
    b20.registerOriginNode(async (ctx) => {
      if (isPostgame(ctx.state)) { await useNode(ctx, 'origen'); return; }
      await b21.nodoOrigenScript(ctx);
    });
  } catch (err) {
    console.warn('[b22a] nodo del Origen', err);
  }
}
registerNetworkOrigin();

// ───────────────────────────── Villa Alba: la verja del Laberinto (B01) ─────────────────────────────

/** Olmedo en el postgame: deja pasar al Laberinto (los Arenzana lo han permitido). */
async function olmedoPostgame(ctx) {
  if (!ctx.flag('b22a_olmedo_permiso')) {
    ctx.setFlag('b22a_olmedo_permiso');
    await lines(ctx, SPEAKER.olmedo, OLMEDO_TEXT.lines);
    return;
  }
  await ctx.say(OLMEDO_TEXT.again(ctx.state), { speaker: SPEAKER.olmedo });
}

/**
 * Envoltorio aditivo de los eventos de Villa Alba (villa_alba.js): en el postgame la casilla que corta el paso al
 * Laberinto deja de hacerlo y Olmedo cambia de frase. Fuera del postgame no cambia nada.
 */
export function b22aVillaAlbaEvents(events) {
  return events.map((ev) => {
    if (ev.id === 'paso_policia') {
      const orig = ev.when;
      return { ...ev, when: (s, e) => (!orig || Boolean(orig(s, e))) && !isPostgame(s) };
    }
    if (ev.id === 'policia' && Array.isArray(ev.pages)) {
      return { ...ev, pages: [...ev.pages, { when: (s) => isPostgame(s), dir: 2, move: 'still', trigger: 'action', script: olmedoPostgame }] };
    }
    return ev;
  });
}

export { when };
