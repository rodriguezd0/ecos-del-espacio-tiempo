// Catálogo de mapas de Axis por zona (docs/CAMPANA.md §1.3–1.6, «Mapas:» de cada bloque y §1.8):
// nombre visible, música (BGM) y fondo de combate por defecto, y lugar del atlas al que pertenece
// (ui/logic/regionMapData.js). Módulo PURO y fuente única de estos datos: lo usan los mapas
// (`...zoneDefaults('villa_zaguan')`), ui/core/mapNames.js y las plantillas de servicios.
//
// Música y fondos: TÉCNICO provisional (X04/X20). Donde CAMPANA no fija un valor se deja null: el mapa
// decide o el combate usa el entorno del terreno. Los interiores se resuelven por prefijo
// ('zaguan_centro' → Villa Zaguán) y heredan nombre y música de su población.

/**
 * Grupo: lugar del atlas + valores por defecto + mapas exactos y prefijos de interiores.
 * maps: 'id' o ['id', { name?, bgm?, battleback? }] para excepciones dentro del grupo.
 */
const G = (place, name, bgm, battleback, maps, prefixes = []) => ({ place, name, bgm, battleback, maps, prefixes });

export const MAP_GROUPS = Object.freeze([
  // ── Poblaciones (§1.3) ──────────────────────────────────────────────────────────────────────
  G('villa_alba', 'Villa Alba', 'town_start', 'Bosque',
    ['villa_alba', 'casa_prota_1f', 'casa_prota_2f', 'casa_gael', 'casa_vecinos_n', 'casa_vecinos_se', 'laboratorio_alerce'], ['alba_']),
  G('villa_zaguan', 'Villa Zaguán', 'PrismaVilla2', 'Pradera', ['villa_zaguan', 'zaguan_centro', 'casa_dintel'], ['zaguan_']),
  G('ciudad_caudal', 'Ciudad Caudal', 'CiudadCeleste', 'water_rio', ['ciudad_caudal', 'molino_diezmo'], ['caudal_']),
  G('villa_brontia', 'Villa Brontia', 'PuebloMarengo', null, ['villa_brontia'], ['brontia_']),
  G('ciudad_estrato', 'Ciudad Estrato', 'CiudadVerde', null, ['ciudad_estrato'], ['estrato_']),
  G('ciudad_lumina', 'Ciudad Lúmina', 'CiudadAzulona', null, ['ciudad_lumina'], ['lumina_']),
  G('aldea_mnemos', 'Aldea Mnemos', 'PrismaVilla1', null, ['aldea_mnemos'], ['mnemos_']),
  G('ciudad_nexo', 'Ciudad Nexo', 'CiudadCarmin', null, ['ciudad_nexo'], ['nexo_']),
  G('caleta_sonda', 'Caleta Sonda', 'Azul Tema', null, ['caleta_sonda'], ['caleta_']),
  G('villa_boreal', 'Villa Boreal', 'Emociones', 'snow', ['villa_boreal'], ['boreal_']),
  G('mesa_vientos', 'Mesa de los Vientos', 'viento', null, ['mesa_vientos'], ['mesa_vientos_']),
  G('bastion_axis', 'Bastión Axis', 'Torre Batalla', null, ['bastion_axis'], ['bastion_']),

  // ── Rutas y zonas (§1.4) ────────────────────────────────────────────────────────────────────
  G('ruta_1', 'Ruta 1', 'Ruta 1', 'Bosque', ['ruta_1']),
  G('laberinto_profundidad', 'Laberinto de la Profundidad', 'Amenaza', null, ['laberinto_profundidad', 'laberinto_setos']),
  G('ruta_2', 'Ruta 2', 'Ruta 2', 'PraderaFlores', ['ruta_2']),
  G('ruta_3', 'Ruta 3', 'PrismaRuta1', null, ['ruta_3']),
  G('garganta_albo', 'Garganta del Albo', 'PrismaRuta1', 'water_rio', ['garganta_albo']),
  G('ruta_4', 'Ruta 4', 'Ruta 3', null, ['ruta_4']),
  G('ruta_5', 'Ruta 5', 'viento', 'Acantilado', ['ruta_5']),
  G('meseta_impulso', 'Meseta del Impulso', 'viento', 'Acantilado',
    ['meseta_impulso', ['parque_eolico', { name: 'Parque Eólico', battleback: 'Central' }]], ['parque_eolico_']),
  G('ruta_6', 'Ruta 6', 'PrismaRuta2', 'ZonaEscarpada', ['ruta_6']),
  G('canteria_solano', 'Cantería Solano', 'PrismaRuta2', 'ZonaEscarpada', ['canteria_solano'], ['canteria_']),
  G('dunas_ceniza', 'Dunas de Ceniza', 'IslaCanela', 'Desierto', ['dunas_ceniza']),
  G('ruta_7', 'Ruta 7', 'Ruta 3', 'Desierto', ['ruta_7']),
  G('ruta_14_reserva', 'Ruta 14', 'ZonaSafari', 'Pradera3', ['ruta_14_reserva'], ['reserva_']),
  G('ruta_8_marisma', 'Ruta 8', 'PuebloLavanda', 'Pradera2', ['ruta_8_marisma'], ['palafitos_']),
  G('ruta_9_neblino', 'Ruta 9', 'PrismaBosqueArcoiris', 'BosqueLila', ['ruta_9_neblino']),
  G('ruta_10', 'Ruta 10', 'BosqueVerde', 'Bosque', ['ruta_10']),
  G('montana_portal', 'Monte del Portal', 'Intro', 'Monte', ['montana_portal', 'campamento_monte']),
  G('cerro_del_alba', 'Cerro del Alba', 'Ruta 1', null, ['cerro_alba', 'cerro_del_alba']),
  G('ruta_11', 'Ruta 11', 'PrismaRuta2', 'snow', ['ruta_11']),
  G('paso_del_norte', 'Paso del Norte', 'PrismaRuta2', 'snow', ['paso_del_norte']),
  G('ruta_12_senda_lazo', 'Ruta 12', 'Transicion', 'CimaNevada', ['ruta_12_senda_lazo']),
  G('ruta_13', 'Ruta 13', 'Ruta 2', 'snow', ['ruta_13']),
  G('lagos_alma', 'Lagos del Alma', 'VinculoSupremo', 'Agua', ['lagos_alma']),
  G('gruta_escarcha', 'Gruta Escarcha', 'Cueva', 'CuevaHielo', ['gruta_escarcha'], ['gruta_escarcha_']),
  G('mar_boreal', 'Mar Boreal', 'Azul Tema', 'water', ['mar_boreal']),
  G('ruta_15', 'Ruta 15', 'Azul Tema', 'Playa', ['ruta_15']),
  G('mar_del_sur', 'Mar del Sur', 'Azul Tema', 'water', ['mar_del_sur']),
  G('mar_del_sur', 'Fondo del Mar del Sur', 'Emociones', 'Sub', ['fondo_mar_sur']),
  G('islote_lumbre', 'Islote Lumbre', 'Pokeflauta', null, ['islote_lumbre']),
  G('volcan_tizon', 'Volcán Tizón', 'MansionQuemada', 'Volcan', ['volcan_tizon'], ['volcan_tizon_', 'tizon_']),
  G('estacion_talasa', 'Estación Talasa', 'GuaridaRocket', 'BaseVillano', ['estacion_talasa', ['ruinas_talasa', { name: 'Ruinas de Talasa' }]], ['estacion_talasa_', 'talasa_']),
  G('arrecife_eco', 'Arrecife del Eco', 'Emociones', 'Sub', ['arrecife_eco']),
  G('sima_eje', 'Sima del Eje', 'Amenaza', 'Espacio', ['sima_eje']),
  G('senda_mirador', 'Senda del Mirador', 'Amenaza', 'Espacio', ['senda_mirador']),
  G('mirador_sur', 'Mirador Sur', null, 'Espacio', ['mirador_sur', ['grieta_porvenir', { name: 'Grieta del Porvenir' }]]),
  G('calzada_rey', 'Calzada del Rey', null, 'Espacio', ['calzada_rey']),
  G('cumbre_azur', 'Columna Lanza', 'Final2', 'ColumnaLanza', ['columna_lanza', ['cumbre_azur', { name: 'Cumbre Azur' }]]),
  G('instalacion_cierzo', 'Instalación Cierzo', null, null, ['instalacion_cierzo'], ['cierzo_']),

  // ── Pilares (§1.5) ──────────────────────────────────────────────────────────────────────────
  G('ruinas_dintel', 'Pilar del Umbral', null, 'Templo', ['explanada_umbral', 'ruinas_dintel']),
  G('garganta_albo', 'Pilar de la Corriente', null, 'CuevaAzul', ['pilar_corriente']),
  G('meseta_impulso', 'Pilar del Impulso', null, 'Acantilado', ['anillo_vientos', 'galerias_soplo']),
  G('cerro_plomo', 'Pilar de la Masa', null, 'Cueva', ['cerro_plomo', 'camara_contrapesos']),
  G('ciudad_estrato', 'Mina Galena', null, 'CuevaOscura', ['mina_galena'], ['mina_galena_']),
  G('archivo_hondo', 'Pilar de la Memoria', null, 'Templo', ['archivo_hondo']),
  G('aljibe_portal', 'Pilar Invertido', 'distortion', 'MundoDistorsion', ['aljibe_portal'], ['pilar_invertido']),
  G('arrecife_eco', 'Pilar de los Ecos', null, 'Templo', ['fosa_eco'], ['antea_']),
  G('lagos_alma', 'Pilar del Alma', null, 'Templo', ['santuario_alma']),
  G('sima_eje', 'Pilar de la Convergencia', null, 'Espacio', ['puente_convergencia', 'camara_cruce']),
  G('sima_eje', 'Pilar del Origen', null, 'Cielo', ['puerta_quince', 'senda_origen', 'cielo_interior', 'terraza_ultimo_sello', 'nucleo_origen']),
]);

