// Tests del motor de combate: habilidades, objetos equipados y cambios forzados por efectos
// (Retirada, Botón Escape, Tarjeta Roja, Mochila Escape, Salida de Emergencia de Añil, Relevo…).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mon, play, damageEvents, msgIndex, MIN_ROLL } from './battle_helpers.mjs';

const trainer = (player, foe, extra = {}) => ({ type: 'trainer', player: { party: player }, opponent: { name: 'Pablo', party: foe }, ...extra });
const wild = (player, foe, extra = {}) => ({ type: 'wild', player: { party: player }, opponent: { party: foe }, ...extra });

// ---------------------------------------------------------------- habilidades
test('Intimidación baja el Ataque del rival al entrar', async () => {
  const { battle, ui } = await play(wild([mon('MACHOP', 30, ['TACKLE'])], [mon('GROWLITHE', 30, ['SPLASH'], { ability: 'INTIMIDATE' })]),
    { script: [], stopAfterScript: true });
  assert.equal(battle.battlers[0].stages.ATTACK, -1);
  assert.ok(msgIndex(ui, 'El Ataque de Machop ha disminuido') >= 0, ui.messages.join('\n'));
});

test('Levitación da inmunidad a Tierra', async () => {
  const { battle } = await play(wild([mon('GARCHOMP', 50, ['EARTHQUAKE'])], [mon('GASTLY', 30, ['SPLASH'], { ability: 'LEVITATE' })]),
    { script: [{ action: 'fight', move: 'EARTHQUAKE' }], stopAfterScript: true });
  assert.equal(battle.battlers[1].hp, battle.battlers[1].totalhp);
});

test('Robustez aguanta un golpe mortal con los PS al máximo', async () => {
  const { battle, ui } = await play(wild([mon('GARCHOMP', 80, ['EARTHQUAKE'])], [mon('GEODUDE', 10, ['SPLASH'], { ability: 'STURDY' })]),
    { script: [{ action: 'fight', move: 'EARTHQUAKE' }], stopAfterScript: true });
  assert.equal(battle.battlers[1].hp, 1);
  assert.ok(msgIndex(ui, 'ha aguantado el golpe') >= 0);
});

test('Absorbe Fuego: inmune al fuego y potencia sus ataques de fuego', async () => {
  const { battle, ui } = await play(wild([mon('CHARMANDER', 40, ['EMBER'])], [mon('VULPIX', 40, ['SPLASH'], { ability: 'FLASHFIRE' })]),
    { script: [{ action: 'fight', move: 'EMBER' }], stopAfterScript: true });
  assert.equal(battle.battlers[1].hp, battle.battlers[1].totalhp);
  assert.equal(battle.battlers[1].effects.FlashFire, true);
  assert.ok(msgIndex(ui, 'El poder de los ataques de tipo Fuego') >= 0);
});

test('Llovizna invoca la lluvia al entrar', async () => {
  const { battle } = await play(wild([mon('PELIPPER', 30, ['SPLASH'], { ability: 'DRIZZLE' })], [mon('RATTATA', 10, ['SPLASH'])]),
    { script: [], stopAfterScript: true });
  assert.equal(battle.field.weather, 'Rain');
  assert.equal(battle.field.weatherDuration, 5);
});

test('Retirada (Wimp Out): en combate salvaje, el Pokémon del jugador huye al bajar de la mitad', async () => {
  const { result } = await play(wild([mon('WIMPOD', 50, ['SPLASH'], { ability: 'WIMPOUT' }), mon('RATTATA', 50, ['TACKLE'])],
    [mon('PIKACHU', 50, ['THUNDERSHOCK'])]), { script: [{ action: 'fight', move: 'SPLASH' }] });
  assert.equal(result.outcome, 'run');
});

