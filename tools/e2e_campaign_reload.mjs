import fs from 'node:fs';
import path from 'node:path';
import { refreshDriver } from './e2e_campaign_refresh.mjs';
import { persistentSaveData, readPersistentSaveData, clockReloadError } from './e2e_campaign_checkpoint_reload.mjs';

export function reloadProofError(before, s, name) {
  const same = (key) => JSON.stringify(s[key]) === JSON.stringify(before[key]);
  if (s.playerName !== name) return 'se cargó otra partida';
  if (!s.flags.game_cleared || !s.flags.b21_fin) return 'el postgame no quedó guardado';
  if (s.map !== before.map || s.x !== before.x || s.y !== before.y) return 'posición final distinta';
  if (s.cells.length !== 100 || s.cores.length !== 5 || !same('cells') || !same('cores')) return 'colección incompleta tras cargar';
  if (s.fragments.length !== 10 || !same('fragments')) return 'fragmentos incompletos o distintos';
  if (!same('pokemon') || !same('partyFull') || !same('boxedPokemon')) return 'equipo o PC distintos tras cargar';
  if (!s.flags.b21_huevo_gael || s.flags.b21_huevo_espera || s.vars?.gael_starter !== before.vars?.gael_starter) return 'huevo de Gael distinto o pendiente tras cargar';
  if (s.vars?.p9_choice !== before.vars?.p9_choice) return 'elección del P9 distinta tras cargar';
  if (s.tablets.length !== 18 || !same('tablets')) return 'Tablillas distintas tras cargar';
  if (s.money !== before.money || !same('bag') || !same('keyItems')) return 'dinero o bolsa distintos tras cargar';
  if (s.zygarde.form !== 'complete' || !s.zygarde.jump || !s.zygarde.anchor || !same('abilities')) return 'capacidades distintas tras cargar';
  if (!before.saveData || !s.saveData) return 'faltan datos completos del guardado';
  const clockError = clockReloadError(before.saveData, s.saveData);
  if (clockError) return clockError;
  if (JSON.stringify(persistentSaveData(before.saveData)) !== JSON.stringify(persistentSaveData(s.saveData))) return 'datos completos de la partida distintos tras cargar';
  return null;
}

// Persistencia final por el mismo flujo que usa el jugador: Guardar, recargar,
// Continuar, Cargar. La comprobación nunca prepara ni modifica progreso.
export async function reloadCompletedCampaign(d, name) {
  await d.save('B21');
  const before = { ...await d.snap(), saveData: await readPersistentSaveData(d) };
  fs.writeFileSync(path.join(d.outDir, 'campaign_final_before_reload.json'), JSON.stringify(before, null, 2));
  fs.writeFileSync(path.join(d.outDir, 'campaign_final_dialogos.json'), JSON.stringify(await d.log(), null, 2));
  await d.page.reload({ waitUntil: 'load' });
  await refreshDriver(d);
  await d.until(s => s.top === 'TitleScene', { what: 'título tras recargar' });
  await d.wait(800); await d.press('KeyZ', 700);
  await d.until(s => s.titleStage === 'menu', { what: 'Continuar tras recargar' });
  await d.wait(200); await d.press('KeyZ', 700);
  await d.until(s => s.top === 'SaveLoadScene', { what: 'lista de la partida QA' });
  await d.press('KeyZ', 400);
  await d.until(s => s.top === 'ChoiceScene', { what: 'confirmar Cargar' });
  await d.press('KeyZ', 700);
  await d.until(s => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'guardado final cargado' });
  await d.settle();
  const saveData = await readPersistentSaveData(d);
  fs.writeFileSync(path.join(d.outDir, 'campaign_final_after_reload.json'), JSON.stringify({ ...await d.snap(), saveData }, null, 2));
  await d.milestone('postgame_recargado', s => reloadProofError(before, { ...s, saveData }, name));
  const enabled = await d.eval(async () => {
    const { isPostgame } = await import('/src/content/events/b22a_common.js');
    const { postgame } = await import('/src/content/events/b22d_common.js');
    return isPostgame(window.__campaign.engine.state) && postgame(window.__campaign.engine.state);
  });
  if (!enabled) throw Error('El guardado recargado no habilita los accesos de postgame');
}
