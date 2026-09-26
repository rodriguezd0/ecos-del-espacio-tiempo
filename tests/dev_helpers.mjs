// Utilidades de los tests del modo desarrollador (no es un test por sí mismo): base de datos como la de main.js
// (items.json + items_axis.json fusionados) y una partida nueva.
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url)));

const { _note, ...axisItems } = load('items_axis.json');

export const db = Object.freeze({
  species: load('species.json'),
  moves: load('moves.json'),
  abilities: load('abilities.json'),
  items: { ...load('items.json'), ...axisItems },
  dex: load('dex_axis.json'),
});

export function newState(name = 'Dev') {
  return GameState.create({ name, gender: 'M' });
}
