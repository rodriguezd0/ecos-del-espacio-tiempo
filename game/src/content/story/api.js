// API de historia para los guiones (docs/ARCHITECTURE.md §6b). Funciones con `ctx` primero; en los guiones
// también están enlazadas como `ctx.story.<función>(…)` (sin ctx):
//   await ctx.story.openClue('T01')                 pista inicial (cola de 3; { direct: true } = descubrimiento directo)
//   await ctx.story.advanceClue('T01', 2)           segunda pista (anillo de zona en el mapa regional)
//   await ctx.story.closeClue('T01')                resuelve la pista (lo hace giveTablet solo)
//   await ctx.story.giveTablet('MEADOWPLATE')       animación de obtención + entrada en la Crónica + cierra la pista
//   await ctx.story.revealVerse(1)                  placa Unown con traducción parcial o total (GLYPHKEY)
//   await ctx.story.restorePillar(1, { core, onRestored })   secuencia completa de «Pilar restaurado»
//   ctx.story.setCrisisPhase(3) / setCrisisPhase(null)       fuerza la fase de crisis o vuelve a la derivada
// Sin DOM (node --test) las presentaciones se omiten y solo cambia el estado. Nada de este módulo importa el
// motor: la presentación (content/story/storyFx.js) se carga bajo demanda.
import { clueArcForTablet } from './clues.js';
import { openClueState, advanceClueState, closeClueState, refreshClueQueue, clueStatus, STATUS } from './clueLogic.js';
import { tabletById, RETIRED_TABLET } from './tablets.js';
import { chronicleFor } from './chronicle.js';
import { verseFor, verseFlag, hasGlyphKey, verseTranslation, unownText, CONFIRMATION_FLAG } from './verses.js';
import { fragmentFor, fragmentId, hasFragment, FRAGMENT_ITEM, FLUTE_ITEM, PILLAR_COUNT } from './fragments.js';
import { CRISIS_OVERRIDE_VAR, CRISIS_RESTORED, crisisPhase } from './crisis.js';

const HEADLESS = typeof document === 'undefined';
const loadFx = () => import('./storyFx.js');

export const STORY_TEXT = Object.freeze({
  clueNew: 'Nueva pista en la Libreta.',
  clueQueued: 'Pista anotada en la Libreta (en espera).',
  clueAdvanced: 'Pista actualizada en la Libreta.',
  clueFromQueue: 'Una pista en espera se abre en la Libreta.',
  coreSilent: 'El núcleo no responde todavía.',
  tabletGot: (name) => `¡Has obtenido la ${name}!`,
  chronicle: 'Su inscripción se ha copiado en la Crónica de la Libreta.',
  fragmentGot: (n) => `¡Has obtenido el Fragmento Azur ${n}!`,
  fluteGot: '¡Los diez Fragmentos Azur se han unido en la Flauta Azur!',
});

/** Música del «Pilar restaurado» (CAMPANA §1.8, X20): jingle y tema posterior (provisionales, X04). */
export const PILLAR_MUSIC = Object.freeze({ jingle: 'VinculoSupremo', after: 'LeyendaPrisma' });

const NOTEBOOK_SE = 'GUI trainer card flip';

function notify(ctx, text) {
  ctx.se?.(NOTEBOOK_SE);
  ctx.ui?.toast?.(text);
}

const refresh = (ctx) => ctx.requestRefresh?.();

// ------------------------------------------------------------------ pistas
/** Abre la pista inicial de un arco. → 'active' | 'queued' | 'solved' */
export async function openClue(ctx, id, { direct = false, silent = false } = {}) {
  const r = openClueState(ctx.state, id, { direct });
  if (r.changed) {
    refresh(ctx);
    if (!silent) notify(ctx, r.status === STATUS.QUEUED ? STORY_TEXT.clueQueued : STORY_TEXT.clueNew);
  }
  return r.status;
}

/** Pasa el arco a su segunda pista (o al paso indicado). → { status, step, changed } */
export async function advanceClue(ctx, id, step = 2, { silent = false } = {}) {
  const r = advanceClueState(ctx.state, id, step);
  if (r.changed) {
    refresh(ctx);
    if (!silent) notify(ctx, STORY_TEXT.clueAdvanced);
  }
  return r;
}

/** Resuelve una pista y deja pasar la siguiente de la cola. → ids activados desde la cola */
export async function closeClue(ctx, id, { silent = false } = {}) {
  const { activated } = closeClueState(ctx.state, id);
  refresh(ctx);
  if (activated.length && !silent) notify(ctx, STORY_TEXT.clueFromQueue);
  return activated;
}

