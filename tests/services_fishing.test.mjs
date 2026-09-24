// Pesca (world/fishing.js): probabilidades de Essentials, casilla pescable, tablas fish_* por mapa y el flujo
// completo con un contexto de guion falso (picar, reaccionar a tiempo, escaparse, no picar, pulsar antes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RODS, FISH_TABLES, FISH_TEXT, biteChance, rollFishing, fishingSpot, fishingType, fishingSpeedup, useRod,
} from '../game/src/world/fishing.js';
import { runFieldAction, CANT_USE } from '../game/src/world/fieldActions.js';
import { EncounterSystem } from '../game/src/world/encounters.js';
import { GameState } from '../game/src/core/state.js';
import { mapFromRows } from './world_helpers.mjs';

// Jugador en (1,1) mirando a la derecha: agua en (2,1); césped en (1,2) debajo.
const ROWS = ['....', '..ww', '....'];

function fakeWorld({ dir = 6, surfing = false, tables = { fish_old: [[100, 'MAGIKARP', 5, 5]] }, press = () => false } = {}) {
  const map = mapFromRows(ROWS);
  const player = {
    x: 1, y: 1, direction: dir, surfing, isPlayer: true, realX: 32, realY: 32, pattern: 0, characterName: 'yo',
    setMovementType() {},
  };
  return {
    map, player, env: () => ({ surfing }),
    encounters: new EncounterSystem(tables, () => 0.5),
    input: { pressed: (b) => press(b) },
  };
}

function fakeCtx(world, state = GameState.create({ name: 'Prueba' })) {
  const said = [];
  const battles = [];
  let biting = false;
  const ctx = {
    world, state, said, battles, player: world.player,
    scene: { runner: { until: async (pred) => { for (let i = 0; i < 1000 && !pred(); i++); } } },
    say: async (t) => { said.push(t); if (t.includes(FISH_TEXT.bite)) biting = true; },
    wait: async () => {},
    se: () => {},
    emote: () => {},
    wildBattle: async (enc) => { battles.push(enc); return 'win'; },
    get biting() { return biting; },
  };
  return ctx;
}

test('pesca: probabilidades de picada de Essentials (20 + 25 × caña, ×1,5 con Viscosidad)', () => {
  assert.equal(biteChance('OLDROD'), 45);
  assert.equal(biteChance('GOODROD'), 70);
  assert.equal(biteChance('SUPERROD'), 95);
  assert.equal(biteChance('SUPERROD', true), 142.5);
  assert.equal(biteChance('NADA'), 0);
  assert.deepEqual(FISH_TABLES, ['fish_old', 'fish_good', 'fish_super']);
  assert.deepEqual(Object.keys(RODS), ['OLDROD', 'GOODROD', 'SUPERROD']);
  assert.equal(fishingSpeedup([{ egg: true, ability: 'STICKYHOLD' }, { ability: 'SUCTIONCUPS' }]), true);
  assert.equal(fishingSpeedup([{ ability: 'STATIC' }]), false);
});

test('pesca: tirada determinista (5–10 puntos, reacción de ½ a 1 s, sin tabla nunca pica)', () => {
  const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };
  assert.deepEqual(rollFishing(seq([0, 0.1, 0]), { rodId: 'OLDROD', hasEncounter: true }), { dots: 5, bite: true, reactFrames: 60 });
  assert.deepEqual(rollFishing(seq([0.99, 0.9, 0.99]), { rodId: 'OLDROD', hasEncounter: true }), { dots: 10, bite: false, reactFrames: 31 });
  assert.equal(rollFishing(() => 0, { rodId: 'SUPERROD', hasEncounter: false }).bite, false);
  const fast = rollFishing(seq([0.99, 0, 0.5, 0.5]), { rodId: 'OLDROD', hasEncounter: true, speedup: true });
  assert.equal(fast.dots, 5, 'con Viscosidad se queda la menor de dos esperas');
});

test('pesca: solo mirando a agua pescable y sin cortar el paso de la orilla', () => {
  assert.equal(fishingSpot(fakeWorld()).ok, true);
  assert.deepEqual([fishingSpot(fakeWorld()).x, fishingSpot(fakeWorld()).y], [2, 1]);
  assert.equal(fishingSpot(fakeWorld({ dir: 2 })).ok, false, 'mirando al césped');
  assert.equal(fishingSpot({}).ok, false);
});

test('pesca: tablas fish_old/fish_good/fish_super del mapa con variante horaria', () => {
  const enc = new EncounterSystem({ fish_old: [[1, 'MAGIKARP', 5]], fish_goodNight: [[1, 'GOLDEEN', 20]] });
  assert.equal(fishingType(enc, 'OLDROD', 12), 'fish_old');
  assert.equal(fishingType(enc, 'GOODROD', 12), null, 'la de noche no vale de día');
  assert.equal(fishingType(enc, 'GOODROD', 23), 'fish_goodNight');
  assert.equal(fishingType(enc, 'SUPERROD', 12), null);
  assert.equal(enc.encounterType({ terrain: { landWildEncounters: true } }), null, 'las tablas de pesca no afectan a la hierba');
});

test('pesca: pica, se pulsa A a tiempo y empieza el combate con la tabla de la caña', async () => {
  let ctx;
  const world = fakeWorld({ press: (b) => b === 'A' && ctx.biting });
  ctx = fakeCtx(world);
  const used = await useRod(ctx, 'OLDROD', { rng: () => 0.1 });
  assert.equal(used, true);
  assert.equal(ctx.said.filter((t) => !t.includes(FISH_TEXT.bite) && t.startsWith('.')).length, 5, 'cinco puntos de espera');
  assert.ok(ctx.said.some((t) => t.endsWith(FISH_TEXT.bite)));
  assert.equal(ctx.said.at(-1), FISH_TEXT.landed);
  assert.deepEqual(ctx.battles.map((e) => [e.species, e.level]), [['MAGIKARP', 5]]);
  assert.equal(world.player.lockPattern, false, 'la animación libera al jugador');
});

test('pesca: si no se pulsa a tiempo el Pokémon se escapa; sin tabla o pulsando antes, no pican', async () => {
  const slow = fakeCtx(fakeWorld());
  await useRod(slow, 'OLDROD', { rng: () => 0.1 });
  assert.equal(slow.said.at(-1), FISH_TEXT.gotAway);
  assert.equal(slow.battles.length, 0);

  const noTable = fakeCtx(fakeWorld());
  await useRod(noTable, 'SUPERROD', { rng: () => 0.1 });
  assert.equal(noTable.said.at(-1), FISH_TEXT.nothing);

  const eager = fakeCtx(fakeWorld({ press: (b) => b === 'B' }));
  await useRod(eager, 'OLDROD', { rng: () => 0.1 });
  assert.equal(eager.said.filter((t) => t.startsWith('.')).length, 1, 'se corta en el primer punto');
  assert.equal(eager.said.at(-1), FISH_TEXT.nothing);
});

test('pesca: las cañas son objetos de campo del menú (mirando a tierra: «Aquí no se puede usar.»)', async () => {
  const ctx = fakeCtx(fakeWorld({ dir: 2 }));
  assert.equal(await runFieldAction(ctx, { type: 'useItem', item: 'GOODROD' }), false);
  assert.deepEqual(ctx.said, [CANT_USE]);
  assert.equal(FISH_TEXT.cantUse, CANT_USE);
  const water = fakeCtx(fakeWorld());
  assert.equal(await runFieldAction(water, { type: 'useItem', item: 'OLDROD' }), true);
});
