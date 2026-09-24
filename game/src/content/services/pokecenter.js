// Plantilla del Centro Pokémon de Axis (interior estándar, tileset 4 Interior1): mostrador con la enfermera
// y la máquina de curación (stamp `mostrador_centro`), PC de almacenamiento (`pc_centro`), mostrador de
// tienda con dependiente (stock por progreso, shop.js), revistero y salida de 3 casillas.
//
// Uso en el mapa de una población (content/maps/<bloque>/zaguan_centro.js):
//   import { pokemonCenterMap } from '../../services/pokecenter.js';
//   export default pokemonCenterMap({ id: 'zaguan_centro', exit: { map: 'villa_zaguan', x: 20, y: 15 } });
// y en el exterior un warp a la alfombra: { x, y, to: 'zaguan_centro', ...CENTER_ENTRY, door: true }.
// Curar fija el punto de cura (derrota y Cuerda Huida) delante de la enfermera.
import {
  INTERIOR_TILESET, SERVICE_BRUSHES, SERVICE_STAMPS, SERVICE_FALLBACK, exitWarps, exitArrowEvents, furnitureEvents,
} from './interior.js';
import { clerkEvent } from './shop.js';
import { playHealMachine } from './healMachine.js';
import { restSpotEvent } from './inn.js';
import { zoneDefaults } from './zones.js';

export const DEFAULT_NURSE_SPRITE = 'enfermera';

/** Geometría del Centro estándar (19×14). Las coordenadas son casillas del mapa del interior. */
export const CENTER_LAYOUT = Object.freeze({
  width: 19,
  height: 14,
  room: Object.freeze({ x: 1, y: 1, w: 17, h: 12 }), // 3 filas de pared (y 1–3) y suelo (y 4–12)
  counter: Object.freeze({ x: 6, y: 1 }), // stamp mostrador_centro (7×9)
  nurse: Object.freeze({ x: 9, y: 5, dir: 2 }),
  front: Object.freeze({ x: 9, y: 7, dir: 8 }), // casilla del jugador al hablar con la enfermera = punto de cura
  machine: Object.freeze({ x: 8, y: 4, offsetX: 14 }), // evento de las Poké Balls: centradas en la cápsula (healMachine.js)
  pc: Object.freeze({ x: 14, y: 3 }), // stamp pc_centro (2×3); se usa desde la fila de abajo
  shop: Object.freeze({ x: 12, y: 9 }), // mostrador de tienda (6×4)
  clerk: Object.freeze({ x: 13, y: 11, dir: 4 }),
  rack: Object.freeze({ x: 2, y: 3 }),
  table: Object.freeze({ x: 2, y: 9 }),
  plants: Object.freeze([{ x: 1, y: 11 }, { x: 17, y: 4 }]),
  door: Object.freeze({ x: 9, y: 12 }), // casilla central del felpudo
});

/** Llegada desde el exterior (para el warp de la puerta del Centro): { tx, ty, dir }. */
export const CENTER_ENTRY = Object.freeze({ tx: CENTER_LAYOUT.door.x, ty: CENTER_LAYOUT.door.y, dir: 8 });

// ------------------------------------------------------------ guiones
const TEXT = Object.freeze({
  welcome: '¡Hola! ¡Bienvenido al Centro Pokémon!',
  offer: 'Aquí curamos a tus Pokémon y les devolvemos toda su energía.',
  ask: '¿Quieres que cuide de tus Pokémon?',
  noParty: 'Vaya, no llevas ningún Pokémon contigo.',
  take: 'Muy bien, dame tus Pokémon un momento.',
  done: '¡Gracias por esperar! Tus Pokémon se han recuperado por completo.',
  bye: '¡Esperamos volver a verte!',
});

/**
 * Flujo completo de curación del Centro (lo usa nurseEvent; sirve también para Centros con otro diseño).
 * opts: { nurse: id del evento o 'this', machine: { x, y, offsetX? }, healPoint: { x, y, dir }, speaker }
 * @returns {Promise<boolean>} true si curó
 */
export async function pokemonCenterHeal(ctx, opts = {}) {
  const L = CENTER_LAYOUT;
  const nurse = opts.nurse ?? 'this';
  const say = (t) => ctx.say(t, opts.speaker ? { speaker: opts.speaker } : {});
  await say(TEXT.welcome);
  if (!ctx.state.party.length) { await say(TEXT.noParty); await say(TEXT.bye); return false; }
  await say(TEXT.offer);
  if (!(await ctx.confirm(TEXT.ask))) { await say(TEXT.bye); return false; }
  await say(TEXT.take);
  const machine = opts.machine || L.machine;
  ctx.face(nurse, 'up');
  await ctx.wait(10);
  await playHealMachine(ctx, {
    x: machine.x, y: machine.y, offsetX: machine.offsetX || 0,
    onHeal: () => {
      ctx.heal();
      const hp = opts.healPoint || null;
      if (hp) ctx.setHealPoint(hp.x, hp.y, hp.dir ?? 8);
      else ctx.setHealPoint(ctx.player.x, ctx.player.y, 8);
    },
  });
  ctx.turnToPlayer(nurse);
  await ctx.wait(8);
  await say(TEXT.done);
  await say(TEXT.bye);
  return true;
}

