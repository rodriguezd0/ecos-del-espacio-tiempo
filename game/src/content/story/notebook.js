// Vista pura de la Libreta de pistas (ui/screens/clues.js la dibuja): pestañas Pistas, Profecía, Crónica y
// Tablillas (docs/TABLILLAS.md §4.2). Sin DOM: se prueba con node --test.
import { clueNotebook, activeCount } from './clueLogic.js';
import { MAX_ACTIVE_CLUES } from './clues.js';
import { VERSES, CONFIRMATION, CONFIRMATION_FLAG, hasGlyphKey, isVerseRevealed, verseTranslation, unownText } from './verses.js';
import { ALL_CHRONICLE, isChronicleUnlocked } from './chronicle.js';
import { TABLETS, tabletById, hasTablet, tabletCounts } from './tablets.js';
import { fragmentFor } from './fragments.js';

export const NOTEBOOK_TABS = Object.freeze([
  Object.freeze({ id: 'clues', name: 'Pistas' }),
  Object.freeze({ id: 'prophecy', name: 'Profecía' }),
  Object.freeze({ id: 'chronicle', name: 'Crónica' }),
  Object.freeze({ id: 'tablets', name: 'Tablillas' }),
]);

/** Lista de la pestaña Pistas: cabeceras de sección y filas seleccionables. */
export function clueListItems(state) {
  const nb = clueNotebook(state);
  const out = [];
  const section = (title, rows) => {
    if (!rows.length) return;
    out.push({ kind: 'header', text: title });
    for (const row of rows) out.push({ kind: 'clue', row });
  };
  section(`Abiertas ${nb.active.length}/${MAX_ACTIVE_CLUES}`, nb.active);
  section('En espera', nb.queued);
  section('Notas', nb.notes);
  section('Resueltas', nb.solved);
  return out;
}

/** Filas de la Profecía: los diez versos y la confirmación. */
export function verseRows(state) {
  const full = hasGlyphKey(state);
  const rows = VERSES.map((v) => {
    const revealed = isVerseRevealed(state, v.n);
    return {
      id: `verse_${v.n}`, n: v.n, numeral: v.numeral, revealed, verse: v, full,
      label: revealed ? `${v.numeral} · ${v.pillarName}` : `${v.numeral} · · ·`,
      translation: revealed ? verseTranslation(v, full) : '',
      unown: revealed ? unownText(v.text) : '',
      readBy: v.readBy,
      tint: fragmentFor(v.n)?.tint || [200, 200, 220],
    };
  });
  const confirmed = state.flag(CONFIRMATION_FLAG);
  rows.push({
    id: 'confirmation', n: null, numeral: '—', revealed: confirmed, verse: null, full: true,
    label: confirmed ? 'Columna Lanza' : '· · ·',
    translation: confirmed ? `${CONFIRMATION.speaker}: «${CONFIRMATION.text}»` : '', unown: '', readBy: CONFIRMATION.speaker,
    tint: [240, 232, 200],
  });
  return rows;
}

/** Filas de la Crónica (I–XV y las tres de Arceus). */
export function chronicleRows(state) {
  return ALL_CHRONICLE.map((e) => {
    const unlocked = isChronicleUnlocked(state, e);
    const tablet = tabletById(e.tablet);
    const short = tablet ? tablet.name.replace(/^Tabla /, '') : '';
    return {
      entry: e, unlocked, tablet,
      label: unlocked ? `${e.numeral === '—' ? '' : `${e.numeral} · `}${short}` : `${e.numeral === '—' ? '' : `${e.numeral} · `}???`,
    };
  });
}

/** Casillas de la pestaña Tablillas (18). */
export function tabletCells(state) {
  return TABLETS.map((t) => ({ tablet: t, owned: hasTablet(state, t.id) }));
}

/** Texto del contador de la cabecera para una pestaña. */
export function tabCounter(state, tabId) {
  switch (tabId) {
    case 'clues': return `Abiertas ${activeCount(state)}/${MAX_ACTIVE_CLUES}`;
    case 'prophecy': return `Versos ${VERSES.filter((v) => isVerseRevealed(state, v.n)).length}/${VERSES.length}`;
    case 'chronicle': return `Páginas ${ALL_CHRONICLE.filter((e) => isChronicleUnlocked(state, e)).length}/${ALL_CHRONICLE.length}`;
    case 'tablets': {
      const c = tabletCounts(state);
      return `Tablillas ${c.owned}/${c.total}`;
    }
    default: return '';
  }
}
