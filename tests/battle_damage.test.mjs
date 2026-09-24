// Tests del motor de combate: daño, efectividad, precisión, prioridad y orden de turno.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, mon, play, damageEvents, msgIndex, MIN_ROLL } from './battle_helpers.mjs';

const wild = (party, extra = {}) => ({ type: 'wild', player: { party: party.player }, opponent: { party: party.foe }, ...extra });

test('daño conocido: Rayo de Pikachu Nv.50 a Squirtle Nv.50 (tirada máxima, sin crítico) = 105', async () => {
  // Pikachu At.Esp. 70, Squirtle Def.Esp. 84 → base = ⌊⌊22·90·70/84⌋/50⌋+2 = 35; ×1.5 STAB ×2 eficaz = 105.
  assert.equal(db.species.PIKACHU.baseStats.spa, 50);
  assert.equal(db.species.SQUIRTLE.baseStats.spd, 64);
  const { battle, ui } = await play(wild({
    player: [mon('PIKACHU', 50, ['THUNDERBOLT'])],
    foe: [mon('SQUIRTLE', 50, ['TAILWHIP'])],
  }), { script: [{ action: 'fight', move: 'THUNDERBOLT' }], stopAfterScript: true });
  const hits = damageEvents(ui, 1);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].from - hits[0].to, 105);
  assert.equal(battle.battlers[1].hp, battle.battlers[1].totalhp - 105);
  assert.ok(msgIndex(ui, '¡Es supereficaz!') >= 0);
});

test('golpe crítico ×1.5 y tirada mínima (85 %) con RNG a 0', async () => {
  const { ui } = await play(wild({
    player: [mon('PIKACHU', 50, ['THUNDERSHOCK'])],
    foe: [mon('SQUIRTLE', 50, ['TAILWHIP'])],
  }, { rng: MIN_ROLL }), { script: [{ action: 'fight', move: 'THUNDERSHOCK' }], stopAfterScript: true });
  const [hit] = damageEvents(ui, 1);
  // Impactrueno de Añil tiene 45 de potencia: base = ⌊⌊22·45·70/84⌋/50⌋+2 = 18
  // 18 × 1.5 (crítico) × 0.85 (tirada mínima) × 1.5 (STAB) × 2 (eficaz) = 68.85 → 69
  assert.equal(db.moves.THUNDERSHOCK.power, 45);
  assert.equal(hit.from - hit.to, 69);
  assert.ok(msgIndex(ui, '¡Un golpe crítico!') >= 0);
});

test('inmunidad de tipo: Rayo no afecta a Geodude', async () => {
  const { battle, ui } = await play(wild({
    player: [mon('PIKACHU', 30, ['THUNDERBOLT'])],
    foe: [mon('GEODUDE', 30, ['DEFENSECURL'])],
  }), { script: [{ action: 'fight', move: 'THUNDERBOLT' }], stopAfterScript: true });
  assert.equal(damageEvents(ui, 1).length, 0);
  assert.equal(battle.battlers[1].hp, battle.battlers[1].totalhp);
  assert.ok(msgIndex(ui, 'No afecta al Geodude salvaje') >= 0, ui.messages.join('\n'));
});

