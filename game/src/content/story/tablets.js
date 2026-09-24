// Las 18 Tablillas de Axis (docs/TABLILLAS.md §4.1, D11, D12): las 17 tablas de tipo de Essentials más la
// Tabla Legendaria. BLANKPLATE («Tabla Normal» en Añil) NO se usa en Axis. Quince forman los arcos T01–T15
// de la historia principal (una Crónica cada una); Arceus conserva tres (Terrax, Terror y Legendaria).
// Módulo PURO de datos. Los IDs son los objetos reales de Añil (game/data/items.json, iconos en
// Graphics/Items/<ID>.png).

export const RETIRED_TABLET = 'BLANKPLATE';
export const CAMPAIGN_TABLET_COUNT = 15;

const t = (id, name, type, arc, chronicle, place, block) => Object.freeze({ id, name, type, arc, chronicle, place, block, arceusPhase: null });
const a = (id, name, type, arceusPhase) => Object.freeze({
  id, name, type, arc: null, chronicle: null, place: 'Columna Lanza (Arceus)', block: 'B21', arceusPhase,
});

export const TABLETS = Object.freeze([
  t('MEADOWPLATE', 'Tabla Pradal', 'GRASS', 'T01', 1, 'Villa Zaguán, Arboleda de los Nombres', 'B03'),
  t('SPLASHPLATE', 'Tabla Linfa', 'WATER', 'T02', 2, 'Ciudad Caudal, Molino del Diezmo', 'B05'),
  t('ZAPPLATE', 'Tabla Trueno', 'ELECTRIC', 'T03', 3, 'Villa Brontia, campanario y subestación', 'B05'),
  t('STONEPLATE', 'Tabla Pétrea', 'ROCK', 'T04', 4, 'Ruta 6, Cantería Solano', 'B07'),
  t('FISTPLATE', 'Tabla Fuerte', 'FIGHTING', 'T05', 5, 'Ciudad Estrato, Losa del Pulso', 'B09'),
  t('IRONPLATE', 'Tabla Acero', 'STEEL', 'T06', 6, 'Ciudad Lúmina, Museo de las Eras', 'B09'),
  t('INSECTPLATE', 'Tabla Bicho', 'BUG', 'T07', 7, 'Reserva del Delta', 'B09'),
  t('TOXICPLATE', 'Tabla Tóxica', 'POISON', 'T08', 8, 'Ruta 8, Marisma Turbia', 'B09'),
  t('MINDPLATE', 'Tabla Mental', 'PSYCHIC', 'T09', 9, 'Aldea Mnemos', 'B11'),
  t('DREADPLATE', 'Tabla Oscura', 'DARK', 'T10', 10, 'Bosque Neblino y Ruta 10', 'B11'),
  t('PIXIEPLATE', 'Tabla Duende', 'FAIRY', 'T11', 11, 'Islote Lumbre', 'B13'),
  t('FLAMEPLATE', 'Tabla Llama', 'FIRE', 'T12', 12, 'Volcán Tizón', 'B13'),
  t('ICICLEPLATE', 'Tabla Helada', 'ICE', 'T13', 13, 'Villa Boreal', 'B15'),
  t('SKYPLATE', 'Tabla Cielo', 'FLYING', 'T14', 14, 'Ciudad Nexo → Mesa de los Vientos', 'B17'),
  t('DRACOPLATE', 'Tabla Draco', 'DRAGON', 'T15', 15, 'Calzada del Rey (Sima del Eje)', 'B19'),
  a('EARTHPLATE', 'Tabla Terrax', 'GROUND', 'Tierra'),
  a('SPOOKYPLATE', 'Tabla Terror', 'GHOST', 'Fantasma'),
  a('LEGENDPLATE', 'Tabla Legendaria', 'NORMAL', 'Normal'),
]);

export const CAMPAIGN_TABLETS = Object.freeze(TABLETS.filter((x) => x.arc));
export const ARCEUS_TABLETS = Object.freeze(TABLETS.filter((x) => x.arceusPhase));

const BY_ID = new Map(TABLETS.map((x) => [x.id, x]));

/** Tablilla por id de objeto (o null). BLANKPLATE devuelve null: no forma parte de Axis. */
export function tabletById(id) {
  return BY_ID.get(id) || null;
}

/** Tablilla del arco 'T01'…'T15' (o null). */
export function tabletForArc(arc) {
  return CAMPAIGN_TABLETS.find((x) => x.arc === arc) || null;
}

export function hasTablet(state, id) {
  return (state.data.tablets || []).includes(id);
}

/** Tablillas de campaña que faltan (la Puerta de las Quince las nombra, TABLILLAS §4.8). */
export function missingCampaignTablets(state) {
  return CAMPAIGN_TABLETS.filter((x) => !hasTablet(state, x.id));
}

/** ¿Tiene las quince de campaña? (condición de la Puerta de las Quince, P10). */
export function hasAllCampaignTablets(state) {
  return missingCampaignTablets(state).length === 0;
}

/** Recuento para la Libreta: { campaign: n/15, total: n/18 }. */
export function tabletCounts(state) {
  const owned = TABLETS.filter((x) => hasTablet(state, x.id)).length;
  const campaign = CAMPAIGN_TABLETS.filter((x) => hasTablet(state, x.id)).length;
  return { owned, total: TABLETS.length, campaign, campaignTotal: CAMPAIGN_TABLET_COUNT };
}
