// Trayectoria temporal: los seguidores caminan por las casillas recorridas, incluso al girar.
import { dx, dy } from './gameMap.js';
import { followerBounds, boundsSeparated, FOLLOWER_MIN_TILES } from './followerSpacing.js';

const formations = new WeakMap();
const followerFormations = new WeakMap();
const point = ch => ({ x: ch.x, y: ch.y });
const same = (a, b) => a?.x === b?.x && a?.y === b?.y;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const hasActiveFollowers = followers => followers.some(f => f && !f.hidden && f.characterName);
const active = state => state.followers.filter(f => !f.hidden && f.characterName);

function facing(from, to, fallback = 2) {
  const x = to.x - from.x, y = to.y - from.y;
  if (!x && !y) return fallback;
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 6 : 4) : (y > 0 ? 2 : 8);
}

function tileAt(state, x, y) {
  const world = state.leader.world;
  if (state.leader.map.valid(x, y)) return { map: state.leader.map, x, y };
  const hit = world?.entryAt?.(x, y);
  return hit && { map: hit.entry.map, x: hit.x, y: hit.y };
}

function walkable(state, p) {
  const tile = tileAt(state, p.x, p.y);
  return Boolean(tile && tile.map.passable(tile.x, tile.y, 0, state.leader, state.leader.world?.env?.() || {})
    && !tile.map.terrainTagAt(tile.x, tile.y).ledge);
}

function seed(state, origin) {
  const nodes = [origin], back = 10 - state.leader.direction;
  let previous = origin;
  for (let i = 0; i < 24; i++) {
    const p = { x: previous.x + dx(back), y: previous.y + dy(back) };
    if (!walkable(state, p)) break;
    const tile = tileAt(state, p.x, p.y);
    if (tile.map.events?.some(ev => !ev.erased && ev.page && !ev.through && !ev.transparent && ev.at(tile.x, tile.y))) break;
    const source = tileAt(state, previous.x, previous.y), env = state.leader.world?.env?.() || {};
    if (!source.map.passable(source.x, source.y, back, state.leader, env)
      || !tile.map.passable(tile.x, tile.y, 10 - back, state.leader, env)) break;
    nodes.unshift(p); previous = p;
  }
  return nodes;
}

function prepare(leader, followers, origin = point(leader)) {
  const state = { leader, followers, nodes: [], cursors: new Map(), goals: new Map(), controlled: new Map(), map: leader.map };
  state.nodes = seed(state, origin);
  formations.set(leader, state);
  for (const f of followers) followerFormations.set(f, state);
  return state;
}

function travelled(nodes, from, to) {
  let result = 0;
  for (let i = from; i > to; i--) result += distance(nodes[i], nodes[i - 1]);
  return result;
}

function plan(state) {
  const nodes = state.nodes, ahead = [{ ch: state.leader, pos: point(state.leader) }];
  let previousIndex = nodes.length - 1;
  state.goals = new Map();
  for (const f of active(state)) {
    if (f.moveRouteForcing) {
      ahead.push({ ch: f, pos: point(f) });
      continue;
    }
    let found = null;
    for (let i = previousIndex - 1; i >= 0; i--) {
      if (travelled(nodes, previousIndex, i) < FOLLOWER_MIN_TILES || !walkable(state, nodes[i])) continue;
      const pos = { ...nodes[i], dir: facing(nodes[i], ahead.at(-1).pos, f.direction) };
      const b = followerBounds(f, pos);
      if (!ahead.every(a => boundsSeparated(b, followerBounds(a.ch, a.pos)))) continue;
      found = { index: i, pos }; break;
    }
    state.goals.set(f, found);
    if (!found) { previousIndex = 0; continue; }
    previousIndex = found.index;
    ahead.push({ ch: f, pos: found.pos });
  }
}

function locate(state, f) {
  const cursor = state.cursors.get(f);
  if (cursor !== undefined && same(state.nodes[cursor], f)) return cursor;
  for (let i = state.nodes.length - 1; i >= 0; i--) if (same(state.nodes[i], f)) return i;
  return null;
}

function record(state) {
  const leader = state.leader, last = state.nodes.at(-1), current = point(leader);
  if (same(last, current)) return;
  if (distance(last, current) > 2 || (!leader.busy() && state.map !== leader.map)) return;
  state.nodes.push(current);
  state.map = leader.map;
  const cursors = active(state).map(f => locate(state, f)).filter(i => i !== null);
  const trim = Math.max(0, Math.min(state.nodes.length - 32, ...cursors.map(i => i - 8)));
  if (trim > 0) {
    state.nodes = state.nodes.slice(trim);
    for (const [f, i] of state.cursors) state.cursors.set(f, i - trim);
  }
}

