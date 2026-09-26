// Cierres de progresión (docs/DECISIONES.md «DECIDIDO (autor, 25-09-2026)», fugas de progresión). Barreras DIEGÉTICAS
// que impiden llegar antes de tiempo a zonas de etapas muy posteriores (un combate de nivel 60 al sur de Caudal nada
// más empezar) o que rompen el orden del guion (el B2 de Gael en Caudal antes de que Casilda le cierre el Umbral).
// La auditoría `tools/audit_progression.mjs` (test `tests/progression_audit.test.mjs`) recorre el mundo etapa a etapa
// y comprueba que estos cierres aguantan. Módulo puro (Node y navegador): cada función devuelve eventos de mapa.
//
//   ruta2BridgeGate(bridge)  Ruta 2: el puente del arroyo, cerrado por los temblores hasta restaurar el P1.
//   caudalSendaGate()         Ciudad Caudal: la verja de la Senda del Mirador, cerrada hasta el P8 (B17).
import BAKED_EXT1 from '../stamps/baked/Exterior1.js';
import BAKED_EXT2 from '../stamps/baked/Exterior2.js';
import { SOUTH_EXIT } from '../maps/b03/caudal_layout.js';

/** Flags globales que abren los cierres (los ponen otros bloques). */
export const GATE_FLAGS = Object.freeze({
  p1: 'p1_restored', // B02: los temblores cesan al restaurar el Pilar del Umbral
  gaelB2: 'b03_gael_b2', // B03: partida antigua que ya llegó a Caudal antes del P1 (no se la encierra)
  p8: 'p8_restored', // B16: fase 3 de la crisis; la Policía Regional abre la Senda del Mirador (B17)
});

/** Tiles de la capa 2 de un stamp horneado (fila a fila). */
function stampTiles(baked, name) {
  const s = baked?.stamps?.[name];
  const layer = s?.layers?.[2];
  if (!s || !layer) throw new Error(`progression_gates: falta el stamp horneado «${name}»`);
  return { w: s.w, h: s.h, ids: layer };
}

// ─── Ruta 2: el puente del arroyo (B02 → B03) ───────────────────────────────────────────────────────────────────

/** ¿Sigue cerrado el puente de la Ruta 2? Hasta el P1 (y nunca en una partida que ya estuvo en Caudal). */
export const ruta2BridgeClosed = (s) => Boolean(s) && !s.flag(GATE_FLAGS.p1) && !s.flag(GATE_FLAGS.gaelB2);

export const RUTA2_GATE_TEXT = Object.freeze({
  speaker: 'Operario',
  closed: [
    '¡Eh, alto! Con los temblores de estas noches se han soltado los tablones del puente.',
    'Hasta que la tierra se quede quieta, por aquí no pasa nadie. Lo ha mandado el concejo de Zaguán.',
    'Dicen que donde más tiembla es en las ruinas del Umbral. Si eso se calma, el puente aguanta.',
  ],
  fromSouth: ['¿Vienes del sur? Pasa, pasa, pero pisa por el centro, que los tablones de los lados bailan.'],
  sign: 'PUENTE CERRADO\nTablones sueltos por los temblores.\n— Concejo de Villa Zaguán',
  open: [
    'Desde que dejó de temblar, el puente aguanta como el primer día.',
    'Caudal está al sur, siguiendo el camino. ¡Buen viaje!',
  ],
});

/**
 * Barrera de obras y un operario en el extremo norte del puente del arroyo de la Ruta 2 (`bridge` = BRIDGES[0] de
 * maps/b03/ruta_2.js: { x, y0 }, tablero de 3 casillas). Cerrado mientras `ruta2BridgeClosed`; quien llegue por el
 * sur (partida a medias) pasa hablando con el operario. Con el P1 la barrera desaparece y el operario se aparta.
 */
