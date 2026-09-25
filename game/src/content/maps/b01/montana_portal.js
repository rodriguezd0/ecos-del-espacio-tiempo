// Montaña del portal: ruina de montaña del prólogo (biblia §4 P-02; guion B01 §1) que se revisita en el
// Pilar 6 (biblia §6.6). Debe ser reconocible: gran cascada al este, explanada de ruinas abajo, escalinata
// ASCENDENTE de tres tramos y, arriba, un estrado de piedra con el PORTAL HORIZONTAL (aljibe; sprite propio
// game/assets/objects/aljibe.png, generado con tools/prologue_assets.mjs).
// Tileset 1 (Exterior1): terrazas de muros finos, escaleras de terraza, acantilado marrón y cascada animada.
// Nombre: Monte del Portal (X22, docs/DECISIONES.md). El prólogo usa este mapa tal cual (mismas coordenadas).
// B12 (Pilar Invertido, content/maps/b12/README.md) lo amplía de forma ADITIVA: 6 columnas más al este (macizo con la
// repisa de la cascada y su gruta, poza mayor), hierba alta en las terrazas (encuentros por `encounterZones`: el
// prólogo desactiva los encuentros) y los eventos del B12 (content/events/b12_monte.js), que solo aparecen en la
// partida real (b01_left_town): marcas del combate, pozos de sondeo, células C050/C051/C076 y el aljibe que se abre.
import { MONTE } from '../b12/layout.js';
import { MONTE_HIERBA } from '../../encounters/b12.js';
import { monteEvents, monteWarps, b12Aljibe } from '../../events/b12_monte.js';
import { buildMonteB12 } from '../b12/monte_build.js';

const W = MONTE.width; // B12: 44 → 50
const H = 50;

// Estrado de piedra (tiles de Exterior1, filas 670–675 × columnas 0–5) ampliado a 9×8 repitiendo el centro.
const DAIS_COLS = [0, 1, 2, 3, 2, 3, 2, 4, 5];
const DAIS_ROWS = [670, 671, 672, 673, 672, 673, 674, 675];
const tid = (col, row) => 384 + row * 8 + col;
const DAIS = {
  w: DAIS_COLS.length,
  h: DAIS_ROWS.length,
  layers: [null, DAIS_ROWS.flatMap((r) => DAIS_COLS.map((c) => tid(c, r))), null],
};

// Posiciones clave (las usa también el guion del prólogo: content/cutscenes/prologue*.js).
export const SPOTS = Object.freeze({
  aljibe: { x: 17, y: 10 }, // casilla ancla (fila inferior, centro) del sprite de 5×4
  aljibeCenter: { x: 17, y: 8 }, // centro visual del hueco
  dais: { x: 13, y: 5 },
  stairs: [{ x: 15, y: 35 }, { x: 15, y: 25 }, { x: 15, y: 15 }], // escalinatas (esquina sup-izq, 5×3)
  plaza: { x: 17, y: 43 }, // centro de la explanada (combate del prólogo)
  waterfall: { x: 36, y: 0, w: 5, h: 38 },
  pool: { ...MONTE.pool }, // B12: poza mayor (antes 9×6): C076 se alcanza nadando
  entry: { x: 17, y: 48 },
});

const rect = (x, y, w, h) => {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
};

/** Eventos invisibles que bloquean el paso sobre el área del aljibe (el sprite ocupa 5×4 casillas). */
function aljibeBlockers() {
  const { x, y } = SPOTS.aljibe;
  const out = [];
  for (let j = y - 3; j <= y; j++) {
    for (let i = x - 2; i <= x + 2; i++) {
      if (i === x && j === y) continue;
      out.push({ id: `aljibe_borde_${i}_${j}`, x: i, y: j, solid: true, script: (ctx) => describeAljibe(ctx) });
    }
  }
  return out;
}

async function describeAljibe(ctx) {
  if (await b12Aljibe(ctx)) return; // B12: en la partida real el aljibe responde a Zygarde
  await ctx.say('Una cavidad circular de piedra, como un aljibe antiguo. No se ve el fondo.');
}

const RUIN_TEXT = 'Restos de piedra muy antiguos. El musgo los cubre casi por completo.';
/** Ruinas decorativas (charset de objetos: fila = variante). */
const ruin = (id, x, y, dir) => ({
  id, x, y, sprite: 'asset:objects/ruinas.png', dir, directionFix: true, walkAnime: false,
  script: async (ctx) => { await ctx.say(RUIN_TEXT); },
});
const RUIN = { rota: 2, monolito: 4, columna: 6, escombros: 8 };

