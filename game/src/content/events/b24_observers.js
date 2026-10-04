// Ganchos síncronos de pasos/combates reales. MapScene y battleFlow los llaman; no lanzan escenas ni viajan.
import { registryReady, activeExpeditions, isActive, noteIndicio, expedition, flag, markHallazgo } from './b24_registry.js';

const count = (s, key, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(s.var(key, 0)); return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), max) : 0;
};
const supportedOutcomes = new Set(['win', 'caught', 'run', 'lose', 'forfeit']);
function recordOwnedFindings(s) {
  for (const id of activeExpeditions(s)) {
    const e = expedition(id);
    const collectedEgg = id === 'phione' && s.party.some((p) => p?.egg && p.species === 'PHIONE' && p.metMap === 'lumina_guarderia');
    if (s.flag(flag(id, 'confirmada')) && (collectedEgg || e.species.every((key) => s.data.dex.caught[key]))) markHallazgo(s, id);
  }
}

export function observeStep(state, info) {
  if (!registryReady(state) || !info || typeof info.mapId !== 'string' || !Number.isInteger(info.x) || !Number.isInteger(info.y)) return false;
  const { mapId, running = false, mounted = false } = info;
  for (const id of activeExpeditions(state)) noteIndicio(state, id, mapId);
  if (isActive(state, 'xerneas') && mapId === 'ruta_14_reserva') state.setVar('dlc2_xerneas_pasos', Math.min(300, count(state, 'dlc2_xerneas_pasos', 300) + 1));
  if (isActive(state, 'celebi') && ['ruta_9_neblino', 'b24_santuario_neblino'].includes(mapId)) state.setVar('dlc2_celebi_sigilo', running || mounted ? 0 : Math.min(8, count(state, 'dlc2_celebi_sigilo', 8) + 1));
  const waterLeft = count(state, 'dlc2_volcanion_agua_pasos', 20);
  if (isActive(state, 'volcanion') && waterLeft > 0) state.setVar('dlc2_volcanion_agua_pasos', waterLeft - 1);
  recordOwnedFindings(state);
  return true;
}

export function observeBattle(state, info) {
  if (!registryReady(state) || !info || typeof info.mapId !== 'string' || !['wild', 'trainer'].includes(info.type) || !supportedOutcomes.has(info.outcome) || info.exhibition) return false;
  if (info.type === 'wild') {
    if (info.outcome === 'win' && isActive(state, 'xerneas')) state.setVar('dlc2_xerneas_pasos', 0);
    if (info.mapId === 'sima_eje' && isActive(state, 'yveltal')) state.setVar('dlc2_yveltal_racha', info.outcome === 'win' ? Math.min(10, count(state, 'dlc2_yveltal_racha', 10) + 1) : 0);
  }
  recordOwnedFindings(state);
  return true;
}
