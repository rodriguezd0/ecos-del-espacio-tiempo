// Acciones de campo de Zygarde como guiones (ctx): Embestida, Trepar, Buceo (bajar/subir/agotarse),
// Reconstrucción (piedras que suben con colisión real y persistente), Vuelo (disgregación en hexágonos),
// cambio de forma con el Arca, Salto de Convergencia (B21) y Anclaje espacial (postgame, solo API).
import { FIELD_TEXT } from '../../content/zygarde/texts.js';
import { FORMS } from '../../content/zygarde/thresholds.js';
import { getCharacter, playerVariant } from '../../content/characters.js';
import { canRide, isRiding, setRiding, mountState, syncMount } from './mount.js';
import { canChooseForm, setForm } from './progression.js';
import { safeEffect, GREEN } from './scenes.js';
import { placeById, resolveFlyTarget } from '../../ui/logic/regionMapData.js';
import { underwaterConfig, surfacePoint } from './dive.js';
import { loadMapDefinition } from '../../content/maps/index.js';

const WHITE_GREEN = [228, 255, 214];

/** Monta el 10 % solo para la acción si no iba montado; devuelve una función que lo deshace. */
function rideForAction(ctx) {
  const world = ctx.world;
  if (isRiding(world) || !canRide(world)) return () => {};
  setRiding(world, true);
  return () => setRiding(world, false);
}

async function fadeOpacity(chars, from, to, frames, ctx) {
  for (let f = 1; f <= frames; f++) {
    const v = Math.round(from + ((to - from) * f) / frames);
    for (const c of chars) if (c) c.opacity = v;
    await ctx.wait(1);
  }
}

// ------------------------------------------------------------ Embestida
/**
 * Zygarde embiste: retroceso, golpe, fisura que estalla en hexágonos y fotogramas de rotura del objeto.
 * `targets` = eventos que se rompen juntos (grupo); se marcan con el self switch A (persistente).
 */
export async function ramBreak(ctx, ev, targets = [ev]) {
  const undo = rideForAction(ctx);
  try {
    ctx.face('player', ctx.directionTo(ctx.player, ev));
    await ctx.wait(4);
    await ctx.move('player', ['backward', { wait: 4 }, 'forward'], { through: false, speed: 4.5 });
    ctx.se('PRSFX- Head Smash');
    const burst = safeEffect(ctx, 'zygardeHexBurst', { x: ev.x, y: ev.y, mode: 'out', count: 16, color: WHITE_GREEN });
    await ctx.flash([255, 255, 255], 6, 120);
    ctx.shake(6, 9, 18);
    ctx.se('Rock Smash');
    for (const t of targets) { t.directionFix = false; t.walkAnime = false; t.lockPattern = true; t.pattern = 0; }
    const sheet = targets.every((t) => !(t.tileId > 0));
    if (sheet) {
      for (const dir of [4, 6, 8]) {
        for (const t of targets) t.direction = dir;
        await ctx.wait(5);
      }
    }
    await fadeOpacity(targets, 255, 0, 10, ctx);
    for (const t of targets) ctx.setSelfSwitch('A', true, t);
    burst?.remove?.(20);
  } finally {
    undo();
  }
}

// ------------------------------------------------------------ Trepar
/** Ruta en línea (primero horizontal) desde el jugador hasta (tx, ty). */
function lineRoute(p, tx, ty) {
  const route = [];
  for (let i = 0; i < Math.abs(tx - p.x); i++) route.push(tx > p.x ? 'right' : 'left');
  for (let i = 0; i < Math.abs(ty - p.y); i++) route.push(ty > p.y ? 'down' : 'up');
  return route;
}

/**
 * Sube o baja una pared señalada montado en el 10 %: paso lento, polvo en cada casilla, vetas que brillan y
 * sonido de escalada. `to` = [x, y] destino.
 */