/**
 * Evento de la enfermera. opts: { id, x, y, dir, sprite, machine, healPoint, speaker, when }.
 * En el Centro estándar basta con `nurseEvent()`.
 */
export function nurseEvent(opts = {}) {
  const L = CENTER_LAYOUT;
  const { id = 'enfermera', x = L.nurse.x, y = L.nurse.y, dir = L.nurse.dir, sprite = DEFAULT_NURSE_SPRITE, when } = opts;
  const healPoint = opts.healPoint || (x === L.nurse.x && y === L.nurse.y ? L.front : null);
  return {
    id, x, y, dir, sprite, move: 'still', when,
    script: (ctx) => pokemonCenterHeal(ctx, { ...opts, nurse: 'this', healPoint }),
  };
}

/** Guion del PC de almacenamiento (encender, sistema de cajas, apagar). */
export async function usePC(ctx) {
  ctx.se('PC open');
  await ctx.say('\\PN ha encendido el PC.');
  for (;;) {
    const i = await ctx.choice(['Sistema de almacenamiento', 'Apagar'], { message: '¿A qué quieres acceder?', cancel: 1 });
    if (i !== 0) break;
    ctx.se('PC access');
    await ctx.ui.openStorage();
  }
  ctx.se('PC close');
}

/** Eventos del PC: una casilla por columna del terminal (se usa mirando hacia arriba; bloquean el paso). */
export function pcEvents(x, y, width = 2) {
  return Array.from({ length: width }, (_, i) => ({ id: `pc_${i}`, x: x + i, y, trigger: 'action', noOver: true, solid: true, script: usePC }));
}

// ------------------------------------------------------------ plantilla de mapa
/**
 * Definición completa del interior de un Centro Pokémon.
 * @param {object} opts
 *   id (obligatorio) · exit: { map, x, y, dir } casilla exterior al salir (obligatoria)
 *   name, bgm ('pokecenter'), shop: false | { list, items, extra, remove, greeting, prices } (tienda del Centro)
 *   pc: false · rest: false (sin rincón de descanso, X25) · nurseSprite · clerkSprite
 *   events: eventos extra (NPC del pueblo, tutores…)
 */
export function pokemonCenterMap(opts = {}) {
  const { id, exit, events = [], shop = {}, pc = true, rest = true } = opts;
  if (!id) throw new Error('pokemonCenterMap: falta el id del mapa');
  const L = CENTER_LAYOUT;
  const zone = zoneDefaults(exit?.map);
  const { x: dx, y: dy } = L.door;
  const list = [
    ...exitArrowEvents(dx, dy + 1),
    nurseEvent({ sprite: opts.nurseSprite || DEFAULT_NURSE_SPRITE }),
    ...(pc ? pcEvents(L.pc.x, L.pc.y + 2) : []),
    ...furnitureEvents('revistero', L.rack.x, L.rack.y + 2, 4, 'Hay revistas de Pokémon de todas partes de Axis.'),
  ];
  if (rest) list.push(restSpotEvent('descanso', L.table.x + 1, L.table.y + 1, { kind: 'center' }));
  if (shop !== false) {
    list.push(clerkEvent({ ...shop, x: L.clerk.x, y: L.clerk.y, dir: L.clerk.dir, sprite: opts.clerkSprite || shop.sprite }));
  }
  return {
    id,
    name: opts.name ?? zone.name ?? '',
    tileset: INTERIOR_TILESET,
    width: L.width,
    height: L.height,
    outdoor: false,
    bgm: opts.bgm ?? 'pokecenter',
    battleback: 'indoor',
    showLocation: false,
    start: { x: dx, y: dy, dir: 8 },
    brushes: SERVICE_BRUSHES,
    stamps: SERVICE_STAMPS,
    fallback: SERVICE_FALLBACK,
    build(b) { buildCenter(b, { pc, shop: shop !== false }); },
    warps: exitWarps(dx, dy, exit || {}),
    events: [...list, ...events],
  };
}

/** Construye el interior estándar (también se puede usar desde un build() propio). */
export function buildCenter(b, { pc = true, shop = true } = {}) {
  const L = CENTER_LAYOUT;
  const r = L.room;
  b.fill(null, 'svc_vacio');
  b.rect(null, r.x, r.y, r.w, r.h, 'svc_habitacion_centro');
  b.stamp('svc_salida_centro', L.door.x - 2, L.door.y);
  b.stamp('mostrador_centro', L.counter.x, L.counter.y);
  if (pc) b.stamp('pc_centro', L.pc.x, L.pc.y);
  b.stamp('svc_revistero', L.rack.x, L.rack.y);
  b.stamp('svc_mesa_baja', L.table.x, L.table.y);
  if (shop) b.stamp('svc_mostrador_tienda', L.shop.x, L.shop.y);
  if (b.hasStamp('planta')) for (const p of L.plants) b.stamp('planta', p.x, p.y);
}
