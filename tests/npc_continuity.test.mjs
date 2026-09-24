// Continuidad de personajes entre bloques: nunca dos Anselmo a la vez en la calle de Caudal (B03) y dentro del Molino
// del Diezmo (B05), y Abril visible en la Sala del Pilar hasta su despedida y después en Brontia (B06 → B05).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anselmoEvent } from '../game/src/content/events/b03_caudal_npcs.js';
import { millEvents } from '../game/src/content/events/b05_t02.js';
import { brontiaEvents } from '../game/src/content/events/b05_brontia.js';
import { abrilSalaEvent } from '../game/src/content/events/b06_nucleo.js';
import casaAbril from '../game/src/content/maps/b05/brontia_casa_abril.js';

/** Estado mínimo para las condiciones when(): flags y hora. */
const fakeState = (flags = [], hour = 12) => {
  const set = new Set(flags);
  return { flag: (k) => set.has(k), var: () => 0, hour };
};
const visible = (ev, s) => (ev.pages ? ev.pages.some((p) => !p.when || p.when(s)) : !ev.when || ev.when(s));

test('Anselmo: en la calle hasta verlo dentro del molino; en el molino desde P2 y para siempre', () => {
  const street = anselmoEvent();
  const mill = millEvents().find((e) => e.id === 'anselmo');
  const stages = [
    { flags: [], street: true, mill: false }, // B03: frente al molino, da la pista T02
    { flags: ['b03_anselmo_t02'], street: true, mill: false },
    { flags: ['b03_anselmo_t02', 'p2_restored'], street: true, mill: true }, // el río vuelve: entra al Diezmo
    { flags: ['p2_restored', 'b05_t02_anselmo'], street: false, mill: true }, // ya visto dentro (escena de entrada)
    { flags: ['p2_restored', 'b05_t02_anselmo', 'b05_t02_eje_abierto'], street: false, mill: true },
    { flags: ['p2_restored', 'b05_t02_anselmo', 'b05_t02_tablilla'], street: false, mill: true }, // «Oye cómo muele»
  ];
  for (const st of stages) {
    const s = fakeState(st.flags);
    assert.equal(visible(street, s), st.street, `calle con ${st.flags.join(',') || 'nada'}`);
    assert.equal(visible(mill, s), st.mill, `molino con ${st.flags.join(',') || 'nada'}`);
    assert.ok(visible(street, s) || visible(mill, s), 'Anselmo siempre está en algún sitio');
  }
});

test('Abril: en la Sala hasta su despedida (aunque el Pilar ya esté restaurado) y después en Brontia', () => {
  const sala = abrilSalaEvent();
  const plaza = brontiaEvents().find((e) => e.id === 'abril');
  const home = casaAbril.events.find((e) => e.id === 'abril_casa');
  const day = (flags) => fakeState(flags, 12);
  const night = (flags) => fakeState(flags, 23);
  assert.ok(visible(sala, day(['b06_abril_sala'])));
  assert.ok(visible(sala, day(['b06_abril_sala', 'p3_restored'])), 'sigue en la Sala mientras se lee el verso');
  assert.ok(!visible(sala, day(['b06_abril_sala', 'p3_restored', 'b06_abril_despedida'])));
  assert.ok(!visible(plaza, day([])) && !visible(home, night([])), 'antes del P3 acampa en el Anillo');
  assert.ok(visible(plaza, day(['p3_restored'])) && !visible(home, day(['p3_restored'])), 'tras el P3, de día en la plaza');
  assert.ok(visible(home, night(['p3_restored'])) && !visible(plaza, night(['p3_restored'])), 'tras el P3, de noche en casa');
});
