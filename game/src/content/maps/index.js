// Registro de mapas de Axis: id → import dinámico del módulo de definición.
// Cada módulo exporta por defecto una definición de mapa (docs/ARCHITECTURE.md §5).
export const MAPS = {
  // dev_test: () => import('./dev_test.js'),
};

export async function loadMapDefinition(id) {
  const loader = MAPS[id];
  if (!loader) throw new Error(`Mapa desconocido: ${id}`);
  const mod = await loader();
  return mod.default;
}