function compile() {
  const exact = new Map();
  const prefixes = [];
  for (const g of MAP_GROUPS) {
    const base = { place: g.place, name: g.name, bgm: g.bgm ?? null, battleback: g.battleback ?? null };
    for (const m of g.maps) {
      const [id, over] = Array.isArray(m) ? m : [m, {}];
      if (exact.has(id)) throw new Error(`zones: mapa repetido en el catálogo: ${id}`);
      exact.set(id, Object.freeze({ id, ...base, ...over }));
    }
    for (const p of g.prefixes) prefixes.push({ prefix: p, info: base });
  }
  prefixes.sort((a, b) => b.prefix.length - a.prefix.length);
  return { exact, prefixes };
}

const { exact: EXACT, prefixes: PREFIXES } = compile();

/** Ids de mapa exactos del catálogo (orden de declaración). */
export const CATALOG_MAP_IDS = Object.freeze([...EXACT.keys()]);

/**
 * Datos por defecto del mapa: { id, place, name, bgm, battleback } o null si no es de Axis
 * (mapas de prueba, ids desconocidos). Busca el id exacto y, si no, el prefijo más largo.
 */
export function mapInfo(mapId) {
  if (!mapId || typeof mapId !== 'string') return null;
  const hit = EXACT.get(mapId);
  if (hit) return hit;
  const p = PREFIXES.find((e) => mapId.startsWith(e.prefix));
  return p ? { id: mapId, ...p.info } : null;
}

/**
 * Valores por defecto para una definición de mapa: { name, bgm, battleback } (sin nulls: los campos
 * sin dato no aparecen). Uso: `export default { id: 'ruta_4', ...zoneDefaults('ruta_4'), … }`.
 */
export function zoneDefaults(mapId) {
  const info = mapInfo(mapId);
  if (!info) return {};
  const out = {};
  for (const k of ['name', 'bgm', 'battleback']) if (info[k]) out[k] = info[k];
  return out;
}

/** Nombre visible de un mapa ('' si no está en el catálogo). */
export function mapDisplayName(mapId) {
  return mapInfo(mapId)?.name || '';
}

/** Lugar del atlas al que pertenece el mapa (id de REGION_MAP.places) o null. */
export function mapPlace(mapId) {
  return mapInfo(mapId)?.place || null;
}
