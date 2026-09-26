// Sima del Eje (docs/CAMPANA.md B19 y §1.4; §2.5 G14 «Puente, Sima y Calzada: Reconstrucción»; TABLILLAS.md §4.3
// Crónica XIII: el camino al fondo está grabado en las tablas). Llegada, estela de los Custodios, los huecos del
// sendero del oeste (Reconstrucción), la Calzada del Rey que se corta ante el vacío hasta que la última Crónica
// (Tabla Draco) completa el camino, el Umbral (salida del bloque: b19_calzada) y el warp a la Puerta de las Quince
// (B20). Enlaces con la Senda del Mirador y el Mirador Sur (B17) por los bordes. Módulo puro salvo los guiones.
import { F, SPEAKER, when, pause } from './b19_common.js';
import {
  GAP_W, GAP_ALCOVE, GAP_FINAL, UMBRAL, REPISA_STELE, EXITS, ITEMS, TRAINERS, ARRIVALS,
} from '../maps/b19/sima_layout.js';
import { CALZADA as CALZADA_TILES, ZOCALO } from '../maps/b19/tiles.js';
import { blockedText, mapRegistered, PUERTA_QUINCE } from '../maps/b19/links.js';
import { itemEvents, trainerEvents } from './b19_calzada.js';

export const SIMA_TEXT = Object.freeze({
  arrival: 'Nada bajo los pies más que roca y vacío. Desde muy abajo sube un rumor, como de agua lejana.',
  // Zygarde habla muy poco (autor, 25-09-2026): el fin de la Calzada lo describe la narración.
  stele: [
    'Una estela partida en dos, con glifos Unown.',
    'Con la Clave Glífica se lee: «QUIEN BAJE, QUE LO HAGA CON TODAS».',
  ],
  deadEnd: 'La Calzada del Rey se corta ante el vacío. Desde aquí no se ve por dónde sigue.',
  socketBefore: 'Un zócalo hexagonal, gastado, al borde del vacío. Enfrente no se ve adónde lleva.',
  finalSocket: 'El zócalo del borde del vacío brilla en verde. La última Crónica dice por dónde sigue la Calzada.',
  finalAsk: '¿Alzar el último tramo de la Calzada del Rey?',
  finalDone: 'Las últimas losas de la Calzada suben desde el fondo y encajan contra el Umbral.',
  umbral: [
    'Aquí termina la Calzada del Rey: ante una roca con una puerta labrada.',
    'Sobre el dintel hay quince huecos tallados en fila.',
  ],
  umbralStele: [
    'Una estela con letras Unown, nítidas como si las hubieran grabado ayer.',
    '«AQUÍ TERMINA LA CALZADA. EL CAMINO SIGUE CON LAS QUINCE.»',
  ],
  doorClosed: 'Una puerta de piedra, cerrada a cal y canto. Por ahora no puedes continuar.',
  gapW: 'Un hueco corta la cornisa. En el borde, un zócalo hexagonal gastado.',
  alcove: 'Un zócalo gastado apunta a un rellano apartado, al otro lado de un paso roto.',
});

// ───────────────────────────── Llegada y estelas ─────────────────────────────

async function arrival(ctx) {
  ctx.setFlag(F.simaIntro);
  await pause(ctx, 12);
  await ctx.say(SIMA_TEXT.arrival);
}

async function readRepisaStele(ctx) {
  for (const t of SIMA_TEXT.stele) await ctx.say(t);
}

// ───────────────────────────── Reconstrucción ─────────────────────────────

const estradoRow = (cells) => cells.map(([x, y]) => [x, y, 2, CALZADA_TILES.body(x, y)]);

function gapEvents() {
  const west = GAP_W.sockets.map((s, i) => ({
    id: `sima_zocalo_oeste_${i}`, type: 'rebuildGap', x: s.x, y: s.y, flag: F.simaGap, tutorial: true,
    tiles: estradoRow(GAP_W.cells), blockedText: SIMA_TEXT.gapW,
  }));
  const A = GAP_ALCOVE;
  const alcove = {
    id: 'sima_zocalo_rellano', type: 'rebuildGap', x: A.socket.x, y: A.socket.y,
    tiles: A.cells.map(([x, y]) => [x, y, 2, ZOCALO.live]), blockedText: SIMA_TEXT.alcove,
  };
  return [...west, alcove];
}

