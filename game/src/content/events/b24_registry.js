// Registro de Expediciones: datos JSON, tres activas y progreso persistente sin penalización por hipótesis.
import catalog from '../maps/b24/expeditions.json' with { type: 'json' };
import { isPostgame } from './b22a_common.js';

export const CATEGORIES = Object.freeze([...catalog.categories]);
export const EXPEDITIONS = Object.freeze(catalog.expeditions.map((e) => Object.freeze({ ...e, maps: Object.freeze([...e.maps]), species: Object.freeze([...e.species]) })));
const byId = new Map(EXPEDITIONS.map((e) => [e.id, e]));
export const expedition = (id) => typeof id === 'string' ? byId.get(id) || null : null;
export const flag = (id, phase) => `dlc2_${id}_${phase}`;
export const registryReady = (s) => Boolean(isPostgame(s) && s.flag('dlc2_registro_abierto'));
export const hallazgoCount = (s) => EXPEDITIONS.filter((e) => s.flag(flag(e.id, 'hallazgo'))).length;
export function availableWave(s) {
  if (!registryReady(s)) return 0;
  const found = hallazgoCount(s);
  return catalog.waveThresholds.filter((n) => found >= n).length;
}
export function activeExpeditions(s) {
  const raw = s.var('dlc2_activas', []);
  return Array.isArray(raw) ? [...new Set(raw.filter((id) => expedition(id) && !s.flag(flag(id, 'hallazgo'))))].slice(0, 3) : [];
}
export const isActive = (s, id) => registryReady(s) && activeExpeditions(s).includes(id);
export function phase(s, id) {
  if (!expedition(id)) return null;
  return s.flag(flag(id, 'hallazgo')) ? 'hallazgo' : s.flag(flag(id, 'indicio')) ? 'indicio' : s.flag(flag(id, 'rumor')) ? 'rumor' : null;
}
export function activate(s, id) {
  const e = expedition(id);
  if (!e) return 'unknown';
  if (!registryReady(s)) return 'story';
  if (s.flag(flag(id, 'hallazgo'))) return 'done';
  if (e.wave > availableWave(s)) return 'wave';
  const active = activeExpeditions(s);
  if (active.includes(id)) return 'active';
  if (active.length >= 3) return 'full';
  s.setVar('dlc2_activas', [...active, id]); s.setFlag(flag(id, 'rumor'));
  return 'ok';
}
export function cancel(s, id) {
  if (!expedition(id)) return false;
  const before = activeExpeditions(s);
  if (!before.includes(id)) return false;
  s.setVar('dlc2_activas', before.filter((v) => v !== id));
  return true;
}
export function noteIndicio(s, id, mapId) {
  const e = expedition(id);
  if (!e || !isActive(s, id) || !e.maps.includes(mapId) || s.flag(flag(id, 'indicio'))) return false;
  s.setFlag(flag(id, 'indicio')); return true;
}
export function submitHypothesis(s, id, placeId) {
  const e = expedition(id);
  if (!e || !isActive(s, id)) return 'inactive';
  if (!placeId) return 'cancel';
  if (!s.flag(flag(id, 'indicio'))) return 'indicio';
  if (placeId !== e.place) return 'wrong';
  s.setFlag(flag(id, 'confirmada')); return 'correct';
}
export function markHallazgo(s, id) {
  if (!isActive(s, id) || s.flag(flag(id, 'hallazgo'))) return false;
  const remaining = activeExpeditions(s).filter((v) => v !== id);
  s.setFlag(flag(id, 'hallazgo')); s.setVar('dlc2_activas', remaining);
  return true;
}
