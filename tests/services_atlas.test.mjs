// Atlas de Axis (ui/logic/regionMapData.js) y catálogo de mapas por zona (content/services/zones.js):
// rejilla, ids únicos, conexiones simétricas y coherentes con las posiciones, mapas de CAMPANA, música y fondos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REGION_MAP, TERRAIN_KEYS, WATER_TERRAIN, LINKLESS_PLACES, LAYOUT_EXCEPTIONS, DIRECTION_VECTORS, GRID_W, GRID_H,
  pointAt, pointForMap, canFlyTo, flyDestinations, resolveFlyTarget, pathCells, placeById, regionMarks,
  registerRegionMarks, routeHitCells, childPlaces, roadPath,
} from '../game/src/ui/logic/regionMapData.js';
import {
  MAP_GROUPS, CATALOG_MAP_IDS, mapInfo, zoneDefaults, mapDisplayName, mapPlace,
} from '../game/src/content/services/zones.js';
import { BGM } from '../game/src/audio/catalog.js';
import { resolveBackdrop } from '../game/src/battle/scene/setup.js';
import { MAPS } from '../game/src/content/maps/index.js';
import { GameState } from '../game/src/core/state.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANIL = path.join(ROOT, 'Pokemon Anil V4.13');
const places = REGION_MAP.places;
const byId = new Map(places.map((p) => [p.id, p]));

