// Modo desarrollador: página principal del menú (docs/MODO_DESARROLLADOR.md).
import { engine } from '../core/engine.js';
import { openDevMenu } from './devMenu.js';
import { teleportPage, worldPage, saveAnywhere } from './devPagesWorld.js';
import { teamPage, speciesPage, itemsPage } from './devPagesTeam.js';
import { progressPage, blocksPage } from './devPagesProgress.js';
import { findMapScene } from './devRuntime.js';

export const rootPage = {
  title: 'Menú',
  items(dev) {
    const where = dev.scene?.world ? `${dev.scene.world.map.id} (${dev.scene.world.player.x},${dev.scene.world.player.y})` : '';
    return [
      { label: 'Teletransporte a un mapa…', value: where, hint: 'Lista por bloque con buscador; llegada válida automática o casilla x,y.', run: (d) => d.menu.push(teleportPage) },
      { label: 'Saltar al inicio de un bloque…', hint: 'B01–B21 con flags, Zygarde, Fragmentos, Tablillas y equipo del tramo.', run: (d) => d.menu.push(blocksPage) },
      { label: 'Dar Pokémon…', run: (d) => d.menu.push(speciesPage) },
      { label: 'Dar objetos…', run: (d) => d.menu.push(itemsPage) },
      { label: 'Pokémon, objetos, dinero, curar…', run: (d) => d.menu.push(teamPage) },
      { label: 'Interruptores, hora y clima…', hint: 'Atravesar paredes, sin encuentros, carrera ×2, hora del día, clima.', run: (d) => d.menu.push(worldPage) },
      { label: 'Progreso: flags, variables, Zygarde…', run: (d) => d.menu.push(progressPage) },
      { label: 'Guardar partida aquí', run: saveAnywhere },
      { label: 'Cerrar', run: (d) => d.menu.close(null) },
    ];
  },
};

/** Abre el menú sobre un mapa. Devuelve null o la acción { type: 'dev', … } que el mapa ejecuta como guion. */
export async function runDevMenu(scene = findMapScene()) {
  const state = scene?.state || engine.state;
  if (!state) throw new Error('No hay partida en curso: el modo desarrollador necesita una partida.');
  return openDevMenu(rootPage, { scene, state, db: engine.data });
}
