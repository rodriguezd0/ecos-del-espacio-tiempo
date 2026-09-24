// Registro de mapas de Axis: id → import dinámico del módulo de definición.
// Cada módulo exporta por defecto una definición de mapa (docs/ARCHITECTURE.md §5).
export const MAPS = {
  // Mapas de prueba del overworld (sin canon)
  dev_test: () => import('./dev_test.js'),
  dev_test_casa: () => import('./dev_test_casa.js'),
  dev_test_este: () => import('./dev_test_este.js'),
};

export async function loadMapDefinition(id) {
  const loader = MAPS[id];
  if (!loader) throw new Error(`Mapa desconocido: ${id}`);
  const mod = await loader();
  return mod.default;
}