test('atlas: rejilla de 30×20 con la leyenda de terrenos', () => {
  assert.equal(REGION_MAP.terrain.length, GRID_H);
  for (const [y, row] of REGION_MAP.terrain.entries()) {
    assert.equal(row.length, GRID_W, `fila ${y}`);
    for (const ch of row) assert.ok(TERRAIN_KEYS[ch], `carácter desconocido "${ch}" en la fila ${y}`);
  }
  assert.equal(REGION_MAP.grid.length, GRID_H, 'rejilla simple de compatibilidad');
  assert.ok(REGION_MAP.grid.every((r) => /^[#.]{30}$/.test(r)));
  assert.equal(REGION_MAP.points, REGION_MAP.places, 'points es alias de places');
});

test('atlas: ids únicos, casillas dentro de la rejilla y un solo icono por casilla (salvo lugares hijos)', () => {
  const ids = places.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
  const cells = new Map();
  for (const p of places) {
    assert.ok(p.name && typeof p.name === 'string', `${p.id} sin nombre`);
    assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < GRID_W && p.y < GRID_H, `${p.id} fuera`);
    assert.ok(['town', 'route', 'zone', 'sea', 'post'].includes(p.kind), `${p.id}: tipo ${p.kind}`);
    if (p.parent) {
      const parent = byId.get(p.parent);
      assert.ok(parent && parent.x === p.x && parent.y === p.y, `${p.id}: el padre ${p.parent} debe estar en su casilla`);
      continue;
    }
    const key = `${p.x},${p.y}`;
    assert.ok(!cells.has(key), `${p.id} y ${cells.get(key)} comparten la casilla ${key}`);
    cells.set(key, p.id);
  }
  assert.deepEqual(childPlaces('aldea_mnemos').map((p) => p.id), ['archivo_hondo']);
  assert.equal(pointAt(REGION_MAP, 2, 10).id, 'aldea_mnemos', 'el cursor muestra el lugar padre');
});

test('atlas: tierra y mar coherentes con cada lugar', () => {
  for (const p of places) {
    const ch = REGION_MAP.terrain[p.y][p.x];
    if (p.kind === 'sea') assert.ok(ch === '~' || ch === 'r', `${p.id} debería estar en el mar (${ch})`);
    else assert.ok(ch !== '~', `${p.id} está en el mar`);
  }
});

test('atlas: conexiones simétricas, direcciones opuestas y acordes con las posiciones', () => {
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  for (const p of places) {
    if (!LINKLESS_PLACES.includes(p.id)) assert.ok(p.links.length > 0, `${p.id} sin conexiones`);
    const targets = p.links.map(([to]) => to);
    assert.equal(new Set(targets).size, targets.length, `${p.id}: conexión repetida`);
    for (const [to, dir] of p.links) {
      const q = byId.get(to);
      assert.ok(q, `${p.id} → ${to}: lugar inexistente`);
      const back = q.links.find(([id]) => id === p.id);
      assert.ok(back, `${p.id} → ${to} sin la conexión de vuelta`);
      if (dir) {
        assert.ok(DIRECTION_VECTORS[dir], `${p.id}: dirección ${dir}`);
        if (back[1]) assert.ok(dot(DIRECTION_VECTORS[dir], DIRECTION_VECTORS[back[1]]) < 0, `${p.id} ${dir} / ${to} ${back[1]}`);
        const known = LAYOUT_EXCEPTIONS.some(([a, b]) => (a === p.id && b === to) || (a === to && b === p.id));
        const v = [q.x - p.x, q.y - p.y];
        if (!known) assert.ok(dot(DIRECTION_VECTORS[dir], v) >= 0, `${p.id} → ${to} (${dir}) contradice el atlas (${v})`);
      }
    }
  }
});

test('atlas: todo lugar se alcanza desde Villa Alba (salvo los de solo Vuelo)', () => {
  const seen = new Set(['villa_alba']);
  const queue = ['villa_alba'];
  while (queue.length) {
    for (const [to] of byId.get(queue.shift()).links) if (!seen.has(to)) { seen.add(to); queue.push(to); }
  }
  const missing = places.filter((p) => !seen.has(p.id) && !LINKLESS_PLACES.includes(p.id)).map((p) => p.id);
  assert.deepEqual(missing, []);
});

test('atlas: caminos dibujados entre lugares conectados y cursor sobre las rutas', () => {
  const linked = (a, b) => byId.get(a).links.some(([to]) => to === b) && byId.get(b).links.some(([to]) => to === a);
  for (const [a, b] of [...REGION_MAP.roads, ...REGION_MAP.seaRoads]) {
    assert.ok(byId.has(a) && byId.has(b), `camino ${a}–${b}: lugar inexistente`);
    if (REGION_MAP.roads.some(([x, y]) => x === a && y === b)) assert.ok(linked(a, b), `camino ${a}–${b} sin conexión en el atlas`);
    for (const [x, y] of pathCells(roadPath(byId.get(a), byId.get(b)))) assert.ok(x >= 0 && y >= 0 && x < GRID_W && y < GRID_H);
  }
  for (const r of places.filter((p) => p.kind === 'route')) {
    assert.ok(REGION_MAP.roads.some((pair) => pair.includes(r.id)), `${r.id} sin camino dibujado`);
    assert.ok(routeHitCells(r.id).length > 0, `${r.id} sin casillas de cursor`);
  }
  assert.equal(pointAt(REGION_MAP, 10, 11)?.id, 'ruta_2', 'icono de ruta');
  assert.equal(pointAt(REGION_MAP, 13, 12)?.id, 'ruta_4', 'cursor sobre el camino de una ruta');
  assert.equal(pointAt(REGION_MAP, 8, 9)?.id, 'ruta_1', 'tramo horizontal: primera ruta del par');
  assert.equal(pointAt(REGION_MAP, 7, 7)?.id, 'ruta_10', 'tramo vertical: segunda ruta del par');
  assert.equal(pointAt(REGION_MAP, 11, 12)?.id, 'ciudad_caudal', 'el icono gana a los caminos');
  assert.equal(pointAt(REGION_MAP, 0, 0), null);
});

test('atlas: la dirección del esquema de CAMPANA §1.2 (noroeste, centro, norte, este, sur)', () => {
  const at = (id) => byId.get(id);
  assert.ok(at('montana_portal').x < at('villa_alba').x && at('montana_portal').y < at('villa_alba').y, 'Monte al noroeste');
  assert.ok(at('cumbre_azur').y < at('villa_zaguan').y, 'Cumbre Azur al norte');
  assert.ok(at('sima_eje').y > at('ciudad_caudal').y && at('sima_eje').y < at('ruta_7').y, 'Sima entre Caudal y la Ruta 7');
  assert.ok(at('meseta_impulso').x > at('villa_brontia').x, 'Meseta al este de Brontia');
  assert.ok(at('villa_boreal').y < at('villa_brontia').y, 'Boreal al norte');
  assert.ok(at('mar_del_sur').y > at('ciudad_estrato').y, 'mar al sur');
  const pillars = places.flatMap((p) => p.pillars || (p.pillar ? [p.pillar] : [])).sort((a, b) => a - b);
  assert.deepEqual(pillars, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'los diez Pilares (P9 y P10 en la Sima)');
});

test('atlas: coincide con la ilustración de arte (game/assets/ui/region_map.json)', (t) => {
  const file = path.join(ROOT, 'game', 'assets', 'ui', 'region_map.json');
  if (!fs.existsSync(file)) { t.skip('sin ilustración todavía'); return; }
  const art = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(art.places).sort(), places.map((p) => p.id).sort(), 'mismos lugares');
  for (const [id, info] of Object.entries(art.places)) {
    assert.deepEqual(info.cell, [byId.get(id).x, byId.get(id).y], `${id}: casilla distinta en la ilustración`);
  }
  const key = ([a, b]) => `${a}>${b}`;
  assert.deepEqual(art.paths.map(key).sort(), REGION_MAP.roads.map(key).sort(), 'mismos caminos');
  assert.deepEqual(art.seaPaths.map(key).sort(), REGION_MAP.seaRoads.map(key).sort(), 'mismas travesías');
});

test('catálogo: cada lugar tiene mapas y cada grupo apunta a un lugar del atlas', () => {
  for (const g of MAP_GROUPS) assert.ok(byId.has(g.place), `grupo ${g.name}: lugar ${g.place} inexistente`);
  for (const p of places) assert.ok(p.mapIds.length > 0, `${p.id} sin mapas en el catálogo`);
  assert.equal(new Set(CATALOG_MAP_IDS).size, CATALOG_MAP_IDS.length);
  for (const p of places.filter((x) => x.fly)) assert.ok(p.mapIds.includes(p.id), `${p.id}: destino de Vuelo sin mapa propio`);
});

/** Ids de mapa de las líneas «Mapas:» de CAMPANA (con comodines `x_*`). */
function campaignMapIds() {
  const lines = fs.readFileSync(path.join(ROOT, 'docs', 'CAMPANA.md'), 'utf8').split('\n');
  const out = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!/^- \*\*Mapas:\*\*/.test(lines[i])) continue;
    let block = lines[i];
    for (let j = i + 1; j < lines.length && /^\s{2,}\S/.test(lines[j]); j++) block += ` ${lines[j]}`;
    for (const m of block.matchAll(/`([a-z0-9_]+\*?)`/g)) {
      // «fog `portal`», «panorama `cielo`»: recursos gráficos, no mapas
      if (/(fog|panorama)\s*$/.test(block.slice(Math.max(0, m.index - 12), m.index))) continue;
      out.add(m[1]);
    }
  }
  out.add('montana_portal');
  return [...out];
}

