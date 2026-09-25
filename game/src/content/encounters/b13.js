// Encuentros salvajes del Bloque 13 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Mar del Sur (superficie)», «Estación
// Talasa», «Volcán Tizón (con el caserío de la forja)», «Islote Lumbre» y «Fondo del Mar del Sur» para el agua bajo los
// pilotes de Talasa). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx, forma?]. Las tablas del mar son las de B09b (misma zona,
// solo lectura: una única fuente).
import { CALETA_SONDA, CALETA_ALGAS } from './b09b.js';

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));
const SEA = Object.freeze({ water: CALETA_SONDA.water, fish_good: CALETA_SONDA.fish_good, fish_super: CALETA_SONDA.fish_super });

/** Mar del Sur (superficie): Nadar 42–50, Caña Buena 30–40 y Supercaña 45–50. */
export const MAR_DEL_SUR = SEA;

/** Estación Talasa: invernadero y cubiertas (cueva/ruina 45–50) y el mar alrededor. */
export const TALASA_DECKS = t([[40, 'SOLOSIS', 45, 50], [35, 'MAGNEMITE', 45, 50], [20, 'MAGNETON', 45, 50], [5, 'DUOSION', 45, 50]]);
export const ESTACION_TALASA = Object.freeze({ ...SEA, cave: TALASA_DECKS, stepChance: Object.freeze({ cave: 3 }) });
export const TALASA_INVERNADERO = Object.freeze({ cave: TALASA_DECKS, stepChance: Object.freeze({ cave: 5 }) });

/** Agua bajo los pilotes de Talasa (Buceo, etapa G): fauna del Fondo del Mar del Sur, 48–54. */
export const TALASA_PILOTES = CALETA_ALGAS;

/** Islote Lumbre: hierba de día y de noche (45–50) y el mar alrededor. */
export const ISLOTE_LUMBRE = Object.freeze({
  ...SEA,
  grass: t([[30, 'COMFEY', 45, 50], [25, 'CUTIEFLY', 45, 50], [25, 'SWIRLIX', 45, 50], [20, 'RIBOMBEE', 45, 50]]),
  grassNight: t([[50, 'CLEFAIRY', 45, 50], [20, 'CLEFFA', 45, 50], [15, 'SWIRLIX', 45, 50], [15, 'COMFEY', 45, 50]]),
});

/** Volcán Tizón: hierba de la ladera (45–50) y el mar de la costa. */
export const VOLCAN_TIZON = Object.freeze({
  ...SEA,
  grass: t([[60, 'FLETCHINDER', 45, 50], [25, 'HOUNDOUR', 45, 50], [12, 'PONYTA', 45, 50], [3, 'TALONFLAME', 45, 50]]),
});

/** Cueva Volcán del Tizón (cueva/ruina 45–50); también el cráter. */
export const TIZON_CUEVA = Object.freeze({
  cave: t([[25, 'MAGBY', 45, 50], [25, 'HOUNDOUR', 45, 50], [22, 'DARUMAKA', 45, 50], [20, 'MAGMAR', 45, 50], [5, 'HOUNDOOM', 45, 50], [3, 'LARVESTA', 45, 50]]),
  stepChance: Object.freeze({ cave: 5 }),
});

export default {
  mar_del_sur: MAR_DEL_SUR, estacion_talasa: ESTACION_TALASA, talasa_invernadero: TALASA_INVERNADERO,
  talasa_pilotes: TALASA_PILOTES, islote_lumbre: ISLOTE_LUMBRE, volcan_tizon: VOLCAN_TIZON, tizon_cueva: TIZON_CUEVA,
};
