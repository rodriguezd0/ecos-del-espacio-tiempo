// Eventos de la Ruta 9 y el Bosque Neblino (docs/CAMPANA.md §1.4 y B11): la niebla del olvido que devuelve al
// lindero hasta el P5 (puerta G7 del §2.5), la llegada tras el P5, carteles, el claro de la hoguera (descansar:
// cambia la franja horaria, necesario para el arco nocturno T10, y fija el punto de regreso), las células C047
// (copa del tronco hueco) y C048 (repisa de cristal) con sus paredes de Trepar, entrenadores (nv 38–41), objetos
// (Lopunnita, POKEDEX_DISTRIBUCION §7.7), el santuario musgoso y el enlace con la Aldea Mnemos (B10, pendiente).
// Nilo y su escondite (T10) están en b11_t10_nilo.js.
import { F, SPEAKER, OBJ, when, zygardeSays, placePlayer, pause } from './b11_common.js';
import { b11CellEvents } from './b11_cells.js';
import { niloEvents } from './b11_t10_nilo.js';
import { NEBLINO } from '../maps/b11/layout.js';
import { PENDING_LINKS } from '../maps/b11/pending_links.js';
import { runRest } from '../services/inn.js';

const N = NEBLINO;
const P5 = 'p5_restored';

export const NEBLINO_TEXT = Object.freeze({
  signNorth: 'RUTA 9 · BOSQUE NEBLINO\n↑ Ruta 10 · Monte del Portal  ↓ Aldea Mnemos',
  signSouth: 'BOSQUE NEBLINO\nNo se aparte del sendero.',
  fogBack: 'La niebla lo envuelve todo. Das unos pasos… y, sin saber cómo, vuelves a estar en el lindero.',
  fogZygarde: 'Esta niebla borra el camino. No es de este bosque.',
  arrival: 'La niebla se ha retirado. Entre los pinos lilas brillan cristales que antes nadie veía.',
  arrivalZygarde: 'El bosque respira otra vez.',
  fire: 'Una hoguera de campamento. Aún quedan brasas y leña seca al lado.',
  fireAsk: '¿Quieres descansar junto a la hoguera?',
  shrine: 'Un claro silencioso. Sobre una piedra plana cubierta de musgo alguien ha dejado unas bayas, como una ofrenda.',
  crystal: 'Cristales lilas que crecen de la tierra. Dan una luz tenue, como si guardaran algo.',
  hollow: 'Un tronco gigantesco, hueco por dentro. Por las raíces se podría trepar a lo alto de la loma.',
  bridge: 'Un puente de troncos sobre el Albo. El agua baja fría del Monte.',
});

/** Niebla del olvido (antes del P5): franjas que devuelven al lindero. También espesa la niebla del mapa. */
function fogLoopEvents() {
  const out = [];
  const band = (tag, loop) => {
    for (let x = loop.x0; x <= loop.x1; x++) {
      out.push({
        id: `niebla_${tag}_${x}`, x, y: loop.y, trigger: 'touch', when: when({ none: [P5] }),
        script: async (ctx) => {
          await ctx.fade('out', 24, [230, 222, 240]);
          await placePlayer(ctx, loop.back);
          await pause(ctx, 20);
          await ctx.fade('in', 24, [230, 222, 240]);
          await ctx.say(NEBLINO_TEXT.fogBack);
          if (!ctx.flag('b11_niebla_vista')) {
            ctx.setFlag('b11_niebla_vista');
            await zygardeSays(ctx, NEBLINO_TEXT.fogZygarde);
          }
        },
      });
    }
  };
  band('norte', N.loopNorth);
  band('sur', N.loopSouth);
  // Niebla espesa mientras no se restaura el P5 (evento paralelo: vale también al entrar por una conexión).
  out.push({
    id: 'niebla_espesa', x: 0, y: 0, trigger: 'parallel', when: when({ none: [P5] }),
    script: async (ctx) => {
      if (ctx.scene?.weather?.type !== 'fog') await ctx.weather('fog', 9);
      await pause(ctx, 30);
    },
  });
  return out;
}

