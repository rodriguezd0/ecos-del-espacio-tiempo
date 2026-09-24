// GENERADO por tools/gen_registries.mjs — no editar a mano (ejecuta: node tools/gen_registries.mjs).
// Registro de mapas de Axis: id → import dinámico del módulo de definición (docs/ARCHITECTURE.md §5).
export const MAPS = {
  "casa_gael": () => import("./b01/casa_gael.js"),
  "casa_prota_1f": () => import("./b01/casa_prota_1f.js"),
  "casa_prota_2f": () => import("./b01/casa_prota_2f.js"),
  "casa_vecinos_n": () => import("./b01/casa_vecinos_n.js"),
  "casa_vecinos_se": () => import("./b01/casa_vecinos_se.js"),
  "laberinto_profundidad": () => import("./b01/laberinto_profundidad.js"),
  "laboratorio_alerce": () => import("./b01/laboratorio_alerce.js"),
  "montana_portal": () => import("./b01/montana_portal.js"),
  "ruta_1": () => import("./b01/ruta_1.js"),
  "villa_alba": () => import("./b01/villa_alba.js"),
  "dev_test_casa": () => import("./dev_test_casa.js"),
  "dev_test_este": () => import("./dev_test_este.js"),
  "dev_test": () => import("./dev_test.js"),
};

export async function loadMapDefinition(id) {
  const loader = MAPS[id];
  if (!loader) throw new Error(`Mapa desconocido: ${id}`);
  const mod = await loader();
  return mod.default;
}