test('poco eficaz: Placaje de tipo Normal contra Roca muestra "No es muy eficaz"', async () => {
  const { ui } = await play(wild({
    player: [mon('PIKACHU', 30, ['TACKLE'])],
    foe: [mon('GEODUDE', 30, ['DEFENSECURL'])],
  }), { script: [{ action: 'fight', move: 'TACKLE' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'No es muy eficaz') >= 0);
});

test('precisión: con RNG alto (tirada 99) falla Hidrobomba (80 %)', async () => {
  // Con RNG 0.9999 la tirada es 99: un movimiento con precisión < 100 falla.
  const { battle, ui } = await play(wild({
    player: [mon('SQUIRTLE', 30, ['HYDROPUMP'])],
    foe: [mon('GEODUDE', 30, ['DEFENSECURL'])],
  }), { script: [{ action: 'fight', move: 'HYDROPUMP' }], stopAfterScript: true });
  assert.equal(battle.battlers[1].hp, battle.battlers[1].totalhp);
  assert.ok(msgIndex(ui, 'ha fallado') >= 0, ui.messages.join('\n'));
});

test('prioridad: Ataque Rápido del más lento actúa antes', async () => {
  const { ui } = await play(wild({
    player: [mon('SQUIRTLE', 30, ['QUICKATTACK', 'TACKLE'])],
    foe: [mon('PIKACHU', 30, ['TAILWHIP'])],
  }), { script: [{ action: 'fight', move: 'QUICKATTACK' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'Squirtle ha usado Ataque Rápido') < msgIndex(ui, 'Pikachu salvaje ha usado Agitacola'));
});

test('velocidad: sin prioridad actúa primero el más rápido', async () => {
  const { ui } = await play(wild({
    player: [mon('SQUIRTLE', 30, ['TACKLE'])],
    foe: [mon('PIKACHU', 30, ['TAILWHIP'])],
  }), { script: [{ action: 'fight', move: 'TACKLE' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'Pikachu salvaje ha usado Agitacola') < msgIndex(ui, 'Squirtle ha usado Placaje'));
});

test('Espacio Raro invierte el orden en la ronda siguiente', async () => {
  const { ui } = await play(wild({
    player: [mon('SQUIRTLE', 50, ['TRICKROOM', 'TACKLE'])],
    foe: [mon('PIKACHU', 50, ['TAILWHIP'])],
  }), { script: [{ action: 'fight', move: 'TRICKROOM' }, { action: 'fight', move: 'TACKLE' }], stopAfterScript: true });
  const round2Squirtle = ui.messages.findIndex((m) => m.includes('Squirtle ha usado Placaje'));
  const pikachuMoves = ui.messages.map((m, i) => (m.includes('Pikachu salvaje ha usado Agitacola') ? i : -1)).filter((i) => i >= 0);
  assert.ok(msgIndex(ui, 'alteró las dimensiones') >= 0);
  assert.equal(pikachuMoves.length, 2);
  assert.ok(round2Squirtle < pikachuMoves[1], 'con Espacio Raro el más lento (Squirtle) va primero');
});

test('Viento Afín duplica la velocidad del bando', async () => {
  const { battle } = await play(wild({
    player: [mon('PIDGEY', 30, ['TAILWIND'])],
    foe: [mon('RATTATA', 30, ['TAILWHIP'])],
  }), { script: [{ action: 'fight', move: 'TAILWIND' }], stopAfterScript: true });
  const b = battle.battlers[0];
  assert.equal(b.pbOwnSide().effects.Tailwind > 0, true);
  const plain = b.speed;
  assert.equal(b.pbSpeed(), plain * 2);
});

test('clima: la lluvia potencia el agua ×1.5', async () => {
  const run = async (weather) => {
    const { ui } = await play(wild({
      player: [mon('SQUIRTLE', 50, ['WATERGUN'])],
      foe: [mon('RATTATA', 50, ['TAILWHIP'])],
    }, { weather }), { script: [{ action: 'fight', move: 'WATERGUN' }], stopAfterScript: true });
    const [hit] = damageEvents(ui, 1);
    return hit.from - hit.to;
  };
  const dry = await run('None');
  const rain = await run('Rain');
  assert.ok(rain > dry);
  assert.ok(Math.abs(rain - dry * 1.5) <= 2, `${dry} → ${rain}`);
});

test('etapas de estadística: Danza Espada duplica el daño físico', async () => {
  const { ui } = await play(wild({
    player: [mon('MACHOP', 50, ['SWORDSDANCE', 'TACKLE'])],
    foe: [mon('SNORLAX', 60, ['TAILWHIP'])],
  }), { script: [{ action: 'fight', move: 'TACKLE' }, { action: 'fight', move: 'SWORDSDANCE' }, { action: 'fight', move: 'TACKLE' }], stopAfterScript: true });
  const hits = damageEvents(ui, 1);
  assert.equal(hits.length, 2);
  const d1 = hits[0].from - hits[0].to;
  const d2 = hits[1].from - hits[1].to;
  assert.ok(d2 >= d1 * 2 - 3 && d2 <= d1 * 2 + 3, `${d1} → ${d2}`);
  assert.ok(msgIndex(ui, 'El Ataque de Machop ha aumentado mucho') >= 0, ui.messages.join('\n'));
});
