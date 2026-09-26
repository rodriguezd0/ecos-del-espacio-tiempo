// Eventos de Columna Lanza (docs/CAMPANA.md B21 §1–5): llegada tras el Salto, antecámara (nodo, manantial, estela de
// la Crónica XIV), la pregunta de Zygarde al llegar a lo alto (D21), el anillo de los dieciocho zócalos (TABLILLAS
// §4.7), Arceus en la cima, sobre el gran hexágono (despertar, combate por fases y resolución) y el regreso por el
// Salto (epílogo). En los textos no se habla de «altar» (DESCARTADO en la biblia). Topes invisibles en el borde del
// vacío (el panorama asoma alrededor) y cara de roca bajo los bordes sur.
import { F, SPRITE, GREEN, GOLD, when, pause } from './b21_common.js';
import { ARRIVAL_TEXT, STELE_TEXT, FLUTE_TEXT } from './b21_texts.js';
import { COLUMNA, SOCKETS, ARCEUS_SOCKET_KS, COLUMNA_PANORAMA, edgeCells, undersideDrips } from '../maps/b21/layout.js';
import { TABLETS, ARCEUS_TABLETS, tabletById } from '../story/tablets.js';
import { extraDefs } from '../stamps/extraTiles.js';
import { landFromJump } from './b21_salto.js';
import { zygardeQuestion } from './b21_zygarde.js';
import { arceusAltar, resolutionScene } from './b21_arceus.js';
import { returnHome, leaveColumna } from './b21_epilogo.js';

export { COLUMNA_PANORAMA };

const KIT = extraDefs('InteriorLiga').stamps;
const tileOf = (name) => KIT[name]?.tiles?.layers?.[2]?.[0] || 0;
export const SOCKET_TILE = tileOf('pilar_zocalo');
export const SOCKET_LIVE_TILE = tileOf('pilar_zocalo_vivo');

/** Tablilla de cada zócalo: las de Arceus arriba (k 17, 0, 1); las quince de campaña en orden alrededor. */
export function socketTablet(k) {
  const a = ARCEUS_SOCKET_KS.indexOf(k);
  if (a >= 0) return ARCEUS_TABLETS[a];
  const others = SOCKETS.map((s) => s.k).filter((x) => !ARCEUS_SOCKET_KS.includes(x));
  const campaign = TABLETS.filter((t) => !t.arceusPhase);
  return campaign[others.indexOf(k)] || null;
}

const hasTablet = (s, id) => (s?.data?.tablets || []).includes(id);

// ─────────────────────────────── Entrada al mapa ───────────────────────────────

/** Al entrar: tras el final, cielo abierto; el Salto deja al jugador montado: la llegada lo resuelve. */
export async function columnaOnEnter(ctx) {
  if (ctx.flag(F.gameCleared)) await ctx.scene?.panorama?.set?.(COLUMNA_PANORAMA.calm);
}

async function arrivalScene(ctx) {
  await pause(ctx, 20);
  await landFromJump(ctx, { formText: ARRIVAL_TEXT.form });
  ctx.setFlag(F.lanzaArrival);
  await ctx.say(ARRIVAL_TEXT.place);
}

// ─────────────────────────────── Piezas ───────────────────────────────

function borderEvents() {
  const out = edgeCells().map((c) => ({
    id: `b21_borde_${c.x}_${c.y}`, x: c.x, y: c.y, solid: true, noOver: true,
    ...(c.under ? { sprite: SPRITE.rock, dir: 2, pattern: (c.x + c.y) % 4, directionFix: true, walkAnime: false, stepAnime: false, shadow: false } : {}),
  }));
  for (const d of undersideDrips()) {
    out.push({
      id: `b21_goteo_${d.x}_${d.y}`, x: d.x, y: d.y, through: true, sprite: SPRITE.rock, dir: 4, pattern: (d.x * 3 + d.y) % 4,
      directionFix: true, walkAnime: false, stepAnime: false, shadow: false,
    });
  }
  return out;
}

async function springScript(ctx) {
  await ctx.say(STELE_TEXT.springLook);
  await ctx.fade('out', 12);
  ctx.heal();
  ctx.me?.('heal');
  await pause(ctx, 40);
  await ctx.fade('in', 12);
  await ctx.say(STELE_TEXT.spring);
}

function springEvents() {
  const s = COLUMNA.spring;
  const out = [];
  for (let j = 0; j < s.h; j++) {
    for (let i = 0; i < s.w; i++) out.push({ id: `b21_manantial_${i}_${j}`, x: s.x + i, y: s.y + j, trigger: 'action', noOver: true, solid: true, script: springScript });
  }
  out.push({
    id: 'b21_manantial_luz', x: s.x + 1, y: s.y + 1, through: true,
    glow: { name: 'softLight', radius: 60, intensity: 0.35, pulse: 0.25, color: [150, 220, 255] },
  });
  return out;
}

/** Placa Unown (Clave Glífica: traducción completa; si no, la de la Pokédex a medias). */
async function readUnown(ctx, title, text) {
  const { unownText, hasGlyphKey, partialTranslation } = await import('../story/verses.js');
  const full = hasGlyphKey(ctx.state);
  const translation = full ? text : partialTranslation(text, { seed: 3 });
  if (typeof document !== 'undefined') {
    try {
      const { showVerse } = await import('../story/storyFx.js');
      await showVerse({ verse: null, title, full, tint: [...GOLD], unown: unownText(text), translation });
      return;
    } catch (err) {
      console.warn('[b21] placa Unown', err);
    }
  }
  await ctx.say(translation);
}

