import fs from 'node:fs';
import path from 'node:path';
import { refreshDriver } from './e2e_campaign_refresh.mjs';

export function reloadProofError(before, s, name) {
  const same = (key) => JSON.stringify(s[key]) === JSON.stringify(before[key]);
  if (s.playerName !== name) return 'se cargó otra partida';
  if (!s.flags.game_cleared || !s.flags.b21_fin) return 'el postgame no quedó guardado';
  if (s.map !== before.map || s.x !== before.x || s.y !== before.y) return 'posición final distinta';
  if (s.cells.length !== 100 || s.cores.length !== 5 || !same('cells') || !same('cores')) return 'colección incompleta tras cargar';
  if (!same('fragments')) return 'fragmentos distintos';
  if (!same('pokemon')) return 'equipo distinto tras cargar';
  if (s.tablets.length !== 18 || !same('tablets')) return 'Tablillas distintas tras cargar';
  if (s.money !== before.money || !same('bag') || !same('keyItems')) return 'dinero o bolsa distintos tras cargar';
  if (s.zygarde.form !== 'complete' || !s.zygarde.jump || !s.zygarde.anchor || !same('abilities')) return 'capacidades distintas tras cargar';
  return null;
}

// Persistencia final por el mismo flujo que usa el jugador: Guardar, recargar,
// Continuar, Cargar. La comprobación nunca prepara ni modifica progreso.
export async function reloadCompletedCampaign(d, name) {
  await d.save('B21');
  const before = await d.snap();
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
  await d.milestone('postgame_recargado', s => reloadProofError(before,s,name));
  const enabled = await d.eval(async () => {
    const { isPostgame } = await import('/src/content/events/b22a_common.js');
    const { postgame } = await import('/src/content/events/b22d_common.js');
    return isPostgame(window.__campaign.engine.state) && postgame(window.__campaign.engine.state);
  });
  if (!enabled) throw Error('El guardado recargado no habilita los accesos de postgame');
}