test('Retirada (Wimp Out): contra un entrenador, se retira y entra el sustituto elegido', async () => {
  const { battle, ui } = await play(trainer([mon('WIMPOD', 50, ['SPLASH'], { ability: 'WIMPOUT' }), mon('RATTATA', 50, ['TACKLE'])],
    [mon('PIKACHU', 50, ['THUNDERSHOCK'])]), { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, '¡Wimpod regresó con Axis!') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[0].species, 'RATTATA');
});

test('Salida de Emergencia (Añil): tras usar un movimiento Bicho, el usuario vuelve y entra otro', async () => {
  const { battle, ui } = await play(trainer([mon('GOLISOPOD', 50, ['XSCISSOR'], { ability: 'EMERGENCYEXIT' }), mon('RATTATA', 50, ['TACKLE'])],
    [mon('SNORLAX', 60, ['SPLASH'])]), { script: [{ action: 'fight', move: 'XSCISSOR' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'regresó con') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[0].species, 'RATTATA');
});

// ---------------------------------------------------------------- objetos equipados
test('Restos cura 1/16 al final de la ronda', async () => {
  const p = mon('SNORLAX', 50, ['SPLASH'], { heldItem: 'LEFTOVERS' });
  const { battle } = await play(wild([p], [mon('RATTATA', 50, ['TACKLE'])]), { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  const b = battle.battlers[0];
  const [hit] = damageEvents({ events: [] }, 0);
  assert.equal(hit, undefined);
  assert.ok(b.hp > 0);
  assert.ok(battle.log.some((m) => m.includes('ha recuperado unos pocos PS con Restos')), battle.log.join('\n'));
});

test('Baya Zidra cura 1/4 al bajar de la mitad', async () => {
  const p = mon('SQUIRTLE', 50, ['SPLASH'], { heldItem: 'SITRUSBERRY' });
  const { battle, ui } = await play(wild([p], [mon('PIKACHU', 50, ['THUNDERBOLT'])]),
    { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'Baya Zidra') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[0].item, null);
});

test('Vidasfera: ×1.3 de daño y pierde 1/10 de sus PS', async () => {
  const { battle, ui } = await play(wild([mon('PIKACHU', 50, ['THUNDERSHOCK'], { heldItem: 'LIFEORB' })], [mon('SNORLAX', 60, ['SPLASH'])]),
    { script: [{ action: 'fight', move: 'THUNDERSHOCK' }], stopAfterScript: true });
  const b = battle.battlers[0];
  assert.equal(b.hp, b.totalhp - Math.floor(b.totalhp / 10));
  assert.ok(msgIndex(ui, 'ha perdido algunos PS') >= 0);
});

test('Banda Focus: sobrevive con 1 PS y se consume', async () => {
  const { battle, ui } = await play(wild([mon('GARCHOMP', 80, ['EARTHQUAKE'])], [mon('PIKACHU', 10, ['SPLASH'], { heldItem: 'FOCUSSASH' })]),
    { script: [{ action: 'fight', move: 'EARTHQUAKE' }], stopAfterScript: true });
  assert.equal(battle.battlers[1].hp, 1);
  assert.equal(battle.battlers[1].item, null);
  assert.ok(msgIndex(ui, 'Banda Aguante') >= 0, ui.messages.join('\n'));
});

test('Cinta Elección: bloquea en el primer movimiento usado', async () => {
  const { battle } = await play(wild([mon('MACHOP', 50, ['TACKLE', 'LOWKICK'], { heldItem: 'CHOICEBAND' })], [mon('SNORLAX', 60, ['SPLASH'])]),
    { script: [{ action: 'fight', move: 'TACKLE' }], stopAfterScript: true });
  const b = battle.battlers[0];
  assert.equal(b.effects.ChoiceBand, 'TACKLE');
  assert.equal(battle.pbCanChooseMove(0, 1, false), false);
  assert.equal(battle.pbCanChooseMove(0, 0, false), true);
});

test('Botón Escape: al recibir el golpe, el portador vuelve y entra el sustituto', async () => {
  const { battle, ui } = await play(trainer([mon('SNORLAX', 50, ['SPLASH'], { heldItem: 'EJECTBUTTON' }), mon('RATTATA', 50, ['TACKLE'])],
    [mon('MACHOP', 50, ['KARATECHOP'])]), { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'regresa gracias a') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[0].species, 'RATTATA');
});

test('Tarjeta Roja: el atacante es sacado del combate', async () => {
  const { battle, ui } = await play(trainer([mon('SNORLAX', 50, ['SPLASH'], { heldItem: 'REDCARD' })],
    [mon('MACHOP', 50, ['KARATECHOP']), mon('ZUBAT', 50, ['SPLASH'])]), { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'fue arrastrado al combate') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[1].species, 'ZUBAT');
});

test('Mochila Escape: al bajar una característica, el portador se retira', async () => {
  const { battle, ui } = await play(trainer([mon('SNORLAX', 50, ['SPLASH'], { heldItem: 'EJECTPACK' }), mon('RATTATA', 50, ['TACKLE'])],
    [mon('ZUBAT', 50, ['GROWL'])]), { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'regresa gracias a') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[0].species, 'RATTATA');
});

// ---------------------------------------------------------------- movimientos con cambios
test('Relevo pasa los cambios de características al sustituto', async () => {
  const { battle } = await play(trainer([mon('NINJASK', 50, ['SWORDSDANCE', 'BATONPASS']), mon('MACHOP', 50, ['TACKLE'])],
    [mon('SNORLAX', 60, ['SPLASH'])]), {
    script: [{ action: 'fight', move: 'SWORDSDANCE' }, { action: 'fight', move: 'BATONPASS' }], stopAfterScript: true,
  });
  assert.equal(battle.battlers[0].species, 'MACHOP');
  assert.equal(battle.battlers[0].stages.ATTACK, 2);
});

test('Rugido saca a un Pokémon aleatorio del rival (entrenador)', async () => {
  const { battle, ui } = await play(trainer([mon('SNORLAX', 50, ['ROAR'])],
    [mon('MACHOP', 40, ['SPLASH']), mon('ZUBAT', 40, ['SPLASH'])]), { script: [{ action: 'fight', move: 'ROAR' }], stopAfterScript: true });
  assert.ok(msgIndex(ui, 'fue arrastrado al combate') >= 0, ui.messages.join('\n'));
  assert.equal(battle.battlers[1].species, 'ZUBAT');
});

test('Plegaria Vital reanima a un aliado debilitado con la mitad de PS', async () => {
  const fainted = mon('RATTATA', 30, ['TACKLE']);
  fainted.hp = 0;
  const { battle, ui } = await play(wild([mon('PAWMOT', 50, ['REVIVALBLESSING']), fainted], [mon('SNORLAX', 60, ['SPLASH'])]),
    { script: [{ action: 'fight', move: 'REVIVALBLESSING' }], stopAfterScript: true });
  const p = battle.pbParty(0)[1];
  assert.ok(p.hp > 0);
  assert.equal(p.hp, Math.floor(battle.maxHPOf(p) / 2));
  assert.ok(msgIndex(ui, 'ha revivido') >= 0, ui.messages.join('\n'));
});

test('Metrónomo llama a otro movimiento (determinista con semilla)', async () => {
  const { ui } = await play(wild([mon('CLEFAIRY', 50, ['METRONOME'])], [mon('SNORLAX', 60, ['SPLASH'])], { rng: MIN_ROLL }),
    { script: [{ action: 'fight', move: 'METRONOME' }], stopAfterScript: true });
  const i = msgIndex(ui, 'Clefairy ha usado Metrónomo');
  assert.ok(i >= 0);
  assert.ok(ui.messages.slice(i + 1).some((m) => m.startsWith('¡Clefairy ha usado')), ui.messages.join('\n'));
});
