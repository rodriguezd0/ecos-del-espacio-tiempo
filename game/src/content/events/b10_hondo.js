// Eventos del Archivo Hondo (docs/CAMPANA.md B10, «Mazmorra: Archivo Hondo»): rellano de la escalera, Estancia 1
// (Suelo Olvidado: el eco del custodio cruza el único camino seguro; pisar fuera devuelve al borde), Estancia 2 (Dos
// Manos: dos custodios dejan dos palancas en posiciones concretas; las palancas se quedan donde se ponen),
// entrenadores y objetos. Estancias 3–5 en b10_hondo_rooms.js; la Cámara del núcleo en b10_hondo_nucleo.js.
import { F, V, SPEAKER, SPRITE, OBJ, frame, lines, placePlayer, eventById, when } from './b10_common.js';
import { ecoEvent, ecoAppear, ecoVanish, ecoMove, stepsAlong, stepsTo, footprint, runEco, gateEvents } from './b10_hondo_eco.js';
import { LEVER_TARGET, LEVER_START, LEVER_NAMES, nextLever, leversSolved, leverPresses } from './b10_hondo_logic.js';
import { lecturaEvents, rollosEvents, muralEvents } from './b10_hondo_rooms.js';
import { nucleoEvents } from './b10_hondo_nucleo.js';
import { b10CellEvents } from './b10_cells.js';
import { SUELO, MANOS, HONDO_ITEMS, HONDO_TRAINERS, sueloTraps } from '../maps/b10/hondo_layout.js';
import { extraTiles } from '../stamps/extraTiles.js';

export const HONDO_TEXT = Object.freeze({
  enter: 'Una espiral de piedra baja hacia la oscuridad. No hay techo ni suelo más abajo: solo el Archivo, flotando.',
  losa: 'Una losa con anillos grabados. Al pisarla, el aire huele a papel viejo…',
  fall: 'El suelo no estaba ahí. Algo te sujeta en la caída y te devuelve, sin daño, al borde de la estancia.',
  crossed: 'Has cruzado el Suelo Olvidado. A tu espalda, el camino del custodio queda marcado con glifos tenues.',
  leverSolved: 'La palanca no cede: la losa del dintel ya está abierta.',
  leverPos: (i, p) => `La palanca ${i === 0 ? 'del oeste' : 'del este'} queda ${LEVER_NAMES[p]}.`,
  manosOpen: 'Con un roce de piedra contra piedra, la losa del dintel se hunde en el suelo.',
  manosGate: 'Una losa cierra el paso bajo el dintel. Tiene dos surcos, como la huella de dos manos.',
  ecosGone: 'Los ecos se deshacen en el aire. Las palancas vuelven a donde tú las dejaste.',
  exitUp: 'La escalera sube al Archivo de papel.',
});

const GLYPH_TILE = extraTiles('InteriorTorre').find((t) => t.name === 'pilar_glifo')?.id || 0;

// ------------------------------------------------------------ Estancia 1 · Suelo Olvidado

const SUELO_HOME = Object.freeze({ x: SUELO.start.x, y: SUELO.start.y, dir: 6 });

async function sueloEco(ctx) {
  await runEco(async () => {
    await ctx.say(HONDO_TEXT.losa);
    const ev = eventById(ctx, 'eco_suelo');
    await ecoAppear(ctx, ev, { at: SUELO_HOME, dir: 6 });
    const steps = stepsAlong(SUELO_HOME, [...SUELO.path, [SUELO.exit.x, SUELO.exit.y]]);
    const cells = [...SUELO.path, [SUELO.exit.x, SUELO.exit.y]];
    const route = [];
    steps.forEach((s, i) => { route.push(s, { call: () => footprint(ctx, cells[i][0], cells[i][1]) }); });
    await ecoMove(ctx, ev, [{ speed: 3 }, ...route]);
    await ecoVanish(ctx, ev);
  });
}