test('catálogo: todos los mapas de CAMPANA tienen nombre, lugar y zona', () => {
  const ids = campaignMapIds();
  assert.ok(ids.length > 60, `se esperaban muchos mapas en CAMPANA (${ids.length})`);
  for (const raw of ids) {
    const id = raw.endsWith('*') ? `${raw.slice(0, -1)}1` : raw;
    const info = mapInfo(id);
    assert.ok(info, `mapa de CAMPANA sin catálogo: ${raw}`);
    assert.ok(info.name && byId.has(info.place), `${raw}: nombre/lugar`);
  }
});

test('catálogo: los mapas registrados del juego (salvo pruebas) tienen nombre visible', () => {
  for (const id of Object.keys(MAPS)) {
    if (id.startsWith('dev_')) continue;
    assert.ok(mapDisplayName(id), `mapa registrado sin nombre en el catálogo: ${id}`);
  }
});

test('catálogo: interiores por prefijo, nombres y valores por defecto', () => {
  assert.equal(mapDisplayName('zaguan_centro'), 'Villa Zaguán');
  assert.equal(mapDisplayName('caudal_tienda'), 'Ciudad Caudal');
  assert.equal(mapDisplayName('ruta_14_reserva'), 'Ruta 14');
  assert.equal(mapDisplayName('pilar_invertido_cara_1'), 'Pilar Invertido');
  assert.equal(mapDisplayName('antea_2_presente'), 'Pilar de los Ecos');
  assert.equal(mapDisplayName('parque_eolico'), 'Parque Eólico');
  assert.equal(mapDisplayName('dev_test'), '');
  assert.equal(mapPlace('casa_prota_1f'), 'villa_alba');
  assert.deepEqual(zoneDefaults('villa_zaguan'), { name: 'Villa Zaguán', bgm: 'PrismaVilla2', battleback: 'Pradera' });
  assert.deepEqual(zoneDefaults('ruta_4'), { name: 'Ruta 4', bgm: 'Ruta 3' }, 'sin fondo fijado en CAMPANA → sin campo');
  assert.deepEqual(zoneDefaults('desconocido'), {});
  assert.equal(pointForMap(REGION_MAP, 'zaguan_centro').id, 'villa_zaguan');
  assert.equal(pointForMap(REGION_MAP, 'explanada_umbral').id, 'ruinas_dintel');
  assert.equal(pointForMap(REGION_MAP, 'fondo_mar_sur').id, 'mar_del_sur');
  assert.equal(pointForMap(REGION_MAP, 'pilar_invertido_sumidero').id, 'aljibe_portal');
  assert.equal(pointForMap(REGION_MAP, 'dev_test'), null);
});

