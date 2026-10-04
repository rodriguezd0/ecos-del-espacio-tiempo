// La cartógrafa ofrece encargos y el mapa regional real permite marcar cada hipótesis.
import { isPostgame } from './b22a_common.js';
import { CATEGORIES, EXPEDITIONS, expedition, activeExpeditions, availableWave, phase, activate, cancel, isActive, submitHypothesis } from './b24_registry.js';

export async function confirmHypothesis(ctx, id) {
  const e = expedition(id);
  if (!e || !isActive(ctx.state, id)) return 'inactive';
  if (phase(ctx.state, id) !== 'indicio') {
    await ctx.say('Primero visita el lugar del rumor y recoge un indicio. Después podrás marcar tu hipótesis en el mapa.');
    return 'indicio';
  }
  const place = await ctx.ui.openRegionMap({ mode: 'select' });
  const result = submitHypothesis(ctx.state, id, place);
  if (result === 'wrong') await ctx.say(`Ese lugar no encaja. No pierdes nada por comprobarlo. Otra pista: ${e.hint}`);
  if (result === 'correct') { ctx.requestRefresh?.(); await ctx.say(`Hipótesis anotada: ${e.name}. Comprueba el lugar con tu equipo.`); }
  return result;
}

async function detail(ctx, e) {
  await ctx.say(`${e.name}: ${e.hint}`);
  if (phase(ctx.state, e.id) === 'hallazgo') { await ctx.say('Hallazgo registrado. Puedes volver a los lugares que has descubierto.'); return; }
  if (!isActive(ctx.state, e.id)) {
    if (await ctx.confirm('¿Seguir esta expedición?')) {
      const r = activate(ctx.state, e.id);
      await ctx.say(r === 'full' ? 'Ya sigues tres expediciones. Puedes pausar una sin perder sus pistas.' : r === 'ok' || r === 'active' ? 'Rumor anotado. Investiga el lugar y vuelve para marcar tu hipótesis en el mapa.' : 'Este encargo estará disponible en una oleada posterior.');
      ctx.requestRefresh?.();
    }
    return;
  }
  const action = await ctx.choice(['Marcar hipótesis en el mapa', 'Pausar esta expedición', 'Volver']);
  if (action === 0) await confirmHypothesis(ctx, e.id);
  if (action === 1) { cancel(ctx.state, e.id); ctx.requestRefresh?.(); await ctx.say('Encargo en pausa. Las pistas y los hallazgos se conservan.'); }
}

async function list(ctx, rows) {
  if (!rows.length) { await ctx.say('Todavía no hay encargos en esta lista.'); return; }
  const i = await ctx.choice([...rows.map((e) => `${e.name} · ${phase(ctx.state, e.id) || 'Rumor'}`), 'Volver']);
  if (Number.isInteger(i) && rows[i]) await detail(ctx, rows[i]);
}

export async function openRegistry(ctx) {
  if (!isPostgame(ctx.state)) { await ctx.say('La Aduana abrirá su Registro cuando regreses de tu viaje al Eje.'); return; }
  if (!ctx.state.flag('dlc2_registro_abierto')) {
    ctx.state.setFlag('dlc2_registro_abierto'); ctx.requestRefresh?.();
    await ctx.say('Soy Sabela Ferreiro. Trabajé en la autoridad portuaria; ahora dibujo lo que sus mapas dejaron fuera. Puedes seguir tres expediciones a la vez.');
    await ctx.say('Primero un rumor, luego un indicio y por último un hallazgo. Marca tus hipótesis en el mapa. Una equivocación no te cuesta nada: te daré otra pista.');
  }
  for (;;) {
    const i = await ctx.choice([...CATEGORIES, 'Activas', 'Provisiones', 'Salir'], { title: `Registro · oleada ${availableWave(ctx.state)} de 4` });
    if (!Number.isInteger(i) || i < 0 || i >= 8) return;
    if (i < CATEGORIES.length) await list(ctx, EXPEDITIONS.filter((e) => e.category === CATEGORIES[i] && e.wave <= availableWave(ctx.state)));
    else if (i === 6) await list(ctx, activeExpeditions(ctx.state).map(expedition));
    else await ctx.ui.openShop({ name: 'Provisiones de expedición', items: ['ORANBERRY', 'STARPIECE', 'SHINYSTONE', 'DUSKSTONE', 'ULTRABALL', ...(availableWave(ctx.state) >= 4 ? ['BEASTBALL'] : [])] });
  }
}
