import { F, OBJ, canDepart, onlyAlmenara, lines } from './b23_common.js';
import { bossBattle } from '../common/bossBattle.js';
import { takeFerry } from '../../world/transport.js';
import { clerkEvent } from '../services/shop.js';

const won = (key) => `dlc1_tecnico_${key}`;
const teams = {
  bomba: ['HELIOLISK', 'MAGNEZONE'], salinas: ['SKARMORY', 'CLAYDOL', 'MAGNEZONE'],
  crisol_o: ['PORYGONZ', 'KLINKLANG', 'ROTOM'], crisol_e: ['CLAYDOL', 'METAGROSS', 'BRONZONG'],
};
const MOVES = {
  HELIOLISK: ['THUNDERBOLT', 'HYPERVOICE', 'SURF', 'DARKPULSE'], MAGNEZONE: ['THUNDERBOLT', 'FLASHCANNON', 'VOLTSWITCH', 'TRIATTACK'],
  SKARMORY: ['BRAVEBIRD', 'IRONHEAD', 'ROOST', 'SPIKES'], CLAYDOL: ['EARTHPOWER', 'PSYCHIC', 'ICEBEAM', 'ANCIENTPOWER'],
  PORYGONZ: ['TRIATTACK', 'SHADOWBALL', 'ICEBEAM', 'THUNDERBOLT'], KLINKLANG: ['GEARGRIND', 'SHIFTGEAR', 'WILDCHARGE', 'RETURN'],
  ROTOM: ['THUNDERBOLT', 'SHADOWBALL', 'WILLOWISP', 'HEX'], METAGROSS: ['METEORMASH', 'ZENHEADBUTT', 'EARTHQUAKE', 'BULLETPUNCH'],
  BRONZONG: ['GYROBALL', 'PSYCHIC', 'EARTHQUAKE', 'HYPNOSIS'],
};
export async function technician(ctx, key) {
  if (!canDepart(ctx.state)) return;
  if (ctx.flag(won(key))) { await ctx.say('El conducto está desconectado. Ya no extrae resonancia.'); return; }
  await ctx.say('No retenemos Pokémon. Estos anillos extraen la resonancia que queda en sus hábitats. Gael sabe usarla.', { speaker: 'Técnico' });
  if (!await ctx.confirm('¿Detener el extractor?')) return;
  const request = { type: 'trainer', noCoop: true, bgm: 'GuaridaRocket', trainer: {
    id: `b23_${key}`, name: 'Técnico del Crisol', class: 'Científico', sprite: 'anil:cientifico', ai: 96, money: 45,
    party: teams[key].map((species, i) => ({ species, level: 75 + i, moves: MOVES[species],
      ivs: { hp: 24, atk: 24, def: 24, spa: 24, spd: 24, spe: 24 } })), items: ['HYPERPOTION'],
  } };
  if (await bossBattle(ctx, request, null, { loseText: 'El extractor hace una pausa. Tu equipo está curado; puedes volver a intentarlo.' }) !== 'win') return;
  ctx.setFlag(won(key));
  if (key === 'bomba') ctx.setFlag(F.pump);
  if (key === 'salinas') ctx.setFlag(F.salinas);
  ctx.requestRefresh?.();
  await ctx.say(key === 'bomba' ? 'El anillo de la bomba se cierra. La conexión del faro puede volver a encenderse en el puerto.' :
    key === 'salinas' ? 'La toma de las salinas queda cerrada. La válvula del Oasis ya puede devolver el agua.' : 'El técnico desconecta su anillo de las tuberías.');
}
export async function repairLighthouse(ctx) {
  if (ctx.flag(F.lighthouse)) { await ctx.say('El faro vuelve a orientar a los barcos. La luz llega hasta Nexo.'); return; }
  if (!ctx.flag(F.pump)) { await ctx.say('El faro está apagado. Su corriente se pierde en el extractor del palmeral, en la Ruta A1.'); return; }
  if (!await ctx.confirm('¿Restablecer la corriente del faro?')) return;
  ctx.setFlag(F.lighthouse); ctx.requestRefresh?.();
  ctx.se?.('PRSFX- Thunderbolt'); await ctx.say('Las lentes giran y el faro se enciende. El embarcadero vuelve a ver la costa.');
}
export function fillOasis(ctx) {
  if (!ctx.flag(F.oasis)) return;
  for (let y = 12; y <= 17; y++) for (let x = 13; x <= 22; x++) { ctx.setTile(x, y, 0, [[136, 134], [130, 132]][y % 2][x % 2]); ctx.setTile(x, y, 1, 0); }
}
export async function restoreOasis(ctx) {
  if (ctx.flag(F.oasis)) { await ctx.say('El agua vuelve a pasar entre las raíces.'); return; }
  if (!ctx.flag(F.salinas)) { await ctx.say('La válvula no recibe agua. La toma de las salinas sigue atrapada en un anillo.'); return; }
  if (!await ctx.confirm('¿Abrir la válvula del Oasis?')) return;
  ctx.setFlag(F.oasis); fillOasis(ctx); ctx.requestRefresh?.();
  await ctx.say('El anillo pierde presión. El agua vuelve al Oasis del Vaso. Las ruinas de la Vasija quedan al oeste.');
}
export async function takeVessel(ctx) {
  if (!ctx.flag(F.oasis)) { await ctx.say('Una vasija bajo el polvo. La inscripción pide que primero vuelva el agua.'); return; }
  if (ctx.flag(F.vessel)) { await ctx.say('La hornacina está vacía. La Vasija Castigo ya está contigo.'); return; }
  await lines(ctx, ['La inscripción representa a Hoopa y sus anillos. La Vasija Castigo encierra el exceso de su energía.',
    'Una anotación reciente dice: «Retirar antes de activar EXP-03». Nadie llegó a llevársela.']);
  await ctx.giveItem('PRISONBOTTLE'); ctx.setFlag(F.vessel); ctx.requestRefresh?.();
}
export async function recording(ctx) {
  if (!['crisol_o', 'crisol_e'].every((k) => ctx.flag(won(k)))) { await ctx.say('El terminal está protegido por los dos técnicos que mantienen los anillos del Crisol.'); return; }
  if (!ctx.flag(F.recording)) {
    await lines(ctx, ['Corta esa conducción. No voy a ayudarte a forzar otra respuesta.'], 'Vértice · mensaje grabado');
    await lines(ctx, ['No necesito su permiso.'], 'Gael · grabación');
    await lines(ctx, ['En la pantalla aparece EXP-03, el cristal extraído de la explanada del Monte del Portal.',
      'Un registro muestra a Gael subiendo el cristal a la Torre. El Laberinto figura como fuente nueva de resonancia.',
      'El plano identifica tres válvulas de aislamiento. Ciérralas antes de seguir por la escalera norte.']);
    ctx.setFlag(F.recording);
  } else await ctx.say('EXP-03 está en la Torre. Las tres válvulas aíslan el conducto que sube.');
}
export async function isolate(ctx, n) {
  if (!ctx.flag(F.recording)) { await ctx.say('El mando está enclavado. El terminal explica qué conductos se pueden aislar.'); return; }
  ctx.setFlag(`dlc1_valvula_${n}`); ctx.requestRefresh?.(); ctx.se?.('PRSFX- Rock Smash');
  if ([0, 1, 2].every((i) => ctx.flag(`dlc1_valvula_${i}`))) {
    ctx.setFlag(F.crisol); ctx.requestRefresh?.(); await ctx.say('Los tres conductos quedan aislados. La escalera de la Torre está libre.');
  } else await ctx.say(`Válvula ${n + 1} cerrada. Sigue las otras tuberías.`);
}
const event = (id, x, y, script, extra = {}) => ({ id, x, y, trigger: 'action', solid: true, script, ...extra });
export function portEvents() {
  return [
    event('b23_ferri', 22, 36, (ctx) => takeFerry(ctx, 'almenara', { speaker: 'Marinero' }), { sprite: 'anil:marinero', dir: 8 }),
    event('b23_faro', 33, 10, repairLighthouse),
    { id: 'b23_luz_faro', x: 33, y: 5, through: true, when: (s) => s.flag(F.lighthouse),
      glow: { name: 'softLight', color: [255, 243, 178], radius: 80, intensity: 0.7 } },
    clerkEvent({ id: 'b23_bazar', x: 22, y: 16, items: ['ULTRABALL', 'TIMERBALL', 'DUSKBALL', 'FULLRESTORE', 'MAXREPEL'] }),
    event('b23_vecina', 19, 24, (ctx) => ctx.say(ctx.flag(F.end) ? 'La luz y el agua se han quedado. Nadie ha visto volver a los técnicos.' : 'El oasis se seca y el faro se apagó. Los técnicos sacan luz de unos anillos. El palmeral está al este.'), { sprite: 'anil:mujer1', dir: 2 }),
  ];
}
export function routeEvents(key) {
  return [event(`b23_tecnico_${key}`, key === 'bomba' ? 24 : 26, 16, (ctx) => technician(ctx, key), { sprite: 'anil:cientifico', dir: 2 }),
    event(`b23_extractor_${key}`, key === 'bomba' ? 27 : 29, 15, (ctx) => ctx.say('El conducto termina en un anillo. Solo absorbe residuos de resonancia.'), { sprite: OBJ.machine, dir: 2 })];
}
export function oasisEvents() {
  return [event('b23_valvula_oasis', 20, 9, restoreOasis, { sprite: OBJ.machine, dir: 4 }),
    event('b23_vasija', 7, 10, takeVessel, { sprite: OBJ.vessel, dir: 2 })];
}
export function crisolEvents() {
  return [event('b23_tecnico_crisol_o', 10, 13, (ctx) => technician(ctx, 'crisol_o'), { sprite: 'anil:cientifico', dir: 2 }),
    event('b23_tecnico_crisol_e', 24, 13, (ctx) => technician(ctx, 'crisol_e'), { sprite: 'anil:cientifico', dir: 2 }),
    event('b23_terminal', 17, 8, recording, { sprite: OBJ.machine, dir: 8 }),
    ...[[7, 21], [27, 21], [17, 15]].map(([x, y], i) => event(`b23_aislamiento_${i}`, x, y, (ctx) => isolate(ctx, i), { sprite: OBJ.machine, dir: 4 })),
  ];
}
export async function regionArrival(ctx) {
  if (!await onlyAlmenara(ctx)) return;
  const blocks = {
    ruta_a2: [F.pump, 'ruta_a1', 43, 20, 'El extractor del palmeral sigue activo. Detén al técnico antes de seguir.'],
    oasis_vaso: [F.salinas, 'ruta_a2', 43, 20, 'La toma de las salinas sigue abierta. Detén al técnico que mantiene el anillo.'],
    monte_candil: [[F.oasis, F.lighthouse, F.vessel], 'oasis_vaso', 31, 20, 'Antes de subir, devuelve el agua al Oasis, enciende el faro y recoge la Vasija de las ruinas.'],
    el_crisol: [[F.oasis, F.lighthouse, F.vessel], 'monte_candil', 23, 12, 'El Crisol concentra toda la resonancia. Primero corta sus tomas del Oasis y del faro.'],
    torre_crisol: [F.crisol, 'el_crisol', 17, 5, 'Primero detén a los técnicos, escucha la grabación y aísla las tres válvulas del Crisol.'],
  };
  const rule = blocks[ctx.map.id];
  if (rule && ![].concat(rule[0]).every((f) => ctx.flag(f))) { await ctx.say(rule[4]); await ctx.warp(rule[1], rule[2], rule[3], 2); return; }
  if (ctx.map.id === 'puerto_almenara' && !ctx.flag(F.arrival)) {
    ctx.setFlag(F.arrival); await ctx.say('Puerto Almenara. Las lentes del faro no giran; el agua del canal apenas cubre el fondo.');
  }
  if (ctx.map.id === 'oasis_vaso') fillOasis(ctx);
}
