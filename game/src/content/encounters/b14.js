// Encuentros salvajes del Bloque 14 — Pilar de los Ecos (docs/POKEDEX_DISTRIBUCION.md §7.3 «Fondo del Mar del Sur ·
// etapa G» y «Arrecife del Eco y Pilar de los Ecos (Ruinas de Antea)»; §7.1: salvajes 48–55). Las mismas tablas sirven
// para el modo clásico y el visible (biblia §15). En los mapas submarinos y en las capas de eco los encuentros son de
// tipo «cueva» (cualquier casilla transitable). En los ecos solo hay especies antiguas y NINGUNA Paradoja (biblia §6.7,
// §16): la Bramaluna Alfa es un encuentro de guion (content/events/b14_fosa.js), no de tabla.
// Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx, forma?] (Corsola de Galar = forma 1).

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Fondo del Mar del Sur (Buceo, 48–54): fauna exclusiva de Buceo. */
export const FONDO_BUCEO = t([
  [20, 'CHINCHOU', 48, 54], [15, 'CLAMPERL', 48, 54], [12, 'SKRELP', 48, 54], [10, 'RELICANTH', 48, 54],
  [8, 'CORSOLA', 48, 54], [8, 'WISHIWASHI', 48, 54], [7, 'REMORAID', 48, 54], [5, 'TATSUGIRI', 48, 54],
  [5, 'LANTURN', 48, 54], [5, 'JELLICENT', 48, 54], [3, 'DONDOZO', 48, 54], [2, 'DRAGALGE', 48, 54],
]);

/** Arrecife del Eco y capa presente de las Ruinas de Antea (Buceo, 50–55). */
export const ARRECIFE_BUCEO = t([[40, 'RELICANTH', 50, 55], [30, 'LANTURN', 50, 55], [30, 'CORSOLA', 50, 55]]);

/** Capa de eco (Antea seca y era primigenia, 50–55): especies antiguas, sin Paradojas. */
export const CAPA_ECO = t([
  [25, 'CRANIDOS', 50, 55], [25, 'SHIELDON', 50, 55], [25, 'CORSOLA', 50, 55, 1], [22, 'DREEPY', 50, 55], [3, 'DRAKLOAK', 50, 55],
]);

export const FONDO_MAR_SUR = Object.freeze({ cave: FONDO_BUCEO, stepChance: Object.freeze({ cave: 4 }) });
export const ARRECIFE_ECO = Object.freeze({ cave: ARRECIFE_BUCEO, stepChance: Object.freeze({ cave: 4 }) });
export const ANTEA_PRESENTE = Object.freeze({ cave: ARRECIFE_BUCEO, stepChance: Object.freeze({ cave: 3 }) });
export const ANTEA_ECO = Object.freeze({ cave: CAPA_ECO, stepChance: Object.freeze({ cave: 3 }) });
/** Era primigenia: la misma tabla, pero solo en la hierba alta (se puede esquivar mientras se evita a la Bramaluna). */
export const ANTEA_PRIMIGENIA = Object.freeze({ grass: CAPA_ECO });

/** Bramaluna real de la Fosa del Eco (visible fijo tras el P7; captura opcional, ratio de captura 10 de la especie). */
export const BRAMALUNA_REAL = Object.freeze({
  species: 'ROARINGMOON', level: 58, alpha: true, ability: 'PROTOSYNTHESIS',
  moves: Object.freeze(['DRAGONDANCE', 'CRUNCH', 'DRAGONCLAW', 'ACROBATICS']),
});
/** Bramaluna Alfa del eco (combate final obligatorio, nivel 56, Energía Potenciadora y Paleosíntesis; sin captura). */
export const BRAMALUNA_ECO = Object.freeze({
  species: 'ROARINGMOON', level: 56, alpha: true, ability: 'PROTOSYNTHESIS', heldItem: 'BOOSTERENERGY', shiny: false,
  moves: Object.freeze(['DRAGONDANCE', 'CRUNCH', 'DRAGONCLAW', 'ACROBATICS']),
});

export default {
  fondo_mar_sur: FONDO_MAR_SUR, arrecife_eco: ARRECIFE_ECO, antea_presente: ANTEA_PRESENTE, antea_eco: ANTEA_ECO,
};
