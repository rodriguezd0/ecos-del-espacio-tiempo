// Multijugador: chat y globos (servidor + net/social.js) e intercambios (net/tradeLogic.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from './battle_helpers.mjs';
import { RoomHub } from '../server/rooms.mjs';
import { PROTOCOL_VERSION, sanitizeChat, MAX_CHAT_LENGTH } from '../game/src/net/protocol.js';
import { wrapText } from '../game/src/net/social.js';
import { cannotOffer, validateTradePokemon, applyTrade } from '../game/src/net/tradeLogic.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { GameState } from '../game/src/core/state.js';

const client = (id) => { const inbox = []; return { id, inbox, send: (m) => inbox.push(m), last: (t) => [...inbox].reverse().find((m) => m.t === t) }; };

test('chat y globos: se limpian y se reparten a la sala; globos desconocidos se ignoran', () => {
  const hub = new RoomHub();
  const a = client('a');
  const b = client('b');
  hub.handle(a, { t: 'hello', v: PROTOCOL_VERSION, room: '', name: 'Ana' });
  hub.handle(b, { t: 'hello', v: PROTOCOL_VERSION, room: a.last('welcome').room, name: 'Beto' });
  hub.handle(a, { t: 'chat', text: '  hola\u0007   Beto  ' });
  assert.deepEqual(b.last('chat'), { t: 'chat', id: 'a', text: 'hola Beto' });
  hub.handle(a, { t: 'chat', text: '   ' });
  assert.equal(b.inbox.filter((m) => m.t === 'chat').length, 1, 'vacío: no se envía');
  hub.handle(a, { t: 'emo', k: '♥' });
  assert.deepEqual(b.last('emo'), { t: 'emo', id: 'a', k: '♥' });
  hub.handle(a, { t: 'emo', k: '<script>' });
  assert.equal(b.inbox.filter((m) => m.t === 'emo').length, 1);
  assert.equal(sanitizeChat('x'.repeat(200)).length, MAX_CHAT_LENGTH);
});

test('burbujas de chat: se parten por palabras en 3 líneas como mucho', () => {
  const measure = (s) => s.length * 6; // 6 px por letra
  assert.deepEqual(wrapText('hola que tal', 60, measure), ['hola que', 'tal']);
  const long = wrapText('palabra '.repeat(30).trim(), 60, measure);
  assert.equal(long.length, 3);
  assert.ok(long[2].endsWith('…'));
  assert.deepEqual(wrapText('supercalifragilistico', 60, measure), ['supercalif', 'ragilistic', 'o']);
});

function stateWith(...species) {
  const st = GameState.create({ name: 'Ana' });
  for (const s of species) st.addPokemon(createPokemon(db, s, 20, { rng: () => 0.5 }));
  return st;
}

test('intercambios: no se ofrece a Zygarde ni el último Pokémon que no es Huevo', () => {
  const st = stateWith('PIKACHU');
  assert.match(cannotOffer(st, 0), /al menos otro/);
  const two = stateWith('PIKACHU', 'ZYGARDE');
  assert.match(cannotOffer(two, 1), /no se separa/);
  assert.equal(cannotOffer(two, 0), null, 'Zygarde se queda en el equipo, así que Pikachu sí se puede ofrecer');
});

test('intercambios: la validación rechaza datos trucados y el cambio evoluciona por intercambio', () => {
  const good = createPokemon(db, 'KADABRA', 30, { rng: () => 0.5 });
  assert.throws(() => validateTradePokemon(db, { ...good, species: 'MISSINGNO' }), /Especie/);
  assert.throws(() => validateTradePokemon(db, { ...good, level: 500 }), /Nivel/);
  assert.throws(() => validateTradePokemon(db, { ...good, moves: [{ id: 'HACK' }] }), /Movimiento/);
  assert.throws(() => validateTradePokemon(db, { ...good, species: 'ZYGARDE' }), /no se puede/);
  const clean = validateTradePokemon(db, { ...good, heldItem: 'OBJETO_FALSO' });
  assert.equal(clean.heldItem, null);
  const st = stateWith('PIKACHU', 'EEVEE');
  const r = applyTrade(st, db, 1, clean);
  assert.equal(st.party[1].species, 'KADABRA');
  assert.equal(r.given.species, 'EEVEE');
  assert.equal(r.evolveTo, 'ALAKAZAM');
  assert.ok(st.data.dex.caught.KADABRA);
});
