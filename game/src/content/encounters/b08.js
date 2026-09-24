// Encuentros salvajes del Bloque 8 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Ciudad Estrato y Mina Galena», «Dunas de
// Ceniza» y «Pilar de la Masa (Cámara de los Contrapesos)», etapa D). Las mismas tablas sirven para el modo clásico y
// el visible (biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].
// «Hierba» de las Dunas: matorrales de ceniza (hierba alta del tileset); la Cueva de las Dunas tiene su propia tabla.

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Mina Galena (cueva / ruina), niveles 27–33. */
export const MINA_GALENA = Object.freeze({
  cave: t([[25, 'GURDURR', 27, 33], [25, 'NACLSTACK', 27, 33], [20, 'TINKATUFF', 27, 33], [15, 'CARBINK', 27, 33], [15, 'SABLEYE', 27, 33]]),
});

/** Galería honda de la Mina Galena (tras el P4), niveles 30–35. */
export const MINA_HONDA = Object.freeze({
  cave: t([[30, 'CARBINK', 30, 35], [25, 'SABLEYE', 30, 35], [25, 'ONIX', 30, 35], [15, 'GRAVELER', 30, 35], [5, 'DURALUDON', 31, 35]]),
});

/**
 * Dunas de Ceniza (matorral de ceniza), niveles 28–34. POKEDEX §7.3: «Sigilyph junto a las ruinas»: la tabla completa
 * (con Sigilyph 20) solo en la zona de las ruinas de zócalos (`encounterZones` del mapa, DUNAS.ruinsZone); en el
 * resto del desierto, las otras tres especies con los mismos pesos.
 */
export const DUNAS_RUINAS = Object.freeze({
  grass: t([[30, 'HIPPOPOTAS', 28, 34], [25, 'SKORUPI', 28, 34], [25, 'DARUMAKA', 28, 34], [20, 'SIGILYPH', 28, 34]]),
});
export const DUNAS_CENIZA = Object.freeze({ grass: t(DUNAS_RUINAS.grass.filter(([, sp]) => sp !== 'SIGILYPH')) });

/** Cueva de las Dunas (cueva / ruina), niveles 30–34. */
export const DUNAS_CUEVA = Object.freeze({
  cave: t([[35, 'GRAVELER', 30, 34], [29, 'HIPPOPOTAS', 30, 34], [20, 'NOSEPASS', 30, 34], [10, 'CARBINK', 30, 34], [5, 'GIBLE', 30, 32], [1, 'GABITE', 33, 34]]),
});

/** Pilar de la Masa: Cerro Plomo y Cámara de los Contrapesos (cueva / ruina), niveles 30–34. */
const MASA_TABLE = t([[25, 'GRAVELER', 30, 34], [20, 'ONIX', 30, 34], [20, 'NOSEPASS', 30, 34], [15, 'NACLSTACK', 30, 34], [12, 'BRONZOR', 30, 34], [8, 'CARBINK', 30, 34]]);
export const CERRO_PLOMO = Object.freeze({ cave: MASA_TABLE });
/** En la Cámara los encuentros son menos frecuentes: el puzle es de empujar piedras, no de combatir. */
export const CAMARA_CONTRAPESOS = Object.freeze({ cave: MASA_TABLE, stepChance: Object.freeze({ cave: 2 }) });

export default {
  mina_galena: MINA_GALENA, mina_galena_honda: MINA_HONDA, dunas_ceniza: DUNAS_CENIZA, dunas_cueva: DUNAS_CUEVA,
  cerro_plomo: CERRO_PLOMO, camara_contrapesos: CAMARA_CONTRAPESOS,
};