/** Llegada tras el P5: la niebla ya no está (una vez). */
function arrivalEvents() {
  const script = async (ctx) => {
    if (ctx.flag(F.neblinoIntro)) return;
    ctx.setFlag(F.neblinoIntro);
    await ctx.say(NEBLINO_TEXT.arrival);
    await zygardeSays(ctx, NEBLINO_TEXT.arrivalZygarde);
  };
  const out = [];
  for (const loop of [N.loopNorth, N.loopSouth]) {
    for (let x = loop.x0; x <= loop.x1; x++) {
      out.push({ id: `llegada_${loop.y}_${x}`, x, y: loop.y, trigger: 'touch', when: when({ all: [P5], none: [F.neblinoIntro] }), script });
    }
  }
  return out;
}

/** Hoguera del claro: descanso de campamento (cambia la franja horaria) y punto de regreso. */
function campEvents() {
  const { fire } = N.camp;
  return [
    {
      id: 'hoguera_neblino', x: fire.x, y: fire.y, name: 'Hoguera', sprite: OBJ.fire, dir: 2, directionFix: true,
      walkAnime: false, stepAnime: true, speed: 3, solid: true, trigger: 'action', light: { radius: 88, intensity: 0.9 },
      script: async (ctx) => {
        await ctx.say(NEBLINO_TEXT.fire);
        const r = await runRest(ctx, { kind: 'camp', message: NEBLINO_TEXT.fireAsk });
        if (r?.rested) ctx.setHealPoint(fire.x, fire.y + 1, 8);
      },
    },
  ];
}

/** Paredes de Trepar (vetas verdes) de la loma del tronco hueco y de la repisa de cristal. */
function climbEvents() {
  const out = [];
  for (const [tag, w] of [['tronco', N.hollow], ['cristal', N.crystal]]) {
    const [fx, fy] = w.from;
    const [tx, ty] = w.to;
    out.push({ id: `pared_${tag}_sube`, type: 'climbWall', x: fx, y: fy - 1, to: [tx, ty], h: 3, sprite: OBJ.veins, dir: 6, directionFix: true, stepAnime: true });
    out.push({ id: `pared_${tag}_baja`, type: 'climbWall', x: tx, y: ty + 1, to: [fx, fy], down: true, glow: false });
  }
  return out;
}

function trainerEvents() {
  return [
    {
      id: 'medium_celia', type: 'trainer', trainer: 'b11_medium_celia', name: 'Médium Celia', sprite: 'anil:medium',
      x: 24, y: 14, dir: 6, sight: 3,
      intro: 'Durante semanas la niebla no dejó pasar a nadie… salvo a los espíritus. ¿Tú qué eres?',
      // Fase 1–2 de la crisis (TABLILLAS T10, CAMPANA §3.1): sombras que bajan del aljibe al Neblino (las arregla el P6, B12).
      after: (s) => (s?.flag?.('p6_restored')
        ? 'Las sombras ya no bajan del Monte. Algo se ha cerrado allá arriba, y el bosque lo nota.'
        : 'Desde que se fue la niebla, de noche bajan sombras del Monte. No son espíritus. No sé lo que son.'),
    },
    {
      id: 'excursionista_ruben', type: 'trainer', trainer: 'b11_excursionista_ruben', name: 'Excursionista Rubén', sprite: 'anil:excursionista',
      x: 29, y: 20, dir: 4, sight: 4,
      intro: '¡Por fin se puede cruzar el Neblino! ¿Echamos un combate para celebrarlo?',
      after: 'Si subes a la Ruta 10, ojo con los Honchkrow. Últimamente vigilan el pinar de arriba.',
    },
    {
      id: 'bichera_lucia', type: 'trainer', trainer: 'b11_bichera_lucia', name: 'Bichera Lucía', sprite: 'anil:bichera',
      x: 22, y: 37, dir: 6, sight: 3,
      intro: '¡Chis! Los Cutiefly del claro están comiendo. …Bueno, un combate rápido.',
      after: 'Los cristales atraen a los bichos por la noche. Brillan un poco, ¿lo has visto?',
    },
    {
      id: 'veterano_andres', type: 'trainer', trainer: 'b11_veterano_andres', name: 'Veterano Andrés', sprite: 'anil:veterano',
      x: 28, y: 52, dir: 4, sight: 4,
      intro: 'Me perdí en esta niebla tres días. Hoy vengo a demostrarme que sé salir.',
      after: 'Olvidé hasta el nombre de mi Noctowl. Él me esperó igual.',
    },
  ];
}