export function ruta2BridgeGate(bridge) {
  const { ids } = stampTiles(BAKED_EXT1, 'barrera_obras');
  const y = bridge.y0;
  const T = RUTA2_GATE_TEXT;
  const talk = async (ctx) => {
    const worker = ctx.world?.events?.find((e) => e.id === 'operario_puente');
    if (worker) ctx.turnToPlayer?.(worker);
    if (ctx.player && ctx.player.y > y) {
      for (const line of T.fromSouth) await ctx.say(line, { speaker: T.speaker });
      await ctx.movePlayerTo(bridge.x + 2, y - 1, { through: true });
      return;
    }
    for (const line of T.closed) await ctx.say(line, { speaker: T.speaker });
  };
  const barrier = (i) => ({
    id: `barrera_puente_r2_${i}`, x: bridge.x + i, y,
    pages: [{
      when: ruta2BridgeClosed, tileId: ids[i] || ids[0], solid: true, trigger: 'action', noOver: true,
      script: async (ctx) => {
        if (ctx.player && ctx.player.y > y) { await talk(ctx); return; }
        await ctx.say(T.sign, { skin: 'signskin' });
      },
    }],
  });
  return [
    barrier(0),
    barrier(1),
    {
      id: 'operario_puente', x: bridge.x + 2, y, name: T.speaker,
      pages: [{ when: ruta2BridgeClosed, sprite: 'anil:operario', dir: 8, move: 'still', trigger: 'action', script: talk }],
    },
    {
      id: 'operario_puente_despues', x: bridge.x + 4, y: y - 1, name: T.speaker,
      pages: [{
        when: (s) => !ruta2BridgeClosed(s), sprite: 'anil:operario', dir: 4, move: 'look', trigger: 'action',
        script: async (ctx) => { for (const line of T.open) await ctx.say(line, { speaker: T.speaker }); },
      }],
    },
  ];
}

// ─── Ciudad Caudal: la verja de la Senda del Mirador (B03 → B17) ────────────────────────────────────────────────

/** ¿Sigue cerrada la Senda del Mirador? Hasta el P8 (CAMPANA B17: la Senda se recorre en el eclipse). */
export const sendaClosed = (s) => Boolean(s) && !s.flag(GATE_FLAGS.p8);

export const SENDA_GATE_TEXT = Object.freeze({
  gate: 'Una verja de hierro cerrada con cadena y candado. Al otro lado, la senda baja entre pinos hacia la Sima.',
  signClosed: 'PASO CERRADO\nSenda del Mirador: desprendimientos hacia la Sima del Eje.\n— Casa de las Esclusas de Caudal',
  signOpen: 'SENDA DEL MIRADOR ↓\nPolicía Regional: prohibido acercarse al borde de la Sima.',
});

/**
 * Verja de hierro (stamp `verja_puerta`, 4×3) sobre el camino sur de Caudal (x 44–47 desde y 52) y el cartel de al
 * lado. Cerrada hasta `p8_restored`; después la verja desaparece y el cartel cambia de aviso.
 */
export function caudalSendaGate() {
  const { w, h, ids } = stampTiles(BAKED_EXT2, 'verja_puerta');
  const { x: gx, y: gy } = SOUTH_EXIT.gate;
  const T = SENDA_GATE_TEXT;
  const out = [];
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const id = ids[j * w + i];
      if (!id) continue;
      out.push({
        id: `verja_senda_${i}_${j}`, x: gx + i, y: gy + j,
        pages: [{
          when: sendaClosed, tileId: id, solid: true, trigger: 'action', noOver: true,
          script: async (ctx) => { await ctx.say(T.gate); },
        }],
      });
    }
  }
  const [sign] = stampTiles(BAKED_EXT2, 'cartel_madera').ids;
  out.push({
    id: 'cartel_senda_cierre', x: SOUTH_EXIT.x0 - 1, y: gy - 1, tileId: sign, solid: true, trigger: 'action', noOver: true,
    script: async (ctx) => { await ctx.say(sendaClosed(ctx.state) ? T.signClosed : T.signOpen, { skin: 'signskin' }); },
  });
  return out;
}