function steleEvents() {
  const c = COLUMNA.chronicle;
  return [0, 1].map((i) => ({
    id: `b21_estela_${i}`, x: c.x + i, y: c.y + 1, trigger: 'action', noOver: true, solid: true,
    script: (ctx) => readUnown(ctx, STELE_TEXT.chronicleTitle, STELE_TEXT.chronicle),
  }));
}

/** Los dieciocho zócalos: se encienden (tile vivo y luz) con cada Tablilla; tras el final, luz dorada. */
function socketEvents() {
  return SOCKETS.map((s) => {
    const t = socketTablet(s.k);
    const lit = (st) => Boolean(t) && hasTablet(st, t.id);
    const describe = async (ctx) => {
      if (t && lit(ctx.state)) {
        await ctx.say(STELE_TEXT.socketLit(t.name));
        return;
      }
      await ctx.say(STELE_TEXT.socketDark);
      const words = t ? STELE_TEXT.arceus[t.id] : null;
      if (words) await readUnown(ctx, t.name.replace('Tabla', 'Zócalo de la Tabla'), words);
    };
    return {
      id: `b21_zocalo_${s.k}`, x: s.x, y: s.y, name: t?.name || 'Zócalo',
      pages: [
        { when: () => true, trigger: 'action', through: true, script: describe },
        {
          when: (st) => lit(st), trigger: 'action', through: true, script: describe, patch: [[s.x, s.y, 2, SOCKET_LIVE_TILE]],
          glow: { name: 'softLight', radius: 34, intensity: 0.28, pulse: 0.3, color: [...GREEN] },
        },
        {
          when: (st) => lit(st) && st.flag(F.tabletsComplete), trigger: 'action', through: true, script: describe,
          patch: [[s.x, s.y, 2, SOCKET_LIVE_TILE]], glow: { name: 'softLight', radius: 40, intensity: 0.45, pulse: 0.2, color: [...GOLD] },
        },
      ],
    };
  });
}

function arceusEvents() {
  const a = COLUMNA.arceus;
  const base = { sprite: SPRITE.arceus, dir: 2, directionFix: true, walkAnime: false, trigger: 'action', script: arceusAltar };
  return [{
    id: 'b21_arceus', x: a.x, y: a.y, name: 'Arceus',
    pages: [
      { when: when({ none: [F.arceusAwake] }), ...base, stepAnime: false, opacity: 190 },
      { when: when({ all: [F.arceusAwake], none: [F.arceusDone] }), ...base, stepAnime: true },
      {
        when: when({ all: [F.arceusFainted] }), ...base, stepAnime: false, opacity: 230,
        script: async (ctx) => { await ctx.say(FLUTE_TEXT.vigil); },
      },
      // Capturado: la cima queda vacía (ninguna página se cumple).
    ],
  }];
}

function nodeEvents() {
  const n = COLUMNA.node;
  return [{
    id: 'b21_nodo_columna', x: n.cx, y: n.cy, name: 'Nodo de Columna Lanza', trigger: 'action', through: true,
    pages: [
      { when: () => true, trigger: 'action', through: true, script: async (ctx) => { await ctx.say(ARRIVAL_TEXT.noReturn); } },
      {
        // Tras el epílogo (postgame): el Salto de vuelta al Laberinto es la salida (sin Vuelo ni Cuerda Huida aquí).
        when: when({ all: [F.gameCleared, F.epilogueBack] }), trigger: 'action', through: true,
        glow: { name: 'softLight', radius: 70, intensity: 0.35, pulse: 0.4, color: [...GREEN] },
        script: leaveColumna,
      },
    ],
  }];
}

function itemEvents() {
  return COLUMNA.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, ...(it.hidden ? { hidden: true } : {}) }));
}

/** Todos los eventos de Columna Lanza. */
export function columnaEvents() {
  const q = COLUMNA.question;
  const strip = [];
  for (let x = q.x0; x <= q.x1; x++) {
    strip.push({
      id: `b21_pregunta_${x}`, x, y: q.y, trigger: 'touch', when: when({ all: [F.lanzaArrival], none: [F.zygardeAsked, F.zygardeJoined] }),
      script: zygardeQuestion,
    });
  }
  return [
    ...borderEvents(),
    ...springEvents(),
    ...steleEvents(),
    ...socketEvents(),
    ...arceusEvents(),
    ...nodeEvents(),
    ...itemEvents(),
    ...strip,
    { id: 'b21_llegada', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.jumpDone], none: [F.lanzaArrival] }), script: arrivalScene },
    { id: 'b21_resolucion', x: 0, y: 1, trigger: 'auto', when: when({ all: [F.arceusDone], none: [F.finalResolved] }), script: resolutionScene },
    { id: 'b21_regreso', x: 1, y: 0, trigger: 'auto', when: when({ all: [F.finalResolved], none: [F.epilogueBack] }), script: returnHome },
  ];
}

/** Tablilla de un zócalo por id (ayuda de pruebas). */
export const socketTabletId = (k) => socketTablet(k)?.id || null;
export { tabletById };
