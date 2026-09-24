// Genera docs/battle_coverage.md: cobertura del motor de combate (códigos de función de movimientos,
// habilidades, objetos equipados, objetos de mochila y Poké Balls), priorizando lo aprendible en Axis.
// Uso: node tools/battle_coverage.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  implementedCodes, implementedAbilities, PASSIVE_ABILITIES, implementedHeldItems, implementedBagItems, IMPLEMENTED_BALLS,
} from '../game/src/battle/core/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'data', f), 'utf8'));
const species = load('species.json');
const moves = load('moves.json');
const abilities = load('abilities.json');
const items = load('items.json');
const dex = load('dex_axis.json');

// ---------------------------------------------------------------- inventario Axis
const axisIds = dex.entries.map((e) => e.id).filter((id) => species[id]);
const axisMoves = new Set();
const axisAbilities = new Set();
for (const id of axisIds) {
  const sp = species[id];
  for (const s of [sp, ...Object.values(sp.forms || {})]) {
    for (const m of s.moves || []) axisMoves.add(m[1]);
    for (const m of s.tutorMoves || []) axisMoves.add(m);
    for (const m of s.eggMoves || []) axisMoves.add(m);
    for (const a of [...(s.abilities || []), ...(s.hiddenAbilities || [])]) axisAbilities.add(a);
  }
}

// ---------------------------------------------------------------- movimientos
const implemented = new Set(implementedCodes());
const byCode = new Map();
for (const m of Object.values(moves)) {
  const code = String(m.functionCode || 'None').split(',')[0].trim();
  if (!byCode.has(code)) byCode.set(code, { moves: [], axis: [] });
  byCode.get(code).moves.push(m);
  if (axisMoves.has(m.id)) byCode.get(code).axis.push(m);
}
const codes = [...byCode.keys()].sort();
const pendingCodes = codes.filter((c) => !implemented.has(c));
const axisMoveList = Object.values(moves).filter((m) => axisMoves.has(m.id));
const axisMovesCovered = axisMoveList.filter((m) => implemented.has(String(m.functionCode || 'None').split(',')[0].trim()));

// ---------------------------------------------------------------- habilidades
const abilImpl = new Set([...implementedAbilities(), ...PASSIVE_ABILITIES]);
const abilIds = Object.keys(abilities).sort();
const pendingAbilities = abilIds.filter((a) => !abilImpl.has(a));
const axisAbilPending = pendingAbilities.filter((a) => axisAbilities.has(a));

// ---------------------------------------------------------------- objetos
const held = new Set(implementedHeldItems());
const bag = new Set(implementedBagItems());
const balls = new Set(IMPLEMENTED_BALLS);
const ballItems = Object.values(items).filter((i) => (i.flags || []).includes('PokeBall'));
const battleUseItems = Object.values(items).filter((i) => i.battleUse && !(i.flags || []).includes('PokeBall'));