export default {
  id: 'montana_portal',
  name: 'Monte del Portal',
  showLocation: false, // el prólogo no muestra rótulo; el Pilar 6 decidirá si lo muestra
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  // Sin BGM propia: la elige quien entra (prólogo: content/cutscenes/prologue.js; B12: evento de música del Monte).
  battleback: 'Monte', // CAMPANA §1.8 (B12)
  start: { x: SPOTS.entry.x, y: SPOTS.entry.y, dir: 8 },
  stamps: { estrado: { tiles: DAIS } },
  // B12: hierba de las terrazas y de la repisa (tabla «Ruta 10 alta y Monte del Portal»); sin `encounters` de mapa.
  encounterZones: [{ x0: 0, y0: 0, x1: W - 1, y1: H - 1, encounters: MONTE_HIERBA }],
  // B11: bajando por el borde sur de la explanada (pulsar abajo) se vuelve a la senda del campamento del Monte.
  // B12: la boca de la gruta en la repisa de la cascada.
  warps: [...[16, 17, 18].map((x) => ({ x, y: H - 1, dirTrigger: 2, to: 'campamento_monte', tx: 10, ty: 1, dir: 2 })), ...monteWarps()],

  build(b) {
    b.fill(null, 'cesped');

    // Macizo oriental con la gran cascada cayendo hasta el estanque de la explanada (B12: 6 columnas más al este).
    b.blob(null, rect(MONTE.massif.x0, MONTE.massif.y0, MONTE.massif.w, MONTE.massif.h), 'acantilado');
    const wf = SPOTS.waterfall;
    b.rect(2, wf.x, wf.y, wf.w, wf.h, { autotile: 0 });
    const pool = rect(SPOTS.pool.x, SPOTS.pool.y, SPOTS.pool.w, SPOTS.pool.h);
    b.paint('agua', pool);
    b.paint('orilla', pool);

    // Terrazas anidadas (abiertas al norte: su borde superior queda fuera del mapa).
    b.blob(null, rect(2, -1, 31, 39), 'terraza');
    b.blob(null, rect(6, -1, 23, 29), 'terraza');
    b.blob(null, rect(10, -1, 15, 19), 'terraza');
    for (const s of SPOTS.stairs) b.stamp('escalera_terraza_ancha', s.x, s.y);

    // Pared rocosa tras el estrado y estrado del portal.
    b.blob(null, rect(12, -1, 11, 5), 'acantilado');
    b.stamp('estrado', SPOTS.dais.x, SPOTS.dais.y);

    // Explanada de ruinas: tierra batida, losas antiguas y rocas caídas.
    b.paint('camino_tierra', rect(4, 38, 29, 12));
    for (const [x, y] of [[9, 40], [21, 40], [9, 44], [21, 44], [15, 41]]) b.stamp('placa_piedra', x, y);
    for (const [x, y] of [[5, 40], [28, 41], [6, 46], [26, 47], [30, 39]]) b.stamp('roca_gris', x, y);
    for (const [x, y] of [[4, 43], [31, 43], [8, 38]]) b.stamp('roca_grande', x, y);

    // Bordes: pinos al oeste de las terrazas y en las esquinas de la explanada.
    b.blob(null, rect(0, -1, 2, 39), 'bosque_pinos');
    b.blob(null, rect(0, 44, 4, 6), 'bosque_pinos');
    b.blob(null, rect(40, 44, 4, 6), 'bosque_pinos');
    b.blob(null, rect(4, -1, 2, 27), 'bosque_pinos');
    b.blob(null, rect(29, -1, 2, 27), 'bosque_pinos');
    for (const [x, y] of [[8, 4], [26, 6], [8, 12], [26, 12], [5, 30], [28, 31]]) b.stamp('roca_gris', x, y);
    for (const [x, y] of [[7, 20], [26, 21], [11, 29], [23, 31]]) b.stamp('roca_grande', x, y);
    // Senda de tierra gastada que sube por el centro de cada terraza.
    b.paint('camino_tierra', rect(16, 28, 3, 7));
    b.paint('camino_tierra', rect(16, 18, 3, 7));
    b.paint('camino_tierra', rect(16, 13, 3, 2));
    buildMonteB12(b); // B12: hierba alta, repisa de la cascada y su gruta, bosque del este
  },

  events: [
    {
      id: 'aljibe', x: SPOTS.aljibe.x, y: SPOTS.aljibe.y, sprite: 'asset:objects/aljibe.png', dir: 2,
      directionFix: true, walkAnime: false, stepAnime: false, shadow: false,
      script: (ctx) => describeAljibe(ctx),
    },
    ...aljibeBlockers(),
    // Avenida de columnas hacia la escalinata y piedras dispersas por la explanada.
    ruin('columna_o1', 13, 40, RUIN.columna), ruin('columna_e1', 21, 40, RUIN.rota),
    ruin('columna_o2', 13, 44, RUIN.rota), ruin('columna_e2', 21, 44, RUIN.columna),
    ruin('columna_o3', 13, 47, RUIN.columna), ruin('columna_e3', 21, 47, RUIN.rota),
    ruin('monolito_1', 6, 42, RUIN.monolito), ruin('monolito_2', 28, 44, RUIN.monolito),
    ruin('monolito_3', 24, 28, RUIN.monolito),
    ruin('escombros_1', 10, 47, RUIN.escombros), ruin('escombros_2', 25, 42, RUIN.escombros),
    ruin('escombros_3', 9, 31, RUIN.escombros), ruin('escombros_4', 22, 20, RUIN.escombros),
    ...monteEvents(), // B12 (solo en la partida real)
  ],
};
