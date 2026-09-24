// Anillos de zona de las pistas en el mapa regional (clueZones de content/story + atlas de services).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { clueZones, openClueState, advanceClueState, closeClueState } from '../game/src/content/story/clueLogic.js';
import { clueRings, placeById } from '../game/src/ui/logic/regionMapData.js';

const newState = () => GameState.create({ name: 'Prueba', gender: 'M', playerId: 1 });

test('sin pistas en segunda fase no hay anillos', () => {
  const st = newState();
  assert.deepEqual(clueRings(clueZones(st)), []);
  openClueState(st, 'T01');
  assert.deepEqual(clueRings(clueZones(st)), [], 'la pista inicial aún no señala zona');
});

test('la segunda pista marca su lugar del atlas (también zonas que son rutas o reservas)', () => {
  const st = newState();
  advanceClueState(st, 'T01', 2);
  advanceClueState(st, 'T07', 2);
  const rings = clueRings(clueZones(st));
  assert.deepEqual(rings.map((r) => r.clues), [['T01'], ['T07']]);
  const zaguan = placeById('villa_zaguan');
  assert.equal(rings[0].placeId, 'villa_zaguan');
  assert.deepEqual([rings[0].x, rings[0].y], [zaguan.x, zaguan.y]);
  assert.ok(rings[1].placeId, 'ruta_14_reserva tiene lugar en el atlas');
  closeClueState(st, 'T01');
  assert.deepEqual(clueRings(clueZones(st)).map((r) => r.clues), [['T07']], 'resuelta: sin anillo');
});

test('clueRings agrupa pistas del mismo lugar e ignora zonas desconocidas', () => {
  const rings = clueRings([
    { id: 'T02', zone: 'ciudad_caudal' }, { id: 'X', zone: 'caudal_centro' }, { id: 'Y', zone: 'no_existe' },
  ]);
  assert.equal(rings.length, 1);
  assert.deepEqual(rings[0].clues, ['T02', 'X']);
});
