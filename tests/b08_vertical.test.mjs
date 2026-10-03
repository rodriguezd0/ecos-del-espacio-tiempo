import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../game/src/content/maps/index.js';
import { GameState } from '../game/src/core/state.js';
import { F } from '../game/src/content/events/b08_common.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { P4_VERTICAL as P } from '../game/src/content/maps/b08/layout.js';

test('P4 vertical: entrenadores, contrapesos y Fermín ocupan sus tres pisos', async () => {
  const floor = async (id, number) => {
    assert.ok(MAPS[id], `${id}: registrado`);
    const def = (await MAPS[id]()).default;
    assert.deepEqual(def.pillar, { id: 'P4', floor: number });
    assert.ok(!def.outdoor);
    return def;
  };
  const base = await floor('camara_contrapesos_base', 1);
  const puzzle = await floor('camara_contrapesos', 2);
  const core = await floor('camara_contrapesos_nucleo', 3);
  assert.deepEqual(base.events.filter((e) => e.trainer).map((e) => e.trainer).sort(), ['b08_minera_cerro', 'b08_montanero_cerro']);
  assert.ok(!puzzle.events.some((e) => ['fermin_camara', 'nucleo_masa'].includes(e.id)));
  assert.ok(core.events.some((e) => e.id === 'fermin_camara'));
  assert.ok(core.events.some((e) => e.id === 'nucleo_masa'));
  assert.equal(puzzle.warps[0].to, base.id);
  const up = puzzle.events.find((e) => e.id === 'subida_nucleo');
  assert.ok(up, 'escalera después de la Balanza');
  const state = GameState.create({ name: 'P' });
  const calls = [];
  const ctx = { state, flag: (f) => state.flag(f), say: async () => {}, se: () => {}, warp: async (...args) => calls.push(args) };
  await up.script(ctx);
  assert.deepEqual(calls, [], 'sin Balanza no se sube');
  state.setFlag(F.balance);
  await up.script(ctx);
  assert.equal(calls[0][0], core.id);
  const pedestal = core.events.find((e) => e.id === 'nucleo_masa');
  assert.ok(!pedestal.pages[1].when(state), 'la Balanza no sustituye el combate');
  state.setFlag(F.fermin);
  assert.ok(pedestal.pages[1].when(state));
});

test('P4: conserva las derrotas de entrenadores de Cerro en las partidas anteriores', async () => {
  const state = GameState.create({ name: 'P' });
  state.setSelfSwitch('cerro_plomo', 'minera_blanca');
  const base = (await MAPS.camara_contrapesos_base()).default;
  await base.onEnter({ state, requestRefresh: () => {} });
  assert.ok(state.selfSwitch(base.id, 'minera_blanca'));
  assert.ok(!state.selfSwitch(base.id, 'montanero_octavio'));
});

test('P4: Fermín sigue visible durante el verso hasta su despedida', async () => {
  const core = (await MAPS.camara_contrapesos_nucleo()).default;
  const fermin = core.events.find((e) => e.id === 'fermin_camara');
  const state = GameState.create({ name: 'P' });
  const visible = () => fermin.pages.some((p) => !p.when || p.when(state));
  assert.ok(!visible(), 'aún no se ha resuelto la Balanza');
  state.setFlag(F.balance);
  assert.ok(visible(), 'vigila la entrada al núcleo');
  state.setFlag(F.fermin);
  assert.ok(visible(), 'se queda tras el combate');
  state.setFlag(F.restored);
  assert.ok(visible(), 'la restauración no lo borra mientras se lee el verso');
  state.setFlag(F.ferminLeft);
  assert.ok(!visible(), 'su despedida termina en la salida');
  const oldSave = GameState.create({ name: 'P' });
  oldSave.setFlag(F.restored);
  assert.ok(fermin.pages.some((p) => !p.when || p.when(oldSave)), 'la restauración basta para una partida anterior');
});

test('P4: Fermín se despide andando hasta la escalera del nuevo núcleo', async () => {
  const state = GameState.create({ name: 'P' });
  state.setFlag(F.balance);
  state.setFlag(F.fermin);
  const { def, entry } = await buildMapNode('camara_contrapesos_nucleo');
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  world.player.moveTo(P.pedestal.x, P.pedestal.y + 1);
  const fermin = world.events.find((e) => e.id === 'fermin_camara');
  fermin.moveTo(P.guardian.x + 2, P.guardian.y);
  let erased = false;
  const ctx = {
    state, world, player: world.player,
    flag: (f) => state.flag(f),
    setFlag: (f) => {
      if (f === F.ferminLeft) assert.deepEqual([fermin.x, fermin.y], [P.down.x, P.down.y], 'llega antes de su despedida');
      state.setFlag(f);
    },
    say: async () => {}, se: () => {}, shake: () => {}, tone: async () => {},
    move: async (actor, route) => {
      const ev = typeof actor === 'string' ? world.events.find((e) => e.id === actor) : actor;
      for (const step of route) {
        const [dir, dx, dy] = { up: [8, 0, -1], down: [2, 0, 1], left: [4, -1, 0], right: [6, 1, 0] }[step];
        assert.ok(!state.flag(F.ferminLeft), 'sigue visible mientras camina');
        assert.ok(world.map.passable(ev.x, ev.y, dir, ev) && world.map.passable(ev.x + dx, ev.y + dy, 10 - dir, ev), 'camina por el suelo');
        ev.moveTo(ev.x + dx, ev.y + dy);
      }
    },
    erase: (ev) => {
      assert.deepEqual([ev.x, ev.y], [P.down.x, P.down.y], 'se oculta en la escalera');
      erased = true;
    },
    story: {
      restorePillar: async (id, opts) => {
        assert.equal(id, 4);
        state.setFlag(F.restored);
        world.refreshEvents();
        await opts.onRestored(ctx);
        return true;
      },
      openClue: async () => {},
    },
  };
  await def.events.find((e) => e.id === 'nucleo_masa').pages[1].script(ctx);
  assert.ok(state.flag(F.ferminLeft) && erased);
});
