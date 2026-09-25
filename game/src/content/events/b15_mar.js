// Eventos del Mar Boreal y su fondo (docs/CAMPANA.md §1.4 «Mar frío»; §2.3 C096 «Témpano»; B22: la Instalación Cierzo
// del islote es del postgame y no es de Genesis). Témpanos, bloques de hielo a la deriva, el marinero Teo, el remolino
// de Buceo, la verja cerrada del islote y los objetos. Coordenadas en content/maps/b15/layout_escarcha.js.
import { F, SPRITE, when } from './b15_common.js';
import { b15CellEvents } from './b15_cells.js';
import { MAR, FONDO } from '../maps/b15/layout_escarcha.js';

export const MAR_TEXT = Object.freeze({
  drift: 'Un bloque de hielo a la deriva. Cruje al chocar con las olas.',
  gate: 'Una verja oxidada, cerrada con cadenas. Detrás, un edificio de hormigón sin rótulos ni ventanas encendidas.',
  gateAgain: 'La verja sigue cerrada. Nadie en Boreal sabe quién levantó esto.',
  sign: 'El cartel está borrado por la sal. Solo se lee: «…CIERZO».',
});

/** Bloques de hielo a la deriva (sólidos, sobre el agua). */
const DRIFT = [[20, 12], [30, 26], [42, 10], [8, 15], [35, 33], [17, 36]];

export function marEvents() {
  const M = MAR;
  return [
    ...DRIFT.map(([x, y], i) => ({ id: `hielo_deriva_${i}`, x, y, name: 'Hielo a la deriva', sprite: SPRITE.iceObject, dir: 2 + 2 * (i % 3), directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MAR_TEXT.drift); } })),
    {
      id: 'verja_cierzo', x: M.cierzo.gate.x, y: M.cierzo.gate.y, name: 'Verja', solid: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.cierzoSeen) ? MAR_TEXT.gateAgain : MAR_TEXT.gate);
        ctx.setFlag(F.cierzoSeen);
      },
    },
    { id: 'cartel_cierzo', type: 'sign', x: M.cierzo.gate.x + 2, y: M.cierzo.gate.y + 1, text: MAR_TEXT.sign },
    {
      id: 'marinero_teo', type: 'trainer', trainer: 'b15_marinero_teo', name: 'Marinero Teo', sprite: 'anil:marinero',
      ...M.teo, sight: 3,
      intro: '¡Eh, tú, a nado con este frío! Si aguantas el agua, aguantarás un combate.',
      after: 'Los témpanos van y vienen. Al noroeste hay un islote con una verja que nadie abre.',
    },
    { id: 'remolino_boreal', type: 'diveSpot', x: M.dive.x, y: M.dive.y, to: 'mar_boreal_fondo', tx: FONDO.entry.x, ty: FONDO.entry.y, dir: FONDO.entry.dir },
    ...M.items.map((it, i) => ({ id: `objeto_mar_boreal_${i}`, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    ...b15CellEvents('mar_boreal'),
  ];
}

export function fondoEvents() {
  const Fd = FONDO;
  return [
    { id: 'superficie_boreal', type: 'diveSpot', surface: true, x: Fd.entry.x, y: Fd.entry.y, to: Fd.surface.map, tx: Fd.surface.x, ty: Fd.surface.y, dir: Fd.surface.dir },
    { id: 'respiradero_boreal', type: 'diveVent', x: Fd.vent.x, y: Fd.vent.y },
    ...Fd.items.map((it, i) => ({ id: `objeto_fondo_boreal_${i}`, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    {
      id: 'restos_fondo', x: 20, y: 9, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Un ancla vieja, cubierta de algas pálidas. Algún pesquero de Boreal la perdió hace muchos inviernos.'); },
    },
  ];
}

export { when };
