// Texto de guía de docs/stamps.md (lo usa tools/stamps_doc.mjs; el catálogo sale de las definiciones).
export const GUIDE = `# Biblioteca de stamps y brushes

Piezas reutilizables para construir los mapas originales de Axis con los tilesets de Añil
(contrato: \`docs/ARCHITECTURE.md\` §5). **Este archivo se genera** con \`node tools/stamps_doc.mjs\`;
edita la guía en \`tools/stamps_doc_guide.mjs\` y el catálogo en las definiciones.

- **Stamp**: bloque fijo de tiles (edificio, árbol, mueble, boca de cueva…) en 1–3 capas, con metadatos
  (\`door\` = casilla de la puerta/warp relativa al stamp, \`solid\`, \`tags\`, \`desc\`).
- **Brush**: relleno inteligente sobre un conjunto de casillas (césped, caminos con bordes, agua, bosque,
  terrazas, habitaciones…). Se calcula con \`paintBrush\`.
- **Tiles propios (overlay)**: piezas que Añil no tiene (kit de Pilar, grava, barro, arena/nieve/ceniza honda,
  zócalos hexagonales) dibujadas por \`tools/stamps_extra*.mjs\` en filas VACÍAS de los atlas del juego.

## Archivos

| Archivo | Qué es |
|---|---|
| \`game/src/content/stamps/<Imagen>.js\` | Definición legible por tileset (\`src\` / \`from\` / \`tiles\` + metadatos + brushes) |
| \`game/src/content/stamps/*_extras.js\`, \`interior_solemne.js\` | Piezas por bioma que se mezclan en las definiciones |
| \`game/src/content/stamps/baked/<Imagen>.js\` | **Generado** por \`tools/stamps_bake.mjs\`: rejillas de IDs resueltas (los mapas de Añil no se sirven en el juego) |
| \`game/src/content/stamps/extraTiles.js\` | Overlay de tiles propios: piezas (\`EXTRA_PIECES\`), dónde van (\`EXTRA_LAYOUTS\`) y sus stamps/brushes (\`extraDefs\`) |
| \`game/src/content/stamps/pilar.js\` | Kit común de Pilar (X23) y **tinte por Pilar** (\`pilarTone\`) |
| \`game/src/content/stamps/index.js\` | API de carga y colocación (pura, sin DOM) |
| \`game/src/content/stamps/brushes.js\` | Algoritmos de brushes (puros) |
| \`game/src/content/stamps/viewer.html\` | Visor en el navegador: <http://localhost:8080/src/content/stamps/viewer.html> |
| \`game/assets/objects/barreras.png\` | Gráficos de EVENTO de las barreras de Zygarde (\`tools/stamps_objects.mjs\`) |
| \`game/src/content/maps/dev_stamps.js\` | Sala de pruebas del kit: \`?scene=map&map=dev_stamps&debug\` (\`vars=pilar:N\` cambia el tinte) |

## API (para el MapBuilder)

\`\`\`js
import { loadStampLibrary, stampWrites, stampDoor } from '../content/stamps/index.js';
import { paintBrush, rectCells } from '../content/stamps/brushes.js';

const lib = await loadStampLibrary(7);          // por ID de tileset (12–15 → Cueva1)
const casa = lib.stamp('casa_roja');            // { name, w, h, layers: [number[]|null ×3], door, tags, desc, … }
for (const w of stampWrites(casa, 10, 6)) layers[w.layer][w.x + w.y * width] = w.id; // solo celdas no vacías
stampDoor(casa, 10, 6);                         // → { x: 14, y: 13 } casilla del warp
for (const w of paintBrush(lib.brush('camino_arena'), rectCells(4, 12, 20, 3), { width, height })) { /* igual */ }
lib.byTag('edificio');                          // stamps por etiqueta
\`\`\`

- \`paintBrush(brush, cells, { seed, width, height, inMask })\` devuelve \`[{ x, y, layer, id }]\`; \`cells\` es la
  máscara del trazo. \`inMask\` permite calcular bordes con otra máscara (p. ej. agua ya pintada).
- Los brushes \`room\` y \`cave\` escriben también fuera de \`cells\` (marco / paredes alrededor del suelo).
- \`buildStampLibrary\` lanza un error claro si el horneado está desfasado respecto a la definición.
- En un mapa (\`build(b)\`): \`b.stamp('pilar_monolito', x, y)\`, \`b.rect(null, x, y, w, h, 'grava')\`… El MapBuilder
  delega en \`brushes.js\` los tipos complejos (\`forest\`, \`cliff\`, \`terrace\`, \`room\`, \`cave\`, \`edge2\` y
  \`nine\` con IDs explícitos).

## Tipos de brush

| Tipo | Definición | Uso |
|---|---|---|
| \`tile\` | \`{ tile, variants?, chance? }\` | Relleno con variantes deterministas |
| \`pattern\` | \`{ pattern: [x, y, w, h] }\` | Mosaico por posición absoluta (césped 4×4, suelos de cueva 3×3) |
| \`grid\` | \`{ grid: [[id, id], [id, id]] }\` | Mosaico de IDs explícitos (agua de exterior) |
| \`autotile\` | \`{ autotile: slot }\` | Autotile resuelto por vecinos (agua de cueva, flores animadas, **cascadas**) |
| \`nine\` | \`{ nine: [x, y], inner?, fill? }\` / \`{ nine: 'ids', ids }\` | Borde 3×3 + esquinas cóncavas 2×2 (orden NO, NE / SO, SE) |
| \`edge2\` | \`{ edge2: { src: [x, y], fill? } }\` | Borde doble 5×5 (playas de arena con espuma sobre el agua; formas convexas) |
| \`forest\` | \`{ forest: { trees, size, period } }\` | Bosque de árboles 2×6 apilados cada 4 filas (copas capa 2, troncos capa 1) |
| \`cliff\` | \`{ cliff: { src, width, faceRows, rows? } }\` | Macizo convexo con cara (acantilados, cerezal) |
| \`terrace\` | \`{ terrace: { rim, side, face } }\` | Terraza de muros finos convexa (ancho ≥ 5) |
| \`room\` | \`{ room: { wall, floor, floorShade, void, frame } }\` | Habitación interior con marco (capas 0 y 2) |
| \`cave\` | \`{ cave: { floor, void, ring } }\` | Sala de cueva rectangular con paredes |
| \`line\` | \`{ line: { ids \\| src, axis } }\` | Línea con extremos (salientes, vallas, canal de resonancia) |

## Kit común de Pilar (X23) y tinte por Pilar

Las piezas \`pilar_*\` llevan **el mismo nombre en todas las bibliotecas de Pilar**, así un recinto se construye igual
en cualquier tileset:

| Grupo | Tilesets | Piezas |
|---|---|---|
| Kit completo | 2 y 12–15 (Cueva1), 11 (InteriorTorre), 8 (InteriorLiga) | \`pilar_monolito\`, \`pilar_dintel\`, \`pilar_canal\` / \`pilar_canal_v\` (brush línea), \`pilar_placa_unown\`, \`pilar_glifo\`, \`pilar_glifo_2\`, \`pilar_pedestal\`, \`pilar_columna\`, \`pilar_columna_quebrada\`, \`pilar_escalinata\`, \`pilar_escalinata_ancha\`, \`pilar_camara_nucleo\`, \`pilar_zocalo\` / \`_gastado\` / \`_vivo\`, \`pilar_losa_eco\`, \`pilar_arista\`, \`pilar_arista_grande\`, \`pilar_manantial\`, \`pilar_enlosado\` (brush nine) |
| Kit exterior | 1 (Exterior1), 7 (ExteriorBosqueCeleste) | monolito, columna(s), dintel, placa Unown, glifos, pedestal, arista, losa de eco, zócalos |
| Solo zócalos | 3, 5, 6 | \`pilar_zocalo\`, \`pilar_zocalo_gastado\` (+ \`_vivo\` en 3 y 5) |

- **Capas**: los calcos de suelo (glifos, cámara de núcleo, losa de eco, zócalos, escalinatas, canal, manantial)
  van en la capa 2 con prioridad 0 para verse sobre el \`pilar_enlosado\` (capa 1). Lo que se coloque encima en la
  capa 2 los sustituye (p. ej. \`pilar_pedestal\` sobre la cámara tapa su centro: queda bien, es su sitio).
- **Pasabilidad y prioridad** reales en \`tilesets.json\`: la base de monolitos, columnas, estelas, pedestales y
  aristas bloquea; lo alto tiene prioridad k = filas sobre la base (tapa al personaje que pasa por detrás). El dintel
  deja un hueco de 3 casillas entre sus pilares. Canal y manantial bloquean (agua).
- **Tinte por Pilar**: la piedra es neutra y el color lo pone el tono del mapa (se suma a día/noche y clima):

\`\`\`js
import { pilarTone } from '../stamps/pilar.js';          // desde content/maps/<bloque>/
export default { id: 'ruinas_dintel', tileset: 2, tone: pilarTone('P1'), … };
await ctx.tone(pilarTone('P1', 0.4), 40);                // en guiones: intensidad 0..1 (p. ej. tras restaurar)
\`\`\`

| Pilar | Tinte | Pilar | Tinte |
|---|---|---|---|
| P1 Umbral | ocre | P6 Invertido | violeta |
| P2 Corriente | azul | P7 Ecos | verde agua |
| P3 Impulso | blanco | P8 Alma | rosa pálido |
| P4 Masa | gris plomo | P9 Convergencia | plata |
| P5 Memoria | sepia | P10 Origen | oro |

Hoja comparativa: \`node tools/stamps_demo.mjs\` → \`tools/cache/stamps/demo/pilar_tintes.png\`.

## Barreras de campo (CAMPANA §1.1)

| Barrera | Cómo se pinta | Evento |
|---|---|---|
| Cuesta de grava | brush \`grava\` (nine, capa 1) en 1, 3, 5, 6, 7 | la bloquea el contenido (Correr) |
| Roca agrietada / tronco caído | — | \`ramRock\` con \`sprite: 'asset:objects/barreras.png'\`, \`dir: 2\` roca · \`4\` tronco · \`8\` roca nevada; \`directionFix: true, stepAnime: true\` |
| Barro / arena / nieve / ceniza honda | brushes \`barro\` (3, 5, 6), \`arena_honda\` (5, 6, tag Sand), \`nieve_honda\` (1), \`ceniza_honda\` (6) | \`roughTerrain\` en los bordes de paso |
| Pared con vetas (Trepar) | pared del tileset (+ \`enredadera\` / brush \`pared_trepar\` en cuevas) | \`climbWall\` con \`sprite: 'asset:objects/barreras.png', dir: 6\` (vetas verdes superpuestas) |
| Vacío con zócalos | \`pilar_zocalo_gastado\` en los bordes | \`rebuildGap\` con \`tiles: [[x, y, 2, id de pilar_zocalo_vivo o pilar_zocalo]]\` |
| Cascada | brush \`cascada\` (autotile 0, capa 2) sobre el acantilado, agua arriba y abajo | — |

## Biomas de la campaña → biblioteca

| Bioma (CAMPANA §1.3–1.5) | TS | Piezas clave |
|---|---|---|
| Pueblo de bosque, rutas, Bosque Neblino | 7 | edificios, \`bosque*\`, \`bosque_morado\`, \`terraza\`, \`acantilado\`, \`cascada\`, \`grava\`, kit exterior |
| Villa Zaguán, Brontia, Ruta 2–5, Monte del Portal, Sima | 1 | edificios, \`central\`, \`campana\`, \`capilla\`, \`estrado\`, \`cascada\`, \`grava\`, kit exterior |
| Nieve (Ruta 11, Paso del Norte, Ruta 13, Villa Boreal) | 1 | \`nieve\`, \`nieve_parche\`, \`arena_nevada\`, \`nieve_honda\`, \`pino_nevado(_peque)\`, \`meseta_nevada\`, \`hoyo_nevado\`, \`empalizada\`, \`cueva_ladera\`, \`escalera_ladera\` |
| Puerto y costa (Ciudad Nexo, Caleta Sonda, Ruta 15, Mar Boreal) | 1 | \`playa\`, \`muelle\`, \`muelle_piedra\`, \`faro\`, \`velero(_2)\`, \`yate\`, \`contenedores\`, \`cajas_madera\`, \`palmeral\`, \`palmera_maceta\`, \`sombrilla\` |
| Ciudad fluvial / capital (Caudal, Lúmina) | 3 | \`tienda_torre\`, \`grandes_almacenes\`, \`galeria_arte\` (museo), \`edificio_crema\`, \`bloque_verde*\`, \`casino\`, \`torre_oscura\`, \`restaurante\`, \`puesto_*\`, \`arco_puente\`, \`suelo_ciudad\`, \`adoquin\`, \`orilla\` |
| Ciudad minera y cañón (Estrato, Ruta 6/7) | 5 | \`estacion_tren\`, \`rascacielos\`, \`bloque_amarillo\`, \`templo_dorado\`, \`pozo_mina\`, \`foso_tierra\`, \`meseta_tierra\`, \`puente_metal\`, \`tuberias\`, \`deposito\`, \`calzada\`, \`grava\` |
| Marisma, delta, sabana, dunas (Ruta 8, 14, Reserva, Dunas de Ceniza) | 6 | \`barro\`, \`ceniza\`, \`ceniza_honda\`, \`arena_honda\`, \`palafito\`, \`puente_tablas\`, \`pasarela_diagonal\`, \`muelle\`, \`tarima\`, \`bosque_sabana\`, \`molino_viento\`, \`invernadero\`, \`playa\` |
| Oriental (Aldea Mnemos, Islote Lumbre) | 9 | \`cerezal\`, \`cerezo(_grande)\`, \`petalos\`, \`torii*\`, \`pabellon_*\`, \`templo_oscuro\`, \`santuario_negro\`, \`dojo\`, \`linterna_*\`, \`farolillos\`, \`puente_rojo\`, \`mar\`, \`playa\`, \`cielo\` |
| Cuevas (tierra, arcilla, hielo, volcán, gris/azul, morada) | 2, 12–15 | \`sala[_variante]\`, \`mancha*\`, \`estanque*\`, \`saliente*\`, bocas por variante, \`sala_irregular*\`, \`sala_islote\`, \`sala_glaciar_*\` (12), \`sala_volcan_*\` (13), \`sala_cueva_azul*\` (15), \`hielo\`, \`nieve\`, \`cascada\`, \`plataforma_madera\` (puente), \`escombros\` |
| Interiores normales, museo, laboratorio, estación, almacenes, oficinas, industria | 4 | \`habitacion_*\`, \`museo_sala\`, \`museo_galeria\`, vitrinas y fósiles, \`laboratorio_*\` (Talasa), \`estacion_tren\`, \`grandes_almacenes*\`, \`oficinas\`, \`central_*\` (Genesis) |
| Salas solemnes y recintos de Pilar interiores | 11, 8 | \`sala_<color>\` (7 marcos), \`vestibulo_solemne\`, \`sala_octogonal\`, \`sala_fuego\`, \`sala_hielo\`, \`sala_sombra\`, \`sala_trono\`, \`sala_arena\`, \`sala_campeon\` (8), \`emblema_*\`, kit de Pilar |

Nada de esto es canon: los stamps son piezas gráficas; la distribución de cada mapa la decide su guion.

## Convenciones y hallazgos

- **Capas**: suelo en 0; caminos, hierba alta, orillas y alfombras en 1; edificios, árboles y muebles en 2
  (como en Añil: así la sombra de un edificio cubre el camino de la capa 1).
- **Pasabilidad**: la da el tileset (\`passages\`/\`priorities\`/\`terrainTags\`); \`solid\` es solo informativo.
- **Agua de exterior**: el autotile \`agua\` de Añil solo tiene válidos los 4 bloques interiores; sus bordes llevan
  una **X roja**. No usar \`{ autotile: 1 }\`: usar el brush \`agua\` (grid) y encima \`orilla\` o \`playa\` con la
  misma máscara. El agua de cueva (autotile 6) sí es un autotile completo.
- **Terrain tags** útiles (tileset 7): hierba alta 388 (morada) y 396 (verde); salientes 651/657/652; arena 416–434.
- **Brushes convexos**: \`cliff\`, \`terrace\`, \`room\`, \`cave\` y \`edge2\` trabajan sobre formas convexas; para formas en
  L combina varios trazos o usa los recortes probados (\`sala_cruz\`, \`sala_irregular\`…). Las alfombras, manchas y
  estanques \`nine\` quedan mejor rectangulares.
- **Salas \`from\`** (recortes de mapas de Añil): úsalas como plantilla; se horneaban con sus muebles, así que los
  eventos (PC, mostradores, estatuas) los pone el mapa. Revisa las del mismo tileset: \`sala_trono\` en 11 y
  \`sala_octogonal\` en 8 cambian algunos tiles de color (el horneado avisa).
- **Bosque**: ancho par; alto ideal 4k+2 para que la última fila sea de troncos. Un tipo de árbol por columna
  (\`mix: 'tree'\` para variar árbol a árbol).
- **Salidas de interior**: \`salida_casa\` / \`salida_lab\` se colocan con la esquina en (puertaX − 2 | − 1, fila
  inferior del suelo); el warp queda en \`door\` (fila del marco).
- **Bocas de cueva** sobre una sala con suelo x0..x1, y0..y1: \`boca_norte\` en (x, y0 − 4), \`salida_luz_sur\`
  en (x, y1), \`boca_oeste\` en (x0 − 3, y), \`boca_este\` en (x1, y). Las variantes llevan sufijo (\`_hielo\`…).
- **Recortes \`from\`**: los mapas del tileset 1 (Exterior1) comparten casi todos los IDs con ExteriorBosqueCeleste;
  el horneado avisa de cuántos tiles difieren y cada recorte se revisó dibujado con el tileset destino.
- **Overlay**: \`npm run data\` regenera atlas y \`tilesets.json\` desde Añil y vuelve a aplicar el overlay
  (\`tools/stamps_extra.mjs\`). Para añadir una pieza: define su forma en \`EXTRA_PIECES\`, su arte en
  \`tools/stamps_extra_art.mjs\` o \`_terrain.mjs\`, su hueco en \`EXTRA_LAYOUTS\`, y ejecuta
  \`node tools/stamps_extra.mjs && node tools/stamps_bake.mjs\`.
- **Correcciones de terrain** (\`TERRAIN_PATCHES\` en \`extraTiles.js\`, las aplica la misma herramienta): la orilla y la
  playa de ExteriorSafari (6) pasan a ser agua navegable como en Exterior1 (en Añil bloqueaban sin tag de agua).
- **Mar decorativo**: \`mar\` (9) y \`luna_panorama\` (3) no tienen terrain de agua; para agua navegable usa \`agua\`.

## Herramientas

| Comando | Para qué |
|---|---|
| \`node tools/find_tiles.mjs <Imagen> [--rows=a-b]\` | Hojas del tileset original con nº de fila/columna e ID (\`tools/cache/stamps/tiles\`) |
| \`node tools/find_tiles.mjs --map=<id> --region=x,y,w,h [--as=<ts>]\` | Recorte de un mapa de Añil con coordenadas (dibujable con otro tileset) |
| \`node tools/find_tiles.mjs --dump=<id> --region=… \` / \`--usage=<tile> [--tileset=<ts>]\` | IDs de un recorte / dónde se usa un tile |
| \`node tools/stamps_components.mjs <Imagen> --rows=a-b\` | Rectángulos de objetos separados por tiles vacíos |
| \`node tools/stamps_scan.mjs <Imagen> --rows=a-b [--max=12]\` | Catálogo visual de esos objetos rotulados con su \`src\` (\`tools/cache/stamps/scan\`) |
| \`node tools/stamps_compat.mjs <origen> <destino>\` | Qué stamps/brushes de una biblioteca valen tal cual en otro tileset |
| \`node tools/stamps_bake.mjs [Imagen]\` | Hornea y valida (IDs, puertas, compatibilidad de recortes) |
| \`node tools/stamps_extra.mjs [Imagen] [--check]\` | Aplica / comprueba el overlay de tiles propios (atlas + \`tilesets.json\`) |
| \`node tools/stamps_objects.mjs [--preview]\` | Regenera \`game/assets/objects/barreras.png\` |
| \`node tools/preview_stamps.mjs <Imagen> [--only=a,b] [--tag=t] [--as=<ts>]\` | Hojas de contacto de stamps y brushes (\`tools/cache/stamps/preview\`) |
| \`node tools/stamps_demo.mjs\` | Composiciones de prueba técnica (pueblo, ruta, interiores, cueva, Pilar y tintes, costa, nieve, oriental, sala solemne, ciudad, barreras) |
| \`node tools/stamps_doc.mjs\` | Regenera este documento |
| \`node --test tests/stamps.test.mjs tests/stamps_campaign.test.mjs\` | Sincronía definición↔horneado, IDs, algoritmos, kit, tintes y overlay |

Para añadir un stamp: localiza el rectángulo con \`find_tiles\` / \`stamps_scan\`, añádelo a la definición, hornea,
revisa la hoja con \`preview_stamps --only=<nombre>\` y ejecuta los tests.
`;
