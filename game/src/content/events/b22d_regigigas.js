// Regigigas (docs/CAMPANA.md B22: «Cámara del Coloso (Archivo Hondo) · Los tres Regis en el equipo · Nv 75»).
// Bajo la cámara del núcleo del Archivo Hondo (P5) hay un sello grabado con tres nichos (roca, hielo, acero). Las tres
// estelas de las Cuevas Selladas lo anuncian: «El que nos dio forma duerme bajo la memoria.» Con Regirock, Regice y
// Registeel en el equipo el sello se abre y baja a la Cámara del Coloso (archivo_coloso), donde duerme Regigigas; el
// coloso solo despierta si los tres están en el equipo. El Archivo Hondo es de B10: el sello se añade con una línea.
import {
  F, SPEAKER, SPRITE, OBJ, MUSIC, postgame, lines, zygardeSays, pause, eventById, legendPresent, examine,
} from './b22d_common.js';
import { hasRegiTrio } from './b22d_logic.js';
import { legendBattle } from './b22d_battle.js';
import { HOOKS, COLOSO } from '../maps/b22d/layout.js';

const C = COLOSO;

export const REGIGIGAS_TEXT = Object.freeze({
  seal: 'Un sello grabado en el enlosado: un óvalo con tres nichos vacíos. Uno tiene forma de roca; otro, de hielo; otro, de acero.',
  sealGlyphs: 'Alrededor, una línea de glifos Unown: «Tres custodios durmieron para que el coloso durmiera. Cuando los tres despierten juntos, él los reconocerá.»',
  sealNoKey: 'Alrededor hay una línea de glifos Unown que no sabes leer.',
  sealCore: 'Tres huecos. Tres formas. Algo muy grande duerme debajo.',
  trio: 'Los tres Pokémon de tu equipo se agitan a la vez. Los nichos del sello se encienden: roca, hielo, acero.',
  open: 'El sello se hunde con un crujido largo y deja a la vista una escalera que baja.',
  openCore: 'Debajo de la memoria hay algo muy grande. Los tres lo están llamando.',
  stairs: 'Una escalera de piedra que baja hacia el fondo del Archivo.',
  stairsAsk: '¿Bajar?',
  arrive: 'Una cámara bajo el Archivo, más antigua que el propio Archivo. Al fondo, una figura que no cabría por ninguna puerta.',
  sleeping: 'Un coloso inmóvil, cubierto de musgo seco. Por su cuerpo corren puntos de luz que se apagan y se encienden muy despacio, como una respiración.',
  notYet: 'El coloso no se mueve. Parece esperar a alguien… o a tres.',
  wake: 'Tus tres Regis se ponen delante de él. El coloso los reconoce: todos los puntos de su cuerpo se encienden a la vez.',
  wake2: 'La cámara entera tiembla. ¡El coloso se levanta!',
  gone: 'La cámara está vacía. En el enlosado quedan dos huellas enormes.',
  niche: (what) => `Un pedestal con la marca de una figura de ${what}. Está vacío, pero caliente, como si alguien se acabara de levantar.`,
  column: 'Una columna de piedra más vieja que las del Archivo. Tiene grabados siete puntos en fila.',
});

const open = (s) => Boolean(s?.flag(F.colosoOpen));

async function sealScript(ctx) {
  if (hasRegiTrio(ctx.state.party)) {
    const seal = eventById(ctx, 'b22d_sello_coloso');
    for (const sp of ['REGIROCK', 'REGICE', 'REGISTEEL']) { ctx.cry(sp); await pause(ctx, 24); }
    if (seal) { seal.direction = 4; seal.stepAnime = true; }
    await ctx.say(REGIGIGAS_TEXT.trio);
    ctx.shake(4, 5, 50);
    ctx.se?.('Earth4', { volume: 80 });
    await pause(ctx, 40);
    await ctx.flash([255, 240, 210], 16, 180);
    ctx.setFlag(F.colosoOpen);
    await ctx.say(REGIGIGAS_TEXT.open);
    await zygardeSays(ctx, REGIGIGAS_TEXT.openCore);
    return;
  }
  await ctx.say(REGIGIGAS_TEXT.seal);
  await ctx.say(ctx.state.hasItem?.('GLYPHKEY') ? REGIGIGAS_TEXT.sealGlyphs : REGIGIGAS_TEXT.sealNoKey);
  await zygardeSays(ctx, REGIGIGAS_TEXT.sealCore);
}

