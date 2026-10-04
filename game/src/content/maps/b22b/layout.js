// Puntos del postgame sobre suelo libre; no cambian el trazado de la campaña.
export const LOCATIONS = Object.freeze({
  tornadus: { map: 'meseta_impulso', x: 25, y: 25 },
  thundurus: { map: 'dunas_ceniza', x: 38, y: 25 },
  landorus: { map: 'cerro_plomo', x: 14, y: 21 },
  articuno: { map: 'escarcha_lago_interior', x: 17, y: 26 },
  zapdos: { map: 'parque_eolico', x: 23, y: 7 },
  moltres: { map: 'tizon_crater', x: 9, y: 34 },
  raikou: { map: 'anillo_vientos', x: 22, y: 15 },
  entei: { map: 'canteria_solano', x: 7, y: 10 },
  suicune: { map: 'lagos_alma', x: 45, y: 33 },
});
export const WIND_ROUTE = Object.freeze([{x:25,y:25},{x:26,y:25},{x:27,y:25},{x:27,y:26},{x:26,y:26},{x:25,y:26}]);
export const RAYS = Object.freeze([{map:'dunas_ceniza',x:24,y:25},{map:'dunas_ceniza',x:30,y:25},{map:'dunas_ceniza',x:36,y:25}]);
export const SIGHTINGS = Object.freeze({
  raikou: [{map:'meseta_impulso',id:'meseta',x:29,y:28},{map:'ruta_4',id:'ruta4',x:40,y:18},{map:'ruta_5',id:'ruta5',x:23,y:20},{map:'ruta_11',id:'ruta11',x:14,y:35}],
  entei: [{map:'ruta_6',id:'ruta6',x:13,y:35},{map:'dunas_ceniza',id:'dunas',x:29,y:27},{map:'ruta_7',id:'ruta7',x:45,y:16},{map:'volcan_tizon',id:'tizon',x:20,y:26}],
  suicune: [{map:'garganta_albo',id:'albo_cauce',x:18,y:30},{map:'gruta_albo',id:'albo_gruta',x:19,y:9},{map:'pozo_albo',id:'albo_pozo',x:12,y:10}],
});
export const LAKE = Object.freeze({
  map:'escarcha_lago_interior', room:{x:3,y:1}, entry:{x:17,y:35,dir:8}, exit:{x:17,y:36},
  access:{map:'gruta_escarcha_2',x:23,y:20}, return:{map:'gruta_escarcha_2',x:22,y:20,dir:4},
});