test('catálogo: la música existe (semántica o archivo de Añil) y los fondos de combate también', () => {
  const bgmFiles = new Set(fs.readdirSync(path.join(ANIL, 'Audio', 'BGM')).map((f) => f.replace(/\.[^.]+$/, '')));
  const infos = [...CATALOG_MAP_IDS.map(mapInfo), ...MAP_GROUPS.map((g) => ({ ...g, id: g.name }))];
  for (const info of infos) {
    if (info.bgm) assert.ok(BGM[info.bgm] || bgmFiles.has(info.bgm), `${info.id}: BGM "${info.bgm}" no existe`);
    if (info.battleback) {
      const file = resolveBackdrop({ battleback: info.battleback }).file;
      assert.ok(fs.existsSync(path.join(ANIL, file)), `${info.id}: fondo ${info.battleback} → ${file} no existe`);
    }
  }
});

test('catálogo: los mapas de las 100 células de Zygarde están en el atlas', async () => {
  let cells;
  try {
    cells = await import('../game/src/content/zygarde/cells.js');
  } catch {
    return; // el registro de células es de otro agente: si no está, no hay nada que comprobar
  }
  for (const id of cells.CELL_MAPS) assert.ok(mapPlace(id), `mapa de células fuera del catálogo: ${id}`);
});