async function stairsScript(ctx) {
  await ctx.say(REGIGIGAS_TEXT.stairs);
  if (!(await ctx.confirm(REGIGIGAS_TEXT.stairsAsk))) return;
  ctx.se?.('Door enter');
  await ctx.warp(C.id, C.arrive.x, C.arrive.y, C.arrive.dir);
}

/** Eventos que añade el Archivo Hondo (archivo_hondo.js). */
export function b22dHondoEvents() {
  const S = HOOKS.hondo.seal;
  return [{
    id: 'b22d_sello_coloso', x: S.x, y: S.y, name: 'Sello de los tres',
    pages: [
      { when: postgame, sprite: OBJ.seal, dir: 2, directionFix: true, walkAnime: false, shadow: false, through: true, trigger: 'action', script: sealScript },
      { when: (s) => postgame(s) && open(s), sprite: OBJ.seal, dir: 6, directionFix: true, walkAnime: false, shadow: false, through: true, trigger: 'action', script: stairsScript },
    ],
  }];
}

// ───────────────────────────── Cámara del Coloso ─────────────────────────────

export const REGIGIGAS_SPEC = Object.freeze({ species: 'REGIGIGAS', level: 75, moves: Object.freeze(['GIGAIMPACT', 'HAMMERARM', 'HEAVYSLAM', 'ZENHEADBUTT']) });

async function regigigasScript(ctx) {
  const ev = eventById(ctx, 'regigigas');
  await ctx.say(REGIGIGAS_TEXT.sleeping);
  if (!hasRegiTrio(ctx.state.party)) { await ctx.say(REGIGIGAS_TEXT.notYet); return; }
  for (const sp of ['REGIROCK', 'REGICE', 'REGISTEEL']) { ctx.cry(sp); await pause(ctx, 20); }
  await ctx.say(REGIGIGAS_TEXT.wake);
  if (ev) ev.stepAnime = true;
  ctx.cry('REGIGIGAS');
  ctx.shake(6, 6, 60);
  await ctx.say(REGIGIGAS_TEXT.wake2);
  await legendBattle(ctx, 'regigigas', REGIGIGAS_SPEC, { retry: { ...C.battle }, bgm: MUSIC.legendMajor, battleback: 'Templo' });
  if (ev && !legendPresent(ctx.state, 'regigigas')) ev.stepAnime = false;
}

/** Casillas que ocupa el coloso (sprite de 4×4): bloqueos invisibles que despiertan a Regigigas. */
export function colossusBlock() {
  const G = C.regigigas;
  const cells = [];
  for (let y = G.y - 2; y <= G.y; y++) for (let x = G.x - 1; x <= G.x + 1; x++) if (!(x === G.x && y === G.y)) cells.push([x, y]);
  return cells;
}

/** Eventos del mapa archivo_coloso. */
export function colosoEvents() {
  const G = C.regigigas;
  const present = (s) => legendPresent(s, 'regigigas');
  const NICHE = ['roca', 'acero', 'hielo'];
  return [
    {
      id: 'b22d_coloso_llegada', x: 0, y: 0, trigger: 'auto', when: (s) => postgame(s) && !s.flag('b22d_coloso_llegada'),
      script: async (ctx) => { ctx.setFlag('b22d_coloso_llegada'); await pause(ctx, 20); await ctx.say(REGIGIGAS_TEXT.arrive); },
    },
    {
      id: 'regigigas', x: G.x, y: G.y, name: 'Regigigas',
      pages: [
        { when: postgame, trigger: 'action', through: true, script: async (ctx) => { await ctx.say(REGIGIGAS_TEXT.gone); } },
        { when: present, sprite: SPRITE.regigigas, dir: G.dir, move: 'still', stepAnime: false, solid: true, trigger: 'action', script: regigigasScript },
      ],
    },
    ...colossusBlock().map(([x, y]) => ({
      id: `b22d_coloso_${x}_${y}`, x, y, name: 'Regigigas',
      pages: [{ when: present, solid: true, noOver: true, trigger: 'action', script: regigigasScript }],
    })),
    ...C.niches.map((n, i) => examine(`b22d_nicho_${i}`, n.x, n.y, REGIGIGAS_TEXT.niche(NICHE[i]))),
    ...C.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
  ];
}

export { SPEAKER, lines };