async function sueloFall(ctx) {
  ctx.se('PRSFX- Shadow Sneak1', { volume: 70 });
  await ctx.fade('out', 16, [20, 14, 8]);
  // Mirando a la rejilla: así el Core y el acompañante quedan detrás, sobre el rellano (no en el suelo invisible).
  await placePlayer(ctx, SUELO.start.x, SUELO.start.y, SUELO.start.dir, { fade: false });
  await ctx.wait(10);
  await ctx.fade('in', 16);
  await ctx.say(HONDO_TEXT.fall);
  if (!ctx.flag(F.sueloFall)) ctx.setFlag(F.sueloFall); // Zygarde habla muy poco (autor, 25-09-2026)
}

async function sueloCrossed(ctx) {
  if (ctx.flag(F.suelo)) return;
  ctx.setFlag(F.suelo);
  ctx.se('PRSFX- Miracle Eye', { volume: 60 });
  await ctx.say(HONDO_TEXT.crossed);
}

function sueloEvents() {
  const losa = SUELO.losa;
  const out = [];
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    out.push({ id: `losa_suelo_${dx}${dy}`, x: losa.x + dx, y: losa.y + dy, trigger: 'touch', through: true, script: sueloEco });
  }
  for (const [x, y] of sueloTraps()) out.push({ id: `suelo_trampa_${x}_${y}`, x, y, trigger: 'touch', through: true, script: sueloFall });
  out.push({
    id: 'suelo_salida', x: SUELO.exit.x, y: SUELO.exit.y,
    pages: [
      { trigger: 'touch', through: true, script: sueloCrossed },
      // El camino del custodio queda marcado con glifos (persistente) una vez cruzado.
      { when: when({ all: [F.suelo] }), through: true, patch: GLYPH_TILE ? SUELO.path.map(([x, y]) => [x, y, 2, GLYPH_TILE]) : undefined },
    ],
  });
  out.push(ecoEvent('eco_suelo', SUELO_HOME, { name: SPEAKER.custodio }));
  return out;
}

// ------------------------------------------------------------ Estancia 2 · Dos Manos

export const leverPos = (s, i) => {
  const v = s?.var?.(i === 0 ? V.lever1 : V.lever2, null);
  return v === null || v === undefined ? LEVER_START[i] : Number(v) % 4;
};

const LEVER_DIRS = [2, 4, 6, 8];

async function openManos(ctx) {
  ctx.setFlag(F.manos);
  ctx.se('Door slide', { volume: 90 });
  ctx.shake(3, 6, 24);
  await ctx.wait(20);
  await ctx.say(HONDO_TEXT.manosOpen);
}

async function pullLever(ctx, i) {
  const s = ctx.state;
  if (ctx.flag(F.manos)) { await ctx.say(HONDO_TEXT.leverSolved); return; }
  const next = nextLever(leverPos(s, i));
  ctx.setVar(i === 0 ? V.lever1 : V.lever2, next);
  ctx.se('PRSFX- Rock Polish', { volume: 70 });
  await ctx.wait(8);
  await ctx.say(HONDO_TEXT.leverPos(i, next));
  if (leversSolved(leverPos(s, 0), leverPos(s, 1))) await openManos(ctx);
}

function leverEvents() {
  return MANOS.levers.map((pos, i) => ({
    id: `palanca_${i + 1}`, x: pos.x, y: pos.y, name: 'Palanca',
    pages: [0, 1, 2, 3].map((p) => ({
      when: (s) => Boolean(s) && leverPos(s, i) === p,
      sprite: OBJ.lever, ...frame(p * 4), solid: true, trigger: 'action', shadow: false,
      script: (ctx) => pullLever(ctx, i),
    })),
  }));
}