export async function climbWall(ctx, to) {
  const p = ctx.player;
  const world = ctx.world;
  const route = lineRoute(p, to[0], to[1]);
  if (!route.length) return;
  // Con arte propio (`<protagonista>_climb`, de espaldas agarrado a la pared) trepa a pie; si no, montado en el 10 %.
  const climbArt = playerVariant(ctx.state?.player?.gender, 'climb');
  const wasRiding = isRiding(world);
  let undo = () => {};
  let saved = null;
  if (climbArt) {
    if (wasRiding) { setRiding(world, false); syncMount(world); }
    saved = { ...p.charsets };
    p.setCharsets({ walk: climbArt, run: climbArt });
  } else {
    undo = rideForAction(ctx);
  }
  try {
    ctx.se('Rock Climb EX');
    const withDust = route.flatMap((step) => [step, { call: (ch) => ctx.scene?.playFieldAnim?.('dust', ch, ch.x, ch.y) }]);
    await ctx.move('player', withDust, { through: true, speed: 3 });
    if (saved) p.setCharsets(saved);
    ctx.se('Player jump', { volume: 60 });
    await ctx.jump('player', 0, 0);
  } finally {
    if (saved) {
      p.setCharsets(saved);
      if (wasRiding) setRiding(world, true);
    }
    undo();
  }
}

// ------------------------------------------------------------ Reconstrucción
/**
 * Alza las piedras de `tiles` ([[x, y, capa, id], …]) una a una: cada piedra sube desde abajo con hexágonos
 * verdes y, al asentarse, escribe el tile (colisión real). El evento que llama guarda su self switch A, cuya
 * página vuelve a aplicar los tiles (patch) al cargar el mapa: persistente en el estado.
 */
export async function rebuildStones(ctx, tiles) {
  const world = ctx.world;
  ctx.se('PRSFX- Stealth Rocks');
  const rise = safeEffect(ctx, 'zygardeRebuild', { tiles });
  ctx.shake(3, 5, 30);
  await ctx.flash([...GREEN], 14, 90);
  for (const [x, y, layer, id] of tiles) {
    if (id >= 384 && typeof world.spawnEvent === 'function') {
      const stone = world.spawnEvent({ id: `__piedra_${x}_${y}_${layer}`, x, y, tileId: id, through: true });
      stone.yOffset = 26;
      stone.opacity = 0;
      const burst = safeEffect(ctx, 'zygardeHexBurst', { x, y, mode: 'out', count: 8 });
      const frames = 14;
      for (let f = 1; f <= frames; f++) {
        const k = f / frames;
        stone.yOffset = Math.round(26 * (1 - k) * (1 - k));
        stone.opacity = Math.min(255, Math.round(255 * k * 1.4));
        await ctx.wait(1);
      }
      ctx.setTile(x, y, layer, id);
      world.removeEvent(stone);
      burst?.remove?.(14);
      ctx.se('Rock Smash', { volume: 45 });
    } else {
      ctx.setTile(x, y, layer, id);
    }
    await ctx.wait(3);
  }
  rise?.remove?.(30);
}

// ------------------------------------------------------------ Buceo
/** Baja al fondo con la burbuja de Zygarde. d = { to, tx, ty, dir }. */
export async function diveDown(ctx, d) {
  ctx.se('PRSFX- Dive1');
  const bubble = safeEffect(ctx, 'zygardeBubble', { target: ctx.player, size: 120 });
  await ctx.flash([120, 200, 255], 10, 90);
  await ctx.fade('out', 22, [6, 22, 38]);
  bubble?.remove?.(1);
  await ctx.warp(d.to, d.tx, d.ty, d.dir ?? 2, { fade: false });
  await ctx.fade('in', 22);
}

/** Sube a la superficie (llega nadando si la casilla es agua). */
export async function surfaceUp(ctx, d) {
  ctx.se('PRSFX- Dive2');
  await ctx.fade('out', 18, [180, 230, 255]);
  await ctx.warp(d.to, d.tx, d.ty, d.dir ?? 2, { fade: false });
  await ctx.fade('in', 18);
}

