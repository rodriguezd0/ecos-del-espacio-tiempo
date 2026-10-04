import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { db, mon, play, msgIndex } from './battle_helpers.mjs';
import { pokemonFromSpec, buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { legendRequest, prototypeRequest } from '../game/src/content/events/b22d_battle.js';
import { PROTOTYPES } from '../game/src/content/events/b22d_logic.js';
import { REGIROCK_SPEC } from '../game/src/content/events/b22d_regirock.js';
import { REGICE_SPEC } from '../game/src/content/events/b22d_regice.js';
import { REGISTEEL_SPEC } from '../game/src/content/events/b22d_registeel.js';
import { REGIGIGAS_SPEC } from '../game/src/content/events/b22d_regigigas.js';
import { HEATRAN_SPEC } from '../game/src/content/events/b22d_heatran.js';
import { DARKRAI_SPEC, CRESSELIA_SPEC } from '../game/src/content/events/b22d_suenos.js';
import { MEWTWO_SPEC } from '../game/src/content/events/b22d_cierzo.js';
import { MARSHADOW_SPEC } from '../game/src/content/events/b22d_marshadow.js';
import { SPRITE, OBJ } from '../game/src/content/events/b22d_common.js';
import { GameState } from '../game/src/core/state.js';
import { nightmareEvents, lumbreEvents } from '../game/src/content/events/b22d_suenos.js';
import { resolveBackdrop } from '../game/src/battle/scene/setup.js';

const SPECS = [REGIROCK_SPEC, REGICE_SPEC, REGISTEEL_SPEC, REGIGIGAS_SPEC, HEATRAN_SPEC, DARKRAI_SPEC, CRESSELIA_SPEC, MEWTWO_SPEC, MARSHADOW_SPEC];
const EXPECTED = [70, 70, 70, 75, 72, 70, 70, 80, 70];
function config(request, { bag = { MASTERBALL: 1 } } = {}) {
  return buildBattleConfig({ ...request,
    player: { party: [mon('BLISSEY', 100, ['SPLASH'])], bag },
    opponent: { party: [pokemonFromSpec(db, request.wild, { rng: () => 0.5 })] },
  }, { db }).config;
}

test('B22d: especies, niveles, movimientos y gráficos de los nueve encuentros existen', () => {
  assert.deepEqual(SPECS.map((s) => s.level), EXPECTED);
  for (const s of [...SPECS, ...PROTOTYPES.map((p) => p.spec)]) {
    assert.ok(db.species[s.species], s.species);
    for (const move of s.moves) assert.ok(db.moves[move], `${s.species}: ${move}`);
    if (s.ability) assert.ok(db.abilities[s.ability], s.ability);
  }
  for (const [key, sprite] of Object.entries(SPRITE).filter(([key]) => SPECS.some((s) => s.species.toLowerCase() === key))) {
    const file = sprite.startsWith('follower:') ? `Followers/${sprite.split(':')[1]}` : sprite;
    assert.ok(fs.existsSync(new URL(`../Pokemon Anil V4.13/Graphics/Characters/${file}.png`, import.meta.url)), `${key}: ${file}`);
  }
  for (const sprite of Object.values(OBJ)) assert.ok(fs.existsSync(new URL(`../game/assets/${sprite.slice(6)}`, import.meta.url)), sprite);
});

test('B22d: los nueve originales permiten la captura real, almacenan nivel y consumen una Ball', async () => {
  for (const spec of SPECS) {
    const { result, ui } = await play(config(legendRequest(spec)), { script: [{ action: 'item', item: 'MASTERBALL' }] });
    assert.equal(result.outcome, 'caught', spec.species);
    assert.equal(result.caught.species, spec.species);
    assert.equal(result.caught.level, spec.level);
    assert.equal(result.bag.MASTERBALL, undefined);
    assert.ok(ui.events.some((e) => e.type === 'throwBall' && e.caught));
  }
});

test('B22d: intentar capturar cada prototipo no gasta la Ball, el turno ni altera sus PS', async () => {
  for (const proto of PROTOTYPES) {
    const { battle, ui } = await play(config(prototypeRequest(proto.spec, 'Este prototipo no se puede capturar.')),
      { script: [{ action: 'item', item: 'MASTERBALL' }], stopAfterScript: true });
    assert.equal(battle.bag.MASTERBALL, 1);
    assert.equal(battle.turnCount, 0);
    assert.equal(battle.battlers[1].hp, battle.battlers[1].totalhp);
    assert.ok(msgIndex(ui, 'Este prototipo no se puede capturar.') >= 0);
  }
});

test('B22d: los perfiles se manifiestan en estadísticas reales y el tercer prototipo cambia de tipo al atacar', async () => {
  const a = pokemonFromSpec(db, PROTOTYPES[0].spec, { rng: () => 0.5 });
  const b = pokemonFromSpec(db, PROTOTYPES[1].spec, { rng: () => 0.5 });
  const c = pokemonFromSpec(db, PROTOTYPES[2].spec, { rng: () => 0.5 });
  const simulate = async (pk, move) => play({ type: 'wild', player: { party: [pk] }, opponent: { party: [mon('BLISSEY', 100, ['SPLASH'])] } },
    { script: [{ action: 'fight', move }], stopAfterScript: true });
  const first = await simulate(a, 'SWORDSDANCE');
  assert.ok(first.battle.battlers[0].attack > first.battle.battlers[0].defense * 1.5, 'ataque extremo');
  const second = await simulate(b, 'BARRIER');
  assert.ok(second.battle.battlers[0].defense > second.battle.battlers[0].attack * 1.5, 'defensa extrema');
  const third = await simulate(c, 'FLAMETHROWER');
  assert.deepEqual(third.battle.battlers[0].pbTypes(), ['FIRE']);
  assert.ok(third.ui.messages.some((s) => s.includes('ha cambiado a tipo Fuego')));
});

test('B22d: los fondos de Darkrai y Cresselia existen en el catálogo de Añil', async () => {
  const state = GameState.create();
  for (const f of ['game_cleared', 'b21_fin', 'b22d_pesadilla_activa']) state.setFlag(f);
  state.addItem('DREAMCATCHER'); state.data.clock.minutes = 22 * 60;
  const requests = [];
  const ctx = { state, setFlag: (f, v = true) => state.setFlag(f, v), requestRefresh() {},
    say: async () => {}, cry() {}, warp: async () => {}, battle: async (r) => { requests.push(r); return 'caught'; } };
  for (const [events, id] of [[nightmareEvents(), 'darkrai'], [lumbreEvents(), 'cresselia']]) {
    const page = events.find((e) => e.id === id).pages.filter((p) => p.when(state)).at(-1);
    assert.ok(page, id); await page.script(ctx);
  }
  for (const r of requests) {
    const { file } = resolveBackdrop({ battleback: r.battleback, environment: r.environment, time: 'night' });
    assert.ok(fs.existsSync(new URL(`../Pokemon Anil V4.13/${file}`, import.meta.url)), file);
  }
});
