// Efectos de sonido de interfaz (nombres de Audio/SE de Añil). Nunca rompen la UI si el audio falla.
import { engine } from '../../core/engine.js';

export const SE = {
  cursor: 'GUI sel cursor',
  decision: 'GUI sel decision',
  cancel: 'GUI sel cancel',
  buzzer: 'GUI sel buzzer',
  menuOpen: 'GUI menu open',
  menuClose: 'GUI menu close',
  save: 'GUI save choice',
  partySwitch: 'GUI party switch',
  bagCursor: 'GUI bag cursor',
  bagPocket: 'GUI bag pocket',
  summaryPage: 'GUI summary change page',
  pokedexOpen: 'GUI pokedex open',
  storagePick: 'GUI storage pick up',
  storagePut: 'GUI storage put down',
  cardOpen: 'GUI trainer card open',
  namingConfirm: 'GUI naming confirm',
  namingTab: 'GUI naming tab swap start',
};

export function playSE(name, opts) {
  const a = engine.audio;
  if (!a || !a.playSE || !name) return;
  try {
    const p = a.playSE(name, opts);
    if (p && p.catch) p.catch((err) => console.warn('[ui] SE', name, err));
  } catch (err) {
    console.warn('[ui] SE', name, err);
  }
}

export function playME(name) {
  const a = engine.audio;
  if (!a || !a.playME || !name) return Promise.resolve();
  try {
    return Promise.resolve(a.playME(name)).catch((err) => console.warn('[ui] ME', name, err));
  } catch (err) {
    console.warn('[ui] ME', name, err);
    return Promise.resolve();
  }
}

export function playCry(species, form = 0) {
  const a = engine.audio;
  if (!a || !a.playCry) return;
  try {
    const p = a.playCry(species, form);
    if (p && p.catch) p.catch((err) => console.warn('[ui] grito', species, err));
  } catch (err) {
    console.warn('[ui] grito', species, err);
  }
}

export const sfx = {
  cursor: () => playSE(SE.cursor),
  decision: () => playSE(SE.decision),
  cancel: () => playSE(SE.cancel),
  buzzer: () => playSE(SE.buzzer),
};
