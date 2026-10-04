// Datos narrativos transversales (content/story): 15 arcos de pistas, 18 Tablillas (sin BLANKPLATE),
// Crónica I–XV, 10 versos + confirmación, 10 Fragmentos y redes de transporte. docs/TABLILLAS.md, CAMPANA §1.7, §3.0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLUE_ARCS, clueArc, clueArcForTablet, ABILITY_NAMES, MAX_ACTIVE_CLUES } from '../game/src/content/story/clues.js';
import {
  TABLETS, CAMPAIGN_TABLETS, ARCEUS_TABLETS, RETIRED_TABLET, tabletById, tabletForArc,
} from '../game/src/content/story/tablets.js';
import { CHRONICLE, ARCEUS_CHRONICLE, chronicleFor } from '../game/src/content/story/chronicle.js';
import {
  VERSES, CONFIRMATION, unownText, partialTranslation, verseTranslation, numeral,
} from '../game/src/content/story/verses.js';
import { FRAGMENTS, fragmentFor, fragmentId, pillarFlag } from '../game/src/content/story/fragments.js';
import { CRISIS_PHASES } from '../game/src/content/story/crisis.js';
import { TRAIN, FERRY } from '../game/src/world/transport.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const ITEMS = readJson('game/data/items.json');
const AXIS_ITEMS = readJson('game/data/items_axis.json');
const TYPES = readJson('game/data/types.json');
const ANIL_ITEMS_DIR = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Items');
const arcIds = Array.from({ length: 15 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`);

test('hay exactamente 15 arcos de pistas T01–T15, en orden y sin repetir', () => {
  assert.deepEqual(CLUE_ARCS.map((a) => a.id), arcIds);
  assert.equal(MAX_ACTIVE_CLUES, 3);
});

test('cada arco tiene pista inicial y segunda, zona, apertura, disponibilidad y cierre coherentes', () => {
  for (const a of CLUE_ARCS) {
    assert.equal(a.steps.length, 2, `${a.id}: dos pistas`);
    for (const s of a.steps) {
      assert.ok(s.text && s.text.length > 10, `${a.id}: texto de pista`);
      assert.ok(s.label && s.by, `${a.id}: etiqueta y fuente`);
    }
    assert.match(a.zone, /^[a-z0-9_]+$/, `${a.id}: zona = id de mapa`);
    assert.ok(a.place && a.title, `${a.id}: lugar y título`);
    assert.match(a.opens.block, /^B\d\d$/, `${a.id}: bloque de apertura`);
    assert.ok(a.opens.by, `${a.id}: quién la abre`);
    assert.match(a.available.flag, /^p([1-9]|10)_restored$/, `${a.id}: disponible tras un Pilar`);
    for (const k of a.abilities) assert.ok(ABILITY_NAMES[k], `${a.id}: capacidad desconocida ${k}`);
    assert.equal(a.closes.tablet, a.tablet, `${a.id}: se cierra con su Tablilla`);
    const t = tabletById(a.tablet);
    assert.ok(t, `${a.id}: Tablilla ${a.tablet}`);
    assert.equal(t.arc, a.id, `${a.id}: la Tablilla apunta al arco`);
    assert.equal(clueArcForTablet(a.tablet), a);
    assert.equal(tabletForArc(a.id), t);
  }
});

test('la disponibilidad de los arcos nunca retrocede y las de Vuelo/Reconstrucción son posteriores a P8', () => {
  let prev = 0;
  for (const a of CLUE_ARCS) {
    const n = Number(a.available.flag.match(/^p(\d+)_/)[1]);
    assert.ok(n >= prev, `${a.id}: disponible tras P${n} (antes P${prev})`);
    prev = n;
    if (a.abilities.includes('fly') || a.abilities.includes('rebuild')) assert.ok(n >= 8, `${a.id}: Vuelo/Reconstrucción tras P8`);
  }
});

test('solo T11 y T12 esperan en cola a Nadar; T08 se abre tras T06', () => {
  const queued = CLUE_ARCS.filter((a) => a.queueUntil).map((a) => a.id);
  assert.deepEqual(queued, ['T11', 'T12']);
  for (const id of queued) assert.deepEqual(clueArc(id).queueUntil, { ability: 'swim' });
  assert.equal(clueArc('T08').after, 'T06');
});

test('18 Tablillas: 17 tablas de tipo + Legendaria, sin BLANKPLATE, todas en items.json', () => {
  assert.equal(TABLETS.length, 18);
  const ids = TABLETS.map((t) => t.id);
  assert.equal(new Set(ids).size, 18);
  assert.ok(!ids.includes(RETIRED_TABLET), 'BLANKPLATE no se usa en Axis (D12)');
  assert.equal(tabletById(RETIRED_TABLET), null);
  for (const t of TABLETS) {
    assert.ok(ITEMS[t.id], `${t.id} existe en items.json`);
    assert.ok(t.name.startsWith('Tabla '), `${t.id}: nombre`);
    assert.ok(TYPES[t.type], `${t.id}: tipo ${t.type}`);
  }
  const typed = TABLETS.filter((t) => t.id !== 'LEGENDPLATE').map((t) => t.type);
  assert.equal(new Set(typed).size, 17, 'una tabla por tipo');
  assert.ok(!typed.includes('NORMAL'), 'no hay «Tabla Normal»');
  const allTypes = Object.keys(TYPES).filter((k) => !TYPES[k].pseudo && k !== 'NORMAL');
  assert.deepEqual([...typed].sort(), allTypes.sort(), 'cubren los 17 tipos no Normal');
});

test('las Tablillas tienen icono en Graphics/Items de Añil', (t) => {
  if (!fs.existsSync(ANIL_ITEMS_DIR)) { t.skip('recursos de Añil no disponibles'); return; }
  for (const tb of TABLETS) assert.ok(fs.existsSync(path.join(ANIL_ITEMS_DIR, `${tb.id}.png`)), `icono ${tb.id}`);
});

test('15 de campaña (T01–T15, Crónica I–XV) y las tres de Arceus en orden de fases', () => {
  assert.deepEqual(CAMPAIGN_TABLETS.map((t) => t.arc), arcIds);
  assert.deepEqual(CAMPAIGN_TABLETS.map((t) => t.chronicle), Array.from({ length: 15 }, (_, i) => i + 1));
  assert.deepEqual(ARCEUS_TABLETS.map((t) => [t.id, t.arceusPhase]), [
    ['EARTHPLATE', 'Tierra'], ['SPOOKYPLATE', 'Fantasma'], ['LEGENDPLATE', 'Normal'],
  ]);
});

test('la Crónica: I–XV enlazadas a su Tablilla y las tres frases de Arceus', () => {
  assert.equal(CHRONICLE.length, 15);
  CHRONICLE.forEach((e, i) => {
    assert.equal(e.numeral, numeral(i + 1));
    const t = tabletById(e.tablet);
    assert.equal(t.chronicle, i + 1, `${e.numeral} ↔ ${e.tablet}`);
    assert.ok(e.text.length > 20);
    assert.equal(chronicleFor(e.tablet), e);
  });
  assert.deepEqual(ARCEUS_CHRONICLE.map((e) => e.text), ['Lo que sostiene.', 'Lo que acecha.', 'Lo que es.']);
  assert.match(CHRONICLE[8].text, /Unos dijeron que fue su mano; otros, que fue la corona/, 'IX ambigua');
});

test('10 versos, uno por Pilar, con lector; confirmación de Arceus', () => {
  assert.equal(VERSES.length, 10);
  VERSES.forEach((v, i) => {
    assert.equal(v.n, i + 1);
    assert.equal(v.pillar, i + 1);
    assert.ok(v.text && v.readBy, `verso ${v.numeral}`);
    assert.ok(fragmentFor(v.n), `Pilar del verso ${v.numeral}`);
  });
  assert.match(VERSES[0].text, /cien y cinco pedazos/);
  assert.match(CONFIRMATION.text, /Eres aquel del que hablaban las piedras/);
});

test('escritura Unown: solo A–Z, espacio, ? y !', () => {
  for (const v of VERSES) assert.match(unownText(v.text), /^[A-Z?! ]+$/, v.numeral);
  assert.equal(unownText('¿Árbol, niño?'), 'ARBOL NINO?');
});

test('traducción parcial: oculta algo en cada verso, conserva lo citado y es determinista', () => {
  for (const v of VERSES) {
    const partial = verseTranslation(v, false);
    assert.notEqual(partial, v.text, `verso ${v.numeral} tiene huecos`);
    assert.match(partial, /···/);
    for (const k of v.keep) assert.ok(partial.toLowerCase().includes(k), `${v.numeral} conserva «${k}»`);
    assert.equal(verseTranslation(v, true), v.text);
    assert.equal(partial, verseTranslation(v, false));
  }
  assert.equal(partialTranslation('y la tierra, su peso.', { keep: ['tierra'] }), 'y la tierra, su ···.');
});

test('10 Fragmentos Azur (F01–F10) con flag pN_restored y tinte', () => {
  assert.equal(FRAGMENTS.length, 10);
  FRAGMENTS.forEach((f, i) => {
    assert.equal(f.id, fragmentId(i + 1));
    assert.equal(f.flag, pillarFlag(i + 1));
    assert.equal(f.tint.length, 3);
    assert.ok(f.name.startsWith('Pilar'));
  });
  for (const id of ['AZUREFRAGMENT', 'AZUREFLUTE', 'CLUENOTEBOOK', 'GLYPHKEY']) assert.ok(AXIS_ITEMS[id], id);
});

test('fases de crisis 0–4 y el cielo restablecido', () => {
  assert.deepEqual(CRISIS_PHASES.map((p) => p.phase), [0, 1, 2, 3, 4, 5]);
});

test('transporte: tren con 5 estaciones tras P4 y ferris Nexo ↔ Caleta / Boreal tras P7', () => {
  assert.equal(TRAIN.unlockFlag, 'p4_restored');
  assert.deepEqual(TRAIN.stops.map((s) => s.id), ['caudal', 'brontia', 'estrato', 'lumina', 'nexo']);
  assert.equal(FERRY.unlockFlag, 'p7_restored');
  const ids = FERRY.stops.map((s) => s.id);
  for (const [a, b] of FERRY.routes) assert.ok(ids.includes(a) && ids.includes(b));
  assert.deepEqual(FERRY.routes.filter((r) => r.includes('caleta') || r.includes('boreal')), [['nexo', 'caleta'], ['nexo', 'boreal']]);
  for (const id of ['almenara', 'petalo', 'estandarte']) {
    assert.ok(FERRY.routes.some((r) => r.includes('nexo') && r.includes(id)), id);
    assert.ok(FERRY.stops.find((s) => s.id === id).requiredFlags.includes('b21_fin'), id);
  }
});