export function refreshFormationVisibility(state) {
  if (!state) return;
  const ahead = [state.leader];
  for (const f of active(state)) {
    if (!f.moveRouteForcing) {
      f.transparent = !walkable(state, point(f))
        || !ahead.every(ch => boundsSeparated(followerBounds(f), followerBounds(ch), 0));
    }
    if (!f.transparent) ahead.push(f);
  }
}

export function placeFollowerFormation(leader, followers) {
  if (!hasActiveFollowers(followers)) return;
  const state = prepare(leader, followers);
  plan(state);
  for (const f of active(state)) {
    if (f.moveRouteForcing) continue;
    const goal = state.goals.get(f);
    const p = goal?.pos || point(leader);
    f.map = leader.map;
    f.moveTo(p.x, p.y);
    f.direction = goal?.pos.dir || leader.direction;
    state.cursors.set(f, goal?.index ?? state.nodes.length - 1);
  }
  refreshFormationVisibility(state);
  return state;
}

/** Registrar el paso/salto del jugador; las actualizaciones continúan la formación al pararse. */
export function followFollowerFormation(leader, followers) {
  if (!hasActiveFollowers(followers)) return;
  let state = formations.get(leader);
  if (!state) {
    const origin = leader.jumping() ? { x: leader.jumpInitialX, y: leader.jumpInitialY }
      : { x: leader.moveInitialX ?? leader.x, y: leader.moveInitialY ?? leader.y };
    state = prepare(leader, followers, origin);
  }
  state.followers = followers;
  for (const f of followers) followerFormations.set(f, state);
  advanceFollowerFormation(state);
}

export function advanceFollowerFormation(state) {
  if (!state || !state.leader.map) return;
  record(state); plan(state);
  for (const f of active(state)) {
    if (f.moveRouteForcing || f.busy()) continue;
    const cursor = locate(state, f), goal = state.goals.get(f), controlled = state.controlled.get(f);
    if (controlled && cursor !== null) state.controlled.delete(f);
    if (controlled && cursor === null) {
      const next = controlled.at(-2);
      if (next && walkable(state, next) && distance(f, next) <= 2) {
        f.followTo(next.x, next.y, state.leader);
        controlled.pop();
      }
      continue;
    }
    if (cursor === null || !goal) continue;
    state.cursors.set(f, cursor);
    if (cursor === goal.index) { f.direction = goal.pos.dir; continue; }
    const nextIndex = cursor + Math.sign(goal.index - cursor), next = state.nodes[nextIndex];
    if (!next || !walkable(state, next)) continue;
    const a = point(f), length = distance(a, next);
    if (length > 2 || length === 0) { state.cursors.set(f, nextIndex); continue; }
    f.followTo(next.x, next.y, state.leader);
    state.cursors.set(f, nextIndex);
  }
  refreshFormationVisibility(state);
}

export function followerFormation(follower) { return followerFormations.get(follower); }

/** Observar una ruta de escena sin tocar su movimiento; permite reenganchar al terminar fuera de las migas. */
export function recordControlledFollower(follower) {
  const state = followerFormations.get(follower);
  if (!state || !follower.moveRouteForcing) return;
  let path = state.controlled.get(follower);
  if (!path) {
    const origin = follower.jumping() ? { x: follower.jumpInitialX, y: follower.jumpInitialY }
      : follower.moving() ? { x: follower.moveInitialX, y: follower.moveInitialY } : point(follower);
    path = [origin]; state.controlled.set(follower, path);
  }
  if (!same(path.at(-1), follower)) path.push(point(follower));
}

/** World desplaza primero al jugador y luego a los seguidores al cruzar una costura. */
export function shiftFollowerFormation(follower, ox, oy) {
  const state = followerFormations.get(follower), head = state?.nodes.at(-1);
  if (!state || !same({ x: head.x + ox, y: head.y + oy }, state.leader)) return;
  state.nodes = state.nodes.map(p => ({ ...p, x: p.x + ox, y: p.y + oy }));
  for (const [f, path] of state.controlled) state.controlled.set(f, path.map(p => ({ ...p, x: p.x + ox, y: p.y + oy })));
}