/**
 * Bajo el agua, A sin nada delante (world.js → fieldHook 'surface'): si el mapa declara su superficie
 * (`underwater.surface`, dive.js) y encima hay agua abierta, ofrece emerger en la casilla equivalente.
 * Devuelve true si emergió. Sin superficie declarada no hace nada; con `areas` que no cubren la casilla, avisa.
 */
export async function surfaceHere(ctx) {
  const def = ctx.world.current?.def;
  const cfg = underwaterConfig(def);
  if (!cfg?.surface) return false;
  const p = ctx.player;
  const at = surfacePoint(def, p.x, p.y);
  if (!at) { await ctx.say(FIELD_TEXT.surfaceBlocked); return false; }
  if ((await ctx.choice(['Sí', 'No'], { message: FIELD_TEXT.surfaceAsk, cancel: 1 })) !== 0) return false;
  await surfaceUp(ctx, { to: at.map, tx: at.x, ty: at.y, dir: p.direction });
  return true;
}

/** La resonancia se agota: fundido y regreso al último respiradero, sin daño ni pérdida (§2.8). */
export async function diveDepleted(ctx, vent) {
  ctx.se('PRSFX- Bubble');
  await ctx.say(FIELD_TEXT.diveDepleted, { auto: 50 });
  await ctx.fade('out', 30, [0, 18, 28]);
  const map = ctx.world.map?.id;
  await ctx.warp(map, vent.x, vent.y, vent.dir ?? 2, { fade: false });
  ctx.scene?.zygarde?.refillDive?.(vent.x, vent.y, { silent: true });
  await ctx.fade('in', 30);
  await ctx.say(FIELD_TEXT.diveReturn);
}

// ------------------------------------------------------------ Vuelo
/** ¿Se puede volar desde este mapa? Exteriores, fuera del agua y sin `fly: false`. */
export function canFlyFrom(def) {
  return Boolean(def && def.outdoor && !def.underwater && def.fly !== false);
}

/**
 * Destino de vuelo a partir de lo que devuelve ui.openRegionMap({ fly: true }): un id de lugar del atlas o un
 * objeto { mapId|map, x, y, dir }. Para un lugar del atlas la casilla de llegada la da
 * `resolveFlyTarget` de services (ui/logic/regionMapData.js): el `flyPoint` de la definición del mapa del
 * pueblo o, si no tiene, su `start`. Si el mapa aún no existe no hay destino (null).
 * `opts`: { loadDef (content/maps/index.js#loadMapDefinition), points } o, forma antigua, la lista `points`
 * (lugares propios con flyTo = { map, x, y, dir } o mapIds; pruebas y mapas de desarrollo).
 */
export async function resolveFlyDestination(pick, opts = {}) {
  if (!pick) return null;
  if (typeof pick === 'object') {
    const map = pick.mapId || pick.map;
    return map ? { map, x: pick.x, y: pick.y, dir: pick.dir ?? 2 } : null;
  }
  const { points = null, loadDef = loadMapDefinition } = Array.isArray(opts) ? { points: opts } : (opts || {});
  if (placeById(pick)) {
    const t = await resolveFlyTarget(pick, loadDef);
    return t?.mapId ? { map: t.mapId, x: t.x, y: t.y, dir: t.dir ?? 2 } : null;
  }
  const point = (points || []).find((p) => p.id === pick);
  if (!point) return null;
  const to = point.flyTo || point.fly;
  if (to && typeof to === 'object' && (to.map || to.mapId)) return { map: to.map || to.mapId, x: to.x, y: to.y, dir: to.dir ?? 2 };
  return point.mapIds?.[0] ? { map: point.mapIds[0], dir: 2 } : null;
}

