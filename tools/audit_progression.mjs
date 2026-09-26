// Auditoría de fugas de progresión (docs/DECISIONES.md «DECIDIDO (autor, 25-09-2026)», fugas de progresión).
// Para cada etapa de la historia (el estado de entrada de cada bloque B01–B21 de game/src/dev/devBlocks.js: flags de
// salida de los bloques anteriores y capacidades de Zygarde de ese momento) recorre el grafo de mapas desde la casilla
// de la etapa (tools/lib/progression_reach.mjs) y lista los mapas alcanzables cuyos entrenadores (con página de
// combate activa y al alcance de la vista) o salvajes (hierba, cueva, agua si se nada, pesca con la caña que se lleva)
// superan en más de MARGIN niveles el nivel esperado de la etapa (el nivel más alto del equipo de referencia).
//
// Uso:   node tools/audit_progression.mjs [--only B03] [--margin 8] [--json]
// Test:  tests/progression_audit.test.mjs (sin fugas; los combates de guion no son eventos `trainer` y no cuentan).
import { pathToFileURL } from 'node:url';
import { BLOCK_STARTS } from '../game/src/dev/devBlocks.js';
import { TRAINERS } from '../game/src/content/trainers/index.js';
import { EncounterSystem, zoneEncountersAt, normalizeEntry } from '../game/src/world/encounters.js';
import { STARTER_LEVEL } from '../game/src/content/events/b01_town_common.js';
import { stageReach, DV } from './lib/progression_reach.mjs';

/** Margen de niveles sobre el esperado a partir del cual se considera fuga. */
export const MARGIN = 8;
const RODS = Object.freeze({ OLDROD: 'fish_old', GOODROD: 'fish_good', SUPERROD: 'fish_super' });
const HOURS = Object.freeze([12, 0]); // día y noche
const key = (x, y) => `${x},${y}`;

/** Nivel esperado de una etapa: el más alto del equipo de referencia (B01: el inicial). */
export function expectedLevel(preset) {
  const levels = (preset.party || []).map(([, lv]) => lv);
  return levels.length ? Math.max(...levels) : STARTER_LEVEL;
}

// ─── Entrenadores ─────────────────────────────────────────────────────────────────────────────────────────────

function trainerParty(def, state) {
  const t = def.trainer ? TRAINERS[def.trainer] : null;
  const party = t ? (typeof t.party === 'function' ? t.party(state) : t.party) : def.party;
  return Array.isArray(party) ? party : [];
}

/** ¿Llega el jugador a la vista del entrenador o a hablarle? */
function trainerInReach(ctx, ev) {
  const near = Object.values(DV).some(([dx, dy]) => ctx.seen.has(key(ev.x + dx, ev.y + dy)));
  if (near) return true;
  const [dx, dy] = DV[ev.direction] || [0, 0];
  for (let k = 1; k <= (ev.sight || 0); k++) if (ctx.seen.has(key(ev.x + dx * k, ev.y + dy * k))) return true;
  return false;
}

function trainerFindings(ctx, state) {
  const out = [];
  for (const ev of ctx.w.events) {
    if (ev.def?.type !== 'trainer' || !ev.page || ev.trigger !== 'eventTouch') continue;
    if (!trainerInReach(ctx, ev)) continue;
    const party = trainerParty(ev.def, state);
    if (!party.length) continue;
    const level = Math.max(...party.map((p) => p.level || 0));
    out.push({ kind: 'entrenador', what: ev.def.trainer || ev.id, level });
  }
  return out;
}

// ─── Salvajes ─────────────────────────────────────────────────────────────────────────────────────────────────

const tableMax = (sys, type) => (type && sys.tables[type]?.length ? Math.max(...sys.tables[type].map((e) => e.max)) : 0);