function itemEvents() {
  return [
    { id: 'objeto_neblino_lopunnita', type: 'item', x: N.shrine.x + 3, y: N.shrine.y, item: 'LOPUNNITE' },
    { id: 'objeto_neblino_1', type: 'item', x: 42, y: 13, item: 'FULLHEAL' },
    { id: 'objeto_neblino_2', type: 'item', x: 44, y: 51, item: 'ULTRABALL', count: 2 },
    { id: 'objeto_neblino_3', type: 'item', x: 13, y: 3, item: 'MOONSTONE', hidden: true },
    { id: 'objeto_neblino_4', type: 'item', x: 33, y: 44, item: 'HYPERPOTION', hidden: true },
    { id: 'objeto_neblino_5', type: 'item', x: 45, y: 4, item: 'TINYMUSHROOM', hidden: true },
  ];
}

function signEvents() {
  const s = N.shrine;
  const examine = (id, x, y, text) => ({ id, x, y, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(text); } });
  return [
    { id: 'cartel_neblino_norte', type: 'sign', x: 19, y: 1, text: NEBLINO_TEXT.signNorth, skin: 'sign hgss dir' },
    { id: 'cartel_neblino_sur', type: 'sign', x: 26, y: 56, text: NEBLINO_TEXT.signSouth, skin: 'sign hgss dir' },
    examine('santuario_piedra', s.x, s.y, NEBLINO_TEXT.shrine),
    examine('santuario_piedra_2', s.x - 1, s.y, NEBLINO_TEXT.shrine),
    examine('santuario_piedra_3', s.x + 1, s.y, NEBLINO_TEXT.shrine),
    examine('cristal_grande_1', 13, 16, NEBLINO_TEXT.crystal),
    examine('tronco_hueco', N.hollow.x0 + 3, N.hollow.y0 + 3, NEBLINO_TEXT.hollow),
  ];
}

/** Racimos de cristal lila (arte de tools/b11_assets.mjs; fila = variante): brillan despacio y se pueden examinar. */
export const LILAC_CRYSTALS = Object.freeze([
  [18, 7, 4], [15, 14, 6], [39, 13, 8], [43, 17, 2], [32, 21, 4], [39, 10, 6], [36, 38, 8],
  [28, 48, 2], [34, 54, 4], [20, 56, 6], [28, 57, 8], [9, 44, 2], [17, 42, 4], [45, 9, 6], [26, 23, 8],
]);

export function crystalEvents(list = LILAC_CRYSTALS, prefix = 'cristal_lila') {
  return list.map(([x, y, dir], i) => ({
    id: `${prefix}_${i}`, x, y, name: 'Cristal', sprite: OBJ.crystal, dir, directionFix: true, walkAnime: false,
    stepAnime: true, speed: 1, solid: true, trigger: 'action', light: { radius: 44, intensity: 0.5 },
    script: async (ctx) => { await ctx.say(NEBLINO_TEXT.crystal); },
  }));
}

/** Borde sur cerrado mientras no exista la Aldea Mnemos (B10): aviso neutro y un paso atrás. */
function mnemosBlock() {
  const link = PENDING_LINKS.aldea_mnemos;
  const script = async (ctx) => {
    ctx.face('player', 'down');
    await ctx.say(link.blocked);
    await ctx.move('player', ['up'], { through: false });
  };
  const out = [];
  for (let x = N.south.x0; x <= N.south.x1; x++) out.push({ id: `limite_mnemos_${x}`, x, y: N.south.y, trigger: 'touch', script });
  return out;
}

export function neblinoEvents({ mnemosOpen = false } = {}) {
  return [
    ...fogLoopEvents(),
    ...arrivalEvents(),
    ...campEvents(),
    ...climbEvents(),
    ...b11CellEvents('ruta_9_neblino'),
    ...trainerEvents(),
    ...itemEvents(),
    ...signEvents(),
    ...crystalEvents(),
    ...niloEvents(),
    ...(mnemosOpen ? [] : mnemosBlock()),
  ];
}

export { SPEAKER };
