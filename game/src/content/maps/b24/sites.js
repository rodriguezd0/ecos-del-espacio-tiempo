import { buildExpeditionMap } from './build.js';
import { expeditionEvents, expeditionEnter } from '../../events/b24_rooms.js';
const back=(map,x,y,dir=2)=>Object.freeze({map,x,y,dir});
const site=(name,quest,theme,species,returnTo,tileset=15)=>Object.freeze({name,quest,theme,species:Object.freeze(species),returnTo,tileset});
export const SITES=Object.freeze({
 b24_aduana_vieja:site('Aduana Vieja',null,'registry',[],back('ciudad_nexo',38,31),4),
 b24_isla_petalo:site('Isla Pétalo','shaymin','flowers',['SHAYMIN'],back('ciudad_nexo',26,37),1),
 b24_isla_estandarte:site('Isla Estandarte','victini','island',['VICTINI'],back('ciudad_nexo',26,37),1),
 b24_santuario_neblino:site('Santuario del Neblino','celebi','grove',['CELEBI'],back('ruta_9_neblino',25,19),1),
 b24_claro_justicia:site('Claro de la Justicia','virizion','justiceForest',['VIRIZION'],back('ruta_9_neblino',41,23),1),
 b24_crater_lucero:site('Cráter del Lucero','cosmog','crater',[],back('cerro_alba',16,8),1),
 b24_cuna_coral:site('Cuna de Coral','manaphy','coral',[],back('antea_2_presente',16,19)),
 b24_canteria_justicia:site('Apuntalamientos de la Cantería','cobalion','quarry',['COBALION'],back('canteria_solano',12,11)),
 b24_cueva_dunas:site('Cueva de las Dunas','terrakion','dunes',['TERRAKION'],back('dunas_ceniza',32,25)),
 b24_mina_diamante:site('Galería de Diamante','diancie','diamond',['DIANCIE'],back('mina_galena',8,19)),
 b24_termas_tizon:site('Termas de Tizón','volcanion','thermal',['VOLCANION'],back('volcan_tizon',25,20)),
 b24_dos_ideales:site('Sala de los dos Ideales','ideales','ideals',['RESHIRAM','ZEKROM'],back('sima_eje',18,16),11),
 b24_ultra_cristal:site('Ultrazona Cristal','ultra_cristal','crystal',['NIHILEGO'],back('b24_crater_lucero',13,18)),
 b24_ultra_selva:site('Ultrazona Selva','ultra_selva','jungle',['BUZZWOLE','PHEROMOSA'],back('b24_crater_lucero',13,18),1),
 b24_ultra_tormenta:site('Ultrazona Tormenta','ultra_tormenta','storm',['XURKITREE'],back('b24_crater_lucero',13,18)),
 b24_ultra_cielo:site('Ultrazona Cielo Alto','ultra_cielo','sky',['CELESTEELA','KARTANA'],back('b24_crater_lucero',13,18)),
 b24_ultra_abismo:site('Ultrazona Abismo','ultra_abismo','abyss',['GUZZLORD'],back('b24_crater_lucero',13,18)),
 b24_ultra_fortaleza:site('Ultrazona Fortaleza','ultra_fortaleza','fortress',['STAKATAKA','BLACEPHALON'],back('b24_crater_lucero',13,18)),
 b24_ultra_veneno:site('Ultrazona Veneno','ultra_veneno','venom',['POIPOLE'],back('b24_crater_lucero',13,18)),
});
export function definition(id){
 const S=typeof id==='string'&&Object.hasOwn(SITES,id)?SITES[id]:null;if(!S)throw new Error('B24: mapa desconocido');
 const outdoor=S.tileset===1;return{id,name:S.name,tileset:S.tileset,width:27,height:25,outdoor,cave:!outdoor&&S.tileset!==4,
  expedition:S.quest,ultra:S.quest?.startsWith('ultra_')||false,bgm:outdoor?'Ruta 3':'Cueva',battleback:outdoor?'Bosque':S.theme==='coral'?'Sub':'Cueva',
  voidBlocks:true,noFollower:['coral','abyss','venom'].includes(S.theme),underwater:S.theme==='coral',start:{x:13,y:22,dir:8},
  tone:({venom:[10,-25,25,15],storm:[-20,-20,0,10],crystal:[-10,0,20,10],jungle:[0,12,-10,0],sky:[-10,0,20,8],abyss:[-25,-25,-10,20],fortress:[10,-10,-10,8]})[S.theme]||[0,0,0,0],
  ...(S.theme==='abyss'?{dark:{amount:0.85,radius:110}}:{}),
  build:b=>buildExpeditionMap(b,S),events:expeditionEvents(id,S),onEnter:ctx=>expeditionEnter(ctx,id,S),
  warps:[{x:13,y:23,to:S.returnTo.map,tx:S.returnTo.x,ty:S.returnTo.y,dir:S.returnTo.dir}]};
}