function wildFindings(ctx, state) {
  const mapSys = new EncounterSystem(ctx.def.encounters || {});
  const zones = (ctx.def.encounterZones || []).map((z) => ({ ...z, system: new EncounterSystem(z.encounters || {}) }));
  const best = new Map(); // tipo → nivel
  const note = (type, level) => { if (level > (best.get(type) || 0)) best.set(type, level); };
  for (const k of ctx.seen) {
    const [x, y] = k.split(',').map(Number);
    const sys = zoneEncountersAt(zones, x, y) || mapSys;
    const surfing = ctx.surf.has(k);
    const terrain = ctx.map.terrainTagAt(x, y);
    for (const hour of HOURS) {
      const type = sys.encounterType({ terrain, surfing, hour });
      if (type) note(type.replace(/(Day|Night|Morning|Afternoon|Evening)$/, ''), tableMax(sys, type));
    }
  }
  const out = [...best].filter(([, lv]) => lv > 0).map(([type, level]) => ({ kind: 'salvaje', what: type, level }));
  const fishing = fishFindings(ctx, state, [mapSys, ...zones.map((z) => z.system)]);
  return [...out, ...fishing];
}

/** Pesca: tablas de las cañas que se llevan, si hay orilla de agua pescable alcanzable. */
function fishFindings(ctx, state, systems) {
  const shore = [...ctx.seen].some((k) => {
    const [x, y] = k.split(',').map(Number);
    return Object.values(DV).some(([dx, dy]) => ctx.map.valid(x + dx, y + dy) && ctx.map.terrainTagAt(x + dx, y + dy).canFish);
  });
  if (!shore) return [];
  const out = [];
  for (const [rod, table] of Object.entries(RODS)) {
    if (!state.hasKeyItem(rod)) continue;
    let level = 0;
    for (const sys of systems) {
      for (const [t, list] of Object.entries(sys.tables)) if (t.startsWith(table)) level = Math.max(level, ...list.map((e) => normalizeEntry(e).max));
    }
    if (level) out.push({ kind: 'pesca', what: table, level });
  }
  return out;
}

// ─── Etapas ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Auditoría de una etapa → { id, expected, limit, reached, leaks: [{ map, via, kind, what, level }], errors }. */
export async function auditStage(preset, { margin = MARGIN } = {}) {
  const expected = expectedLevel(preset);
  const limit = expected + margin;
  const { state, maps, errors, from } = await stageReach(preset);
  const leaks = [];
  for (const [id, ctx] of maps) {
    if (!ctx.seen.size) continue;
    for (const f of [...trainerFindings(ctx, state), ...wildFindings(ctx, state)]) {
      if (f.level > limit) leaks.push({ map: id, via: from.get(id) || '?', ...f });
    }
  }
  leaks.sort((a, b) => b.level - a.level || a.map.localeCompare(b.map));
  const reached = [...maps.values()].filter((c) => c.seen.size).map((c) => c.id).sort();
  return { id: preset.id, expected, limit, reached, leaks, errors: [...errors] };
}

export async function auditAll({ only = null, margin = MARGIN } = {}) {
  const stages = BLOCK_STARTS.filter((b) => !only || b.id.toUpperCase() === only.toUpperCase());
  const out = [];
  for (const preset of stages) out.push(await auditStage(preset, { margin }));
  return out;
}

function printReport(results) {
  let total = 0;
  for (const r of results) {
    const head = `${r.id} · nivel esperado ${r.expected} (límite ${r.limit}) · ${r.reached.length} mapas alcanzables`;
    console.log(head);
    for (const [id, msg] of r.errors) console.log(`   (no se pudo construir ${id}: ${msg})`);
    const byMap = new Map();
    for (const l of r.leaks) byMap.set(l.map, [...(byMap.get(l.map) || []), l]);
    for (const [map, list] of byMap) {
      total += 1;
      const items = list.map((l) => `${l.kind} ${l.what} nv ${l.level}`).join(', ');
      console.log(`   FUGA ${map} (desde ${list[0].via}): ${items}`);
    }
  }
  console.log(total ? `\n${total} fuga(s) (mapa × etapa).` : '\nSin fugas.');
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const results = await auditAll({ only: opt('--only'), margin: Number(opt('--margin') ?? MARGIN) });
  if (args.includes('--json')) console.log(JSON.stringify(results, null, 1));
  else printReport(results);
  if (args.includes('--reach')) for (const r of results) console.log(`${r.id}: ${r.reached.join(' ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