test('Vuelo: poblaciones visitadas o desbloqueadas; la Mesa de los Vientos solo por guion', () => {
  const zaguan = placeById('villa_zaguan');
  const mesa = placeById('mesa_vientos');
  assert.equal(canFlyTo(zaguan, [], []), false);
  assert.equal(canFlyTo(zaguan, [], ['zaguan_centro']), true, 'visitar un interior cuenta');
  assert.equal(canFlyTo(zaguan, ['villa_zaguan']), true, 'firma antigua (flyPoints)');
  assert.equal(canFlyTo(placeById('ruta_2'), ['ruta_2'], ['ruta_2']), false, 'las rutas no son destino');
  assert.equal(canFlyTo(mesa, [], ['mesa_vientos']), false);
  const st = GameState.create({ name: 'Prueba' });
  st.setPosition('villa_alba', 5, 5);
  st.setPosition('ciudad_caudal', 5, 5);
  assert.throws(() => st.unlockFlyPoint(''), /inválido/);
  st.unlockFlyPoint('mesa_vientos');
  st.unlockFlyPoint('mesa_vientos');
  assert.deepEqual(st.data.flyPoints, ['mesa_vientos']);
  assert.equal(st.hasFlyPoint('mesa_vientos'), true);
  assert.deepEqual(flyDestinations(st).map((p) => p.id).sort(), ['ciudad_caudal', 'mesa_vientos', 'villa_alba']);
  for (const p of places.filter((x) => x.fly)) {
    assert.ok(['town', 'post'].includes(p.kind), `${p.id}: solo poblaciones`);
    assert.deepEqual(p.flyTo, { map: p.id });
  }
});

test('Vuelo: casilla de llegada = flyPoint del mapa, o su start; null si el mapa no existe', async () => {
  const defs = {
    villa_zaguan: { id: 'villa_zaguan', start: { x: 3, y: 4, dir: 2 }, flyPoint: { x: 20, y: 16, dir: 2 } },
    ciudad_caudal: { id: 'ciudad_caudal', start: { x: 7, y: 8, dir: 8 } },
  };
  const load = async (id) => { if (!defs[id]) throw new Error('Mapa desconocido'); return defs[id]; };
  assert.deepEqual(await resolveFlyTarget('villa_zaguan', load), { mapId: 'villa_zaguan', x: 20, y: 16, dir: 2 });
  assert.deepEqual(await resolveFlyTarget('ciudad_caudal', load), { mapId: 'ciudad_caudal', x: 7, y: 8, dir: 8 });
  assert.equal(await resolveFlyTarget('villa_brontia', load), null);
  assert.equal(await resolveFlyTarget('ruta_4', load), null);
});

test('marcas del mapa regional: por mapa, por lugar o con el formato de Zygarde', () => {
  registerRegionMarks(() => [{ mapId: 'ruta_1', kind: 'cell', count: 2, total: 6 }]);
  registerRegionMarks(() => { throw new Error('proveedor roto'); });
  const orig = console.warn;
  console.warn = () => {};
  try {
    const marks = regionMarks(null, REGION_MAP, [{ id: 'villa_zaguan', remaining: 1, found: 1, total: 2 }, { mapId: 'nada' }]);
    assert.deepEqual(marks.get('ruta_1'), [{ kind: 'cell', count: 2, found: null, total: 6, crisis: false }]);
    assert.deepEqual(marks.get('villa_zaguan'), [{ kind: 'cell', count: 1, found: 1, total: 2, crisis: false }]);
    assert.equal(marks.size, 2);
  } finally {
    console.warn = orig;
  }
  assert.throws(() => registerRegionMarks(null), /función/);
});

test('ríos y caminos del atlas: pathCells rasteriza tramos rectos y diagonales', () => {
  assert.deepEqual(pathCells([[0, 0], [2, 0]]), [[0, 0], [1, 0], [2, 0]]);
  assert.deepEqual(pathCells([[0, 0], [2, 2]]), [[0, 0], [1, 1], [2, 2]]);
  assert.deepEqual(pathCells([[1, 1]]), [[1, 1]]);
  for (const line of REGION_MAP.rivers) {
    for (const [x, y] of line) assert.ok(!WATER_TERRAIN.includes(REGION_MAP.terrain[y][x]) || REGION_MAP.terrain[y][x] === 'l', 'el río va por tierra');
  }
});