/** Revisa la cola (p. ej. tras conseguir Nadar). → ids activados */
export function refreshClues(ctx, { silent = false } = {}) {
  const activated = refreshClueQueue(ctx.state);
  if (activated.length && !silent) notify(ctx, STORY_TEXT.clueFromQueue);
  return activated;
}

// ------------------------------------------------------------------ presentación
/** Muestra un objeto importante con rayos y un mensaje encima (o solo el mensaje sin DOM). */
async function presentItem(ctx, item, color, lines) {
  let handle = null;
  if (!HEADLESS) {
    try {
      handle = (await loadFx()).openObtain({ item, color });
      await handle.ready;
    } catch (err) {
      console.error('[historia] Animación de obtención', err);
      handle = null;
    }
  }
  ctx.me?.('key_item_get');
  try {
    for (const line of lines) if (line) await ctx.say(line);
  } finally {
    if (handle) await handle.close();
  }
}

// ------------------------------------------------------------------ Tablillas
/**
 * Entrega una Tablilla: objeto en la mochila, state.addTablet, animación, entrada de la Crónica y cierre de la
 * pista de su arco. BLANKPLATE no existe en Axis (D12). → true si era nueva.
 */
export async function giveTablet(ctx, id, { silent = false } = {}) {
  if (id === RETIRED_TABLET) throw new Error('giveTablet: BLANKPLATE («Tabla Normal») no se usa en Axis (D12)');
  const tablet = tabletById(id);
  if (!tablet) throw new Error(`giveTablet: Tablilla desconocida "${id}"`);
  const st = ctx.state;
  if ((st.data.tablets || []).includes(id)) return false;
  st.addTablet(id);
  if (!st.hasItem(id)) st.addItem(id, 1);
  const arc = clueArcForTablet(id);
  let activated = [];
  if (arc) activated = closeClueState(st, arc.id).activated;
  refresh(ctx);
  if (!silent) {
    const entry = chronicleFor(id);
    await presentItem(ctx, id, [255, 232, 170], [STORY_TEXT.tabletGot(tablet.name), entry ? STORY_TEXT.chronicle : null]);
    if (activated.length) notify(ctx, STORY_TEXT.clueFromQueue);
  }
  return true;
}

// ------------------------------------------------------------------ versos
/**
 * Revela un verso (flag verse_n) y muestra su placa Unown; la traducción es total con la Clave Glífica.
 * n = 'confirmation' registra la confirmación de Arceus (la dice la escena; no hay placa).
 */
export async function revealVerse(ctx, n, { show = true } = {}) {
  const st = ctx.state;
  if (n === 'confirmation') {
    st.setFlag(CONFIRMATION_FLAG);
    refresh(ctx);
    return true;
  }
  const verse = verseFor(n);
  if (!verse) throw new Error(`revealVerse: verso inexistente "${n}" (1–10 o 'confirmation')`);
  st.setFlag(verseFlag(verse.n));
  refresh(ctx);
  if (!show || HEADLESS) return true;
  const full = hasGlyphKey(st);
  const fr = fragmentFor(verse.n);
  try {
    await (await loadFx()).showVerse({
      verse, full, tint: fr?.tint, unown: unownText(verse.text), translation: verseTranslation(verse, full),
      title: `Verso ${verse.numeral} · ${fr?.name || ''}`,
    });
  } catch (err) {
    console.error('[historia] Placa del verso', err);
    await ctx.say(verseTranslation(verse, full));
  }
  return true;
}

// ------------------------------------------------------------------ Fragmentos y Pilares
/** Ajusta el contador del objeto AZUREFRAGMENT al número de Fragmentos (antes de la Flauta). */
export function syncFragmentItem(state) {
  if (state.hasKeyItem(FLUTE_ITEM)) return;
  const count = (state.data.fragments || []).filter((id) => /^F\d\d$/.test(id)).length;
  const cur = state.itemCount(FRAGMENT_ITEM);
  if (count > cur) state.addItem(FRAGMENT_ITEM, count - cur);
  else if (count < cur) state.removeItem(FRAGMENT_ITEM, cur - count);
}

/**
 * Secuencia genérica de «Pilar restaurado» (CAMPANA §1.5, §3.0; música §1.8):
 *   jingle VinculoSupremo → brillo del núcleo (tinte del Pilar) → Fragmento Azur n (AZUREFRAGMENT con contador,
 *   state.addFragment) → verso n en Unown → flag pN_restored → efecto local (opts.onRestored) → LeyendaPrisma.
 * opts: { core: {x, y} casilla del núcleo (por defecto la de enfrente), requirePrevious = true (cadena de
 *   resonancia: hace falta el Fragmento n−1), onRestored: async (ctx, fragmento) => {}, music = true,
 *   bgmAfter = 'LeyendaPrisma', showVerse = true, force = false, silentFail = false }
 * → true si se restauró; false si ya lo estaba o el núcleo no respondió.
 */
