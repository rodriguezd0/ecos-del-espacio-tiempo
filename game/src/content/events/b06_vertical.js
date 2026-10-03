// Piso de entrenadores del P3 y entrada a su puzzle. Los identificadores anteriores conservan premios y progreso.
import { F } from './b06_common.js';
import { ANILLO_TEXT } from './b06_anillo.js';
import { pilarTrainerEvents } from './b06_meseta.js';
import { GALERIAS, P3_VERTICAL } from '../maps/b06/layout.js';

export const P3_MONOLITHS = Object.freeze({ N: [6, 8], E: [12, 8], W: [18, 8] });

export function baseEvents() {
  return [
    ...pilarTrainerEvents(),
    ...Object.entries(P3_MONOLITHS).flatMap(([key, [x, y]]) => [0, 1].map((dx) => ({
      id: `monolito_${key.toLowerCase()}_${dx}`, x: x + dx, y: y + 2, solid: true, trigger: 'action', noOver: true,
      script: async (ctx) => { await ctx.say(ANILLO_TEXT.monoliths[key]); },
    }))),
    { id: 'objeto_anillo_1', type: 'item', x: 7, y: 20, item: 'HYPERPOTION', hidden: true },
    { id: 'objeto_anillo_2', type: 'item', x: 20, y: 18, item: 'ETHER' },
    { id: 'objeto_anillo_3', type: 'item', x: 7, y: 13, item: 'REVIVE', hidden: true },
    {
      id: 'tienda_abril', x: 6, y: 18, trigger: 'action', solid: true,
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.abrilAfter) ? ANILLO_TEXT.tentNote : 'El refugio de Abril. Un saco de dormir y una pila de revistas viejas junto a la pared.');
        const r = await ctx.rest({ kind: 'camp', message: '¿Quieres descansar un rato en el refugio?' });
        if (r?.rested) ctx.setHealPoint(6, 19, 8);
      },
    },
    {
      id: 'subida_galerias', ...P3_VERTICAL.up, trigger: 'touch', through: true,
      script: async (ctx) => {
        if (!ctx.flag(F.colector) && !ctx.flag(F.restored)) { await ctx.say(ANILLO_TEXT.mouthGale); return; }
        ctx.se('Door enter');
        await ctx.warp('galerias_soplo', GALERIAS.entry.x, GALERIAS.entry.y, 8);
      },
    },
    {
      id: 'cartel_galerias', x: 19, y: 6, type: 'sign',
      text: `${ANILLO_TEXT.sign}\n«Si no puedes remontar las flechas, sube montado. Las veletas giran el viento.»`,
    },
  ];
}

export async function baseOnEnter(ctx) {
  const moved = [
    ['meseta_impulso', 'veterana_julia'], ['meseta_impulso', 'mecanica_sonia'],
    ...['objeto_anillo_1', 'objeto_anillo_2', 'objeto_anillo_3'].map((id) => ['anillo_vientos', id]),
  ];
  for (const [map, id] of moved) {
    if (ctx.state.selfSwitch(map, id)) ctx.state.setSelfSwitch('anillo_vientos_base', id, 'A', true);
  }
  ctx.requestRefresh();
}