/** Eco de las Dos Manos: cada custodio va a su palanca desde la posición 0 y tira hasta dejarla en la suya. */
async function manosEco(ctx) {
  await runEco(async () => {
    await ctx.say(HONDO_TEXT.losa);
    const levers = MANOS.levers.map((_, i) => eventById(ctx, `palanca_${i + 1}`));
    for (const lv of levers) if (lv) lv.direction = LEVER_DIRS[0];
    for (let i = 0; i < 2; i++) {
      const ev = eventById(ctx, `eco_manos_${i + 1}`);
      const home = MANOS.custodios[i];
      await ecoAppear(ctx, ev, { at: home, dir: 8 });
      const target = { x: MANOS.levers[i].x, y: MANOS.levers[i].y + 1 };
      await ecoMove(ctx, ev, [{ speed: 3.5 }, ...stepsTo(home, target), 'turn_up']);
      for (let k = 1; k <= leverPresses(i); k++) {
        await ctx.wait(14);
        ctx.se('PRSFX- Rock Polish', { volume: 55 });
        if (levers[i]) levers[i].direction = LEVER_DIRS[k];
      }
      await ctx.wait(20);
    }
    await ctx.wait(30);
    for (let i = 0; i < 2; i++) await ecoVanish(ctx, eventById(ctx, `eco_manos_${i + 1}`));
    // Las palancas vuelven a la posición que dejó el jugador.
    levers.forEach((lv, i) => { if (lv) lv.direction = LEVER_DIRS[leverPos(ctx.state, i)]; });
    await ctx.say(HONDO_TEXT.ecosGone);
  });
}

function manosEvents() {
  const losa = MANOS.losa;
  const out = [...leverEvents()];
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    out.push({ id: `losa_manos_${dx}${dy}`, x: losa.x + dx, y: losa.y + dy, trigger: 'touch', through: true, when: when({ none: [F.manos] }), script: manosEco });
  }
  MANOS.custodios.forEach((home, i) => out.push(ecoEvent(`eco_manos_${i + 1}`, home, { name: SPEAKER.custodio, sprite: i === 0 ? SPRITE.custodio : SPRITE.custodia })));
  // El paso de las Dos Manos se aborda desde el norte: losa baja (umbral) para no tapar al jugador.
  out.push(...gateEvents('losa_manos', MANOS.gate, F.manos, HONDO_TEXT.manosGate, { sprite: OBJ.threshold, ...frame(8) }));
  return out;
}

// ------------------------------------------------------------ entrenadores, objetos y entrada

function trainerEvents() {
  const DATA = {
    b10_investigadora_leonor: { name: 'Leonor', sprite: 'anil:cientifica', after: 'Bajé a estudiar las estanterías y me encontré con palancas. Nadie estudia palancas.' },
    b10_cerebrito_ismael: { name: 'Ismael', sprite: 'anil:cerebrito', after: 'He leído la estela diez veces. Lo que no recuerdo es para qué.' },
    b10_medium_remigio: { name: 'Remigio', sprite: 'anil:medium', after: 'Esos custodios no son fantasmas. Los fantasmas, al menos, te miran.' },
  };
  return HONDO_TRAINERS.map((t) => ({ id: t.id.replace(/^b10_/, 'entrenador_'), type: 'trainer', trainer: t.id, x: t.x, y: t.y, dir: t.dir, sight: t.sight, ...DATA[t.id] }));
}

function itemEvents() {
  return HONDO_ITEMS.map((it) => ({ ...it, type: 'item' }));
}

export async function hondoOnEnter(ctx) {
  if (ctx.flag(F.hondoSeen)) return;
  ctx.setFlag(F.hondoSeen);
  await ctx.wait?.(10);
  await ctx.say(HONDO_TEXT.enter);
}

/** Todos los eventos del Archivo Hondo. */
export function hondoEvents() {
  return [
    ...sueloEvents(),
    ...manosEvents(),
    ...lecturaEvents(),
    ...rollosEvents(),
    ...muralEvents(),
    ...nucleoEvents(),
    ...trainerEvents(),
    ...itemEvents(),
    ...b10CellEvents('archivo_hondo'),
  ];
}

export { LEVER_TARGET, lines };
