// Ilustración aprobada del mapa regional de Axis (tools/pixel_map.mjs) y su JSON de coordenadas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img } from '../tools/pixel.mjs';
import { buildRegionJson } from '../tools/pixel_map.mjs';
import { PLACES, PATHS, SEA_PATHS, cellCenter, coldAt } from '../tools/pixel_map_data.mjs';

const UI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'game', 'assets', 'ui');
const json = JSON.parse(fs.readFileSync(path.join(UI, 'region_map.json'), 'utf8'));
const base = Img.load(path.join(UI, 'region_map.png')); // solo relieve (la pantalla dibuja los marcadores)
const full = Img.load(path.join(UI, 'region_map_marcado.png'));
const WATER = ['#3A74C4', '#4A8CD6', '#74B4E6', '#A6D6F2', '#5A9ADE', '#3E6CB0', '#7ED6CE', '#5AA8EA', '#3A6CB0'];
const hex = (p) => `#${p.slice(0, 3).map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')}`;

test('mapa regional: imágenes de 480×320 ampliadas ×2 exacto y JSON al día con el generador', () => {
  for (const img of [full, base]) {
    assert.deepEqual([img.w, img.h], [480, 320]);
    for (let y = 0; y < img.h; y += 2) for (let x = 0; x < img.w; x += 2) {
      assert.equal(img.get(x + 1, y + 1).join(), img.get(x, y).join(), `bloque 2×2 roto en ${x},${y}`);
    }
  }
  assert.deepEqual(json, JSON.parse(JSON.stringify(buildRegionJson())), 'ejecuta node tools/pixel_map.mjs');
  assert.equal(json.cell, 16);
  assert.equal(json.provisional, false);
  assert.equal(json.decision, 'D30 · X02');
  assert.equal(json.approvedOn, '2026-10-04');
  assert.equal(json.approvedBy, 'autor');
});

test('mapa regional: cada lugar está en el centro de su casilla y no hay casillas repetidas', () => {
  const cells = new Set();
  for (const [id, p] of Object.entries(json.places)) {
    assert.deepEqual(p.xy, cellCenter(...p.cell), id);
    assert.deepEqual(json.coords[id], p.xy, id);
    assert.ok(p.xy[0] > 0 && p.xy[0] < 480 && p.xy[1] > 0 && p.xy[1] < 320, `${id} fuera del mapa`);
    assert.ok(Array.isArray(p.mapIds) && p.mapIds.length, `${id}: mapIds`);
    if (p.parent) {
      assert.ok(json.places[p.parent], `${id}: padre ${p.parent}`);
      assert.deepEqual(p.cell, json.places[p.parent].cell);
      continue;
    }
    const key = p.cell.join();
    assert.ok(!cells.has(key), `casilla repetida ${key} (${id})`);
    cells.add(key);
  }
  for (const [a, b] of [...PATHS, ...SEA_PATHS]) assert.ok(PLACES[a] && PLACES[b], `camino ${a}–${b}`);
});

test('mapa regional: están todos los lugares clave de CAMPANA §1 y los diez Pilares', () => {
  for (const id of ['villa_alba', 'villa_zaguan', 'ciudad_caudal', 'villa_brontia', 'ciudad_estrato', 'ciudad_lumina',
    'aldea_mnemos', 'ciudad_nexo', 'caleta_sonda', 'villa_boreal', 'mesa_vientos', 'bastion_axis', 'montana_portal',
    'cumbre_azur', 'sima_eje', 'mar_del_sur', 'mar_boreal', 'laberinto_profundidad']) {
    assert.ok(json.places[id], id);
  }
  const pillars = new Set();
  for (const p of Object.values(json.places)) (p.pillars || (p.pillar ? [p.pillar] : [])).forEach((n) => pillars.add(n));
  assert.deepEqual([...pillars].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(json.places.villa_alba.mapIds.includes('laboratorio_alerce'));
});

test('mapa regional: geografía legible (poblaciones en tierra, mares en agua, Sima oscura, norte nevado)', () => {
  for (const [id, p] of Object.entries(json.places)) {
    const c = hex(base.get(...p.xy));
    if (p.kind === 'town' || p.kind === 'city') assert.ok(!WATER.includes(c), `${id} cae en el agua (${c})`);
    if (p.kind === 'sea') assert.ok(WATER.includes(c), `${id} no cae en el agua (${c})`);
  }
  const [sx, sy] = json.places.sima_eje.xy;
  const sima = base.get(sx, sy);
  assert.ok(sima[0] + sima[1] + sima[2] < 150, 'la Sima del Eje es un abismo oscuro');
  const boreal = base.get(...json.places.villa_boreal.xy);
  assert.ok(boreal[0] > 180 && boreal[1] > 180 && boreal[2] > 200, 'Villa Boreal está nevada');
  assert.ok(coldAt(408, 88) >= 0.9 && coldAt(168, 136) === 0, 'frío en el norte, templado en Villa Alba');
  // Los marcadores de pueblo solo están en la versión marcada.
  const [ax, ay] = json.places.villa_alba.xy;
  assert.equal(hex(full.get(ax, ay)), '#4AA6EE');
  assert.notEqual(hex(base.get(ax, ay)), '#4AA6EE');
});