/** Zygarde se disgrega en su red de hexágonos y se rehace en el destino con el jugador (§1.7). */
export async function flyTransition(ctx, dest) {
  const world = ctx.world;
  const p = ctx.player;
  // Arte propio: tira de disgregación del protagonista (`<protagonista>_vuelo`, 8 fotogramas de 96 px).
  const vuelo = getCharacter(playerVariant(ctx.state?.player?.gender, 'vuelo'));
  const followers = world.followers || [];
  ctx.se('PRSFX- Teleport');
  ctx.face('player', 'down');
  const out = safeEffect(ctx, 'zygardeHexBurst', { x: p.x, y: p.y, mode: 'out', count: 40, spread: 3.2 });
  let stripOut = null;
  if (vuelo) {
    p.opacity = 0;
    stripOut = safeEffect(ctx, 'zygardeStrip', { url: vuelo.file, target: p, frames: vuelo.cols, frameW: vuelo.frameW, frameH: vuelo.frameH, ticks: 4, fadeIn: 1 });
  }
  await ctx.flash([...GREEN], 14, 150);
  await fadeOpacity(vuelo ? followers : [p, ...followers], 255, 0, 18, ctx);
  if (vuelo) await ctx.wait(Math.max(0, vuelo.cols * 4 - 18));
  await ctx.fade('out', 16, [8, 26, 14]);
  out?.remove?.(1);
  stripOut?.remove?.(1);
  await ctx.warp(dest.map, dest.x, dest.y, dest.dir ?? 2, { fade: false });
  const pl = ctx.player;
  for (const c of [pl, ...(world.followers || [])]) c.opacity = 0;
  pl.turnGeneric?.(2);
  const back = safeEffect(ctx, 'zygardeHexBurst', { x: pl.x, y: pl.y, mode: 'in', count: 40, spread: 3.2 });
  const stripIn = vuelo
    ? safeEffect(ctx, 'zygardeStrip', { url: vuelo.file, target: pl, frames: vuelo.cols, frameW: vuelo.frameW, frameH: vuelo.frameH, ticks: 4, reverse: true, fadeIn: 1 })
    : null;
  await ctx.fade('in', 16);
  await ctx.wait(vuelo ? Math.max(14, vuelo.cols * 4 - 16) : 14);
  if (vuelo) { pl.opacity = 255; stripIn?.remove?.(1); }
  await fadeOpacity(vuelo ? world.followers || [] : [pl, ...(world.followers || [])], 0, 255, 16, ctx);
  ctx.se('core_signal', { volume: 45 });
  back?.remove?.(16);
}

/** Vuelo completo: comprueba, abre el mapa regional en modo vuelo y viaja. */
export async function flyWithZygarde(ctx) {
  if (!ctx.zygarde('fly')) return false;
  if (!canFlyFrom(ctx.world.current?.def)) { await ctx.say(FIELD_TEXT.cantFly); return false; }
  const pick = await ctx.ui.openRegionMap({ fly: true });
  const dest = await resolveFlyDestination(pick);
  if (!dest) return false;
  await flyTransition(ctx, dest);
  return true;
}

// ------------------------------------------------------------ Arca: formas
/** Cambia de forma con el Arca (si está desbloqueada), con destello y hexágonos. */
export async function changeForm(ctx, form, { requireArca = true } = {}) {
  const st = ctx.state;
  if (!canChooseForm(st, form, { requireArca })) {
    if (requireArca && !st.hasKeyItem('ZYGARDECUBE')) await ctx.say(FIELD_TEXT.noArca);
    return false;
  }
  if (st.zygardeForm === form) return false;
  ctx.se('core_signal', { volume: 50 });
  const at = ctx.world.core?.visible ? ctx.world.core : ctx.player;
  const fx = safeEffect(ctx, 'zygardeHexBurst', { x: at.x, y: at.y, mode: 'in', count: 18 });
  await ctx.flash([...GREEN], 12, 110);
  setForm(st, form);
  ctx.scene?.refreshFollower?.();
  fx?.remove?.(20);
  await ctx.say(FIELD_TEXT.formChanged(FORMS[form].name));
  return true;
}

