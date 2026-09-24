// Ventana con el sprite animado de un Pokémon (elección de inicial, B01 §4.3), como pbShowPicture de
// Essentials. Se apila bajo los mensajes y se cierra a mano. Las dependencias de UI se cargan bajo demanda
// para que las definiciones de mapa sigan siendo importables en Node (sin DOM devuelve un no-op).

const WIN = 212;
const TOP = 20;

/**
 * Muestra la ventana y devuelve { close() } cuando ya está en pantalla.
 * @param {string} species  ID de especie (TURTWIG…)
 */
export async function showPokemonPicture(species) {
  if (typeof document === 'undefined') return { close() {} };
  const [{ engine, SCREEN_W }, { UIScene }, { drawWindow }, { drawPokemonSprite, preloadPokemon }, { menuSkin }] = await Promise.all([
    import('../../core/engine.js'),
    import('../../ui/core/uiScene.js'),
    import('../../ui/core/windowskin.js'),
    import('../../ui/core/pokemonGfx.js'),
    import('../../ui/core/options.js'),
  ]);
  const pokemon = { species, form: 0, shiny: false };
  await preloadPokemon([pokemon], { sprites: true }).catch((err) => console.warn('Sprite de inicial', err));

  class PictureScene extends UIScene {
    draw(g) {
      const x = Math.round((SCREEN_W - WIN) / 2);
      drawWindow(g, menuSkin(), x, TOP, WIN, WIN);
      drawPokemonSprite(g, pokemon, x + WIN / 2, TOP + WIN / 2, { t: engine.frame, scale: 2 });
    }
    drawUI(g) {
      g.save();
      this.draw(g);
      g.restore();
    }
  }

  const scene = new PictureScene();
  engine.scenes.push(scene).catch((err) => engine.reportError(err));
  // push() apila tras enter(): esperar a que esté en la pila para poder cerrarla sin carreras.
  for (let i = 0; i < 30 && !engine.scenes.stack.some((e) => e.scene === scene); i++) {
    await new Promise((r) => setTimeout(r, 16));
  }
  return { close: () => scene.close() };
}
