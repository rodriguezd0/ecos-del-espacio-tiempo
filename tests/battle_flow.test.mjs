// Tests del motor de combate: estados, captura, experiencia, cambios, dobles, mega, fases de jefe,
// huida y dinero. Deterministas (RNG constante o sembrado) con HeadlessBattleUI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, mon, play, damageEvents, msgIndex, MIN_ROLL, MAX_ROLL } from './battle_helpers.mjs';
import { expForLevel, speciesData } from '../game/src/battle/core/pokemon.js';

const wild = (player, foe, extra = {}) => ({ type: 'wild', player: { party: player, ...(extra.player || {}) }, opponent: { party: foe }, ...extra.cfg });

// ---------------------------------------------------------------- estados
test('parálisis: Onda Trueno paraliza, reduce la Velocidad a la mitad y puede impedir moverse', async () => {
  const { battle, ui } = await play(wild([mon('PIKACHU', 30, ['THUNDERWAVE', 'SPLASH'])], [mon('RATTATA', 30, ['TAILWHIP'])], { cfg: { rng: MIN_ROLL } }),
    { script: [{ action: 'fight', move: 'THUNDERWAVE' }, { action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  const foe = battle.battlers[1];
  assert.equal(foe.status, 'PARALYSIS');
  assert.equal(foe.pbSpeed(), Math.max(1, Math.round(foe.speed / 2)));
  assert.ok(msgIndex(ui, 'sufre parálisis') >= 0);
  assert.ok(msgIndex(ui, '¡El Rattata salvaje está paralizado! ¡No se puede mover!') >= 0, ui.messages.join('\n'));
});

test('veneno grave: Tóxico quita 1/16, 2/16… al final de cada ronda', async () => {
  const { battle } = await play(wild([mon('BULBASAUR', 30, ['TOXIC', 'SPLASH'])], [mon('RATTATA', 30, ['TAILWHIP'])], { cfg: { rng: MIN_ROLL } }),
    { script: [{ action: 'fight', move: 'TOXIC' }, { action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  const foe = battle.battlers[1];
  const t = foe.totalhp;
  assert.equal(foe.status, 'POISON');
  assert.equal(foe.hp, t - Math.floor(t / 16) - Math.floor((2 * t) / 16));
});

test('quemadura: Fuego Fatuo quema y resta 1/16 por ronda', async () => {
  const { battle, ui } = await play(wild([mon('VULPIX', 30, ['WILLOWISP'])], [mon('RATTATA', 30, ['TAILWHIP'])], { cfg: { rng: MIN_ROLL } }),
    { script: [{ action: 'fight', move: 'WILLOWISP' }], stopAfterScript: true });
  const foe = battle.battlers[1];
  assert.equal(foe.status, 'BURN');
  assert.equal(foe.hp, foe.totalhp - Math.floor(foe.totalhp / 16));
  assert.ok(msgIndex(ui, 'se resiente de la quemadura') >= 0);
});

test('Protección bloquea el ataque del rival', async () => {
  const { battle, ui } = await play(wild([mon('SQUIRTLE', 30, ['PROTECT'])], [mon('RATTATA', 30, ['TACKLE'])]),
    { script: [{ action: 'fight', move: 'PROTECT' }], stopAfterScript: true });
  assert.equal(battle.battlers[0].hp, battle.battlers[0].totalhp);
  assert.ok(msgIndex(ui, 'se ha protegido') >= 0, ui.messages.join('\n'));
});

// ---------------------------------------------------------------- captura
test('captura: la Master Ball siempre atrapa y el resultado devuelve el Pokémon', async () => {
  const { result, ui } = await play(wild([mon('PIKACHU', 10, ['TACKLE'])], [mon('RATTATA', 5, ['TAILWHIP'])], { player: { bag: { MASTERBALL: 1 } } }),
    { script: [{ action: 'item', item: 'MASTERBALL' }] });
  assert.equal(result.outcome, 'caught');
  assert.equal(result.caught.species, 'RATTATA');
  assert.equal(result.caught.ball, 'MASTERBALL');
  assert.equal(result.bag.MASTERBALL, undefined);
  assert.ok(ui.events.some((e) => e.type === 'throwBall' && e.caught));
});

test('captura: sacudidas deterministas (RNG alto falla, RNG bajo atrapa)', async () => {
  const fail = await play(wild([mon('PIKACHU', 10, ['TACKLE'])], [mon('RATTATA', 5, ['TAILWHIP'])], { player: { bag: { POKEBALL: 1 } } }),
    { script: [{ action: 'item', item: 'POKEBALL' }], stopAfterScript: true });
  assert.ok(msgIndex(fail.ui, '¡Oh, no! ¡El Pokémon se ha escapado!') >= 0);
  assert.equal(fail.battle.bag.POKEBALL, undefined); // la Ball se gastó
  const ok = await play(wild([mon('PIKACHU', 10, ['TACKLE'])], [mon('RATTATA', 5, ['TAILWHIP'])], { player: { bag: { POKEBALL: 1 } }, cfg: { rng: MIN_ROLL } }),
    { script: [{ action: 'item', item: 'POKEBALL' }] });
  assert.equal(ok.result.outcome, 'caught');
});

test('captura bloqueada por reglas: se explica el motivo y no se gasta ni la Ball ni el turno', async () => {
  const { battle, ui } = await play(wild([mon('PIKACHU', 10, ['TACKLE'])], [mon('RATTATA', 5, ['TAILWHIP'])], {
    player: { bag: { POKEBALL: 3 } },
    cfg: { rules: { catchCondition: () => ({ allowed: false, reason: '¡Una fuerza misteriosa desvía la Ball!' }) } },
  }), { script: [{ action: 'item', item: 'POKEBALL' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, '¡Una fuerza misteriosa desvía la Ball!') >= 0);
  assert.equal(battle.bag.POKEBALL, 3);
  assert.equal(battle.turnCount, 0);
  assert.equal(msgIndex(ui, 'Rattata salvaje ha usado'), -1);
});

test('captura: canCatch=false también bloquea con motivo configurable', async () => {
  const { battle, ui } = await play(wild([mon('PIKACHU', 10, ['TACKLE'])], [mon('RATTATA', 5, ['TAILWHIP'])], {
    player: { bag: { POKEBALL: 1 } }, cfg: { rules: { canCatch: false, catchReason: 'No puedes capturarlo.' } },
  }), { script: [{ action: 'item', item: 'POKEBALL' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'No puedes capturarlo.') >= 0);
  assert.equal(battle.bag.POKEBALL, 1);
});

// ---------------------------------------------------------------- experiencia
test('experiencia escalada (gen 5/7+): derrotar a un Squirtle Nv.30 con Pikachu Nv.50', async () => {
  const { result, ui } = await play(wild([mon('PIKACHU', 50, ['THUNDERBOLT'])], [mon('SQUIRTLE', 30, ['TAILWHIP'])]));
  const baseExp = speciesData(db, 'SQUIRTLE').baseExp;
  const adjust = Math.sqrt(((2 * 30 + 10) / (50 + 30 + 10)) ** 5);
  const expected = Math.floor(Math.floor((30 * baseExp) / 5) * adjust) + 1;
  assert.equal(result.outcome, 'win');
  assert.ok(msgIndex(ui, `¡Pikachu ha ganado ${expected} puntos de experiencia!`) >= 0, ui.messages.join('\n'));
  const before = expForLevel(speciesData(db, 'PIKACHU').growthRate, 50);
  assert.equal(result.playerParty[0].exp, before + expected);
  assert.ok(result.playerParty[0].evs.spe >= 0);
});

test('subida de nivel: aprende un movimiento nuevo sustituyendo el primero (ui.learnMove)', async () => {
  const pika = mon('PIKACHU', 7, ['TACKLE', 'GROWL', 'TAILWHIP', 'THUNDERSHOCK']);
  const learnAt8 = db.species.PIKACHU.moves.filter(([lv]) => lv === 8).map(([, m]) => m);
  assert.ok(learnAt8.length > 0, 'Pikachu aprende algo a nivel 8');
  pika.exp = expForLevel(speciesData(db, 'PIKACHU').growthRate, 8) - 1;
  const { result, ui } = await play(wild([pika], [mon('RATTATA', 3, ['TAILWHIP'])]),
    { script: [{ action: 'fight', move: 'THUNDERSHOCK' }], learnMove: 'replaceFirst' });
  const p = result.playerParty[0];
  assert.equal(p.level, 8);
  assert.ok(ui.events.some((e) => e.type === 'learnMove' && learnAt8.includes(e.move)));
  assert.ok(learnAt8.includes(p.moves[0].id));
  assert.ok(result.levelUps.some((l) => l.from === 7 && l.to === 8));
});

// ---------------------------------------------------------------- cambios
test('cambio forzado: al debilitarse, el jugador elige sustituto y el combate continúa', async () => {
  const { result, ui } = await play(wild([mon('PIKACHU', 3, ['GROWL']), mon('GEODUDE', 60, ['EARTHQUAKE'])], [mon('MACHOP', 30, ['KARATECHOP'])]),
    { switchTo: [1] });
  const ins = ui.events.filter((e) => e.type === 'switchIn').map((e) => e.species);
  assert.ok(ins.includes('GEODUDE'), JSON.stringify(ins));
  assert.ok(msgIndex(ui, '¡Pikachu se debilitó!') >= 0);
  assert.equal(result.outcome, 'win');
});

test('cambio voluntario: el sustituto recibe el golpe del turno', async () => {
  const { battle, ui } = await play(wild([mon('PIKACHU', 30, ['TACKLE']), mon('GEODUDE', 30, ['DEFENSECURL'])], [mon('RATTATA', 30, ['TACKLE'])]),
    { script: [{ action: 'switch', index: 1 }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'Pikachu') >= 0);
  assert.equal(battle.battlers[0].species, 'GEODUDE');
  assert.equal(damageEvents(ui, 0).length, 1);
  assert.equal(battle.battlers[0].pokemonIndex, 1);
});

test('Ida y Vuelta saca al usuario tras golpear', async () => {
  const { battle } = await play(wild([mon('SCYTHER', 40, ['UTURN']), mon('GEODUDE', 30, ['DEFENSECURL'])], [mon('SNORLAX', 50, ['SPLASH'])]),
    { script: [{ action: 'fight', move: 'UTURN' }], switchTo: [1], stopAfterScript: true });
  assert.equal(battle.battlers[0].species, 'GEODUDE');
});

// ---------------------------------------------------------------- dobles
test('combate doble con aliado: cuatro combatientes y el aliado actúa con su IA', async () => {
  const { battle, ui, result } = await play({
    type: 'trainer', format: 'double',
    player: { party: [mon('PIKACHU', 40, ['THUNDERBOLT'])] },
    ally: { name: 'Lira', party: [mon('SQUIRTLE', 40, ['WATERGUN'])] },
    opponent: { name: 'Gemelas', baseMoney: 20, party: [mon('RATTATA', 20, ['TACKLE']), mon('PIDGEY', 20, ['TACKLE'])] },
  });
  assert.equal(battle.battlers.filter(Boolean).length, 4);
  assert.ok(msgIndex(ui, 'El Squirtle aliado ha usado') >= 0, ui.messages.slice(0, 20).join('\n'));
  assert.equal(result.outcome, 'win');
});

test('dobles: Terremoto golpea a todos los adyacentes con daño reducido (×0.75)', async () => {
  const { ui } = await play({
    type: 'wild', format: 'double',
    player: { party: [mon('GARCHOMP', 50, ['EARTHQUAKE']), mon('PIDGEY', 30, ['SPLASH'])] },
    opponent: { party: [mon('SNORLAX', 60, ['SPLASH']), mon('SNORLAX', 60, ['SPLASH'])] },
  }, { script: [{ action: 'fight', move: 'EARTHQUAKE' }, { action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  assert.equal(damageEvents(ui, 1).length, 1);
  assert.equal(damageEvents(ui, 3).length, 1);
  assert.equal(damageEvents(ui, 2).length, 0, 'Pidgey vuela: inmune a Terremoto');
});

// ---------------------------------------------------------------- megaevolución
test('megaevolución: Garchomp con Garchompita megaevoluciona y vuelve a su forma al terminar', async () => {
  const chomp = mon('GARCHOMP', 60, ['DRAGONCLAW'], { heldItem: 'GARCHOMPITE' });
  const { result, ui } = await play(wild([chomp], [mon('RATTATA', 10, ['TAILWHIP'])]),
    { script: [{ action: 'fight', move: 'DRAGONCLAW', mega: true }] });
  assert.ok(ui.messages.some((m) => /megaevolucion/i.test(m)), ui.messages.join('\n'));
  assert.ok(ui.events.some((e) => e.type === 'changeForm' && e.species === 'GARCHOMP' && e.form === 1));
  assert.equal(result.playerParty[0].form, 0);
  assert.equal(result.playerParty[0].heldItem, 'GARCHOMPITE');
});

test('megaevolución del rival: nombra su propio aro (megaRingName) o el Mega Aro por defecto', async () => {
  const battleWith = (extra) => play({
    type: 'trainer', player: { party: [mon('SNORLAX', 70, ['SPLASH'])] },
    opponent: { name: 'Gael', party: [mon('ABSOL', 55, ['BITE'], { heldItem: 'ABSOLITE' })], megaRing: true, skill: 100, ...extra },
  }, { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  const black = await battleWith({ megaRingName: 'el aro negro' });
  assert.ok(black.ui.messages.some((m) => /reaccionando al aro negro de Gael/.test(m)), black.ui.messages.join('\n'));
  const plain = await battleWith({});
  assert.ok(plain.ui.messages.some((m) => /reaccionando al Mega Aro de Gael/.test(m)), plain.ui.messages.join('\n'));
});

test('megaevolución: solo una por combate y bando', async () => {
  const a = mon('GARCHOMP', 60, ['DRAGONCLAW'], { heldItem: 'GARCHOMPITE' });
  const b = mon('ABSOL', 60, ['BITE'], { heldItem: 'ABSOLITE' });
  const { battle } = await play({
    type: 'wild', format: 'double', player: { party: [a, b] },
    opponent: { party: [mon('SNORLAX', 70, ['SPLASH']), mon('SNORLAX', 70, ['SPLASH'])] },
  }, { script: [{ action: 'fight', move: 'DRAGONCLAW', mega: true }, { action: 'fight', move: 'BITE', mega: true }], stopAfterScript: true });
  const megas = [battle.battlers[0], battle.battlers[2]].filter((x) => x.mega());
  assert.equal(megas.length, 1);
});

// ---------------------------------------------------------------- fases de jefe
test('fases de jefe: el jefe no se debilita, cambia de tipo y sigue; la captura solo en la última fase', async () => {
  const boss = mon('RATTATA', 20, ['TAILWHIP']);
  const { result, ui, battle } = await play(wild([mon('GARCHOMP', 80, ['EARTHQUAKE'])], [boss], {
    player: { bag: { MASTERBALL: 1 } },
    cfg: {
      phases: [{ types: ['GHOST'], message: '¡El jefe cambia de fase!', name: 'fantasma' }],
      rules: { catchCondition: (b) => (b.bossInFinalPhase() ? { allowed: true } : { allowed: false, reason: 'Aún no es posible.' }) },
    },
  }), { script: [{ action: 'item', item: 'MASTERBALL' }, { action: 'fight', move: 'EARTHQUAKE' }, { action: 'item', item: 'MASTERBALL' }] });
  assert.ok(msgIndex(ui, 'Aún no es posible.') >= 0);
  assert.ok(msgIndex(ui, '¡El jefe cambia de fase!') >= 0);
  assert.equal(battle.phaseState.index, 1);
  assert.equal(result.outcome, 'caught');
  assert.equal(result.phase.index, 1);
});

// ---------------------------------------------------------------- huida y dinero
test('huida: el más rápido escapa siempre; el lento falla con tirada alta', async () => {
  const fast = await play(wild([mon('PIKACHU', 30, ['TACKLE'])], [mon('SNORLAX', 30, ['SPLASH'])]), { script: [{ action: 'run' }] });
  assert.equal(fast.result.outcome, 'run');
  assert.ok(msgIndex(fast.ui, '¡Escapas sin problemas!') >= 0, fast.ui.messages.join('\n'));
  const slow = await play(wild([mon('SNORLAX', 30, ['TACKLE'])], [mon('PIKACHU', 30, ['TAILWHIP'])], { cfg: { rng: MAX_ROLL } }),
    { script: [{ action: 'run' }], stopAfterScript: true });
  assert.ok(msgIndex(slow.ui, '¡No puedes huir!') >= 0, slow.ui.messages.join('\n'));
  assert.equal(slow.battle.decision, 0);
});

test('dinero: ganar a un entrenador da nivel máximo × dinero base', async () => {
  const { result, ui } = await play({
    type: 'trainer', player: { party: [mon('GARCHOMP', 60, ['EARTHQUAKE'])], money: 100 },
    opponent: { name: 'Pablo', baseMoney: 40, party: [mon('RATTATA', 10, ['TACKLE']), mon('RATTATA', 12, ['TACKLE'])] },
  });
  assert.equal(result.outcome, 'win');
  assert.equal(result.moneyChange, 480);
  assert.equal(result.money, 580);
  assert.ok(msgIndex(ui, '480$') >= 0);
});

test('dinero: perder cuesta dinero según el nivel máximo y las medallas', async () => {
  const { result } = await play({
    type: 'trainer', player: { party: [mon('RATTATA', 5, ['GROWL'])], money: 1000 },
    opponent: { name: 'Pablo', party: [mon('GARCHOMP', 60, ['EARTHQUAKE'])] },
  });
  assert.equal(result.outcome, 'lose');
  assert.equal(result.moneyChange, -(5 * 8));
});