/** Último tramo: la Tabla Draco completa el camino (sin ella, el zócalo es solo un borde gastado). */
function finalGapEvents() {
  const S = GAP_FINAL.socket;
  const hasTablet = (s) => Boolean(s?.flag(F.tablet));
  return [
    {
      id: 'sima_zocalo_final_antes', x: S.x, y: S.y, name: 'Zócalo',
      pages: [{ when: (s) => !hasTablet(s), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(SIMA_TEXT.socketBefore); } }],
    },
    {
      id: 'sima_zocalo_final', type: 'rebuildGap', x: S.x, y: S.y, flag: F.finalGap, when: hasTablet,
      tiles: estradoRow(GAP_FINAL.cells), askText: SIMA_TEXT.finalAsk,
      doneText: SIMA_TEXT.finalDone,
    },
    ...GAP_FINAL.deadEnd.map(([x, y], k) => ({
      id: `sima_fin_calzada_${k}`, x, y,
      pages: [
        {
          when: when({ none: [F.tablet, F.simaDeadEnd] }), through: true, lock: false, trigger: 'touch',
          script: async (ctx) => { ctx.setFlag(F.simaDeadEnd); await ctx.say(SIMA_TEXT.deadEnd); },
        },
        {
          when: when({ all: [F.tablet], none: [F.finalGap, F.simaWayKnown] }), through: true, lock: false, trigger: 'touch',
          script: async (ctx) => { ctx.setFlag(F.simaWayKnown); await ctx.say(SIMA_TEXT.finalSocket); },
        },
      ],
    })),
  ];
}

// ───────────────────────────── Umbral y Puerta de las Quince ─────────────────────────────

async function reachUmbral(ctx) {
  ctx.setFlag(F.exit);
  for (const t of SIMA_TEXT.umbral) await ctx.say(t);
}

/** Warp del Umbral a la Puerta de las Quince (B20), solo si su mapa ya existe (si no, la puerta no se abre). */
export function puertaWarps() {
  if (!mapRegistered(PUERTA_QUINCE.map)) return [];
  const P = PUERTA_QUINCE;
  return [{ x: UMBRAL.door.x, y: UMBRAL.door.y, to: P.map, tx: P.x, ty: P.y, dir: P.dir }];
}

function umbralEvents() {
  return [
    ...UMBRAL.landing.map(([x, y], k) => ({
      id: `umbral_llegada_${k}`, x, y,
      pages: [{ when: when({ all: [F.finalGap], none: [F.exit] }), through: true, lock: false, trigger: 'touch', script: reachUmbral }],
    })),
    ...(mapRegistered(PUERTA_QUINCE.map) ? [] : [{
      id: 'puerta_quince_cerrada', x: UMBRAL.door.x, y: UMBRAL.door.y, name: 'Puerta de las Quince',
      pages: [{ trigger: 'action', solid: true, script: async (ctx) => { await ctx.say(SIMA_TEXT.doorClosed); } }],
    }]),
    {
      id: 'estela_umbral', x: UMBRAL.stele.x, y: UMBRAL.stele.y + 1, name: 'Estela',
      pages: [{ trigger: 'action', script: async (ctx) => { for (const t of SIMA_TEXT.umbralStele) await ctx.say(t); } }],
    },
  ];
}

// ───────────────────────────── Bajadas (B17) ─────────────────────────────

/** Mientras el mapa de B17 no exista, dos piedras cierran la cornisa del borde con un aviso neutro. */
function edgeBlockEvents() {
  const out = [];
  for (const [key, e] of Object.entries(EXITS)) {
    if (mapRegistered(e.to)) continue;
    const y = key === 'north' ? e.y + 1 : e.y - 1;
    for (let x = e.x0; x <= e.x1; x++) {
      out.push({
        id: `sima_borde_${key}_${x}`, x, y, name: 'Desprendimiento',
        pages: [{ sprite: 'Object rock', dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(blockedText(e.to)); } }],
      });
    }
  }
  return out;
}

export function simaEvents() {
  return [
    { id: 'sima_llegada', x: ARRIVALS.north.x, y: 0, pages: [{ when: when({ none: [F.simaIntro] }), trigger: 'auto', script: arrival }] },
    { id: 'estela_repisa', x: REPISA_STELE.x, y: REPISA_STELE.y + 1, name: 'Estela', pages: [{ trigger: 'action', script: readRepisaStele }] },
    ...gapEvents(),
    ...finalGapEvents(),
    ...umbralEvents(),
    ...edgeBlockEvents(),
    ...itemEvents(ITEMS),
    ...trainerEvents(TRAINERS),
  ];
}

export { SPEAKER };