export async function restorePillar(ctx, n, opts = {}) {
  const fr = fragmentFor(n);
  if (!fr) throw new Error(`restorePillar: Pilar inexistente "${n}" (1–${PILLAR_COUNT})`);
  const st = ctx.state;
  if (st.flag(fr.flag) && !opts.force) return false;
  if (opts.requirePrevious !== false && fr.n > 1 && !hasFragment(st, fr.n - 1)) {
    if (!opts.silentFail) await ctx.say(STORY_TEXT.coreSilent);
    return false;
  }
  const music = opts.music !== false;
  if (music) ctx.bgm?.(PILLAR_MUSIC.jingle, { restart: true, fadeOutPrevious: 10 });
  const at = opts.core || ctx.facingTile?.() || { x: 0, y: 0 };
  let glow = null;
  try {
    glow = ctx.effect?.('softLight', { x: at.x, y: at.y, radius: 128, color: fr.tint, intensity: 0.85, pulse: 0.35, fadeIn: 30 });
  } catch (err) {
    console.warn('[historia] brillo del núcleo', err);
  }
  ctx.se?.('Anim/Saint9');
  ctx.shake?.(3, 6, 30);
  await ctx.flash?.(fr.tint, 24, 200);
  await ctx.wait?.(30);
  st.addFragment(fragmentId(fr.n));
  syncFragmentItem(st);
  refresh(ctx);
  await presentItem(ctx, FRAGMENT_ITEM, fr.tint, [STORY_TEXT.fragmentGot(fr.n)]);
  if (opts.showVerse !== false) await revealVerse(ctx, fr.n);
  else st.setFlag(verseFlag(fr.n));
  if (ctx.setFlag) ctx.setFlag(fr.flag); else st.setFlag(fr.flag);
  try {
    if (typeof opts.onRestored === 'function') await opts.onRestored(ctx, fr);
  } finally {
    glow?.remove?.(60);
    if (music && opts.bgmAfter !== null) ctx.bgm?.(opts.bgmAfter || PILLAR_MUSIC.after, { fadeOutPrevious: 30 });
  }
  return true;
}

/** Une los diez Fragmentos en la Flauta Azur (B20). → true si se forjó. */
export async function forgeAzureFlute(ctx, { silent = false } = {}) {
  const st = ctx.state;
  if (st.hasKeyItem(FLUTE_ITEM)) return false;
  for (let n = 1; n <= PILLAR_COUNT; n++) if (!hasFragment(st, n)) return false;
  st.removeItem(FRAGMENT_ITEM, st.itemCount(FRAGMENT_ITEM));
  st.addKeyItem(FLUTE_ITEM);
  refresh(ctx);
  if (!silent) await presentItem(ctx, FLUTE_ITEM, [120, 190, 255], [STORY_TEXT.fluteGot]);
  return true;
}

// ------------------------------------------------------------------ crisis
/** Fuerza la fase de crisis (0–4, 5 = cielo restablecido) o, con null, vuelve a la derivada de los flags. */
export function setCrisisPhase(ctxOrState, phase) {
  const st = ctxOrState?.state || ctxOrState;
  if (phase === null || phase === undefined || phase === 'auto') {
    st.setVar(CRISIS_OVERRIDE_VAR, null);
  } else {
    const n = Number(phase);
    if (!Number.isInteger(n) || n < 0 || n > CRISIS_RESTORED) throw new Error(`setCrisisPhase: fase inválida "${phase}" (0–${CRISIS_RESTORED} o null)`);
    st.setVar(CRISIS_OVERRIDE_VAR, n);
  }
  if (ctxOrState?.state) refresh(ctxOrState);
  return crisisPhase(st);
}

// ------------------------------------------------------------------ enlace para ctx.story
/** API enlazada a un ctx (la expone script/context.js como ctx.story). */
export function storyApi(ctx) {
  return {
    openClue: (id, o) => openClue(ctx, id, o),
    advanceClue: (id, step, o) => advanceClue(ctx, id, step, o),
    closeClue: (id, o) => closeClue(ctx, id, o),
    refreshClues: (o) => refreshClues(ctx, o),
    clueStatus: (id) => clueStatus(ctx.state, id),
    giveTablet: (id, o) => giveTablet(ctx, id, o),
    revealVerse: (n, o) => revealVerse(ctx, n, o),
    restorePillar: (n, o) => restorePillar(ctx, n, o),
    forgeAzureFlute: (o) => forgeAzureFlute(ctx, o),
    setCrisisPhase: (phase) => setCrisisPhase(ctx, phase),
    crisisPhase: () => crisisPhase(ctx.state),
  };
}
