// Los diez Fragmentos Azur, uno por Pilar (docs/CAMPANA.md §1.5, §1.8, §2.9 y bloques B02–B20).
// Módulo PURO de datos. El objeto de la mochila es AZUREFRAGMENT (con contador) y el estado guarda los
// ids de Fragmento con state.addFragment(id). Al unirse los diez nace la Flauta Azur (AZUREFLUTE, B20).

export const FRAGMENT_ITEM = 'AZUREFRAGMENT';
export const FLUTE_ITEM = 'AZUREFLUTE';
export const PILLAR_COUNT = 10;

/** Flag global de Pilar restaurado (CAMPANA: `p1_restored` … `p10_restored`). */
export const pillarFlag = (n) => `p${n}_restored`;
/** Id del Fragmento n en state.fragments ('F01' … 'F10'). */
export const fragmentId = (n) => `F${String(n).padStart(2, '0')}`;

const f = (n, data) => Object.freeze({ n, id: fragmentId(n), pillar: `P${n}`, flag: pillarFlag(n), verse: n, ...data });

/**
 * tint: tinte del kit de Pilar (§1.8) en RGB, para el brillo del núcleo y la placa del verso.
 * localEffect: el «cambio en el mundo» de cada bloque (lo aplica el guion del Pilar con opts.onRestored).
 */
export const FRAGMENTS = Object.freeze([
  f(1, {
    name: 'Pilar del Umbral', place: 'Ruinas del Dintel, junto a Villa Zaguán', block: 'B02',
    keeper: 'Casilda Roquer', tintName: 'ocre', tint: [214, 160, 72],
    localEffect: 'Las puertas de Zaguán vuelven a cerrar; cesan los temblores alrededor de Villa Alba.',
  }),
  f(2, {
    name: 'Pilar de la Corriente', place: 'Garganta del Albo', block: 'B04',
    keeper: 'Leandro Alcántara', tintName: 'azul', tint: [72, 136, 232],
    localEffect: 'El Albo recupera su cauce; se abre el vado de la Ruta 4; vuelve la pesca.',
  }),
  f(3, {
    name: 'Pilar del Impulso', place: 'Anillo de los Vientos, Meseta del Impulso', block: 'B06',
    keeper: 'Abril Céspedes', tintName: 'blanco', tint: [232, 240, 248],
    localEffect: 'El viento recupera su rumbo; el Parque da luz a Brontia; cesan los vendavales de la Ruta 6.',
  }),
  f(4, {
    name: 'Pilar de la Masa', place: 'Cerro Plomo, Dunas de Ceniza', block: 'B08',
    keeper: 'Fermín Galena', tintName: 'gris plomo', tint: [150, 160, 172],
    localEffect: 'Se detiene el hundimiento de Estrato; se despeja el Paso del Derrumbe; vuelve el tren.',
  }),
  f(5, {
    name: 'Pilar de la Memoria', place: 'Archivo Hondo, Aldea Mnemos', block: 'B10',
    keeper: 'Olvido Arrieta', tintName: 'sepia', tint: [190, 150, 104],
    localEffect: 'La niebla del olvido se levanta y se abre la Ruta 9 hacia el norte.',
  }),
  f(6, {
    name: 'Pilar Invertido', place: 'Monte del Portal, Mundo Distorsión', block: 'B12',
    keeper: null, tintName: 'violeta', tint: [168, 104, 232],
    localEffect: 'El aljibe queda como puerta anclada; las sombras dejan de filtrarse; cesan los temblores.',
  }),
  f(7, {
    name: 'Pilar de los Ecos', place: 'Ruinas de Antea, Arrecife del Eco', block: 'B14',
    keeper: null, tintName: 'verde agua', tint: [104, 216, 192],
    localEffect: 'Las mareas se normalizan; el hielo-eco retrocede del norte; se reanudan los ferris.',
  }),
  f(8, {
    name: 'Pilar del Alma', place: 'Santuario del Alma, Lagos del Alma', block: 'B16',
    keeper: 'Uxie, Mesprit y Azelf', tintName: 'rosa pálido', tint: [240, 184, 200],
    localEffect: 'Vuelve el vínculo de los Pokémon del norte.',
  }),
  f(9, {
    name: 'Pilar de la Convergencia', place: 'Puente de la Convergencia, Sima del Eje', block: 'B18',
    keeper: 'Dialga y Palkia', tintName: 'plata', tint: [200, 208, 224],
    localEffect: 'Los relojes se sincronizan y la Sima deja de ensancharse.',
  }),
  f(10, {
    name: 'Pilar del Origen', place: 'Fondo de la Sima del Eje', block: 'B20',
    keeper: 'Trío de las Nubes y Gael', tintName: 'oro', tint: [240, 200, 88],
    localEffect: 'Los diez Fragmentos se unen en la Flauta Azur.',
  }),
]);

/** Fragmento del Pilar n (1–10) o null. */
export function fragmentFor(n) {
  return FRAGMENTS[Number(n) - 1] || null;
}

/** Números de Pilar restaurados según sus flags. */
export function restoredPillars(state) {
  return FRAGMENTS.filter((fr) => state.flag(fr.flag)).map((fr) => fr.n);
}

/** Pilar restaurado más alto (0 si ninguno). */
export function highestRestoredPillar(state) {
  return restoredPillars(state).reduce((a, b) => Math.max(a, b), 0);
}

/** ¿Tiene el jugador el Fragmento n? */
export function hasFragment(state, n) {
  return (state.data.fragments || []).includes(fragmentId(n));
}