const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)} %` : '—');
const name = (m) => m.name || m.id;
const lines = [];
lines.push('# Cobertura del motor de combate');
lines.push('');
lines.push('> Generado por `node tools/battle_coverage.mjs` a partir de `game/data/*.json` y de los registros de');
lines.push('> `game/src/battle/core`. No editar a mano: volver a generar tras añadir efectos.');
lines.push('');
lines.push('## Resumen');
lines.push('');
lines.push('| Área | Implementado | Total | Cobertura |');
lines.push('|---|---:|---:|---:|');
lines.push(`| Códigos de función de movimientos (moves.json) | ${codes.length - pendingCodes.length} | ${codes.length} | ${pct(codes.length - pendingCodes.length, codes.length)} |`);
lines.push(`| Movimientos aprendibles por el inventario Axis | ${axisMovesCovered.length} | ${axisMoveList.length} | ${pct(axisMovesCovered.length, axisMoveList.length)} |`);
lines.push(`| Habilidades (abilities.json) | ${abilIds.length - pendingAbilities.length} | ${abilIds.length} | ${pct(abilIds.length - pendingAbilities.length, abilIds.length)} |`);
lines.push(`| Habilidades de especies Axis | ${axisAbilities.size - axisAbilPending.length} | ${axisAbilities.size} | ${pct(axisAbilities.size - axisAbilPending.length, axisAbilities.size)} |`);
lines.push(`| Objetos equipados con efecto (manejadores) | ${held.size} | — | — |`);
lines.push(`| Objetos de mochila usables en combate | ${battleUseItems.filter((i) => bag.has(i.id)).length} | ${battleUseItems.length} | ${pct(battleUseItems.filter((i) => bag.has(i.id)).length, battleUseItems.length)} |`);
lines.push(`| Poké Balls con modificador | ${ballItems.filter((i) => balls.has(i.id)).length} | ${ballItems.length} | ${pct(ballItems.filter((i) => balls.has(i.id)).length, ballItems.length)} |`);
lines.push('');
lines.push('Los códigos sin clase propia usan un respaldo seguro (`UnimplementedMove`): los movimientos de daño');
lines.push('golpean sin efecto adicional y los de estado fallan con «¡Pero ha fallado!». Los códigos usados en');
lines.push('combate sin implementar quedan registrados en `unimplementedUsed` (exportado por `battle/core/index.js`).');
lines.push('');
lines.push('## Códigos de función pendientes');
lines.push('');
if (pendingCodes.length === 0) {
  lines.push('Ninguno: todos los códigos presentes en `moves.json` tienen clase.');
} else {
  lines.push('| Código | Movimientos (Axis primero) |');
  lines.push('|---|---|');
  for (const c of pendingCodes.sort((a, b) => byCode.get(b).axis.length - byCode.get(a).axis.length)) {
    const e = byCode.get(c);
    lines.push(`| \`${c}\` | ${[...e.axis, ...e.moves.filter((m) => !e.axis.includes(m))].slice(0, 6).map(name).join(', ')} |`);
  }
}
lines.push('');
lines.push('## Habilidades pendientes');
lines.push('');
if (pendingAbilities.length === 0) {
  lines.push('Ninguna.');
} else {
  lines.push('| Habilidad | Nombre | ¿Especie Axis? | Motivo |');
  lines.push('|---|---|---|---|');
  const reasons = {
    TERASHIFT: 'Depende de la teracristalización, que el motor no implementa.',
  };
  for (const a of pendingAbilities) {
    lines.push(`| \`${a}\` | ${abilities[a].name} | ${axisAbilities.has(a) ? 'sí' : 'no'} | ${reasons[a] || 'Sin efecto implementado todavía.'} |`);
  }
}
lines.push('');
lines.push('## Objetos de mochila sin efecto en combate');
lines.push('');
const bagPending = battleUseItems.filter((i) => !bag.has(i.id));
lines.push(bagPending.length ? bagPending.map((i) => `\`${i.id}\` (${i.name})`).join(', ') : 'Ninguno.');
if (bagPending.some((i) => i.id === 'CENIZASSAGRADAS')) {
  lines.push('');
  lines.push('`CENIZASSAGRADAS` tiene `battleUse` en los datos, pero Añil no le da manejador de combate (solo de campo).');
}
lines.push('');
lines.push('## Poké Balls sin modificador propio');
lines.push('');
const ballPending = ballItems.filter((i) => !balls.has(i.id));
lines.push(ballPending.length ? ballPending.map((i) => `\`${i.id}\` (${i.name})`).join(', ') : 'Ninguna (todas usan su ratio).');
lines.push('');
lines.push('## Códigos implementados');
lines.push('');
lines.push('| Código | Nº movimientos | Aprendibles en Axis | Ejemplos |');
lines.push('|---|---:|---:|---|');
for (const c of codes.filter((x) => implemented.has(x))) {
  const e = byCode.get(c);
  lines.push(`| \`${c}\` | ${e.moves.length} | ${e.axis.length} | ${e.moves.slice(0, 3).map(name).join(', ')} |`);
}
lines.push('');
lines.push('## Objetos equipados con manejador');
lines.push('');
lines.push([...held].sort().map((i) => `\`${i}\``).join(', '));
lines.push('');

const out = path.join(ROOT, 'docs', 'battle_coverage.md');
fs.writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
console.log(`Escrito ${out}: ${codes.length - pendingCodes.length}/${codes.length} códigos, ` +
  `${abilIds.length - pendingAbilities.length}/${abilIds.length} habilidades.`);
