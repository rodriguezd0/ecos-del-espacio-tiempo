// Arranque de Pokémon: Ecos del Espacio-Tiempo.
// Rutas de desarrollo: ?scene=<ruta> (ver DEV_ROUTES). Sin parámetro → pantalla de título.
import { engine } from './core/engine.js';
import { GameAudio } from './audio/audio.js';

// Cada ruta carga un módulo cuyo export por defecto es una clase Scene.
// Los parámetros de la URL se pasan a scene.enter(params).
const DEV_ROUTES = {
  title: () => import('./ui/screens/title.js'),
  map: () => import('./world/mapScene.js'),
  ui: () => import('./ui/dev/uiTest.js'),
  audio: () => import('./audio/dev/jukebox.js'),
  battle: () => import('./battle/scene/devBattle.js'),
  sprites: () => import('./dev/spriteViewer.js'),
  boot: () => import('./dev/bootCheck.js'),
};

async function loadDatabase() {
  const a = engine.assets;
  const [species, moves, abilities, baseItems, axisItems, types, trainerTypes, tilesets, dex] = await Promise.all([
    a.json('data/species.json'), a.json('data/moves.json'), a.json('data/abilities.json'), a.json('data/items.json'),
    a.json('data/items_axis.json'), a.json('data/types.json'), a.json('data/trainer_types.json'), a.json('data/tilesets.json'),
    a.json('data/dex_axis.json'),
  ]);
  // Objetos propios de Axis (Fragmentos Azur, Flauta Azur…) sobre la base de Añil.
  const { _note, ...axisOnly } = axisItems;
  const items = { ...baseItems, ...axisOnly };
  return { species, moves, abilities, items, types, trainerTypes, tilesets, dex };
}

async function loadFonts() {
  const a = engine.assets;
  await Promise.all([
    a.font('Power Green', a.anil('Fonts/power green.ttf')),
    a.font('Power Green Narrow', a.anil('Fonts/power green narrow.ttf')),
    a.font('Power Green Small', a.anil('Fonts/power green small.ttf')),
    a.font('Power Clear', a.anil('Fonts/power clear.ttf')),
    a.font('Power Clear Bold', a.anil('Fonts/power clear bold.ttf')),
  ].map((p) => p.catch((err) => console.warn(err))));
}

async function openRoute(route, params) {
  const loader = DEV_ROUTES[route] || DEV_ROUTES.title;
  let mod;
  try {
    mod = await loader();
  } catch (err) {
    console.warn(`Ruta "${route}" no disponible todavía; se usa bootCheck.`, err);
    mod = await DEV_ROUTES.boot();
  }
  const SceneClass = mod.default;
  await engine.scenes.replace(new SceneClass(), params);
}

async function main() {
  engine.init();
  try {
    engine.audio = new GameAudio(engine.assets);
    const unlock = () => engine.audio.unlock();
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('pointerdown', unlock, { once: true });
    await loadFonts();
    engine.data = await loadDatabase();
    document.getElementById('boot')?.remove();
    engine.start();
    const params = Object.fromEntries(new URLSearchParams(location.search));
    openRoute(params.scene || 'title', params);
  } catch (err) {
    engine.reportError(err);
  }
}

main();
