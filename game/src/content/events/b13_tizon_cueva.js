// Eventos de la Cueva del Tizón (docs/TABLILLAS.md T12 «La forja fría»): bloques de obsidiana que se empujan, coladas
// que se enfrían al taponar su boca, los tres respiraderos que alimentan la forja y el reinicio de las salas sin
// resolver al salir de ellas. Las REGLAS están en b13_lava_logic.js (puras y probadas); aquí se animan y se guardan
// (var b13_colada_<sala>). Técnica de la perforación en el vestíbulo.
import { F, V, SPRITE, OBJ, objectPage } from './b13_common.js';
import { ROOMS, ROOM_IDS, roomStart, roomState, isSolved, push } from './b13_lava_logic.js';
import { EXITS, TECH, ITEMS, roomAt } from '../maps/b13/tizon_cueva_layout.js';

const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });

export const CUEVA_TEXT = Object.freeze({
  block: 'Un bloque de obsidiana, negro y brillante. Pesa, pero se desliza sobre la roca.',
  lava: 'El bloque no entra en la lava corriente: se fundiría antes de taponar nada.',
  noRoom: 'El bloque no se mueve: algo lo frena al otro lado.',
  dam: 'El bloque de obsidiana se hunde en la boca de la colada y la tapona.',
  cooled: 'La lava deja de correr. En pocos segundos se oscurece y se endurece en una costra negra.',
  reset: 'A tu espalda, el magma vuelve a abrirse paso: las coladas de la galería se reinician.',
  vent: 'Un respiradero de piedra, taponado por una costra de lava fría. Debajo se oye silbar el aire caliente.',
  ventAsk: '¿Quieres apartar la costra del respiradero?',
  ventOpen: 'Apartas la costra. Un chorro de aire caliente sube silbando por la chimenea de piedra.',
  ventDone: 'El respiradero humea. El calor sube hacia la forja.',
  allVents: 'Muy lejos, bajo tus pies, algo retumba. Por las chimeneas del volcán vuelve a subir el calor.',
  headLava: 'La boca de la colada: por aquí brota el magma.',
  dammedHead: 'Un bloque de obsidiana hundido en la boca de la colada.',
});

export const readRoom = (state, n) => roomState(n, state?.var?.(V.lava(n), null));
function writeRoom(ctx, n, st) { ctx.setVar(V.lava(n), { blocks: st.blocks, dammed: st.dammed }); }

/** Coloca los bloques donde dice el estado (al entrar y tras reiniciar). */
export function syncBlocks(ctx) {
  for (const n of ROOM_IDS) {
    const st = readRoom(ctx.state, n);
    for (const [id, p] of Object.entries(st.blocks)) {
      const ev = ctx.world.events.find((e) => e.id === `obsidiana_${n}_${id}`);
      if (!ev) continue;
      if (p) { ev.moveTo(p[0], p[1]); ev.opacity = 255; } else ev.opacity = 0;
    }
  }
  ctx.requestRefresh();
}

/**
 * Al entrar en el mapa (o cambiar de galería por un túnel): se reinician las salas sin resolver en las que no está el
 * jugador (TABLILLAS T12: «las coladas se reinician al salir de la sala»).
 */
export async function caveOnEnter(ctx) {
  const here = roomAt(ctx.player.x, ctx.player.y);
  let reset = false;
  for (const n of ROOM_IDS) {
    if (n === here) continue;
    const st = readRoom(ctx.state, n);
    if (isSolved(n, st)) continue;
    const start = roomStart(n);
    const moved = JSON.stringify(st) !== JSON.stringify(start);
    if (moved) { writeRoom(ctx, n, start); reset = true; }
  }
  syncBlocks(ctx);
  if (reset) await ctx.say(CUEVA_TEXT.reset);
}

// ───────────────────────────── Bloques ─────────────────────────────

async function blockScript(ctx) {
  const ev = ctx.event;
  const { room: n } = ev.def;
  const p = ctx.player;
  const dir = p.direction;
  const [dx, dy] = [{ 2: 0, 4: -1, 6: 1, 8: 0 }[dir], { 2: 1, 4: 0, 6: 0, 8: -1 }[dir]];
  if (ev.x !== p.x + dx || ev.y !== p.y + dy) return;
  const st = readRoom(ctx.state, n);
  const r = push(n, st, p.x, p.y, dir);
  if (!r.ok) {
    ctx.se('Player bump');
    if (r.reason === 'lava') await ctx.say(CUEVA_TEXT.lava);
    return;
  }
  ctx.se('Strength push');
  await ctx.move(ev, [DIR_NAME[dir]], { through: true, speed: 4 });
  writeRoom(ctx, n, r.state);
  if (r.dammed) await dammed(ctx, n, r.dammed, ev);
}

async function dammed(ctx, n, flow, ev) {
  ctx.se('PRSFX- Rock Wrecker', { volume: 70 });
  ev.opacity = 0;
  await ctx.flash([255, 150, 70], 10, 110);
  await ctx.say(CUEVA_TEXT.dam);
  ctx.se('PRSFX- Mist', { volume: 70 });
  ctx.requestRefresh();
  await ctx.wait(16);
  await ctx.say(CUEVA_TEXT.cooled);
  if (!ctx.flag('b13_t12_primera_costra')) {
    ctx.setFlag('b13_t12_primera_costra');
    // Zygarde habla muy poco (autor, 25-09-2026): la regla del puzle queda como narración.
    await ctx.say('La costra parece firme. Se puede pisar.');
  }
  if (isSolved(n, readRoom(ctx.state, n)) && ROOMS[n].flows.r && ROOMS[n].flows.l) {
    await ctx.say('La fuente del centro sigue viva, pero ya no tiene por dónde correr.');
  }
}

