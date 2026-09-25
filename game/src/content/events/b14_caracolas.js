// Caracolas del eco (docs/CAMPANA.md B14, mazmorra): golpear una cambia la sala entera entre el presente sumergido
// y su eco. Salas 1–2: presente ↔ Antea seca; salas 3–4: presente ↔ Antea ↔ era primigenia. Cada capa es un mapa
// gemelo con las mismas coordenadas (maps/b14/layout.js), así que el jugador aparece en la misma casilla.
// La última caracola usada (o escuchada) es el punto de regreso cuando la Bramaluna embiste (var b14_caracola).
// Las caracolas siguen funcionando tras el P7 (CAMPANA §2.5, invariante 4). Módulo puro salvo los guiones.
import { ROOMS, ERA_LABEL, roomMap, parseRoomMap, ANTEA_MAPS } from '../maps/b14/layout.js';
import { F, V, OBJ, COLOR, lines, zygardeSays, pause } from './b14_common.js';

/** Fila de la hoja de la caracola por capa. */
export const CARACOLA_ROW = Object.freeze({ presente: 2, antea: 4, primigenia: 6 });

export const CARACOLA_TEXT = Object.freeze({
  look: {
    presente: 'Una caracola enorme, incrustada de coral. Del hueco sale un zumbido que no suena a mar.',
    antea: 'La caracola del heraldo, pulida y blanca sobre su peana. Vibra aunque nadie la toque.',
    primigenia: 'Una caracola viva, medio enterrada en la arena tibia. Late despacio.',
  },
  tuto: [
    'Espera. Esta caracola… guarda el sonido de lo que fue.',
    'Si la golpeas, oiremos este mismo lugar en otro tiempo. Y estaremos allí.',
  ],
  ask2: '¿Golpear la caracola?',
  ask3: 'La caracola resuena en dos tonos distintos. ¿Qué eco quieres oír?',
  hit: 'Golpeas la caracola con la palma.',
  keep: 'La caracola sigue vibrando. Recordarás este sitio.',
  firstEcho: 'Esto es un eco. Lo que hagamos aquí seguirá en el presente. Al revés, no.',
  firstPrimal: [
    'Mucho antes de la ciudad. Aquí todavía no había nada que recordar.',
    'Algo grande respira entre los helechos. Si nos ve, nos echará. No dejes que nos vea.',
  ],
  back: 'El agua vuelve a llenarlo todo. El presente.',
});

const YES_NO = ['Golpearla', 'No'];

/** Punto de regreso: 'mapa:x:y:dir'. */
export const caracolaKey = (map, x, y, dir) => `${map}:${x}:${y}:${dir}`;
export function parseCaracolaKey(v) {
  const m = /^(antea_\d_[a-z]+):(\d+):(\d+):(\d)$/.exec(String(v || ''));
  return m && ANTEA_MAPS.includes(m[1]) ? { map: m[1], x: Number(m[2]), y: Number(m[3]), dir: Number(m[4]) } : null;
}

/** Regreso por defecto de un mapa de Antea: la primera caracola de su sala, en esa misma capa. */
export function defaultReturn(mapId) {
  const r = parseRoomMap(mapId);
  if (!r) return null;
  const c = ROOMS[r.room].caracolas[0];
  return { map: mapId, x: c.stand.x, y: c.stand.y, dir: c.stand.dir };
}

/** Recuerda la casilla actual como la última caracola. */
export function rememberCaracola(ctx, x = ctx.player.x, y = ctx.player.y, dir = ctx.player.direction) {
  ctx.setVar(V.caracola, caracolaKey(ctx.map.id, x, y, dir));
}

/** Cambia la sala entera a otra capa: ondas del eco, fundido y warp a la misma casilla del mapa gemelo. */
export async function switchEra(ctx, room, era) {
  const p = ctx.player;
  const to = roomMap(room, era);
  ctx.se('Anim/Water1', { volume: 80 });
  ctx.se('core_signal', { volume: 50 });
  let ring = null;
  try { ring = ctx.effect('softLight', { x: p.x, y: p.y, radius: 150, color: COLOR.echo, intensity: 0.8, pulse: 0.8, fadeIn: 10 }); } catch { ring = null; }
  await ctx.flash(COLOR.echo, 16, 170);
  await ctx.fade('out', 18, era === 'presente' ? [4, 20, 34] : [220, 250, 240]);
  ring?.remove?.(1);
  const x = p.x; const y = p.y; const dir = p.direction;
  await ctx.warp(to, x, y, dir, { fade: false });
  rememberCaracola(ctx);
  await ctx.fade('in', 22);
  if (era === 'primigenia' && !ctx.flag(F.primalSeen)) {
    ctx.setFlag(F.primalSeen);
    for (const t of CARACOLA_TEXT.firstPrimal) await zygardeSays(ctx, t);
  } else if (era !== 'presente' && !ctx.flag(F.firstEcho)) {
    ctx.setFlag(F.firstEcho);
    await zygardeSays(ctx, CARACOLA_TEXT.firstEcho);
  }
}

/** Golpear una caracola: elige la capa (o se queda como punto de regreso). */
export async function useCaracola(ctx, room, era, c) {
  const R = ROOMS[room];
  rememberCaracola(ctx);
  await ctx.say(CARACOLA_TEXT.look[era]);
  if (!ctx.flag(F.caracolaTuto)) {
    ctx.setFlag(F.caracolaTuto);
    for (const t of CARACOLA_TEXT.tuto) await zygardeSays(ctx, t);
  }
  const others = R.eras.filter((e) => e !== era);
  let target = null;
  if (others.length === 1) {
    const i = await ctx.choice(YES_NO, { message: CARACOLA_TEXT.ask2, cancel: 1 });
    target = i === 0 ? others[0] : null;
  } else {
    const i = await ctx.choice([...others.map((e) => ERA_LABEL[e]), 'Nada'], { message: CARACOLA_TEXT.ask3, cancel: others.length });
    target = others[i] || null;
  }
  if (!target) { await ctx.say(CARACOLA_TEXT.keep); return; }
  await ctx.say(CARACOLA_TEXT.hit);
  await switchEra(ctx, room, target);
  if (target === 'presente' && c) await pause(ctx, 2);
}

/** Eventos de las caracolas de una sala en una capa. */
export function caracolaEvents(room, era) {
  return ROOMS[room].caracolas.map((c) => ({
    id: c.id, x: c.x, y: c.y, name: 'Caracola',
    sprite: OBJ.caracola, dir: CARACOLA_ROW[era], directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
    solid: true, noOver: true, trigger: 'action',
    light: era === 'presente' ? { radius: 70, intensity: 0.7 } : undefined,
    script: (ctx) => useCaracola(ctx, room, era, c),
  }));
}

/**
 * Regreso a la última caracola (embestida de la Bramaluna): warp a la casilla guardada; si no hay ninguna válida,
 * a la primera caracola de la sala actual en la misma capa.
 */
export async function returnToCaracola(ctx) {
  const spot = parseCaracolaKey(ctx.var(V.caracola, '')) || defaultReturn(ctx.map.id);
  if (!spot) return false;
  await ctx.warp(spot.map, spot.x, spot.y, spot.dir, { fade: false });
  return true;
}

export { lines };