/**
 * Acción devuelta por la pantalla de Zygarde ({ type: 'zygarde', action: 'fly' | 'form', form }).
 * Registrada en world/fieldActions.js como tipo 'zygarde'.
 */
export async function runZygardeAction(ctx, action) {
  switch (action?.action) {
    case 'fly': return flyWithZygarde(ctx);
    case 'form': return changeForm(ctx, action.form);
    case 'formChanged': {
      ctx.scene?.refreshFollower?.();
      const at = ctx.world.core?.visible ? ctx.world.core : ctx.player;
      const fx = safeEffect(ctx, 'zygardeHexBurst', { x: at.x, y: at.y, mode: 'in', count: 18 });
      ctx.se('core_signal', { volume: 45 });
      await ctx.flash([...GREEN], 12, 90);
      fx?.remove?.(20);
      return true;
    }
    default: return false;
  }
}

// ------------------------------------------------------------ Salto de Convergencia (B21)
/**
 * Salto de Convergencia (CAMPANA B21 §1): Zygarde adopta a propósito el 10 %, el jugador monta y la red lo
 * lleva al destino entre estelas, espacio estirado y destellos (20–30 s). Desde la segunda vez se puede
 * saltar con A/B (flag zyg_jump_seen). Los diálogos previos son del guion del bloque.
 * opts: { to, x, y, dir = 8, frames = 1500, skippable }
 */
export async function convergenceJump(ctx, { to, x, y, dir = 8, frames = 1500, skippable = null } = {}) {
  if (!to) throw new Error('convergenceJump: falta el mapa de destino "to"');
  const st = ctx.state;
  const world = ctx.world;
  const canSkip = skippable ?? st.flag('zyg_jump_seen');
  setForm(st, '10');
  ctx.scene?.refreshFollower?.();
  mountState(world).forced = true;
  setRiding(world, true);
  ctx.se('PRSFX- Teleport');
  await ctx.flash([...GREEN], 16, 160);
  const field = ctx.scene?.zygarde;
  if (field?.playJump) await field.playJump({ frames, skippable: canSkip });
  else await ctx.wait(Math.min(frames, 120));
  st.setFlag('zyg_jump_seen', true);
  await ctx.fade('out', 24, [235, 255, 225]);
  field?.stopJump?.();
  await ctx.warp(to, x, y, dir, { fade: false });
  mountState(world).forced = false;
  await ctx.fade('in', 30);
}

// ------------------------------------------------------------ Anclaje espacial (postgame, X16)
/** ¿Hay Anclaje disponible aquí? Capacidad 'anchor' y mapa con `anchorZone: true`. */
export function canAnchor(state, mapDef) {
  return Boolean(state?.zygardeAbility?.('anchor') && mapDef?.anchorZone === true);
}

/**
 * Anclaje espacial: fija una orientación inestable. Solo API (postgame): el guion del mapa decide qué cambia
 * en `onAnchor(ctx)`. Devuelve true si se ancló.
 */
export async function spatialAnchor(ctx, { onAnchor = null } = {}) {
  if (!canAnchor(ctx.state, ctx.world.current?.def)) { await ctx.say(FIELD_TEXT.cantAnchor); return false; }
  const p = ctx.player;
  ctx.se('PRSFX- Origin Pulse');
  const fx = safeEffect(ctx, 'zygardeHexBurst', { x: p.x, y: p.y, mode: 'in', count: 30, spread: 4 });
  await ctx.tone([-30, 20, -30, 40], 20);
  ctx.shake(4, 4, 30);
  await ctx.wait(30);
  if (typeof onAnchor === 'function') await onAnchor(ctx);
  await ctx.tone([0, 0, 0, 0], 30);
  fx?.remove?.(20);
  await ctx.say(FIELD_TEXT.anchorDone);
  return true;
}
