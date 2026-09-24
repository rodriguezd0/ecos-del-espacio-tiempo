// Encuentros salvajes del bloque 1 (docs/bloques/B01_apertura.md §5). PROVISIONAL: especies del inventario
// de Axis; el reparto final de la Pokédex está pendiente (D28). Las mismas tablas sirven para el modo
// clásico (encuentros al andar por la hierba alta) y el visible (los Pokémon deambulan por ella; biblia §15).
// Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].

/** Ruta 1 — hierba alta, niveles 2–4. */
export const RUTA_1 = Object.freeze({
  grass: Object.freeze([
    [20, 'STARLY', 2, 4],
    [20, 'BIDOOF', 2, 4],
    [15, 'LILLIPUP', 2, 4],
    [15, 'KRICKETOT', 2, 4],
    [10, 'SHINX', 2, 4],
    [10, 'BUDEW', 2, 4],
    [10, 'WURMPLE', 2, 4],
  ]),
});

export default { ruta_1: RUTA_1 };
