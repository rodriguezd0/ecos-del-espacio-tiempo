// Cerro del Alba (docs/CAMPANA.md §1.4 y §2.3 C054): acceso por las raíces del muro este del mirador de la Ruta 1
// (Correr para subir al mirador, Trepar para el cerro), pared de raíces hasta la cornisa con C054, escalera a la
// cima y el brasero frío (Ho-Oh, postgame: aquí solo es decorado). Módulo puro salvo los guiones.
import { F, OBJ } from './b11_common.js';
import { b11CellEvents } from './b11_cells.js';
import { CERRO, RUTA1_CERRO } from '../maps/b11/layout.js';
import { FIELD_TEXT } from '../zygarde/texts.js';

const C = CERRO;

export const CERRO_TEXT = Object.freeze({
  roots: 'Raíces gruesas bajan por el muro del mirador desde la ladera del Cerro del Alba.',
  climbAsk: '¿Quieres trepar por las raíces hasta el Cerro del Alba?',
  arrive: 'Desde aquí arriba se ven los tejados de Villa Alba… y, al fondo, el Monte.',
  brazier: 'Un brasero antiguo de piedra y bronce. Las cenizas están frías desde hace mucho.',
  view: 'Villa Alba, pequeña entre los árboles. Más allá, la Ruta 1 hacia el sur.',
  down: 'Bajas por las raíces hasta el mirador.',
});

/** Evento que añade la Ruta 1 (B01): raíces en el muro este del mirador → Cerro del Alba. */
export function cerroAccessEvents() {
  const w = RUTA1_CERRO.wall;
  return [{
    id: 'raices_cerro_alba', x: w.x, y: w.y, name: 'Raíces', sprite: OBJ.veins, dir: 6, directionFix: true, stepAnime: true,
    solid: true, noOver: true, trigger: 'action', glow: { name: 'zygardeVeins', h: 1 },
    script: async (ctx) => {
      if (!ctx.zygarde('climb')) { await ctx.say(CERRO_TEXT.roots); await ctx.say(FIELD_TEXT.climbWall); return; }
      if (!(await ctx.confirm(CERRO_TEXT.climbAsk))) return;
      ctx.se?.('Rock Climb EX');
      await ctx.fade('out', 20);
      await ctx.warp('cerro_alba', C.entry.x, C.entry.y, C.entry.dir, { fade: false });
      await ctx.fade('in', 20);
    },
  }];
}

function climbEvents() {
  const [fx, fy] = C.wall.from;
  const [tx, ty] = C.wall.to;
  return [
    { id: 'pared_cerro_sube', type: 'climbWall', x: fx, y: fy - 1, to: [tx, ty], h: 3, sprite: OBJ.veins, dir: 6, directionFix: true, stepAnime: true },
    { id: 'pared_cerro_baja', type: 'climbWall', x: tx, y: ty + 1, to: [fx, fy], down: true, glow: false },
  ];
}

function exitEvents() {
  const back = RUTA1_CERRO.from;
  const out = [];
  for (let x = C.exit.x0; x <= C.exit.x1; x++) {
    out.push({
      id: `bajada_cerro_${x}`, x, y: C.exit.y, trigger: 'touch',
      script: async (ctx) => {
        await ctx.say(CERRO_TEXT.down);
        await ctx.warp('ruta_1', back.x, back.y, back.dir);
      },
    });
  }
  return out;
}

export function cerroEvents() {
  return [
    {
      id: 'cerro_llegada', x: 0, y: 0, trigger: 'auto', when: (s) => Boolean(s) && !s.flag(F.cerroSeen),
      script: async (ctx) => { ctx.setFlag(F.cerroSeen); await ctx.say(CERRO_TEXT.arrive); },
    },
    ...climbEvents(),
    ...b11CellEvents('cerro_alba'),
    {
      id: 'brasero_alba', x: C.brazier.x, y: C.brazier.y, name: 'Brasero', sprite: 'asset:objects/b11_brasero.png', dir: 2,
      directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CERRO_TEXT.brazier); },
    },
    { id: 'vista_cerro', x: 20, y: 20, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(CERRO_TEXT.view); } },
    { id: 'objeto_cerro_1', type: 'item', x: 18, y: 3, item: 'PPUP' },
    { id: 'objeto_cerro_2', type: 'item', x: 1, y: 18, item: 'SUPERREPEL', hidden: true },
    ...exitEvents(),
  ];
}