function blockEvents() {
  const out = [];
  for (const n of ROOM_IDS) {
    for (const [id, [x, y]] of Object.entries(ROOMS[n].blocks)) {
      out.push({
        id: `obsidiana_${n}_${id}`, x, y, room: n, block: id, name: 'Bloque de obsidiana',
        pages: [
          { ...objectPage(OBJ.block, 2), solid: true, trigger: 'touch', script: blockScript },
          // Hundido en una boca: el evento desaparece (lo que se ve es el bloque de la boca taponada).
          { when: (s) => readRoom(s, n).blocks[id] === null, through: true },
        ],
      });
    }
  }
  return out;
}

// ───────────────────────────── Coladas ─────────────────────────────

const isDammed = (n, flow) => (s) => readRoom(s, n).dammed.includes(flow);
const lavaText = async (ctx) => { await ctx.say(CUEVA_TEXT.lava); };

/**
 * Coladas: cada casilla es un evento sobre el suelo volcánico (la lava del autotile de Añil solo se ve bien en charcas
 * anchas). Viva: lava que fluye, sólida. Taponada: costra fría que se pisa; la boca queda con el bloque hundido.
 */
function lavaEvents() {
  const out = [];
  for (const n of ROOM_IDS) {
    for (const [flow, fl] of Object.entries(ROOMS[n].flows)) {
      fl.cells.forEach(([x, y], i) => {
        const head = i === 0;
        const live = head
          ? { ...objectPage(OBJ.lava, 6, { stepAnime: true }), shadow: false, solid: true, light: { radius: 44, intensity: 0.7 }, trigger: 'action', script: async (ctx) => { await ctx.say(CUEVA_TEXT.headLava); } }
          : { ...objectPage(OBJ.lava, 2, { stepAnime: true }), shadow: false, solid: true, light: i % 4 === 0 ? { radius: 36, intensity: 0.5 } : undefined, trigger: 'action', script: lavaText };
        const cooled = head
          ? { when: isDammed(n, flow), ...objectPage(OBJ.block, 4), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CUEVA_TEXT.dammedHead); } }
          : { when: isDammed(n, flow), ...objectPage(OBJ.lava, i % 5 ? 4 : 8, { stepAnime: true }), shadow: false, through: true };
        out.push({ id: `colada_${n}_${flow}_${i}`, x, y, name: head ? 'Boca de la colada' : 'Colada', pages: [live, cooled] });
      });
    }
    for (const [x, y] of ROOMS[n].source || []) {
      out.push({ id: `fuente_${n}_${x}_${y}`, x, y, name: 'Fuente de magma', ...objectPage(OBJ.lava, 6, { stepAnime: true }), shadow: false, solid: true, light: { radius: 48, intensity: 0.8 }, trigger: 'action', script: lavaText });
    }
  }
  return out;
}

// ───────────────────────────── Respiraderos ─────────────────────────────

async function ventScript(ctx) {
  const n = ctx.event.def.vent;
  if (ctx.flag(F.tizVent(n))) { await ctx.say(CUEVA_TEXT.ventDone); return; }
  await ctx.say(CUEVA_TEXT.vent);
  if (!(await ctx.confirm(CUEVA_TEXT.ventAsk))) return;
  ctx.se('Rock Smash');
  await ctx.wait(10);
  ctx.se('PRSFX- Mist', { volume: 90 });
  ctx.setFlag(F.tizVent(n));
  await ctx.say(CUEVA_TEXT.ventOpen);
  if ([1, 2, 3].every((k) => ctx.flag(F.tizVent(k))) && !ctx.flag(F.tizVents)) {
    ctx.setFlag(F.tizVents);
    ctx.shake(3, 4, 30);
    await ctx.say(CUEVA_TEXT.allVents);
  }
}

function ventEvents() {
  return ROOM_IDS.map((n) => {
    const v = ROOMS[n].vent;
    return {
      id: `respiradero_${n}`, x: v.x, y: v.y, vent: n, name: 'Respiradero',
      pages: [
        { ...objectPage(OBJ.vent, 2), solid: true, trigger: 'action', script: ventScript },
        { when: (s) => Boolean(s?.flag(F.tizVent(n))), ...objectPage(OBJ.vent, 6, { stepAnime: true }), solid: true, light: { radius: 40, intensity: 0.6 }, trigger: 'action', script: ventScript },
      ],
    };
  });
}

/** Warps entre galerías (mismo mapa) y hacia fuera. */
export function caveWarps() {
  return Object.values(EXITS).map((e) => ({ x: e.door.x, y: e.door.y, to: e.map || 'tizon_cueva', tx: e.arrive.x, ty: e.arrive.y, dir: e.arrive.dir }));
}

export function caveEvents() {
  return [
    ...blockEvents(),
    ...lavaEvents(),
    ...ventEvents(),
    {
      id: TECH.id, type: 'trainer', trainer: TECH.trainer, name: TECH.name, sprite: SPRITE.techF, x: TECH.x, y: TECH.y, dir: TECH.dir, sight: TECH.sight,
      intro: 'Zona de perforación. Las coladas no son cosa nuestra… o no del todo. Da la vuelta.',
      after: 'La jefa está arriba, en el cráter, con la sonda. Yo solo vigilo las galerías.',
    },
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
  ];
}
