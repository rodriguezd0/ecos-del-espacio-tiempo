# Biblioteca de stamps y brushes

Piezas reutilizables para construir los mapas originales de Axis con los tilesets de Añil
(contrato: `docs/ARCHITECTURE.md` §5). **Este archivo se genera** con `node tools/stamps_doc.mjs`;
edita la guía en `tools/stamps_doc_guide.mjs` y el catálogo en las definiciones.

- **Stamp**: bloque fijo de tiles (edificio, árbol, mueble, boca de cueva…) en 1–3 capas, con metadatos
  (`door` = casilla de la puerta/warp relativa al stamp, `solid`, `tags`, `desc`).
- **Brush**: relleno inteligente sobre un conjunto de casillas (césped, caminos con bordes, agua, bosque,
  terrazas, habitaciones…). Se calcula con `paintBrush`.
- **Tiles propios (overlay)**: piezas que Añil no tiene (kit de Pilar, grava, barro, arena/nieve/ceniza honda,
  zócalos hexagonales) dibujadas por `tools/stamps_extra*.mjs` en filas VACÍAS de los atlas del juego.

## Archivos

| Archivo | Qué es |
|---|---|
| `game/src/content/stamps/<Imagen>.js` | Definición legible por tileset (`src` / `from` / `tiles` + metadatos + brushes) |
| `game/src/content/stamps/*_extras.js`, `interior_solemne.js` | Piezas por bioma que se mezclan en las definiciones |
| `game/src/content/stamps/baked/<Imagen>.js` | **Generado** por `tools/stamps_bake.mjs`: rejillas de IDs resueltas (los mapas de Añil no se sirven en el juego) |
| `game/src/content/stamps/extraTiles.js` | Overlay de tiles propios: piezas (`EXTRA_PIECES`), dónde van (`EXTRA_LAYOUTS`) y sus stamps/brushes (`extraDefs`) |
| `game/src/content/stamps/pilar.js` | Kit común de Pilar (X23) y **tinte por Pilar** (`pilarTone`) |
| `game/src/content/stamps/index.js` | API de carga y colocación (pura, sin DOM) |
| `game/src/content/stamps/brushes.js` | Algoritmos de brushes (puros) |
| `game/src/content/stamps/viewer.html` | Visor en el navegador: <http://localhost:8080/src/content/stamps/viewer.html> |
| `game/assets/objects/barreras.png` | Gráficos de EVENTO de las barreras de Zygarde (`tools/stamps_objects.mjs`) |
| `game/src/content/maps/dev_stamps.js` | Sala de pruebas del kit: `?scene=map&map=dev_stamps&debug` (`vars=pilar:N` cambia el tinte) |

## API (para el MapBuilder)

```js
import { loadStampLibrary, stampWrites, stampDoor } from '../content/stamps/index.js';
import { paintBrush, rectCells } from '../content/stamps/brushes.js';

const lib = await loadStampLibrary(7);          // por ID de tileset (12–15 → Cueva1)
const casa = lib.stamp('casa_roja');            // { name, w, h, layers: [number[]|null ×3], door, tags, desc, … }
for (const w of stampWrites(casa, 10, 6)) layers[w.layer][w.x + w.y * width] = w.id; // solo celdas no vacías
stampDoor(casa, 10, 6);                         // → { x: 14, y: 13 } casilla del warp
for (const w of paintBrush(lib.brush('camino_arena'), rectCells(4, 12, 20, 3), { width, height })) { /* igual */ }
lib.byTag('edificio');                          // stamps por etiqueta
```

- `paintBrush(brush, cells, { seed, width, height, inMask })` devuelve `[{ x, y, layer, id }]`; `cells` es la
  máscara del trazo. `inMask` permite calcular bordes con otra máscara (p. ej. agua ya pintada).
- Los brushes `room` y `cave` escriben también fuera de `cells` (marco / paredes alrededor del suelo).
- `buildStampLibrary` lanza un error claro si el horneado está desfasado respecto a la definición.
- En un mapa (`build(b)`): `b.stamp('pilar_monolito', x, y)`, `b.rect(null, x, y, w, h, 'grava')`… El MapBuilder
  delega en `brushes.js` los tipos complejos (`forest`, `cliff`, `terrace`, `room`, `cave`, `edge2` y
  `nine` con IDs explícitos).

## Tipos de brush

| Tipo | Definición | Uso |
|---|---|---|
| `tile` | `{ tile, variants?, chance? }` | Relleno con variantes deterministas |
| `pattern` | `{ pattern: [x, y, w, h] }` | Mosaico por posición absoluta (césped 4×4, suelos de cueva 3×3) |
| `grid` | `{ grid: [[id, id], [id, id]] }` | Mosaico de IDs explícitos (agua de exterior) |
| `autotile` | `{ autotile: slot }` | Autotile resuelto por vecinos (agua de cueva, flores animadas, **cascadas**) |
| `nine` | `{ nine: [x, y], inner?, fill? }` / `{ nine: 'ids', ids }` | Borde 3×3 + esquinas cóncavas 2×2 (orden NO, NE / SO, SE) |
| `edge2` | `{ edge2: { src: [x, y], fill? } }` | Borde doble 5×5 (playas de arena con espuma sobre el agua; formas convexas) |
| `forest` | `{ forest: { trees, size, period } }` | Bosque de árboles 2×6 apilados cada 4 filas (copas capa 2, troncos capa 1) |
| `cliff` | `{ cliff: { src, width, faceRows, rows? } }` | Macizo convexo con cara (acantilados, cerezal) |
| `terrace` | `{ terrace: { rim, side, face } }` | Terraza de muros finos convexa (ancho ≥ 5) |
| `room` | `{ room: { wall, floor, floorShade, void, frame } }` | Habitación interior con marco (capas 0 y 2) |
| `cave` | `{ cave: { floor, void, ring } }` | Sala de cueva rectangular con paredes |
| `line` | `{ line: { ids \| src, axis } }` | Línea con extremos (salientes, vallas, canal de resonancia) |

## Kit común de Pilar (X23) y tinte por Pilar

Las piezas `pilar_*` llevan **el mismo nombre en todas las bibliotecas de Pilar**, así un recinto se construye igual
en cualquier tileset:

| Grupo | Tilesets | Piezas |
|---|---|---|
| Kit completo | 2 y 12–15 (Cueva1), 11 (InteriorTorre), 8 (InteriorLiga) | `pilar_monolito`, `pilar_dintel`, `pilar_canal` / `pilar_canal_v` (brush línea), `pilar_placa_unown`, `pilar_glifo`, `pilar_glifo_2`, `pilar_pedestal`, `pilar_columna`, `pilar_columna_quebrada`, `pilar_escalinata`, `pilar_escalinata_ancha`, `pilar_camara_nucleo`, `pilar_zocalo` / `_gastado` / `_vivo`, `pilar_losa_eco`, `pilar_arista`, `pilar_arista_grande`, `pilar_manantial`, `pilar_enlosado` (brush nine) |
| Kit exterior | 1 (Exterior1), 7 (ExteriorBosqueCeleste) | monolito, columna(s), dintel, placa Unown, glifos, pedestal, arista, losa de eco, zócalos |
| Solo zócalos | 3, 5, 6 | `pilar_zocalo`, `pilar_zocalo_gastado` (+ `_vivo` en 3 y 5) |

- **Capas**: los calcos de suelo (glifos, cámara de núcleo, losa de eco, zócalos, escalinatas, canal, manantial)
  van en la capa 2 con prioridad 0 para verse sobre el `pilar_enlosado` (capa 1). Lo que se coloque encima en la
  capa 2 los sustituye (p. ej. `pilar_pedestal` sobre la cámara tapa su centro: queda bien, es su sitio).
- **Pasabilidad y prioridad** reales en `tilesets.json`: la base de monolitos, columnas, estelas, pedestales y
  aristas bloquea; lo alto tiene prioridad k = filas sobre la base (tapa al personaje que pasa por detrás). El dintel
  deja un hueco de 3 casillas entre sus pilares. Canal y manantial bloquean (agua).
- **Tinte por Pilar**: la piedra es neutra y el color lo pone el tono del mapa (se suma a día/noche y clima):

```js
import { pilarTone } from '../stamps/pilar.js';          // desde content/maps/<bloque>/
export default { id: 'ruinas_dintel', tileset: 2, tone: pilarTone('P1'), … };
await ctx.tone(pilarTone('P1', 0.4), 40);                // en guiones: intensidad 0..1 (p. ej. tras restaurar)
```

| Pilar | Tinte | Pilar | Tinte |
|---|---|---|---|
| P1 Umbral | ocre | P6 Invertido | violeta |
| P2 Corriente | azul | P7 Ecos | verde agua |
| P3 Impulso | blanco | P8 Alma | rosa pálido |
| P4 Masa | gris plomo | P9 Convergencia | plata |
| P5 Memoria | sepia | P10 Origen | oro |

Hoja comparativa: `node tools/stamps_demo.mjs` → `tools/cache/stamps/demo/pilar_tintes.png`.

## Barreras de campo (CAMPANA §1.1)

| Barrera | Cómo se pinta | Evento |
|---|---|---|
| Cuesta de grava | brush `grava` (nine, capa 1) en 1, 3, 5, 6, 7 | la bloquea el contenido (Correr) |
| Roca agrietada / tronco caído | — | `ramRock` con `sprite: 'asset:objects/barreras.png'`, `dir: 2` roca · `4` tronco · `8` roca nevada; `directionFix: true, stepAnime: true` |
| Barro / arena / nieve / ceniza honda | brushes `barro` (3, 5, 6), `arena_honda` (5, 6, tag Sand), `nieve_honda` (1), `ceniza_honda` (6) | `roughTerrain` en los bordes de paso |
| Pared con vetas (Trepar) | pared del tileset (+ `enredadera` / brush `pared_trepar` en cuevas) | `climbWall` con `sprite: 'asset:objects/barreras.png', dir: 6` (vetas verdes superpuestas) |
| Vacío con zócalos | `pilar_zocalo_gastado` en los bordes | `rebuildGap` con `tiles: [[x, y, 2, id de pilar_zocalo_vivo o pilar_zocalo]]` |
| Cascada | brush `cascada` (autotile 0, capa 2) sobre el acantilado, agua arriba y abajo | — |

## Biomas de la campaña → biblioteca

| Bioma (CAMPANA §1.3–1.5) | TS | Piezas clave |
|---|---|---|
| Pueblo de bosque, rutas, Bosque Neblino | 7 | edificios, `bosque*`, `bosque_morado`, `terraza`, `acantilado`, `cascada`, `grava`, kit exterior |
| Villa Zaguán, Brontia, Ruta 2–5, Monte del Portal, Sima | 1 | edificios, `central`, `campana`, `capilla`, `estrado`, `cascada`, `grava`, kit exterior |
| Nieve (Ruta 11, Paso del Norte, Ruta 13, Villa Boreal) | 1 | `nieve`, `nieve_parche`, `arena_nevada`, `nieve_honda`, `pino_nevado(_peque)`, `meseta_nevada`, `hoyo_nevado`, `empalizada`, `cueva_ladera`, `escalera_ladera` |
| Puerto y costa (Ciudad Nexo, Caleta Sonda, Ruta 15, Mar Boreal) | 1 | `playa`, `muelle`, `muelle_piedra`, `faro`, `velero(_2)`, `yate`, `contenedores`, `cajas_madera`, `palmeral`, `palmera_maceta`, `sombrilla` |
| Ciudad fluvial / capital (Caudal, Lúmina) | 3 | `tienda_torre`, `grandes_almacenes`, `galeria_arte` (museo), `edificio_crema`, `bloque_verde*`, `casino`, `torre_oscura`, `restaurante`, `puesto_*`, `arco_puente`, `suelo_ciudad`, `adoquin`, `orilla` |
| Ciudad minera y cañón (Estrato, Ruta 6/7) | 5 | `estacion_tren`, `rascacielos`, `bloque_amarillo`, `templo_dorado`, `pozo_mina`, `foso_tierra`, `meseta_tierra`, `puente_metal`, `tuberias`, `deposito`, `calzada`, `grava` |
| Marisma, delta, sabana, dunas (Ruta 8, 14, Reserva, Dunas de Ceniza) | 6 | `barro`, `ceniza`, `ceniza_honda`, `arena_honda`, `palafito`, `puente_tablas`, `pasarela_diagonal`, `muelle`, `tarima`, `bosque_sabana`, `molino_viento`, `invernadero`, `playa` |
| Oriental (Aldea Mnemos, Islote Lumbre) | 9 | `cerezal`, `cerezo(_grande)`, `petalos`, `torii*`, `pabellon_*`, `templo_oscuro`, `santuario_negro`, `dojo`, `linterna_*`, `farolillos`, `puente_rojo`, `mar`, `playa`, `cielo` |
| Cuevas (tierra, arcilla, hielo, volcán, gris/azul, morada) | 2, 12–15 | `sala[_variante]`, `mancha*`, `estanque*`, `saliente*`, bocas por variante, `sala_irregular*`, `sala_islote`, `sala_glaciar_*` (12), `sala_volcan_*` (13), `sala_cueva_azul*` (15), `hielo`, `nieve`, `cascada`, `plataforma_madera` (puente), `escombros` |
| Interiores normales, museo, laboratorio, estación, almacenes, oficinas, industria | 4 | `habitacion_*`, `museo_sala`, `museo_galeria`, vitrinas y fósiles, `laboratorio_*` (Talasa), `estacion_tren`, `grandes_almacenes*`, `oficinas`, `central_*` (Genesis) |
| Salas solemnes y recintos de Pilar interiores | 11, 8 | `sala_<color>` (7 marcos), `vestibulo_solemne`, `sala_octogonal`, `sala_fuego`, `sala_hielo`, `sala_sombra`, `sala_trono`, `sala_arena`, `sala_campeon` (8), `emblema_*`, kit de Pilar |

Nada de esto es canon: los stamps son piezas gráficas; la distribución de cada mapa la decide su guion.

## Convenciones y hallazgos

- **Capas**: suelo en 0; caminos, hierba alta, orillas y alfombras en 1; edificios, árboles y muebles en 2
  (como en Añil: así la sombra de un edificio cubre el camino de la capa 1).
- **Pasabilidad**: la da el tileset (`passages`/`priorities`/`terrainTags`); `solid` es solo informativo.
- **Agua de exterior**: el autotile `agua` de Añil solo tiene válidos los 4 bloques interiores; sus bordes llevan
  una **X roja**. No usar `{ autotile: 1 }`: usar el brush `agua` (grid) y encima `orilla` o `playa` con la
  misma máscara. El agua de cueva (autotile 6) sí es un autotile completo.
- **Terrain tags** útiles (tileset 7): hierba alta 388 (morada) y 396 (verde); salientes 651/657/652; arena 416–434.
- **Brushes convexos**: `cliff`, `terrace`, `room`, `cave` y `edge2` trabajan sobre formas convexas; para formas en
  L combina varios trazos o usa los recortes probados (`sala_cruz`, `sala_irregular`…). Las alfombras, manchas y
  estanques `nine` quedan mejor rectangulares.
- **Salas `from`** (recortes de mapas de Añil): úsalas como plantilla; se horneaban con sus muebles, así que los
  eventos (PC, mostradores, estatuas) los pone el mapa. Revisa las del mismo tileset: `sala_trono` en 11 y
  `sala_octogonal` en 8 cambian algunos tiles de color (el horneado avisa).
- **Bosque**: ancho par; alto ideal 4k+2 para que la última fila sea de troncos. Un tipo de árbol por columna
  (`mix: 'tree'` para variar árbol a árbol).
- **Salidas de interior**: `salida_casa` / `salida_lab` se colocan con la esquina en (puertaX − 2 | − 1, fila
  inferior del suelo); el warp queda en `door` (fila del marco).
- **Bocas de cueva** sobre una sala con suelo x0..x1, y0..y1: `boca_norte` en (x, y0 − 4), `salida_luz_sur`
  en (x, y1), `boca_oeste` en (x0 − 3, y), `boca_este` en (x1, y). Las variantes llevan sufijo (`_hielo`…).
- **Recortes `from`**: los mapas del tileset 1 (Exterior1) comparten casi todos los IDs con ExteriorBosqueCeleste;
  el horneado avisa de cuántos tiles difieren y cada recorte se revisó dibujado con el tileset destino.
- **Overlay**: `npm run data` regenera atlas y `tilesets.json` desde Añil y vuelve a aplicar el overlay
  (`tools/stamps_extra.mjs`). Para añadir una pieza: define su forma en `EXTRA_PIECES`, su arte en
  `tools/stamps_extra_art.mjs` o `_terrain.mjs`, su hueco en `EXTRA_LAYOUTS`, y ejecuta
  `node tools/stamps_extra.mjs && node tools/stamps_bake.mjs`.
- **Correcciones de terrain** (`TERRAIN_PATCHES` en `extraTiles.js`, las aplica la misma herramienta): la orilla y la
  playa de ExteriorSafari (6) pasan a ser agua navegable como en Exterior1 (en Añil bloqueaban sin tag de agua).
- **Mar decorativo**: `mar` (9) y `luna_panorama` (3) no tienen terrain de agua; para agua navegable usa `agua`.

## Herramientas

| Comando | Para qué |
|---|---|
| `node tools/find_tiles.mjs <Imagen> [--rows=a-b]` | Hojas del tileset original con nº de fila/columna e ID (`tools/cache/stamps/tiles`) |
| `node tools/find_tiles.mjs --map=<id> --region=x,y,w,h [--as=<ts>]` | Recorte de un mapa de Añil con coordenadas (dibujable con otro tileset) |
| `node tools/find_tiles.mjs --dump=<id> --region=… ` / `--usage=<tile> [--tileset=<ts>]` | IDs de un recorte / dónde se usa un tile |
| `node tools/stamps_components.mjs <Imagen> --rows=a-b` | Rectángulos de objetos separados por tiles vacíos |
| `node tools/stamps_scan.mjs <Imagen> --rows=a-b [--max=12]` | Catálogo visual de esos objetos rotulados con su `src` (`tools/cache/stamps/scan`) |
| `node tools/stamps_compat.mjs <origen> <destino>` | Qué stamps/brushes de una biblioteca valen tal cual en otro tileset |
| `node tools/stamps_bake.mjs [Imagen]` | Hornea y valida (IDs, puertas, compatibilidad de recortes) |
| `node tools/stamps_extra.mjs [Imagen] [--check]` | Aplica / comprueba el overlay de tiles propios (atlas + `tilesets.json`) |
| `node tools/stamps_objects.mjs [--preview]` | Regenera `game/assets/objects/barreras.png` |
| `node tools/preview_stamps.mjs <Imagen> [--only=a,b] [--tag=t] [--as=<ts>]` | Hojas de contacto de stamps y brushes (`tools/cache/stamps/preview`) |
| `node tools/stamps_demo.mjs` | Composiciones de prueba técnica (pueblo, ruta, interiores, cueva, Pilar y tintes, costa, nieve, oriental, sala solemne, ciudad, barreras) |
| `node tools/stamps_doc.mjs` | Regenera este documento |
| `node --test tests/stamps.test.mjs tests/stamps_campaign.test.mjs` | Sincronía definición↔horneado, IDs, algoritmos, kit, tintes y overlay |

Para añadir un stamp: localiza el rectángulo con `find_tiles` / `stamps_scan`, añádelo a la definición, hornea,
revisa la hoja con `preview_stamps --only=<nombre>` y ejecuta los tests.

## Catálogo

| Tileset | Imagen | Stamps | Brushes |
|---|---|---|---|
| 7 | ExteriorBosqueCeleste | 94 | 22 |
| 1 | Exterior1 | 124 | 27 |
| 3 | Exterior2 | 99 | 24 |
| 5 | Exterior3 | 93 | 26 |
| 6 | ExteriorSafari | 50 | 21 |
| 9 | ExteriorPrisma | 99 | 21 |
| 2 (y 12–15) | Cueva1 | 136 | 39 |
| 4 | Interior1 | 61 | 13 |
| 11 | InteriorTorre | 74 | 21 |
| 8 | InteriorLiga | 75 | 21 |

### Tileset 7 · ExteriorBosqueCeleste (94 stamps, 22 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `casa_roja` | 7×11 | 2 | 4,7 | edificio, casa | Casa de tejado rojo a dos aguas con mirador (7×11, sombra incluida) |
| `laboratorio_rojo` | 9×16 | 2 | 2,11 | edificio, laboratorio | Edificio de cúpula roja con molino, anexo y buzón (laboratorio de Pueblo Paleta, 9×16) |
| `centro_pokemon` | 7×11 | 2 | 3,8 | edificio, centro | Centro Pokémon |
| `casa_verde_pequena` | 6×8 | 2 | 2,5 | edificio, casa | Casa pequeña de tejado verde con chimenea |
| `casa_verde` | 6×10 | 2 | 3,6 | edificio, casa | Casa de tejado verde con jardineras |
| `casa_gris` | 6×7 | 2 | 3,4 | edificio, casa | Casa de pizarra gris con porche |
| `casa_rosa` | 5×5 | 2 | 1,3 | edificio, casa | Casa baja de tejado granate |
| `casa_turquesa_balcon` | 7×9 | 2 | 2,6 | edificio, casa, turquesa | Casa turquesa con balcón y chimenea |
| `tienda_turquesa` | 7×8 | 2 | 3,5 | edificio, tienda, turquesa | Tienda turquesa con toldo a rayas |
| `fachada_turquesa` | 7×6 | 2 | 3,4 | edificio, laboratorio, turquesa | Fachada turquesa compacta (candidata a laboratorio de Axis) |
| `cabana_turquesa` | 6×9 | 2 | 2,6 | edificio, casa, turquesa | Cabaña de troncos con tejado turquesa |
| `edificio_turquesa_ancho` | 7×8 | 2 | 3,5 | edificio, laboratorio, turquesa | Edificio ancho de madera con tejado turquesa |
| `granero_verde` | 5×7 | 2 | 2,5 | edificio | Granero de tejado verde |
| `casa_naranja` | 7×8 | 2 | 3,5 | edificio, casa | Casa de tejado naranja a cuatro aguas |
| `casa_naranja_ancha` | 6×7 | 2 | 2,4 | edificio, casa | Casa de tejado naranja con puerta doble (puerta en x 2–3) |
| `casa_azul` | 6×7 | 2 | 3,4 | edificio, casa | Casa de tejado azul |
| `edificio_rojo_grande` | 7×8 | 2 | 3,6 | edificio | Edificio grande de tejado rojo (gimnasio/sala) |
| `molino` | 2×4 | 2 |  | decoracion | Molino de viento pequeño |
| `arbol` | 2×4 | 2 |  | arbol | Árbol redondo suelto (2×4) |
| `pino` | 2×4 | 2 |  | arbol | Pino suelto (2×4) |
| `arbol_alto` | 2×6 | 2 |  | arbol | Árbol redondo del bosque (2×6, apilable cada 4 filas) |
| `pino_alto` | 2×6 | 2 |  | arbol | Pino del bosque (2×6, apilable cada 4 filas) |
| `roca_turquesa` | 2×2 | 2 |  | roca | Roca turquesa grande (2×2) |
| `roca_turquesa_peque` | 1×1 | 2 |  | roca | Roca turquesa pequeña |
| `roca_gris` | 2×1 | 2 |  | roca | Roca gris |
| `roca_agua` | 1×1 | 2 |  | roca, agua | Roca que asoma en el agua |
| `tocon` | 1×1 | 2 |  | decoracion | Tocón con musgo |
| `setas` | 1×1 | 2 |  | decoracion | Grupo de setas |
| `guijarros` | 1×1 | 1 |  | decoracion | Guijarros sobre la hierba |
| `brotes` | 1×1 | 2 |  | decoracion | Matojo de hierba (decorativo) |
| `flores_rosas` | 1×1 | 1 |  | flor | Flores rosas sueltas |
| `flores_blancas` | 1×1 | 1 |  | flor | Flores blancas sueltas |
| `macizo_flores` | 2×1 | 1 |  | flor | Macizo de flores de colores (2×1) |
| `lupinos` | 3×2 | 2 |  | flor | Lupinos lila altos |
| `arbustos` | 2×2 | 2 |  | decoracion | Matas de arbusto oscuro |
| `arbol_morado` | 2×6 | 2 |  | arbol, bosque_celeste | Árbol morado del Bosque Celeste (2×6) |
| `pino_morado` | 2×6 | 2 |  | arbol, bosque_celeste | Pino morado del Bosque Celeste (2×6) |
| `arbol_morado_peque` | 2×4 | 2 |  | arbol, bosque_celeste | Árbol morado suelto (2×4) |
| `pino_morado_peque` | 2×4 | 2 |  | arbol, bosque_celeste | Pino morado suelto (2×4) |
| `cristales` | 6×2 | 2 |  | roca, bosque_celeste | Grupo de cristales turquesa (6×2) |
| `cristal_grande` | 2×2 | 2 |  | roca, bosque_celeste | Cristal turquesa grande (2×2) |
| `boquete` | 4×3 | 1 |  | cueva, vestigio | Boquete oscuro rodeado de rocas (entrada a cueva/ruina) |
| `tronco_caido_h` | 3×1 | 2 |  | decoracion | Tronco caído horizontal (3×1) |
| `tronco_caido_v` | 1×3 | 2 |  | decoracion | Tronco caído vertical (1×3) |
| `tocon_gigante` | 3×2 | 2 |  | vestigio, bosque_celeste | Tocón gigante turquesa (vestigio) |
| `portal_raices` | 3×3 | 2 |  | vestigio, bosque_celeste | Telón de raíces moradas (decorativo, bloquea) |
| `entrada_mina` | 3×4 | 2 | 1,2 | cueva, entrada | Entrada de mina con marco de madera y raíles |
| `barrera_obras` | 2×1 | 2 |  | mobiliario | Barrera de obras amarilla y negra |
| `farola_azul` | 1×4 | 2 |  | mobiliario, luz | Farola azul moderna |
| `meseta_hierba` | 5×5 | 1 |  | terraza | Meseta de hierba con bordes de tierra (5×5) |
| `escalera_diagonal` | 3×5 | 2 |  | escalera | Escalera de madera en diagonal |
| `banco` | 3×1 | 2 |  | mobiliario | Banco de madera (3×1) |
| `cartel_madera` | 1×1 | 2 |  | cartel | Cartel de madera pequeño |
| `tablon_anuncios` | 2×2 | 2 |  | cartel | Tablón de madera de entrada (2×2) |
| `tablon_anuncios_2` | 2×2 | 2 |  | cartel | Tablón de madera con marco (2×2) |
| `cartel_ruta` | 3×2 | 2 |  | cartel | Cartel de ruta sobre postes (3×2) |
| `papelera` | 1×1 | 2 |  | mobiliario | Papelera roja |
| `buzon_azul` | 1×2 | 2 |  | mobiliario | Buzón/panel azul |
| `buzon_rojo` | 1×2 | 2 |  | mobiliario | Buzón rojo |
| `maquinas_expendedoras` | 2×2 | 2 |  | mobiliario | Dos máquinas expendedoras |
| `farola` | 1×5 | 2 |  | mobiliario, luz | Farola verde con sombra |
| `farola_blanca` | 1×3 | 2 |  | mobiliario, luz | Farola de globo blanco |
| `columpio` | 3×3 | 2 |  | mobiliario | Columpio de madera |
| `estatua` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon en pedestal |
| `estatua_2` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon ave en pedestal |
| `fuente_grande` | 4×6 | 2 |  | mobiliario, agua | Fuente de piedra de dos pisos |
| `estanque_pequeno` | 3×3 | 1 |  | agua, jardin | Estanque cuadrado pequeño con marco de hierba |
| `palmera_maceta` | 2×4 | 2 |  | decoracion | Palmera en maceta |
| `flor_amarilla_grande` | 1×2 | 1 |  | flor | Flor amarilla alta animada (autotiles 4/3) |
| `flor_lila_grande` | 1×2 | 1 |  | flor | Flor lila alta animada (autotiles 6/5) |
| `escalera_terraza` | 3×3 | 2 |  | terraza, escalera | Escalera de madera para subir una terraza (sobre la cara de 3 filas) |
| `escalera_terraza_ancha` | 5×3 | 2 |  | terraza, escalera | Escalera de terraza de 5 de ancho |
| `parterre_octogonal` | 3×3 | 2 |  | flor, jardin | Parterre octogonal de flores (foco de plaza) |
| `jardinera_flores` | 3×3 | 2 |  | flor, jardin | Jardinera de madera con tulipanes |
| `mesa_terraza` | 2×2 | 2 |  | mobiliario | Mesa de terraza |
| `troncos` | 2×2 | 2 |  | decoracion | Pila de troncos |
| `placa_piedra` | 6×3 | 1 |  | suelo, plaza | Losa de piedra con musgo (plaza) |
| `seto_marco` | 5×5 | 2 |  | seto | Seto florido cerrado en cuadro (5×5) |
| `seto_corto` | 2×2 | 2 |  | seto | Seto florido corto (2×2) |
| `jardin_vallado` | 8×4 | 1 |  | jardin, flor, valla | Valla blanca con dos jardineras de tulipanes y flores (Pueblo Paleta) |
| `seto_largo` | 10×2 | 1 |  | seto | Seto florido largo (10×2) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |
| `pilar_monolito` | 2×3 | 2 |  | pilar, vestigio | Monolito de piedra con tres hexágonos tallados (2×3; la base bloquea) |
| `pilar_columna` | 1×3 | 2 |  | pilar, vestigio | Columna entera con capitel (1×3) |
| `pilar_dintel` | 5×4 | 2 |  | pilar, vestigio, puerta | Dintel: dos pilares y viga con banda de hexágonos (5×4; se pasa por debajo, hueco de 3) |
| `pilar_columna_quebrada` | 1×2 | 2 |  | pilar, vestigio | Columna quebrada con cascotes (1×2) |
| `pilar_pedestal` | 1×2 | 2 |  | pilar, fragmento | Pedestal hexagonal con hueco para el Fragmento (1×2) |
| `pilar_arista` | 1×2 | 2 |  | pilar, cristal | Arista violeta: cristal afilado (1×2) |
| `pilar_placa_unown` | 2×2 | 2 |  | pilar, cartel | Estela con glifos Unown (2×2; evento de lectura encima) |
| `pilar_glifo` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo |
| `pilar_glifo_2` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo (variante) |
| `pilar_losa_eco` | 2×2 | 2 |  | pilar, eco, suelo | Losa de eco: anillos concéntricos grabados (2×2, pisable) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `cesped` | pattern | 0 | Césped base (mosaico 4×4) |
| `cesped_claro` | nine | 1 | Zona de césped claro con bordes suaves |
| `hierba_alta` | tile | 1 | Hierba alta verde (encuentros, tag Grass) |
| `hierba_alta_morada` | tile | 1 | Hierba alta morada de Bosque Celeste (encuentros) |
| `camino_arena` | nine | 1 | Camino de arena con bordes de hierba |
| `camino_tierra` | nine | 1 | Camino de tierra con bordes de hierba |
| `agua` | grid | 0 | Agua (autotile 1 con sus 4 patrones válidos). Añadir orilla encima |
| `orilla` | nine | 1 | Orilla de hierba del agua (misma máscara que agua) |
| `flores_azules` | autotile | 1 | Flores azules animadas |
| `bosque` | forest | 2 | Bosque denso de árboles redondos (ancho par; alto 4k+2 ideal) |
| `bosque_pinos` | forest | 2 | Bosque denso de pinos |
| `bosque_morado` | forest | 2 | Bosque morado del Bosque Celeste |
| `estanque_morado` | nine | 1 | Estanque con marco de musgo morado |
| `bosque_mixto` | forest | 2 | Bosque mixto |
| `acantilado` | cliff | 1 | Macizo rocoso turquesa (convexo): borde, cuerpo y cara de 3 filas |
| `terraza` | terrace | 1 | Terraza elevada de muros finos (convexa, ancho ≥ 5): borde norte, laterales dobles y cara sur de 3 filas |
| `estanque` | nine | 1 | Estanque con agua fija y marco de hierba (alternativa a agua+orilla) |
| `saliente` | line | 1 | Saliente horizontal (ledge): se salta hacia el sur |
| `valla_blanca` | line | 1 | Valla blanca horizontal |
| `valla_blanca_v` | line | 1 | Valla blanca vertical (remate arriba) |
| `cascada` | autotile | 2 | Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo |
| `grava` | nine | 1 | Cuesta de grava suelta con marcas de derrape (Correr) |

### Tileset 1 · Exterior1 (124 stamps, 27 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `casa_roja` | 7×11 | 2 | 4,7 | edificio, casa | Casa de tejado rojo a dos aguas con mirador (7×11, sombra incluida) |
| `centro_pokemon` | 7×11 | 2 | 3,8 | edificio, centro | Centro Pokémon |
| `casa_verde_pequena` | 6×8 | 2 | 2,5 | edificio, casa | Casa pequeña de tejado verde con chimenea |
| `casa_verde` | 6×10 | 2 | 3,6 | edificio, casa | Casa de tejado verde con jardineras |
| `casa_gris` | 6×7 | 2 | 3,4 | edificio, casa | Casa de pizarra gris con porche |
| `casa_rosa` | 5×5 | 2 | 1,3 | edificio, casa | Casa baja de tejado granate |
| `casa_turquesa_balcon` | 7×9 | 2 | 2,6 | edificio, casa, turquesa | Casa turquesa con balcón y chimenea |
| `tienda_turquesa` | 7×8 | 2 | 3,5 | edificio, tienda, turquesa | Tienda turquesa con toldo a rayas |
| `fachada_turquesa` | 7×6 | 2 | 3,4 | edificio, laboratorio, turquesa | Fachada turquesa compacta (candidata a laboratorio de Axis) |
| `cabana_turquesa` | 6×9 | 2 | 2,6 | edificio, casa, turquesa | Cabaña de troncos con tejado turquesa |
| `edificio_turquesa_ancho` | 7×8 | 2 | 3,5 | edificio, laboratorio, turquesa | Edificio ancho de madera con tejado turquesa |
| `granero_verde` | 5×7 | 2 | 2,5 | edificio | Granero de tejado verde |
| `casa_naranja` | 7×8 | 2 | 3,5 | edificio, casa | Casa de tejado naranja a cuatro aguas |
| `casa_naranja_ancha` | 6×7 | 2 | 2,4 | edificio, casa | Casa de tejado naranja con puerta doble (puerta en x 2–3) |
| `casa_azul` | 6×7 | 2 | 3,4 | edificio, casa | Casa de tejado azul |
| `edificio_rojo_grande` | 7×8 | 2 | 3,6 | edificio | Edificio grande de tejado rojo (gimnasio/sala) |
| `molino` | 2×4 | 2 |  | decoracion | Molino de viento pequeño |
| `arbol` | 2×4 | 2 |  | arbol | Árbol redondo suelto (2×4) |
| `pino` | 2×4 | 2 |  | arbol | Pino suelto (2×4) |
| `arbol_alto` | 2×6 | 2 |  | arbol | Árbol redondo del bosque (2×6, apilable cada 4 filas) |
| `pino_alto` | 2×6 | 2 |  | arbol | Pino del bosque (2×6, apilable cada 4 filas) |
| `roca_gris` | 2×1 | 2 |  | roca | Roca gris |
| `roca_agua` | 1×1 | 2 |  | roca, agua | Roca que asoma en el agua |
| `tocon` | 1×1 | 2 |  | decoracion | Tocón con musgo |
| `setas` | 1×1 | 2 |  | decoracion | Grupo de setas |
| `guijarros` | 1×1 | 1 |  | decoracion | Guijarros sobre la hierba |
| `brotes` | 1×1 | 2 |  | decoracion | Matojo de hierba (decorativo) |
| `flores_rosas` | 1×1 | 1 |  | flor | Flores rosas sueltas |
| `flores_blancas` | 1×1 | 1 |  | flor | Flores blancas sueltas |
| `macizo_flores` | 2×1 | 1 |  | flor | Macizo de flores de colores (2×1) |
| `lupinos` | 3×2 | 2 |  | flor | Lupinos lila altos |
| `arbustos` | 2×2 | 2 |  | decoracion | Matas de arbusto oscuro |
| `boquete` | 4×3 | 1 |  | cueva, vestigio | Boquete oscuro rodeado de rocas (entrada a cueva/ruina) |
| `tronco_caido_h` | 3×1 | 2 |  | decoracion | Tronco caído horizontal (3×1) |
| `tronco_caido_v` | 1×3 | 2 |  | decoracion | Tronco caído vertical (1×3) |
| `entrada_mina` | 3×4 | 2 | 1,2 | cueva, entrada | Entrada de mina con marco de madera y raíles |
| `barrera_obras` | 2×1 | 2 |  | mobiliario | Barrera de obras amarilla y negra |
| `farola_azul` | 1×4 | 2 |  | mobiliario, luz | Farola azul moderna |
| `meseta_hierba` | 5×5 | 1 |  | terraza | Meseta de hierba con bordes de tierra (5×5) |
| `escalera_diagonal` | 3×5 | 2 |  | escalera | Escalera de madera en diagonal |
| `banco` | 3×1 | 2 |  | mobiliario | Banco de madera (3×1) |
| `cartel_madera` | 1×1 | 2 |  | cartel | Cartel de madera pequeño |
| `tablon_anuncios` | 2×2 | 2 |  | cartel | Tablón de madera de entrada (2×2) |
| `tablon_anuncios_2` | 2×2 | 2 |  | cartel | Tablón de madera con marco (2×2) |
| `cartel_ruta` | 3×2 | 2 |  | cartel | Cartel de ruta sobre postes (3×2) |
| `papelera` | 1×1 | 2 |  | mobiliario | Papelera roja |
| `buzon_azul` | 1×2 | 2 |  | mobiliario | Buzón/panel azul |
| `buzon_rojo` | 1×2 | 2 |  | mobiliario | Buzón rojo |
| `maquinas_expendedoras` | 2×2 | 2 |  | mobiliario | Dos máquinas expendedoras |
| `farola` | 1×5 | 2 |  | mobiliario, luz | Farola verde con sombra |
| `farola_blanca` | 1×3 | 2 |  | mobiliario, luz | Farola de globo blanco |
| `columpio` | 3×3 | 2 |  | mobiliario | Columpio de madera |
| `estatua` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon en pedestal |
| `estatua_2` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon ave en pedestal |
| `fuente_grande` | 4×6 | 2 |  | mobiliario, agua | Fuente de piedra de dos pisos |
| `estanque_pequeno` | 3×3 | 1 |  | agua, jardin | Estanque cuadrado pequeño con marco de hierba |
| `palmera_maceta` | 2×4 | 2 |  | decoracion | Palmera en maceta |
| `flor_amarilla_grande` | 1×2 | 1 |  | flor | Flor amarilla alta animada (autotiles 4/3) |
| `flor_lila_grande` | 1×2 | 1 |  | flor | Flor lila alta animada (autotiles 6/5) |
| `escalera_terraza` | 3×3 | 2 |  | terraza, escalera | Escalera de madera para subir una terraza (sobre la cara de 3 filas) |
| `escalera_terraza_ancha` | 5×3 | 2 |  | terraza, escalera | Escalera de terraza de 5 de ancho |
| `parterre_octogonal` | 3×3 | 2 |  | flor, jardin | Parterre octogonal de flores (foco de plaza) |
| `jardinera_flores` | 3×3 | 2 |  | flor, jardin | Jardinera de madera con tulipanes |
| `mesa_terraza` | 2×2 | 2 |  | mobiliario | Mesa de terraza |
| `troncos` | 2×2 | 2 |  | decoracion | Pila de troncos |
| `placa_piedra` | 6×3 | 1 |  | suelo, plaza | Losa de piedra con musgo (plaza) |
| `seto_marco` | 5×5 | 2 |  | seto | Seto florido cerrado en cuadro (5×5) |
| `seto_corto` | 2×2 | 2 |  | seto | Seto florido corto (2×2) |
| `jardin_vallado` | 8×4 | 1 |  | jardin, flor, valla | Valla blanca con dos jardineras de tulipanes y flores (Pueblo Paleta) |
| `seto_largo` | 10×2 | 1 |  | seto | Seto florido largo (10×2) |
| `roca_grande` | 2×2 | 2 |  | roca | Roca marrón grande (2×2) |
| `roca_peque` | 1×1 | 2 |  | roca | Roca marrón pequeña |
| `tocon_gigante` | 3×2 | 2 |  | decoracion | Tocón gigante (3×2) |
| `laboratorio_rojo` | 9×16 | 2 | 2,11 | edificio, laboratorio | Laboratorio de cúpula roja con anexo y buzón (Pueblo Paleta; en este tileset sin molino) |
| `pino_nevado` | 2×6 | 2 |  | nieve, arbol | Pino nevado alto (2×6) |
| `pino_nevado_peque` | 2×4 | 2 |  | nieve, arbol | Pino nevado (2×4) |
| `arbusto_nevado` | 3×1 | 2 |  | nieve, decoracion | Matas cubiertas de nieve (3×1) |
| `tocon_nevado` | 1×1 | 2 |  | nieve, decoracion | Tocón con nieve |
| `planta_nevada` | 1×2 | 2 |  | nieve, decoracion | Planta de hojas anchas con nieve (1×2) |
| `meseta_nevada` | 6×6 | 1 |  | nieve, terraza | Meseta nevada con cara de tierra (6×6) |
| `hoyo_nevado` | 4×4 | 1 |  | nieve, cueva | Hoyo en la nieve con paredes de tierra (4×4) |
| `montones_nieve` | 5×2 | 1 |  | nieve, decoracion | Montoncitos de nieve dispersos (5×2, pisables) |
| `empalizada` | 3×3 | 2 |  | nieve, madera | Empalizada de tablones oscuros (3×3) |
| `cueva_ladera` | 2×4 | 2 | 0,2 | cueva, entrada | Boca de cueva en una ladera, en diagonal (2×4) |
| `escalera_ladera` | 4×4 | 2 |  | escalera | Escalera de madera en diagonal por la ladera (4×4) |
| `faro` | 4×13 | 2 | 1,8 | edificio, puerto, faro | Faro blanco con linterna encendida y sombra (4×13; puerta en la base) |
| `poste_electrico` | 3×6 | 2 |  | mobiliario | Poste de madera con cables (3×6, sombra incluida) |
| `velero` | 5×4 | 2 |  | puerto, barco | Velero blanco amarrado (5×4, sobre el agua) |
| `velero_2` | 5×4 | 2 |  | puerto, barco | Velero blanco mirando al otro lado (5×4) |
| `yate` | 11×5 | 2 |  | puerto, barco | Yate/ferri de pasajeros con popa (11×5, sobre el agua) |
| `camion` | 5×4 | 2 |  | vehiculo, puerto | Camión de carga (5×4) |
| `contenedores` | 4×4 | 2 |  | puerto, almacen | Dos contenedores de carga, verde y rojo (4×4) |
| `cajas_madera` | 5×3 | 2 |  | puerto, almacen | Pila de cajas de madera (5×3) |
| `sombrilla` | 2×2 | 2 |  | playa | Sombrilla de playa (2×2) |
| `farola_hierro` | 1×4 | 2 |  | mobiliario, luz | Farola de hierro (1×4) |
| `central` | 11×9 | 2 | 5,7 | edificio, industria, astillero | Nave industrial con depósitos y torres (11×9; astillero, central, subestación o fábrica) |
| `muelle_piedra` | 21×24 | 1,2 |  | puerto, muelle | Muelle de piedra en T con farolas, norays y veleros (21×24; va sobre `agua`) |
| `tienda_campana` | 4×5 | 2 | 1,3 | campamento | Tienda de campaña (4×5) |
| `arco_festivo` | 8×4 | 2 |  | plaza, fiesta | Arco de luces de feria sobre la calle (8×4; se pasa por debajo) |
| `puesto_mercado` | 3×4 | 2 |  | mercado | Puesto de mercado con toldo azul y tendero (3×4) |
| `puesto_mercado_2` | 3×4 | 2 |  | mercado | Puesto de mercado con toldo rosa y tendero (3×4) |
| `barriles` | 2×2 | 2 |  | mercado | Dos barriles (2×2) |
| `farolillos` | 6×7 | 2 |  | fiesta, oriental, luz | Hilera de farolillos rojos entre postes (6×7; se pasa por debajo) |
| `campana` | 2×4 | 2 |  | campanario | Campana de bronce en su armazón (2×4) |
| `capilla` | 3×5 | 2 |  | vestigio, santuario | Capilla pequeña de tejado rojo (3×5) |
| `estrado` | 6×6 | 1 |  | plaza, vestigio | Estrado de losas con bordillo (6×6; ampliable repitiendo el centro) |
| `casa_turquesa_chimenea` | 7×8 | 2 | 2,6 | edificio, casa, turquesa | Cabaña turquesa con chimenea (7×8) |
| `edificio_naranja` | 6×8 | 2 | 2,6 | edificio, casa | Casa grande de tejado naranja (6×8) |
| `casa_azul_grande` | 6×6 | 2 | 2,4 | edificio, casa | Casa de tejado azul con doble puerta (6×6) |
| `edificio_cupula` | 8×8 | 2 | 3,6 | edificio, ciudad | Edificio de cúpula roja (8×8; museo, gimnasio o sede) |
| `torre_cristal` | 14×12 | 2 | 6,9 | edificio, ciudad | Torre acristalada azul con estatuas en la entrada (14×12; sede, estación o gran almacén) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |
| `pilar_monolito` | 2×3 | 2 |  | pilar, vestigio | Monolito de piedra con tres hexágonos tallados (2×3; la base bloquea) |
| `pilar_columna` | 1×3 | 2 |  | pilar, vestigio | Columna entera con capitel (1×3) |
| `pilar_dintel` | 5×4 | 2 |  | pilar, vestigio, puerta | Dintel: dos pilares y viga con banda de hexágonos (5×4; se pasa por debajo, hueco de 3) |
| `pilar_columna_quebrada` | 1×2 | 2 |  | pilar, vestigio | Columna quebrada con cascotes (1×2) |
| `pilar_pedestal` | 1×2 | 2 |  | pilar, fragmento | Pedestal hexagonal con hueco para el Fragmento (1×2) |
| `pilar_arista` | 1×2 | 2 |  | pilar, cristal | Arista violeta: cristal afilado (1×2) |
| `pilar_placa_unown` | 2×2 | 2 |  | pilar, cartel | Estela con glifos Unown (2×2; evento de lectura encima) |
| `pilar_glifo` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo |
| `pilar_glifo_2` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo (variante) |
| `pilar_losa_eco` | 2×2 | 2 |  | pilar, eco, suelo | Losa de eco: anillos concéntricos grabados (2×2, pisable) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `cesped` | pattern | 0 | Césped base (mosaico 4×4) |
| `cesped_claro` | nine | 1 | Zona de césped claro con bordes suaves |
| `camino_arena` | nine | 1 | Camino de arena con bordes de hierba |
| `camino_tierra` | nine | 1 | Camino de tierra con bordes de hierba |
| `agua` | grid | 0 | Agua (autotile 1 con sus 4 patrones válidos). Añadir orilla encima |
| `orilla` | nine | 1 | Orilla de hierba del agua (misma máscara que agua) |
| `bosque` | forest | 2 | Bosque denso de árboles redondos (ancho par; alto 4k+2 ideal) |
| `bosque_pinos` | forest | 2 | Bosque denso de pinos |
| `bosque_mixto` | forest | 2 | Bosque mixto |
| `terraza` | terrace | 1 | Terraza elevada de muros finos (convexa, ancho ≥ 5): borde norte, laterales dobles y cara sur de 3 filas |
| `estanque` | nine | 1 | Estanque con agua fija y marco de hierba (alternativa a agua+orilla) |
| `saliente` | line | 1 | Saliente horizontal (ledge): se salta hacia el sur |
| `valla_blanca` | line | 1 | Valla blanca horizontal |
| `valla_blanca_v` | line | 1 | Valla blanca vertical (remate arriba) |
| `cascada` | autotile | 2 | Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo |
| `hierba_alta` | tile | 1 | Hierba alta clásica (encuentros, tag Grass) |
| `hierba_alta_oscura` | tile | 1 | Hierba alta de hojas oscuras (encuentros) |
| `flores_amarillas` | autotile | 1 | Flores amarillas animadas |
| `acantilado` | cliff | 1 | Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas |
| `nieve` | pattern | 0 | Suelo nevado (mosaico 6×6) |
| `nieve_parche` | nine | 1 | Parche de nieve con borde suave sobre el césped |
| `arena_nevada` | nine | 1 | Claro de arena/tierra con borde de nieve |
| `playa` | edge2 | 1 | Playa de arena con espuma sobre el agua (borde doble): `agua` en toda la zona y encima `playa` con la máscara de la arena (formas convexas) |
| `muelle` | pattern | 1 | Tablones de muelle (mosaico 4×5; pasarela o embarcadero) |
| `palmeral` | forest | 2 | Hilera de palmeras apiladas (paseo marítimo; ancho par) |
| `grava` | nine | 1 | Cuesta de grava suelta con marcas de derrape (Correr) |
| `nieve_honda` | nine | 1 | Nieve honda con huellas hundidas (Terreno complicado) |

### Tileset 3 · Exterior2 (99 stamps, 24 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `centro_pokemon` | 7×11 | 2 | 3,8 | edificio, centro | Centro Pokémon |
| `edificio_turquesa_ancho` | 7×8 | 2 | 3,5 | edificio, laboratorio, turquesa | Edificio ancho de madera con tejado turquesa |
| `granero_verde` | 5×7 | 2 | 2,5 | edificio | Granero de tejado verde |
| `arbol` | 2×4 | 2 |  | arbol | Árbol redondo suelto (2×4) |
| `pino` | 2×4 | 2 |  | arbol | Pino suelto (2×4) |
| `arbol_alto` | 2×6 | 2 |  | arbol | Árbol redondo del bosque (2×6, apilable cada 4 filas) |
| `pino_alto` | 2×6 | 2 |  | arbol | Pino del bosque (2×6, apilable cada 4 filas) |
| `roca_gris` | 2×1 | 2 |  | roca | Roca gris |
| `roca_agua` | 1×1 | 2 |  | roca, agua | Roca que asoma en el agua |
| `tocon` | 1×1 | 2 |  | decoracion | Tocón con musgo |
| `guijarros` | 1×1 | 1 |  | decoracion | Guijarros sobre la hierba |
| `brotes` | 1×1 | 2 |  | decoracion | Matojo de hierba (decorativo) |
| `flores_rosas` | 1×1 | 1 |  | flor | Flores rosas sueltas |
| `flores_blancas` | 1×1 | 1 |  | flor | Flores blancas sueltas |
| `macizo_flores` | 2×1 | 1 |  | flor | Macizo de flores de colores (2×1) |
| `lupinos` | 3×2 | 2 |  | flor | Lupinos lila altos |
| `arbustos` | 2×2 | 2 |  | decoracion | Matas de arbusto oscuro |
| `entrada_mina` | 3×4 | 2 | 1,2 | cueva, entrada | Entrada de mina con marco de madera y raíles |
| `barrera_obras` | 2×1 | 2 |  | mobiliario | Barrera de obras amarilla y negra |
| `meseta_hierba` | 5×5 | 1 |  | terraza | Meseta de hierba con bordes de tierra (5×5) |
| `escalera_diagonal` | 3×5 | 2 |  | escalera | Escalera de madera en diagonal |
| `cartel_madera` | 1×1 | 2 |  | cartel | Cartel de madera pequeño |
| `tablon_anuncios` | 2×2 | 2 |  | cartel | Tablón de madera de entrada (2×2) |
| `tablon_anuncios_2` | 2×2 | 2 |  | cartel | Tablón de madera con marco (2×2) |
| `cartel_ruta` | 3×2 | 2 |  | cartel | Cartel de ruta sobre postes (3×2) |
| `papelera` | 1×1 | 2 |  | mobiliario | Papelera roja |
| `buzon_azul` | 1×2 | 2 |  | mobiliario | Buzón/panel azul |
| `buzon_rojo` | 1×2 | 2 |  | mobiliario | Buzón rojo |
| `maquinas_expendedoras` | 2×2 | 2 |  | mobiliario | Dos máquinas expendedoras |
| `farola` | 1×5 | 2 |  | mobiliario, luz | Farola verde con sombra |
| `columpio` | 3×3 | 2 |  | mobiliario | Columpio de madera |
| `estatua` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon en pedestal |
| `estatua_2` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon ave en pedestal |
| `fuente_grande` | 4×6 | 2 |  | mobiliario, agua | Fuente de piedra de dos pisos |
| `flor_amarilla_grande` | 1×2 | 1 |  | flor | Flor amarilla alta animada (autotiles 4/3) |
| `flor_lila_grande` | 1×2 | 1 |  | flor | Flor lila alta animada (autotiles 6/5) |
| `escalera_terraza` | 3×3 | 2 |  | terraza, escalera | Escalera de madera para subir una terraza (sobre la cara de 3 filas) |
| `escalera_terraza_ancha` | 5×3 | 2 |  | terraza, escalera | Escalera de terraza de 5 de ancho |
| `jardinera_flores` | 3×3 | 2 |  | flor, jardin | Jardinera de madera con tulipanes |
| `troncos` | 2×2 | 2 |  | decoracion | Pila de troncos |
| `placa_piedra` | 6×3 | 1 |  | suelo, plaza | Losa de piedra con musgo (plaza) |
| `seto_marco` | 5×5 | 2 |  | seto | Seto florido cerrado en cuadro (5×5) |
| `seto_corto` | 2×2 | 2 |  | seto | Seto florido corto (2×2) |
| `jardin_vallado` | 8×4 | 1 |  | jardin, flor, valla | Valla blanca con dos jardineras de tulipanes y flores (Pueblo Paleta) |
| `seto_largo` | 10×2 | 1 |  | seto | Seto florido largo (10×2) |
| `caravana` | 6×5 | 2 |  | vehiculo | Caravana/camión rosa (6×5; mercado ambulante o puesto de Genesis) |
| `verja_negra` | 4×4 | 2 |  | valla, hierro | Verja de hierro negro (4×4) |
| `verja_negra_larga` | 8×2 | 2 |  | valla, hierro | Tramo de verja de hierro (8×2) |
| `lapidas` | 4×2 | 2 |  | cementerio, vestigio | Hilera de cuatro lápidas (4×2) |
| `verja_puerta` | 4×3 | 2 |  | valla, hierro, puerta | Puerta de verja de hierro cerrada (4×3) |
| `arco_hierro` | 4×3 | 2 |  | valla, hierro, puerta | Arco de hierro abierto (4×3; se pasa por debajo) |
| `cesped_marchito` | 3×4 | 1 |  | cementerio, suelo | Parcela de césped marchito (3×4) |
| `farolillos_postes` | 5×4 | 2 |  | fiesta, luz | Farolillos colgados entre dos postes (5×4; se pasa por debajo) |
| `islote_arena` | 4×6 | 1 |  | playa, agua | Islote de arena en el agua con bajío (4×6) |
| `casa_turquesa_grande` | 7×8 | 2 | 3,5 | edificio, turquesa | Casa grande de tejado turquesa acristalado (7×8) |
| `muelle_tablas` | 3×7 | 1 |  | madera, muelle, puerto | Embarcadero de tablones (3×7) |
| `tarima_muelle` | 5×7 | 1 |  | madera, muelle, puerto | Embarcadero elevado: tablero con cajón arriba y frente de madera sobre el agua (5×7; el frente bloquea) |
| `losas_piedra` | 4×4 | 1 |  | suelo, plaza | Losas de piedra gris (4×4) |
| `roseton_plaza` | 5×4 | 1 |  | plaza, suelo | Rosetón de piedra circular (centro de plaza, 5×4) |
| `cabana_roja` | 6×8 | 2 | 3,5 | edificio, madera | Cabaña de troncos de tejado rojo (6×8) |
| `fardo_paja` | 3×2 | 2 |  | granja | Fardo de paja deshecho (3×2) |
| `comedero` | 2×2 | 2 |  | granja | Comedero de madera con heno (2×2) |
| `abrevadero` | 3×1 | 2 |  | granja, agua | Abrevadero de piedra (3×1) |
| `banderines` | 7×5 | 2 |  | fiesta, plaza | Banderines de feria entre dos columnas doradas (7×5; se pasa por debajo) |
| `aerogenerador` | 2×5 | 2 |  | energia | Aerogenerador (2×5; Parque Eólico) |
| `palmera_maceta` | 2×3 | 2 |  | tropical, palmera | Palmera en maceta (2×3) |
| `luna_panorama` | 8×8 | 0 |  | panorama, noche | Cielo nocturno con luna llena (8×8; fondo de mirador o cumbre) |
| `casa_granate` | 5×5 | 2 | 1,3 | edificio, casa | Casa baja de tejado granate (5×5) |
| `tienda_torre` | 8×16 | 1,2 | 3,13 | edificio, tienda, ciudad | Tienda en torre redondeada con rótulo (8×16; tienda de ciudad grande) |
| `bloque_verde` | 5×7 | 2 |  | edificio, ciudad | Bloque de viviendas de azotea verde (5×7) |
| `bloque_verde_puerta` | 5×7 | 2 | 2,5 | edificio, ciudad | Bloque de viviendas con portal (5×7) |
| `bloque_verde_alto` | 5×6 | 2 |  | edificio, ciudad | Bloque de viviendas con aire acondicionado (5×6) |
| `restaurante` | 5×8 | 2 | 2,6 | edificio, tienda | Restaurante de tejado de madera con rótulo (5×8; pastelería, casa de comidas) |
| `casino` | 6×7 | 2 | 2,5 | edificio, ciudad | Edificio de neones morados (6×7; sala de juegos o club) |
| `torre_oscura` | 7×11 | 2 | 3,9 | edificio, ciudad, genesis | Edificio negro con pantalla azul (7×11; sede corporativa, Consorcio o Genesis) |
| `cupula_cristal` | 8×7 | 2 |  | edificio, cupula | Cúpula de cristal azul (8×7; parte superior de invernadero o museo) |
| `casa_pizarra` | 6×7 | 2 | 2,5 | edificio, casa | Casa de tejado de pizarra con ventanales (6×7) |
| `casa_grande_pizarra` | 7×7 | 2 | 4,5 | edificio, casa | Casa grande de pizarra con chimenea (7×7) |
| `puerta_troncos` | 7×3 | 2 |  | puerta, madera | Portalón de troncos (7×3; se pasa por debajo) |
| `estandarte` | 1×4 | 2 |  | mercado, fiesta | Estandarte vertical con letras (1×4) |
| `puesto_azul` | 3×4 | 2 |  | mercado | Puesto de mercado con toldo azul y tendero (3×4) |
| `farolillos` | 8×6 | 2 |  | fiesta, luz | Hilera de farolillos rojos entre postes (8×6) |
| `barriles` | 3×2 | 2 |  | mercado | Barriles y farol (3×2) |
| `puesto_rosa` | 3×4 | 2 |  | mercado | Puesto de mercado con toldo rosa y tendero (3×4) |
| `alfombra_redonda` | 5×3 | 1 |  | mercado, suelo | Dos alfombras redondas granate (5×3) |
| `grandes_almacenes` | 8×12 | 2 | 3,9 | edificio, ciudad, tienda | Gran edificio de cristal azul con entrada amplia (8×12; Grandes Almacenes o estación central) |
| `edificio_rosa` | 6×8 | 2 | 3,6 | edificio, ciudad | Edificio moderno granate con cristaleras (6×8) |
| `galeria_arte` | 6×7 | 2 | 2,5 | edificio, museo | Galería con murales en la fachada (6×7; Museo de las Eras, sala de arte) |
| `arco_puente` | 8×5 | 2 |  | puerta, puente | Arco de entrada con columnas verdes (8×5; puerta de ciudad o parque) |
| `edificio_crema` | 6×8 | 2 | 2,6 | edificio, ciudad | Edificio moderno crema de dos plantas (6×8; hotel, correos, aduana) |
| `farola_rosa` | 1×3 | 2 |  | mobiliario, luz | Farola de globo con poste rosa (1×3) |
| `estatuas_gemelas` | 4×2 | 2 |  | estatua, vestigio | Dos estatuas de piedra (4×2) |
| `tumbas` | 4×2 | 2 |  | cementerio | Hilera de tumbas (4×2) |
| `velas` | 3×2 | 2 |  | cementerio, luz | Velas encendidas (3×2) |
| `flores_ofrenda` | 2×2 | 2 |  | cementerio, flor | Ramos de flores de ofrenda (2×2) |
| `altar_incienso` | 3×4 | 2 |  | vestigio, oriental | Altar de incienso con tejadillo (3×4) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `cesped` | pattern | 0 | Césped base (mosaico 4×4) |
| `cesped_claro` | nine | 1 | Zona de césped claro con bordes suaves |
| `camino_arena` | nine | 1 | Camino de arena con bordes de hierba |
| `camino_tierra` | nine | 1 | Camino de tierra con bordes de hierba |
| `agua` | grid | 0 | Agua (autotile 1 con sus 4 patrones válidos). Añadir orilla encima |
| `bosque` | forest | 2 | Bosque denso de árboles redondos (ancho par; alto 4k+2 ideal) |
| `bosque_pinos` | forest | 2 | Bosque denso de pinos |
| `bosque_mixto` | forest | 2 | Bosque mixto |
| `terraza` | terrace | 1 | Terraza elevada de muros finos (convexa, ancho ≥ 5): borde norte, laterales dobles y cara sur de 3 filas |
| `estanque` | nine | 1 | Estanque con agua fija y marco de hierba (alternativa a agua+orilla) |
| `saliente` | line | 1 | Saliente horizontal (ledge): se salta hacia el sur |
| `valla_blanca` | line | 1 | Valla blanca horizontal |
| `valla_blanca_v` | line | 1 | Valla blanca vertical (remate arriba) |
| `hierba_alta` | tile | 1 | Hierba alta clásica (encuentros, tag Grass) |
| `hierba_alta_oscura` | tile | 1 | Hierba alta de hojas oscuras (encuentros) |
| `flores_amarillas` | autotile | 1 | Flores amarillas animadas |
| `acantilado` | cliff | 1 | Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas |
| `cascada` | autotile | 2 | Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo |
| `playa` | edge2 | 1 | Playa de arena con espuma sobre el agua (borde doble; formas convexas) |
| `orilla` | nine | 1 | Orilla de hierba del agua (misma máscara que `agua`) |
| `suelo_ciudad` | tile | 0 | Losas de piedra gris de ciudad |
| `adoquin` | tile | 0 | Adoquinado de calle |
| `grava` | nine | 1 | Cuesta de grava suelta con marcas de derrape (Correr) |
| `barro` | nine | 1 | Barro con huellas hundidas (Terreno complicado) |

### Tileset 5 · Exterior3 (93 stamps, 26 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `centro_pokemon` | 7×11 | 2 | 3,8 | edificio, centro | Centro Pokémon |
| `edificio_turquesa_ancho` | 7×8 | 2 | 3,5 | edificio, laboratorio, turquesa | Edificio ancho de madera con tejado turquesa |
| `granero_verde` | 5×7 | 2 | 2,5 | edificio | Granero de tejado verde |
| `arbol` | 2×4 | 2 |  | arbol | Árbol redondo suelto (2×4) |
| `pino` | 2×4 | 2 |  | arbol | Pino suelto (2×4) |
| `arbol_alto` | 2×6 | 2 |  | arbol | Árbol redondo del bosque (2×6, apilable cada 4 filas) |
| `pino_alto` | 2×6 | 2 |  | arbol | Pino del bosque (2×6, apilable cada 4 filas) |
| `roca_gris` | 2×1 | 2 |  | roca | Roca gris |
| `roca_agua` | 1×1 | 2 |  | roca, agua | Roca que asoma en el agua |
| `tocon` | 1×1 | 2 |  | decoracion | Tocón con musgo |
| `guijarros` | 1×1 | 1 |  | decoracion | Guijarros sobre la hierba |
| `brotes` | 1×1 | 2 |  | decoracion | Matojo de hierba (decorativo) |
| `flores_rosas` | 1×1 | 1 |  | flor | Flores rosas sueltas |
| `flores_blancas` | 1×1 | 1 |  | flor | Flores blancas sueltas |
| `macizo_flores` | 2×1 | 1 |  | flor | Macizo de flores de colores (2×1) |
| `lupinos` | 3×2 | 2 |  | flor | Lupinos lila altos |
| `arbustos` | 2×2 | 2 |  | decoracion | Matas de arbusto oscuro |
| `entrada_mina` | 3×4 | 2 | 1,2 | cueva, entrada | Entrada de mina con marco de madera y raíles |
| `barrera_obras` | 2×1 | 2 |  | mobiliario | Barrera de obras amarilla y negra |
| `meseta_hierba` | 5×5 | 1 |  | terraza | Meseta de hierba con bordes de tierra (5×5) |
| `escalera_diagonal` | 3×5 | 2 |  | escalera | Escalera de madera en diagonal |
| `cartel_madera` | 1×1 | 2 |  | cartel | Cartel de madera pequeño |
| `tablon_anuncios` | 2×2 | 2 |  | cartel | Tablón de madera de entrada (2×2) |
| `tablon_anuncios_2` | 2×2 | 2 |  | cartel | Tablón de madera con marco (2×2) |
| `cartel_ruta` | 3×2 | 2 |  | cartel | Cartel de ruta sobre postes (3×2) |
| `papelera` | 1×1 | 2 |  | mobiliario | Papelera roja |
| `buzon_azul` | 1×2 | 2 |  | mobiliario | Buzón/panel azul |
| `buzon_rojo` | 1×2 | 2 |  | mobiliario | Buzón rojo |
| `maquinas_expendedoras` | 2×2 | 2 |  | mobiliario | Dos máquinas expendedoras |
| `farola` | 1×5 | 2 |  | mobiliario, luz | Farola verde con sombra |
| `columpio` | 3×3 | 2 |  | mobiliario | Columpio de madera |
| `estatua` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon en pedestal |
| `estatua_2` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon ave en pedestal |
| `flor_amarilla_grande` | 1×2 | 1 |  | flor | Flor amarilla alta animada (autotiles 4/3) |
| `flor_lila_grande` | 1×2 | 1 |  | flor | Flor lila alta animada (autotiles 6/5) |
| `escalera_terraza` | 3×3 | 2 |  | terraza, escalera | Escalera de madera para subir una terraza (sobre la cara de 3 filas) |
| `escalera_terraza_ancha` | 5×3 | 2 |  | terraza, escalera | Escalera de terraza de 5 de ancho |
| `jardinera_flores` | 3×3 | 2 |  | flor, jardin | Jardinera de madera con tulipanes |
| `troncos` | 2×2 | 2 |  | decoracion | Pila de troncos |
| `placa_piedra` | 6×3 | 1 |  | suelo, plaza | Losa de piedra con musgo (plaza) |
| `seto_marco` | 5×5 | 2 |  | seto | Seto florido cerrado en cuadro (5×5) |
| `seto_corto` | 2×2 | 2 |  | seto | Seto florido corto (2×2) |
| `jardin_vallado` | 8×4 | 1 |  | jardin, flor, valla | Valla blanca con dos jardineras de tulipanes y flores (Pueblo Paleta) |
| `seto_largo` | 10×2 | 1 |  | seto | Seto florido largo (10×2) |
| `caravana` | 6×5 | 2 |  | vehiculo | Caravana/camión rosa (6×5; mercado ambulante o puesto de Genesis) |
| `verja_negra` | 4×4 | 2 |  | valla, hierro | Verja de hierro negro (4×4) |
| `verja_negra_larga` | 8×2 | 2 |  | valla, hierro | Tramo de verja de hierro (8×2) |
| `lapidas` | 4×2 | 2 |  | cementerio, vestigio | Hilera de cuatro lápidas (4×2) |
| `verja_puerta` | 4×3 | 2 |  | valla, hierro, puerta | Puerta de verja de hierro cerrada (4×3) |
| `arco_hierro` | 4×3 | 2 |  | valla, hierro, puerta | Arco de hierro abierto (4×3; se pasa por debajo) |
| `cesped_marchito` | 3×4 | 1 |  | cementerio, suelo | Parcela de césped marchito (3×4) |
| `farolillos_postes` | 5×4 | 2 |  | fiesta, luz | Farolillos colgados entre dos postes (5×4; se pasa por debajo) |
| `islote_arena` | 4×6 | 1 |  | playa, agua | Islote de arena en el agua con bajío (4×6) |
| `casa_turquesa_grande` | 7×8 | 2 | 3,5 | edificio, turquesa | Casa grande de tejado turquesa acristalado (7×8) |
| `muelle_tablas` | 3×7 | 1 |  | madera, muelle, puerto | Embarcadero de tablones (3×7) |
| `tarima_muelle` | 5×7 | 1 |  | madera, muelle, puerto | Embarcadero elevado: tablero con cajón arriba y frente de madera sobre el agua (5×7; el frente bloquea) |
| `losas_piedra` | 4×4 | 1 |  | suelo, plaza | Losas de piedra gris (4×4) |
| `roseton_plaza` | 5×4 | 1 |  | plaza, suelo | Rosetón de piedra circular (centro de plaza, 5×4) |
| `cabana_roja` | 6×8 | 2 | 3,5 | edificio, madera | Cabaña de troncos de tejado rojo (6×8) |
| `fardo_paja` | 3×2 | 2 |  | granja | Fardo de paja deshecho (3×2) |
| `comedero` | 2×2 | 2 |  | granja | Comedero de madera con heno (2×2) |
| `abrevadero` | 3×1 | 2 |  | granja, agua | Abrevadero de piedra (3×1) |
| `banderines` | 7×5 | 2 |  | fiesta, plaza | Banderines de feria entre dos columnas doradas (7×5; se pasa por debajo) |
| `aerogenerador` | 2×5 | 2 |  | energia | Aerogenerador (2×5; Parque Eólico) |
| `palmera_maceta` | 2×3 | 2 |  | tropical, palmera | Palmera en maceta (2×3) |
| `mansion_ladrillo` | 8×13 | 2 | 3,10 | edificio, mansion | Mansión de ladrillo con hiedra (8×13; mansión quemada, escuela, casa señorial) |
| `losa_plaza` | 5×3 | 1 |  | plaza, suelo | Losa de plaza de cantos con bordillo (5×3) |
| `farola_hierro` | 1×5 | 2 |  | mobiliario, luz | Farola de hierro (1×5) |
| `meseta_tierra` | 5×5 | 1 |  | mina, terraza | Meseta de tierra redondeada (5×5) |
| `pozo_mina` | 3×5 | 2 | 1,3 | mina, cueva, entrada | Pozo de mina con cuerda sobre tierra (3×5; warp en door; como en Isla Canela) |
| `foso_tierra` | 6×6 | 2 | 2,3 | mina, cueva, entrada | Pozo de mina dentro de un foso con bordes de tierra (6×6) |
| `deposito` | 2×6 | 2 |  | industria, mina | Depósito con tuberías (2×6) |
| `tuberias` | 7×4 | 2 |  | industria, mina | Tuberías sobre soportes (7×4) |
| `puente_metal` | 8×4 | 2 |  | puente, industria, mina | Puente/pasarela metálica con estribos (8×4; cañón, mina) |
| `chapa_metal` | 4×2 | 1 |  | industria, suelo | Plancha metálica en el suelo (4×2) |
| `guijarros_mina` | 4×2 | 2 |  | mina, decoracion | Piedras de mineral sueltas (4×2) |
| `pabellon_azul` | 8×6 | 2 | 3,4 | edificio, ciudad | Pabellón de cubierta azul (8×6; gimnasio, escuela, estación de Talasa) |
| `casa_cupula` | 4×5 | 2 | 2,4 | edificio, casa | Casa de tejado abovedado marrón (4×5) |
| `estacion_cupula` | 8×8 | 2 | 3,6 | edificio, estacion | Edificio de cúpula turquesa con gran entrada (8×8; estación, gimnasio, sala de exposiciones) |
| `bloque_amarillo` | 5×9 | 2 |  | edificio, ciudad | Bloque de viviendas amarillo de azotea verde (5×9) |
| `aparcamiento` | 3×5 | 1 |  | ciudad, suelo | Plaza de aparcamiento/alcantarilla (3×5) |
| `farola_blanca` | 1×3 | 2 |  | mobiliario, luz | Farola de globo blanco (1×3) |
| `boca_incendios` | 1×2 | 2 |  | mobiliario | Boca de incendios roja (1×2) |
| `bicicletas` | 4×1 | 2 |  | mobiliario | Bicicletas aparcadas (4×1) |
| `bloque_morado` | 4×9 | 2 | 2,7 | edificio, ciudad | Bloque de viviendas morado (4×9) |
| `templo_dorado` | 8×8 | 2 | 4,5 | edificio, oriental | Gran salón de tejado dorado con farolillos (8×8) |
| `plaza_templo` | 6×5 | 1 |  | plaza, oriental | Explanada de losas ocres con bordillo (6×5) |
| `estacion_tren` | 8×11 | 2 | 3,8 | edificio, estacion, ciudad | Estación de tren con rótulo «TREN» (8×11) |
| `contenedores` | 4×3 | 2 |  | puerto, almacen | Contenedores verde y rojo (4×3) |
| `rascacielos` | 8×24 | 2 | 4,16 | edificio, ciudad | Rascacielos de cristal violeta (8×24; sede, hotel o grandes almacenes) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `cesped` | pattern | 0 | Césped base (mosaico 4×4) |
| `cesped_claro` | nine | 1 | Zona de césped claro con bordes suaves |
| `camino_arena` | nine | 1 | Camino de arena con bordes de hierba |
| `camino_tierra` | nine | 1 | Camino de tierra con bordes de hierba |
| `agua` | grid | 0 | Agua (autotile 1 con sus 4 patrones válidos). Añadir orilla encima |
| `bosque` | forest | 2 | Bosque denso de árboles redondos (ancho par; alto 4k+2 ideal) |
| `bosque_pinos` | forest | 2 | Bosque denso de pinos |
| `bosque_mixto` | forest | 2 | Bosque mixto |
| `terraza` | terrace | 1 | Terraza elevada de muros finos (convexa, ancho ≥ 5): borde norte, laterales dobles y cara sur de 3 filas |
| `estanque` | nine | 1 | Estanque con agua fija y marco de hierba (alternativa a agua+orilla) |
| `saliente` | line | 1 | Saliente horizontal (ledge): se salta hacia el sur |
| `valla_blanca` | line | 1 | Valla blanca horizontal |
| `valla_blanca_v` | line | 1 | Valla blanca vertical (remate arriba) |
| `hierba_alta` | tile | 1 | Hierba alta clásica (encuentros, tag Grass) |
| `hierba_alta_oscura` | tile | 1 | Hierba alta de hojas oscuras (encuentros) |
| `flores_amarillas` | autotile | 1 | Flores amarillas animadas |
| `acantilado` | cliff | 1 | Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas |
| `cascada` | autotile | 2 | Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo |
| `playa` | edge2 | 1 | Playa de arena con espuma sobre el agua (borde doble; formas convexas) |
| `orilla` | nine | 1 | Orilla de hierba del agua (misma máscara que `agua`) |
| `suelo_ciudad` | tile | 0 | Losas de piedra gris de ciudad |
| `calzada` | nine | 0 | Calzada de asfalto con bordillo (avenidas de ciudad grande; rectangular) |
| `grava` | nine | 1 | Cuesta de grava suelta con marcas de derrape (Correr) |
| `barro` | nine | 1 | Barro con huellas hundidas (Terreno complicado) |
| `arena_honda` | nine | 1 | Arena profunda con huellas hundidas (Terreno complicado) |
| `ceniza` | pattern | 0 | Suelo de ceniza gris con ondas de viento (mosaico 2×2) |

### Tileset 6 · ExteriorSafari (50 stamps, 21 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `arbol` | 2×4 | 2 |  | arbol | Árbol redondo suelto (2×4) |
| `pino` | 2×4 | 2 |  | arbol | Pino suelto (2×4) |
| `arbol_grande` | 3×7 | 2 |  | arbol, sabana | Árbol frondoso grande de la sabana (3×7) |
| `arbol_grande_2` | 3×6 | 2 |  | arbol, sabana | Árbol frondoso de copa ancha (3×6) |
| `matorral` | 3×2 | 2 |  | sabana, decoracion | Matorral alargado (3×2) |
| `mata` | 1×1 | 2 |  | sabana, decoracion | Mata redonda pequeña |
| `poste` | 1×1 | 2 |  | valla, madera | Poste de madera (valla de postes, palafitos) |
| `helechos` | 3×1 | 2 |  | sabana, tropical | Helechos tropicales en fila (3×1) |
| `matas_redondas` | 2×1 | 2 |  | sabana | Dos matas redondas (2×1) |
| `palmera_maceta` | 2×3 | 2 |  | tropical, palmera | Palmera en maceta (2×3) |
| `tocon_grande` | 3×2 | 2 |  | decoracion | Tocón grande (3×2) |
| `seto_redondo` | 3×3 | 2 |  | seto | Seto en anillo (3×3) |
| `roca_grande` | 2×2 | 2 |  | roca | Roca grande (2×2) |
| `roca_peque` | 1×1 | 2 |  | roca | Roca pequeña |
| `boquete` | 4×3 | 1 |  | cueva, vestigio | Boquete oscuro rodeado de rocas (4×3) |
| `entrada_mina` | 3×4 | 2 | 1,2 | cueva, entrada, mina | Entrada de mina con marco de madera y raíles (Cantería, Cerro Plomo) |
| `barrera_obras` | 2×1 | 2 |  | mobiliario, mina | Barrera de obras amarilla y negra |
| `meseta_hierba` | 5×5 | 1 |  | terraza | Meseta de hierba con bordes de tierra (5×5) |
| `escalera_diagonal` | 3×5 | 2 |  | escalera | Escalera de madera en diagonal |
| `fardo_paja` | 3×2 | 2 |  | granja | Fardo de paja deshecho (3×2) |
| `comedero` | 2×2 | 2 |  | granja | Comedero de madera con heno (2×2) |
| `abrevadero` | 3×1 | 2 |  | granja, agua | Abrevadero de piedra (3×1) |
| `palafito` | 6×8 | 2 | 3,5 | edificio, palafito, madera | Cabaña de madera de tejado rojo (6×8; palafito sobre `pasarela` o posada) |
| `puente_tablas` | 3×1 | 2 |  | puente, madera | Tablones sobre el agua (puente corto horizontal, 3×1) |
| `pasarela_diagonal` | 2×3 | 2 |  | puente, madera | Pasarela de madera en diagonal (2×3) |
| `muelle` | 3×6 | 1 |  | madera, muelle | Embarcadero de tablones (3×6) |
| `tarima` | 5×7 | 1 |  | madera, muelle | Embarcadero elevado: tablero con cajón arriba y frente de madera sobre el agua (5×7; el frente bloquea) |
| `tendedero` | 6×6 | 2 |  | palafito, decoracion | Cuerda con farolillos/ropa entre dos postes (6×6; se pasa por debajo) |
| `centro_pokemon` | 7×11 | 2 | 3,8 | edificio, centro | Centro Pokémon |
| `casa_morada` | 5×8 | 2 | 1,5 | edificio, casa | Casa de tejado morado con puerta de corazón (5×8) |
| `casa_cupula_roja` | 6×9 | 2 | 3,5 | edificio | Casa de tejado rojo abovedado (6×9; puesto de guardas de la Reserva) |
| `casa_granate` | 5×5 | 2 | 1,3 | edificio, casa | Casa baja de tejado granate (5×5) |
| `casa_tejado_azul` | 5×5 | 2 | 2,3 | edificio, casa | Casa baja de tejado azul (5×5) |
| `caseta_turquesa` | 7×7 | 2 | 3,4 | edificio, turquesa | Caseta de tejado turquesa (7×7; puesto de la Reserva) |
| `caseta_turquesa_peque` | 5×7 | 2 | 2,4 | edificio, turquesa | Caseta turquesa pequeña (5×7) |
| `invernadero` | 8×13 | 2 | 4,8 | edificio, cupula | Gran cúpula de cristal (8×13; invernadero, acuario o laboratorio) |
| `museo` | 8×10 | 2 | 4,7 | edificio, museo | Edificio de columnas y arco (8×10; museo o sede) |
| `torre_campana` | 8×20 | 2 | 3,15 | edificio, campanario | Torre con campana y jardineras (8×20) |
| `molino_viento` | 2×5 | 2 |  | energia | Aerogenerador blanco (2×5; Parque Eólico) |
| `fuente` | 4×6 | 2 |  | agua, plaza | Fuente de piedra (4×6) |
| `empalizada` | 3×3 | 2 |  | madera, valla | Empalizada de tablones (3×3) |
| `farola` | 1×5 | 2 |  | mobiliario, luz | Farola verde con sombra |
| `cartel_madera` | 1×1 | 2 |  | cartel | Cartel de madera pequeño |
| `cartel_ruta` | 3×2 | 2 |  | cartel | Cartel de ruta sobre postes (3×2) |
| `troncos` | 2×2 | 2 |  | decoracion | Pila de troncos |
| `escalera_terraza` | 3×3 | 2 |  | terraza, escalera | Escalera de madera para subir una terraza |
| `guijarros` | 1×1 | 1 |  | decoracion | Guijarros |
| `islote_arena` | 4×6 | 1 |  | playa, agua | Islote de arena en el agua con bajío (4×6) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `cesped` | pattern | 0 | Hierba de sabana (mosaico 4×4) |
| `cesped_claro` | nine | 1 | Hierba clara con bordes suaves |
| `hierba_alta` | tile | 1 | Hierba alta (encuentros) |
| `camino_arena` | nine | 1 | Arena con bordes de hierba (playa interior, caminos) |
| `camino_tierra` | nine | 1 | Tierra rojiza de marisma con bordes de hierba |
| `agua` | grid | 0 | Agua (autotile 1 con sus patrones válidos). Añadir orilla o playa encima |
| `orilla` | nine | 1 | Orilla de hierba del agua (misma máscara que `agua`) |
| `playa` | edge2 | 1 | Playa de arena con bajío sobre el agua (borde doble; formas convexas) |
| `estanque` | nine | 1 | Estanque con agua fija y marco de hierba |
| `bosque` | forest | 2 | Bosque de árboles redondos |
| `bosque_pinos` | forest | 2 | Bosque de pinos |
| `bosque_sabana` | forest | 2 | Arboleda frondosa de la sabana (árboles 3×7; ancho múltiplo de 3) |
| `acantilado` | cliff | 1 | Macizo de roca rojiza (convexo): borde, cuerpo y cara de 3 filas |
| `saliente` | line | 1 | Saliente horizontal (ledge): se salta hacia el sur |
| `valla_postes` | line | 1 | Valla de postes de madera (vertical; para horizontal usa el stamp `poste` en fila) |
| `cascada` | autotile | 2 | Cascada animada (autotile 0) |
| `ceniza` | pattern | 0 | Suelo de ceniza gris con ondas de viento (mosaico 2×2) |
| `barro` | nine | 1 | Barro con huellas hundidas (Terreno complicado) |
| `arena_honda` | nine | 1 | Arena profunda con huellas hundidas (Terreno complicado) |
| `ceniza_honda` | nine | 1 | Ceniza profunda con huellas (Terreno complicado en las Dunas de Ceniza) |
| `grava` | nine | 1 | Cuesta de grava suelta con marcas de derrape (Correr) |

### Tileset 9 · ExteriorPrisma (99 stamps, 21 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `casa_roja` | 7×11 | 2 | 4,7 | edificio, casa | Casa de tejado rojo a dos aguas con mirador (7×11, sombra incluida) |
| `centro_pokemon` | 7×11 | 2 | 3,8 | edificio, centro | Centro Pokémon |
| `casa_verde_pequena` | 6×8 | 2 | 2,5 | edificio, casa | Casa pequeña de tejado verde con chimenea |
| `casa_verde` | 6×10 | 2 | 3,6 | edificio, casa | Casa de tejado verde con jardineras |
| `casa_gris` | 6×7 | 2 | 3,4 | edificio, casa | Casa de pizarra gris con porche |
| `casa_rosa` | 5×5 | 2 | 1,3 | edificio, casa | Casa baja de tejado granate |
| `casa_turquesa_balcon` | 7×9 | 2 | 2,6 | edificio, casa, turquesa | Casa turquesa con balcón y chimenea |
| `tienda_turquesa` | 7×8 | 2 | 3,5 | edificio, tienda, turquesa | Tienda turquesa con toldo a rayas |
| `fachada_turquesa` | 7×6 | 2 | 3,4 | edificio, laboratorio, turquesa | Fachada turquesa compacta (candidata a laboratorio de Axis) |
| `cabana_turquesa` | 6×9 | 2 | 2,6 | edificio, casa, turquesa | Cabaña de troncos con tejado turquesa |
| `edificio_turquesa_ancho` | 7×8 | 2 | 3,5 | edificio, laboratorio, turquesa | Edificio ancho de madera con tejado turquesa |
| `granero_verde` | 5×7 | 2 | 2,5 | edificio | Granero de tejado verde |
| `casa_naranja` | 7×8 | 2 | 3,5 | edificio, casa | Casa de tejado naranja a cuatro aguas |
| `casa_naranja_ancha` | 6×7 | 2 | 2,4 | edificio, casa | Casa de tejado naranja con puerta doble (puerta en x 2–3) |
| `molino` | 2×4 | 2 |  | decoracion | Molino de viento pequeño |
| `arbol` | 2×4 | 2 |  | arbol | Árbol redondo suelto (2×4) |
| `pino` | 2×4 | 2 |  | arbol | Pino suelto (2×4) |
| `arbol_alto` | 2×6 | 2 |  | arbol | Árbol redondo del bosque (2×6, apilable cada 4 filas) |
| `pino_alto` | 2×6 | 2 |  | arbol | Pino del bosque (2×6, apilable cada 4 filas) |
| `roca_gris` | 2×1 | 2 |  | roca | Roca gris |
| `tocon` | 1×1 | 2 |  | decoracion | Tocón con musgo |
| `setas` | 1×1 | 2 |  | decoracion | Grupo de setas |
| `guijarros` | 1×1 | 1 |  | decoracion | Guijarros sobre la hierba |
| `brotes` | 1×1 | 2 |  | decoracion | Matojo de hierba (decorativo) |
| `flores_rosas` | 1×1 | 1 |  | flor | Flores rosas sueltas |
| `flores_blancas` | 1×1 | 1 |  | flor | Flores blancas sueltas |
| `macizo_flores` | 2×1 | 1 |  | flor | Macizo de flores de colores (2×1) |
| `lupinos` | 3×2 | 2 |  | flor | Lupinos lila altos |
| `arbustos` | 2×2 | 2 |  | decoracion | Matas de arbusto oscuro |
| `entrada_mina` | 3×4 | 2 | 1,2 | cueva, entrada | Entrada de mina con marco de madera y raíles |
| `barrera_obras` | 2×1 | 2 |  | mobiliario | Barrera de obras amarilla y negra |
| `farola_azul` | 1×4 | 2 |  | mobiliario, luz | Farola azul moderna |
| `meseta_hierba` | 5×5 | 1 |  | terraza | Meseta de hierba con bordes de tierra (5×5) |
| `banco` | 3×1 | 2 |  | mobiliario | Banco de madera (3×1) |
| `cartel_madera` | 1×1 | 2 |  | cartel | Cartel de madera pequeño |
| `tablon_anuncios` | 2×2 | 2 |  | cartel | Tablón de madera de entrada (2×2) |
| `tablon_anuncios_2` | 2×2 | 2 |  | cartel | Tablón de madera con marco (2×2) |
| `cartel_ruta` | 3×2 | 2 |  | cartel | Cartel de ruta sobre postes (3×2) |
| `papelera` | 1×1 | 2 |  | mobiliario | Papelera roja |
| `buzon_azul` | 1×2 | 2 |  | mobiliario | Buzón/panel azul |
| `buzon_rojo` | 1×2 | 2 |  | mobiliario | Buzón rojo |
| `farola` | 1×5 | 2 |  | mobiliario, luz | Farola verde con sombra |
| `farola_blanca` | 1×3 | 2 |  | mobiliario, luz | Farola de globo blanco |
| `columpio` | 3×3 | 2 |  | mobiliario | Columpio de madera |
| `estatua` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon en pedestal |
| `estatua_2` | 2×2 | 2 |  | mobiliario | Estatua de Pokémon ave en pedestal |
| `fuente_grande` | 4×6 | 2 |  | mobiliario, agua | Fuente de piedra de dos pisos |
| `estanque_pequeno` | 3×3 | 1 |  | agua, jardin | Estanque cuadrado pequeño con marco de hierba |
| `palmera_maceta` | 2×4 | 2 |  | decoracion | Palmera en maceta |
| `flor_amarilla_grande` | 1×2 | 1 |  | flor | Flor amarilla alta animada (autotiles 4/3) |
| `flor_lila_grande` | 1×2 | 1 |  | flor | Flor lila alta animada (autotiles 6/5) |
| `escalera_terraza` | 3×3 | 2 |  | terraza, escalera | Escalera de madera para subir una terraza (sobre la cara de 3 filas) |
| `escalera_terraza_ancha` | 5×3 | 2 |  | terraza, escalera | Escalera de terraza de 5 de ancho |
| `parterre_octogonal` | 3×3 | 2 |  | flor, jardin | Parterre octogonal de flores (foco de plaza) |
| `jardinera_flores` | 3×3 | 2 |  | flor, jardin | Jardinera de madera con tulipanes |
| `mesa_terraza` | 2×2 | 2 |  | mobiliario | Mesa de terraza |
| `troncos` | 2×2 | 2 |  | decoracion | Pila de troncos |
| `placa_piedra` | 6×3 | 1 |  | suelo, plaza | Losa de piedra con musgo (plaza) |
| `seto_marco` | 5×5 | 2 |  | seto | Seto florido cerrado en cuadro (5×5) |
| `seto_corto` | 2×2 | 2 |  | seto | Seto florido corto (2×2) |
| `jardin_vallado` | 8×4 | 1 |  | jardin, flor, valla | Valla blanca con dos jardineras de tulipanes y flores (Pueblo Paleta) |
| `seto_largo` | 10×2 | 1 |  | seto | Seto florido largo (10×2) |
| `cerezo_grande` | 7×9 | 2 |  | oriental, arbol, cerezo | Cerezo grande en flor con dos troncos (7×9) |
| `cerezo` | 4×5 | 2 |  | oriental, arbol, cerezo | Cerezo en flor (4×5) |
| `lluvia_petalos` | 5×3 | 1 |  | oriental, cerezo, suelo | Corro de pétalos caídos sobre la hierba (5×3) |
| `nenufares` | 2×2 | 2 |  | agua, decoracion | Nenúfares con flor (2×2, sobre el agua) |
| `secadero` | 2×2 | 2 |  | puerto, pesca | Secadero de redes/pescado (2×2) |
| `torii` | 7×6 | 2 |  | oriental, vestigio, puerta | Torii naranja con placa (7×6; se pasa por debajo) |
| `torii_rosa` | 7×6 | 2 |  | oriental, vestigio, puerta | Torii rosa (7×6) |
| `torii_negro` | 7×6 | 2 |  | oriental, vestigio, puerta | Torii grande de madera oscura (7×6) |
| `pabellon_verde` | 7×9 | 2 | 2,6 | oriental, edificio | Pabellón de tejado verde y dorado (7×9; archivo, santuario o casa de té) |
| `pabellon_verde_2` | 7×9 | 2 | 3,6 | oriental, edificio | Pabellón de tejado verde con ventanas redondas (7×9) |
| `casa_oriental_rosa` | 7×9 | 2 | 2,6 | oriental, edificio, casa | Casa oriental de tejado granate y paredes rosas (7×9) |
| `pabellon_rosa` | 7×9 | 2 | 3,6 | oriental, edificio | Pabellón rosa de dos aleros (7×9) |
| `templo_oscuro` | 6×9 | 2 | 2,6 | oriental, edificio, vestigio | Templo de tejado oscuro con pórtico rojo (6×9) |
| `salon_oscuro` | 6×9 | 2 | 2,6 | oriental, edificio | Salón grande de tejado negro con farolillos (6×9) |
| `santuario_negro` | 5×7 | 2 | 2,5 | oriental, vestigio | Santuario de tejado negro con pórtico rojo (5×7) |
| `dojo` | 8×8 | 2 | 3,5 | oriental, edificio | Edificio largo de madera oscura con escalinata (8×8; dojo o Archivo Hondo) |
| `capilla_roja` | 3×5 | 2 |  | oriental, vestigio | Capilla pequeña de tejado rojo (3×5) |
| `campana_templo` | 2×4 | 2 |  | oriental, campanario | Campana de bronce en armazón (2×4) |
| `linterna_piedra` | 1×2 | 2 |  | oriental, luz | Linterna de piedra gris (1×2) |
| `linterna_rosa` | 1×2 | 2 |  | oriental, luz | Linterna de piedra rosada (1×2) |
| `linterna_oscura` | 1×2 | 2 |  | oriental, luz | Linterna de piedra oscura (1×2) |
| `farolillos` | 6×7 | 2 |  | oriental, fiesta, luz | Hilera de farolillos rojos entre postes (6×7; se pasa por debajo) |
| `menhir` | 3×4 | 2 |  | oriental, vestigio, roca | Piedra erguida antigua (3×4, sombra incluida) |
| `surtidor` | 1×1 | 2 |  | agua, decoracion | Surtidor de agua (1×1) |
| `pila_bambu` | 2×2 | 2 |  | oriental, agua | Pila de agua con caño (2×2) |
| `puesto_festival` | 5×5 | 2 |  | oriental, mercado, fiesta | Puesto de feria con estandarte rojo (5×5) |
| `puesto_mercado` | 4×4 | 2 |  | mercado | Puesto de mercado con toldo y tendero (4×4) |
| `puente_rojo` | 6×4 | 2 |  | oriental, puente | Puente arqueado rojo de madera (6×4; va sobre agua) |
| `puente_rojo_peque` | 6×2 | 2 |  | oriental, puente | Puente rojo pequeño (6×2) |
| `escalera_roja` | 3×3 | 2 |  | escalera, oriental | Escalera de piedra con barandilla roja (3×3) |
| `pedregal` | 5×2 | 1 |  | roca, decoracion | Pedregal de cantos blancos (5×2) |
| `bote_remos` | 4×2 | 2 |  | puerto, barco | Bote de remos de madera (4×2, sobre el agua) |
| `velero` | 5×4 | 2 |  | puerto, barco | Velero amarrado (5×4) |
| `estrado` | 6×6 | 1 |  | plaza, vestigio | Estrado de losas con bordillo (6×6) |
| `boquete` | 4×4 | 1 |  | cueva, vestigio | Boquete oscuro rodeado de rocas (4×4) |
| `casa_azul_larga` | 5×5 | 2 | 2,3 | edificio, casa | Casa baja de tejado azul (5×5) |
| `casa_tejado_naranja` | 6×6 | 2 | 2,4 | edificio, casa | Casa de tejado naranja (6×6) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `cesped` | pattern | 0 | Césped base (mosaico 4×4) |
| `cesped_claro` | nine | 1 | Zona de césped claro con bordes suaves |
| `hierba_alta` | tile | 1 | Hierba alta verde (encuentros, tag Grass) |
| `camino_arena` | nine | 1 | Camino de arena con bordes de hierba |
| `camino_tierra` | nine | 1 | Camino de tierra con bordes de hierba |
| `agua` | grid | 0 | Agua (autotile 1 con sus 4 patrones válidos). Añadir orilla encima |
| `orilla` | nine | 1 | Orilla de hierba del agua (misma máscara que agua) |
| `bosque` | forest | 2 | Bosque denso de árboles redondos (ancho par; alto 4k+2 ideal) |
| `bosque_pinos` | forest | 2 | Bosque denso de pinos |
| `bosque_mixto` | forest | 2 | Bosque mixto |
| `terraza` | terrace | 1 | Terraza elevada de muros finos (convexa, ancho ≥ 5): borde norte, laterales dobles y cara sur de 3 filas |
| `estanque` | nine | 1 | Estanque con agua fija y marco de hierba (alternativa a agua+orilla) |
| `saliente` | line | 1 | Saliente horizontal (ledge): se salta hacia el sur |
| `valla_blanca` | line | 1 | Valla blanca horizontal |
| `valla_blanca_v` | line | 1 | Valla blanca vertical (remate arriba) |
| `cerezal` | cliff | 2 | Bosque de cerezos en flor (masa convexa: copas rosas y fila de troncos al sur) |
| `petalos` | tile | 0 | Suelo alfombrado de pétalos rosas |
| `mar` | grid | 0 | Mar de fondo DECORATIVO (mosaico 2×2, sin terrain de agua: no se navega). Agua navegable: `agua` + `playa`/`orilla` |
| `playa` | edge2 | 1 | Playa de arena con espuma sobre el agua (borde doble; formas convexas) |
| `cielo` | pattern | 0 | Cielo con nubes (panorama de cumbres y mapas sobre las nubes) |
| `cascada` | autotile | 2 | Cascada animada (autotile 0) sobre un acantilado |

### Tileset 2 · Cueva1 (136 stamps, 39 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `sala_cruz` | 20×18 | 0,1,2 | 9,17 | sala | Sala de cueva en cruz con 4 salidas (norte: boca oscura, oeste/este: túneles, sur: luz exterior) |
| `roca_grande` | 2×3 | 2 |  | roca, tierra | Roca grande (tierra y musgo verde) |
| `boca_norte` | 3×4 | 2 | 1,2 | salida, tierra | Boca oscura en la pared norte (tierra y musgo verde); colocar en (x, y0-4) |
| `salida_luz_sur` | 3×2 | 2 | 1,1 | salida, tierra | Claridad de salida en la pared sur (tierra y musgo verde); colocar en (x, y1) |
| `roca_grande_arcilla` | 2×3 | 2 |  | roca, arcilla | Roca grande (tierra rojiza y agua turquesa) |
| `boca_norte_arcilla` | 3×4 | 2 | 1,2 | salida, arcilla | Boca oscura en la pared norte (tierra rojiza y agua turquesa); colocar en (x, y0-4) |
| `salida_luz_sur_arcilla` | 3×2 | 2 | 1,1 | salida, arcilla | Claridad de salida en la pared sur (tierra rojiza y agua turquesa); colocar en (x, y1) |
| `salida_luz_norte_arcilla` | 3×4 | 2 | 1,2 | salida, arcilla | Salida iluminada en la pared norte (tierra rojiza y agua turquesa); colocar en (x, y0-4) |
| `boca_oeste_arcilla` | 4×4 | 2 | 2,2 | salida, arcilla | Túnel oscuro en la pared oeste (tierra rojiza y agua turquesa); colocar en (x0-3, y) |
| `boca_este_arcilla` | 4×4 | 2 | 1,2 | salida, arcilla | Túnel oscuro en la pared este (tierra rojiza y agua turquesa); colocar en (x1, y) |
| `salida_luz_oeste_arcilla` | 4×4 | 2 | 2,2 | salida, arcilla | Salida iluminada en la pared oeste (tierra rojiza y agua turquesa); colocar en (x0-3, y) |
| `salida_luz_este_arcilla` | 4×4 | 2 | 1,2 | salida, arcilla | Salida iluminada en la pared este (tierra rojiza y agua turquesa); colocar en (x1, y) |
| `roca_peque_arcilla` | 1×2 | 2 |  | roca, arcilla | Roca pequeña (tierra rojiza y agua turquesa) |
| `roca_musgo_arcilla` | 2×2 | 2 |  | roca, arcilla | Roca redonda (2×2) (tierra rojiza y agua turquesa) |
| `matojo_cueva_arcilla` | 2×2 | 2 |  | roca, arcilla | Mata de roca (2×2) (tierra rojiza y agua turquesa) |
| `tronco_h_arcilla` | 3×1 | 2 |  | madera, arcilla | Tronco/viga horizontal (3×1) (tierra rojiza y agua turquesa) |
| `tronco_v_arcilla` | 2×3 | 2 |  | madera, arcilla | Raíz/tronco vertical (2×3) (tierra rojiza y agua turquesa) |
| `paso_rejilla_arcilla` | 8×3 | 2 |  | madera, vestigio, arcilla | Paso con rejilla de madera entre rocas (8×3) (tierra rojiza y agua turquesa) |
| `roca_grande_hielo` | 2×3 | 2 |  | roca, hielo | Roca grande (suelo gris azulado y paredes azules) |
| `boca_norte_hielo` | 3×4 | 2 | 1,2 | salida, hielo | Boca oscura en la pared norte (suelo gris azulado y paredes azules); colocar en (x, y0-4) |
| `salida_luz_sur_hielo` | 3×2 | 2 | 1,1 | salida, hielo | Claridad de salida en la pared sur (suelo gris azulado y paredes azules); colocar en (x, y1) |
| `salida_luz_norte_hielo` | 3×4 | 2 | 1,2 | salida, hielo | Salida iluminada en la pared norte (suelo gris azulado y paredes azules); colocar en (x, y0-4) |
| `boca_oeste_hielo` | 4×4 | 2 | 2,2 | salida, hielo | Túnel oscuro en la pared oeste (suelo gris azulado y paredes azules); colocar en (x0-3, y) |
| `boca_este_hielo` | 4×4 | 2 | 1,2 | salida, hielo | Túnel oscuro en la pared este (suelo gris azulado y paredes azules); colocar en (x1, y) |
| `salida_luz_oeste_hielo` | 4×4 | 2 | 2,2 | salida, hielo | Salida iluminada en la pared oeste (suelo gris azulado y paredes azules); colocar en (x0-3, y) |
| `salida_luz_este_hielo` | 4×4 | 2 | 1,2 | salida, hielo | Salida iluminada en la pared este (suelo gris azulado y paredes azules); colocar en (x1, y) |
| `roca_peque_hielo` | 1×2 | 2 |  | roca, hielo | Roca pequeña (suelo gris azulado y paredes azules) |
| `roca_musgo_hielo` | 2×2 | 2 |  | roca, hielo | Roca redonda (2×2) (suelo gris azulado y paredes azules) |
| `matojo_cueva_hielo` | 2×2 | 2 |  | roca, hielo | Mata de roca (2×2) (suelo gris azulado y paredes azules) |
| `tronco_h_hielo` | 3×1 | 2 |  | madera, hielo | Tronco/viga horizontal (3×1) (suelo gris azulado y paredes azules) |
| `tronco_v_hielo` | 2×3 | 2 |  | madera, hielo | Raíz/tronco vertical (2×3) (suelo gris azulado y paredes azules) |
| `paso_rejilla_hielo` | 8×3 | 2 |  | madera, vestigio, hielo | Paso con rejilla de madera entre rocas (8×3) (suelo gris azulado y paredes azules) |
| `roca_grande_volcan` | 2×3 | 2 |  | roca, volcan | Roca grande (suelo rojizo y paredes moradas) |
| `boca_norte_volcan` | 3×4 | 2 | 1,2 | salida, volcan | Boca oscura en la pared norte (suelo rojizo y paredes moradas); colocar en (x, y0-4) |
| `salida_luz_sur_volcan` | 3×2 | 2 | 1,1 | salida, volcan | Claridad de salida en la pared sur (suelo rojizo y paredes moradas); colocar en (x, y1) |
| `salida_luz_norte_volcan` | 3×4 | 2 | 1,2 | salida, volcan | Salida iluminada en la pared norte (suelo rojizo y paredes moradas); colocar en (x, y0-4) |
| `boca_oeste_volcan` | 4×4 | 2 | 2,2 | salida, volcan | Túnel oscuro en la pared oeste (suelo rojizo y paredes moradas); colocar en (x0-3, y) |
| `boca_este_volcan` | 4×4 | 2 | 1,2 | salida, volcan | Túnel oscuro en la pared este (suelo rojizo y paredes moradas); colocar en (x1, y) |
| `salida_luz_oeste_volcan` | 4×4 | 2 | 2,2 | salida, volcan | Salida iluminada en la pared oeste (suelo rojizo y paredes moradas); colocar en (x0-3, y) |
| `salida_luz_este_volcan` | 4×4 | 2 | 1,2 | salida, volcan | Salida iluminada en la pared este (suelo rojizo y paredes moradas); colocar en (x1, y) |
| `roca_peque_volcan` | 1×2 | 2 |  | roca, volcan | Roca pequeña (suelo rojizo y paredes moradas) |
| `roca_musgo_volcan` | 2×2 | 2 |  | roca, volcan | Roca redonda (2×2) (suelo rojizo y paredes moradas) |
| `matojo_cueva_volcan` | 2×2 | 2 |  | roca, volcan | Mata de roca (2×2) (suelo rojizo y paredes moradas) |
| `tronco_h_volcan` | 3×1 | 2 |  | madera, volcan | Tronco/viga horizontal (3×1) (suelo rojizo y paredes moradas) |
| `tronco_v_volcan` | 2×3 | 2 |  | madera, volcan | Raíz/tronco vertical (2×3) (suelo rojizo y paredes moradas) |
| `paso_rejilla_volcan` | 8×3 | 2 |  | madera, vestigio, volcan | Paso con rejilla de madera entre rocas (8×3) (suelo rojizo y paredes moradas) |
| `roca_grande_gris` | 2×3 | 2 |  | roca, gris | Roca grande (suelo gris y paredes azul oscuro) |
| `boca_norte_gris` | 3×4 | 2 | 1,2 | salida, gris | Boca oscura en la pared norte (suelo gris y paredes azul oscuro); colocar en (x, y0-4) |
| `salida_luz_sur_gris` | 3×2 | 2 | 1,1 | salida, gris | Claridad de salida en la pared sur (suelo gris y paredes azul oscuro); colocar en (x, y1) |
| `salida_luz_norte_gris` | 3×4 | 2 | 1,2 | salida, gris | Salida iluminada en la pared norte (suelo gris y paredes azul oscuro); colocar en (x, y0-4) |
| `boca_oeste_gris` | 4×4 | 2 | 2,2 | salida, gris | Túnel oscuro en la pared oeste (suelo gris y paredes azul oscuro); colocar en (x0-3, y) |
| `boca_este_gris` | 4×4 | 2 | 1,2 | salida, gris | Túnel oscuro en la pared este (suelo gris y paredes azul oscuro); colocar en (x1, y) |
| `salida_luz_oeste_gris` | 4×4 | 2 | 2,2 | salida, gris | Salida iluminada en la pared oeste (suelo gris y paredes azul oscuro); colocar en (x0-3, y) |
| `salida_luz_este_gris` | 4×4 | 2 | 1,2 | salida, gris | Salida iluminada en la pared este (suelo gris y paredes azul oscuro); colocar en (x1, y) |
| `roca_peque_gris` | 1×2 | 2 |  | roca, gris | Roca pequeña (suelo gris y paredes azul oscuro) |
| `roca_musgo_gris` | 2×2 | 2 |  | roca, gris | Roca redonda (2×2) (suelo gris y paredes azul oscuro) |
| `matojo_cueva_gris` | 2×2 | 2 |  | roca, gris | Mata de roca (2×2) (suelo gris y paredes azul oscuro) |
| `tronco_h_gris` | 3×1 | 2 |  | madera, gris | Tronco/viga horizontal (3×1) (suelo gris y paredes azul oscuro) |
| `tronco_v_gris` | 2×3 | 2 |  | madera, gris | Raíz/tronco vertical (2×3) (suelo gris y paredes azul oscuro) |
| `paso_rejilla_gris` | 8×3 | 2 |  | madera, vestigio, gris | Paso con rejilla de madera entre rocas (8×3) (suelo gris y paredes azul oscuro) |
| `roca_grande_morada` | 2×3 | 2 |  | roca, morada | Roca grande (suelo morado y paredes oscuras) |
| `boca_norte_morada` | 3×4 | 2 | 1,2 | salida, morada | Boca oscura en la pared norte (suelo morado y paredes oscuras); colocar en (x, y0-4) |
| `salida_luz_sur_morada` | 3×2 | 2 | 1,1 | salida, morada | Claridad de salida en la pared sur (suelo morado y paredes oscuras); colocar en (x, y1) |
| `salida_luz_norte_morada` | 3×4 | 2 | 1,2 | salida, morada | Salida iluminada en la pared norte (suelo morado y paredes oscuras); colocar en (x, y0-4) |
| `boca_oeste_morada` | 4×4 | 2 | 2,2 | salida, morada | Túnel oscuro en la pared oeste (suelo morado y paredes oscuras); colocar en (x0-3, y) |
| `boca_este_morada` | 4×4 | 2 | 1,2 | salida, morada | Túnel oscuro en la pared este (suelo morado y paredes oscuras); colocar en (x1, y) |
| `salida_luz_oeste_morada` | 4×4 | 2 | 2,2 | salida, morada | Salida iluminada en la pared oeste (suelo morado y paredes oscuras); colocar en (x0-3, y) |
| `salida_luz_este_morada` | 4×4 | 2 | 1,2 | salida, morada | Salida iluminada en la pared este (suelo morado y paredes oscuras); colocar en (x1, y) |
| `roca_peque_morada` | 1×2 | 2 |  | roca, morada | Roca pequeña (suelo morado y paredes oscuras) |
| `roca_musgo_morada` | 2×2 | 2 |  | roca, morada | Roca redonda (2×2) (suelo morado y paredes oscuras) |
| `matojo_cueva_morada` | 2×2 | 2 |  | roca, morada | Mata de roca (2×2) (suelo morado y paredes oscuras) |
| `tronco_h_morada` | 3×1 | 2 |  | madera, morada | Tronco/viga horizontal (3×1) (suelo morado y paredes oscuras) |
| `tronco_v_morada` | 2×3 | 2 |  | madera, morada | Raíz/tronco vertical (2×3) (suelo morado y paredes oscuras) |
| `paso_rejilla_morada` | 8×3 | 2 |  | madera, vestigio, morada | Paso con rejilla de madera entre rocas (8×3) (suelo morado y paredes oscuras) |
| `salida_luz_norte` | 3×4 | 2 | 1,2 | salida | Salida iluminada en la pared norte (al exterior); colocar en (x, y0-4) |
| `boca_oeste` | 4×4 | 2 | 2,2 | salida | Túnel oscuro en la pared oeste; colocar en (x0-3, y) |
| `boca_este` | 4×4 | 2 | 1,2 | salida | Túnel oscuro en la pared este; colocar en (x1, y) |
| `salida_luz_oeste` | 4×4 | 2 | 2,2 | salida | Salida iluminada en la pared oeste; colocar en (x0-3, y) |
| `salida_luz_este` | 4×4 | 2 | 1,2 | salida | Salida iluminada en la pared este; colocar en (x1, y) |
| `escalera_mano` | 1×2 | 2 | 0,1 | salida, escalera | Escalera de mano de madera (subir a otro nivel) |
| `agujero` | 2×2 | 1 | 0,1 | salida | Agujero en el suelo con reborde (bajar a otro nivel) |
| `roca_peque` | 1×2 | 2 |  | roca | Roca pequeña rojiza |
| `roca_musgo` | 2×2 | 2 |  | roca | Roca redonda con musgo (2×2) |
| `matojo_cueva` | 2×2 | 2 |  | roca | Mata de roca y musgo oscuro (2×2) |
| `roca_nevada` | 3×2 | 2 |  | roca, hielo | Roca con nieve (3×2) |
| `cristales` | 6×2 | 2 |  | roca, cristal | Grupo de cristales turquesa (6×2) |
| `gota_cristal` | 1×2 | 2 |  | cristal | Cristal azul en forma de gota |
| `tronco_h` | 3×1 | 2 |  | madera | Tronco/viga horizontal (3×1) |
| `tronco_v` | 2×3 | 2 |  | madera | Raíz/tronco vertical (2×3) |
| `pepita` | 1×1 | 2 |  | decoracion | Piedra dorada (decorativa) |
| `charco` | 1×1 | 1 |  | agua | Charco pequeño |
| `mancha_tierra` | 2×1 | 1 |  | suelo | Mancha de tierra en el suelo |
| `cartel` | 1×1 | 2 |  | cartel | Cartel de madera |
| `carteles_dobles` | 4×2 | 2 |  | cartel | Dos tablones de madera (4×2) |
| `paso_rejilla` | 8×3 | 2 |  | madera, vestigio | Paso con rejilla de madera entre rocas (8×3) |
| `santuario` | 5×8 | 2 | 2,5 | vestigio | Santuario de tejado negro y pórtico rojo (5×8, sombra incluida) |
| `antorcha` | 1×2 | 2 |  | luz | Antorcha animada de pared (autotile 5) |
| `chorro_agua` | 2×2 | 2 |  | agua | Chorro de agua animado que brota de la roca (autotiles 1–4) |
| `montones_nieve` | 6×2 | 1 |  | nieve, decoracion | Montoncitos de nieve dispersos (6×2, decorativos, pisables) |
| `copo_nieve` | 2×1 | 1 |  | nieve, decoracion | Pequeño montón de nieve (2×1) |
| `cuerda` | 2×4 | 2 |  | trepar, escalera | Cuerda colgante (bajar/subir un desnivel; evento encima) |
| `enredadera` | 1×2 | 2 |  | trepar | Enredadera sobre la roca (pared escalable, Trepar) |
| `musgo_rocas` | 2×1 | 2 |  | roca, decoracion | Rocas pequeñas con musgo (2×1) |
| `plataforma_madera` | 4×3 | 1 |  | madera, puente | Plataforma/puente de tablones claros (4×3, terrain Bridge) |
| `plataforma_madera_oscura` | 3×3 | 1 |  | madera, puente | Plataforma/puente de tablones oscuros (3×3, terrain Bridge) |
| `roca_agua_grande` | 2×2 | 2 |  | roca, agua | Roca grande que asoma en el agua (2×2) |
| `roca_agua` | 1×1 | 2 |  | roca, agua | Roca pequeña en el agua |
| `escombros` | 4×2 | 2 |  | roca, escombros | Montón de roca y cascotes (4×2). Roca rompible como evento: tileId 3576 (entera) → 3577 (cascotes) |
| `sala_irregular` | 29×15 | 0,1,2 |  | sala, irregular | Sala irregular de tierra con recodos y rocas (29×15, Monte Moon) |
| `sala_irregular_2` | 20×16 | 0,1,2 |  | sala, irregular | Sala irregular pequeña con estanque (20×16, Monte Moon) |
| `sala_islote` | 29×21 | 0,1,2 |  | sala, irregular, agua | Gruta con agua y orillas irregulares (29×21, Islas Espuma) |
| `sala_glaciar_cascada` | 28×35 | 0,1,2 |  | sala, irregular, hielo, agua | Gruta helada con terrazas de nieve, cascada central y pared escalable (28×35, Cueva Glaciada; usar con tileset 12) |
| `sala_glaciar_bloques` | 33×39 | 0,1,2 |  | sala, irregular, hielo | Gruta helada de suelo resbaladizo con rocas nevadas (33×39; tileset 12) |
| `sala_glaciar_santuario` | 29×37 | 0,1,2 |  | sala, irregular, hielo, vestigio | Gruta helada con lago y santuario (29×37; tileset 12) |
| `sala_cueva_azul` | 32×28 | 0,1,2 |  | sala, irregular, agua, gris | Cueva de agua azul con terrazas, estanques y cascada (32×28, Monte Plateado; usar con tileset 15) |
| `sala_cueva_azul_cascada` | 38×26 | 0,1,2 |  | sala, irregular, agua, gris | Cueva azul con gran cascada y lago (38×26; tileset 15; Garganta del Albo, P2) |
| `sala_volcan_l` | 21×22 | 0,1,2 |  | sala, irregular, volcan | Galería volcánica en L con escalones (21×22, Volcán Canela; usar con tileset 13) |
| `sala_volcan_cruz` | 19×25 | 0,1,2 |  | sala, irregular, volcan | Galería volcánica en cruz (19×25; tileset 13) |
| `pilar_dintel` | 5×4 | 2 |  | pilar, vestigio, puerta | Dintel: dos pilares y viga con banda de hexágonos (5×4; se pasa por debajo, hueco de 3) |
| `pilar_monolito` | 2×3 | 2 |  | pilar, vestigio | Monolito de piedra con tres hexágonos tallados (2×3; la base bloquea) |
| `pilar_columna` | 1×3 | 2 |  | pilar, vestigio | Columna entera con capitel (1×3) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |
| `pilar_camara_nucleo` | 5×5 | 2 |  | pilar, nucleo, suelo | Cámara de núcleo: gran hexágono grabado con radios y zócalo central (5×5, calco de suelo) |
| `pilar_columna_quebrada` | 1×2 | 2 |  | pilar, vestigio | Columna quebrada con cascotes (1×2) |
| `pilar_arista` | 1×2 | 2 |  | pilar, cristal | Arista violeta: cristal afilado (1×2) |
| `pilar_pedestal` | 1×2 | 2 |  | pilar, fragmento | Pedestal hexagonal con hueco para el Fragmento (1×2) |
| `pilar_arista_grande` | 2×2 | 2 |  | pilar, cristal | Grupo de aristas violetas (2×2) |
| `pilar_glifo` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo |
| `pilar_glifo_2` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo (variante) |
| `pilar_losa_eco` | 2×2 | 2 |  | pilar, eco, suelo | Losa de eco: anillos concéntricos grabados (2×2, pisable) |
| `pilar_escalinata_ancha` | 5×3 | 2 |  | pilar, escalera | Escalinata ancha de piedra (5×3, pasable) |
| `pilar_placa_unown` | 2×2 | 2 |  | pilar, cartel | Estela con glifos Unown (2×2; evento de lectura encima) |
| `pilar_manantial` | 3×3 | 2 |  | pilar, agua | Manantial: pila circular de piedra con surtidor (3×3, bloquea) |
| `pilar_escalinata` | 3×3 | 2 |  | pilar, escalera | Escalinata de piedra (sube hacia el norte, 3×3, pasable) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `vacio` | tile | 0 | Negro de roca maciza (fuera de las salas) |
| `suelo` | pattern | 0 | Suelo de cueva: tierra y musgo verde |
| `sala` | cave | — | Sala rectangular (tierra y musgo verde): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `mancha` | nine | 1 | Mancha de suelo irregular (tierra y musgo verde) sobre el suelo de la sala (mejor rectangular) |
| `suelo_arcilla` | pattern | 0 | Suelo de cueva: tierra rojiza y agua turquesa |
| `sala_arcilla` | cave | — | Sala rectangular (tierra rojiza y agua turquesa): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `mancha_arcilla` | nine | 1 | Mancha de suelo irregular (tierra rojiza y agua turquesa) sobre el suelo de la sala (mejor rectangular) |
| `estanque_arcilla` | nine | 1 | Estanque rectangular con marco de roca (tierra rojiza y agua turquesa) |
| `saliente_arcilla` | line | 1 | Saliente de cueva (tierra rojiza y agua turquesa): se salta hacia el sur |
| `suelo_hielo` | pattern | 0 | Suelo de cueva: suelo gris azulado y paredes azules |
| `sala_hielo` | cave | — | Sala rectangular (suelo gris azulado y paredes azules): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `mancha_hielo` | nine | 1 | Mancha de suelo irregular (suelo gris azulado y paredes azules) sobre el suelo de la sala (mejor rectangular) |
| `estanque_hielo` | nine | 1 | Estanque rectangular con marco de roca (suelo gris azulado y paredes azules) |
| `saliente_hielo` | line | 1 | Saliente de cueva (suelo gris azulado y paredes azules): se salta hacia el sur |
| `suelo_volcan` | pattern | 0 | Suelo de cueva: suelo rojizo y paredes moradas |
| `sala_volcan` | cave | — | Sala rectangular (suelo rojizo y paredes moradas): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `mancha_volcan` | nine | 1 | Mancha de suelo irregular (suelo rojizo y paredes moradas) sobre el suelo de la sala (mejor rectangular) |
| `estanque_volcan` | nine | 1 | Estanque rectangular con marco de roca (suelo rojizo y paredes moradas) |
| `saliente_volcan` | line | 1 | Saliente de cueva (suelo rojizo y paredes moradas): se salta hacia el sur |
| `suelo_gris` | pattern | 0 | Suelo de cueva: suelo gris y paredes azul oscuro |
| `sala_gris` | cave | — | Sala rectangular (suelo gris y paredes azul oscuro): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `mancha_gris` | nine | 1 | Mancha de suelo irregular (suelo gris y paredes azul oscuro) sobre el suelo de la sala (mejor rectangular) |
| `estanque_gris` | nine | 1 | Estanque rectangular con marco de roca (suelo gris y paredes azul oscuro) |
| `saliente_gris` | line | 1 | Saliente de cueva (suelo gris y paredes azul oscuro): se salta hacia el sur |
| `suelo_morada` | pattern | 0 | Suelo de cueva: suelo morado y paredes oscuras |
| `sala_morada` | cave | — | Sala rectangular (suelo morado y paredes oscuras): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `mancha_morada` | nine | 1 | Mancha de suelo irregular (suelo morado y paredes oscuras) sobre el suelo de la sala (mejor rectangular) |
| `estanque_morada` | nine | 1 | Estanque rectangular con marco de roca (suelo morado y paredes oscuras) |
| `saliente_morada` | line | 1 | Saliente de cueva (suelo morado y paredes oscuras): se salta hacia el sur |
| `agua` | autotile | 0 | Agua de cueva (autotile 6; en tilesets 12–15 es hielo, lava, agua morada/azul) |
| `estanque` | nine | 1 | Estanque rectangular con marco de roca (agua fija) |
| `saliente` | line | 1 | Saliente de cueva (ledge): se salta hacia el sur |
| `hielo` | nine | 1 | Placa de hielo resbaladizo con reborde (terrain Ice; mejor rectangular) |
| `nieve` | nine | 1 | Nieve acumulada sobre el suelo de la cueva (bordes de copos) |
| `cascada` | autotile | 2 | Cascada de cueva animada (autotile 0): rectángulo sobre la pared, con agua arriba y abajo |
| `pared_trepar` | tile | 2 | Roca con musgo para Trepar: pintar una franja sobre la pared (capa 2) y poner encima el evento climbWall |
| `pilar_canal_v` | line | 2 | Canal de resonancia vertical |
| `pilar_enlosado` | nine | 1 | Enlosado antiguo con bordillo (nine): suelo de sala de Pilar sobre la roca |
| `pilar_canal` | line | 2 | Canal de resonancia horizontal (agua luminosa en un surco; bloquea) |

### Tileset 4 · Interior1 (61 stamps, 13 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `salida_casa` | 5×2 | 2 | 2,1 | salida | Hueco en el marco de madera con felpudo rojo (salida de casa, 3 casillas de ancho) |
| `salida_lab` | 4×2 | 2 | 1,1 | salida | Hueco en el marco blanco con felpudo rojo (salida de laboratorio, 2 de ancho) |
| `cama` | 3×4 | 2 |  | dormitorio | Cama de matrimonio morada (3×4) |
| `cama_individual` | 3×3 | 2 |  | dormitorio | Cama/colchoneta verde menta sin cabecero (3×3) |
| `escritorio_pc` | 3×3 | 2 |  | dormitorio, pc | Escritorio con PC y silla verde (3×3) |
| `comoda` | 1×2 | 2 |  | dormitorio | Cómoda con cajones |
| `estanteria_naranja` | 1×2 | 2 |  | dormitorio, libros | Estantería naranja estrecha |
| `armario_lateral` | 1×4 | 2 |  | dormitorio | Armario alto visto de lado (pared izquierda) |
| `consola` | 2×1 | 2 |  | salon | Videoconsola en el suelo |
| `tele` | 2×2 | 2 |  | salon | Televisor sobre mueble (2×2) |
| `mesa_comedor` | 5×3 | 2 |  | salon, cocina | Mesa de comedor con mantel y dos sillas (5×3) |
| `sofa` | 2×5 | 2 |  | salon | Sofá azul vertical (pared derecha) |
| `vitrina` | 2×3 | 2 |  | salon | Vitrina de madera con cristal |
| `estanteria_roja` | 2×3 | 2 |  | salon, libros | Estantería roja con libros (2×3) |
| `nevera` | 1×3 | 2 |  | cocina | Nevera blanca |
| `fregadero` | 2×3 | 2 |  | cocina | Fregadero y encimera (2×3) |
| `sartenes` | 2×2 | 2 |  | cocina, pared | Sartenes colgadas (va sobre la pared) |
| `taza` | 1×1 | 2 |  | cocina | Taza (sobre una mesa) |
| `planta` | 1×2 | 2 |  | decoracion | Planta en maceta (1×2) |
| `planta_alta` | 1×2 | 2 |  | decoracion | Planta alta enredadera (1×2) |
| `papelera` | 1×1 | 2 |  | decoracion | Papelera roja |
| `cuadro` | 1×1 | 2 |  | pared, decoracion | Cuadro pequeño (pared) |
| `reloj_pared` | 1×1 | 2 |  | pared, decoracion | Reloj de pared gris |
| `ventana_cortinas` | 2×2 | 1 |  | pared | Ventana con cortinas azules (pared, 2×2) |
| `ventana` | 2×1 | 1 |  | pared | Ventana de cristal azul (pared) |
| `escalera_subir_der` | 2×3 | 1,2 | 1,1 | escalera | Escalera que sube, pegada a la pared derecha (warp en door) |
| `escalera_subir_izq` | 2×3 | 1,2 | 0,1 | escalera | Escalera que sube, pegada a la pared izquierda |
| `escalera_bajar_der` | 2×3 | 1 | 0,1 | escalera | Escalera que baja (planta alta), pared derecha |
| `escalera_bajar_izq` | 2×3 | 1 | 1,1 | escalera | Escalera que baja (planta alta), pared izquierda |
| `mostrador_centro` | 7×9 | 1,2 |  | centro | Mostrador del Centro Pokémon con máquina curativa, hueco de la trastienda y logotipo en el suelo (7×9; la fila 0 va sobre la 1ª fila de pared) |
| `pc_centro` | 2×3 | 2 |  | centro, pc | Terminal PC de almacenamiento (2×3) |
| `maquina_lab` | 3×5 | 2 |  | laboratorio | Máquina de laboratorio con cápsula turquesa (3×5) |
| `pizarras` | 4×2 | 2 |  | laboratorio, pared | Pizarras con gráficas (pared, 4×2) |
| `estanteria_lab` | 2×3 | 2 |  | laboratorio, libros | Estantería blanca con libros (2×3) |
| `fotocopiadora` | 2×2 | 2 |  | laboratorio | Aparato blanco (fotocopiadora/analizador) |
| `ventanal_lab` | 1×2 | 2 |  | laboratorio, pared | Ventanal azul de laboratorio (pared) |
| `lab_ordenadores` | 5×4 | 2 |  | laboratorio, pc | Banco de ordenadores del laboratorio (5×4) |
| `lab_zona_maquina` | 5×7 | 0,1,2 |  | laboratorio | Zona elevada con máquina y ordenador (5×7, incluye suelo) |
| `mesa_lab_verde` | 3×2 | 1 |  | laboratorio | Mesa de trabajo verde (3×2) |
| `vitrina_museo` | 3×2 | 2 |  | museo | Vitrina alargada de cristal sobre peana (3×2) |
| `vitrina_estrecha` | 1×2 | 2 |  | museo | Vitrina estrecha (1×2) |
| `fosil_pedestal` | 2×2 | 2 |  | museo, fosil | Fósil de concha sobre pedestal (2×2) |
| `fosil_pedestal_2` | 2×2 | 2 |  | museo, fosil | Fósil sobre pedestal blanco (2×2) |
| `esqueleto_fosil` | 3×3 | 2 |  | museo, fosil | Esqueleto fósil sobre peana (3×3) |
| `esqueleto_fosil_2` | 2×3 | 2 |  | museo, fosil | Esqueleto fósil de cola larga (2×3) |
| `panel_informativo` | 2×2 | 2 |  | museo, pared | Panel informativo iluminado (pared, 2×2) |
| `vitrinas_joyas` | 2×2 | 2 |  | museo | Dos vitrinas pequeñas con gemas (2×2) |
| `cordon_museo` | 7×6 | 2 |  | museo | Exposición acordonada con postes y cordón rojo (7×6) |
| `museo_sala` | 35×19 | 0,1,2 |  | museo, sala | Sala de museo completa: vitrinas, fósiles, cordones, maqueta y recepción (35×19) |
| `museo_galeria` | 28×16 | 0,1,2 |  | museo, sala | Galería de museo con vitrinas, maqueta de cohete y escalera (28×16) |
| `laboratorio_grande` | 33×19 | 0,1,2 |  | laboratorio, sala | Laboratorio grande con máquinas, ordenadores y probetas (33×19) |
| `laboratorio_sala` | 18×16 | 0,1,2 |  | laboratorio, sala | Sala de laboratorio (18×16) |
| `laboratorio_sala_2` | 18×16 | 0,1,2 |  | laboratorio, sala | Sala de laboratorio con equipos (18×16) |
| `laboratorio_sala_3` | 18×16 | 0,1,2 |  | laboratorio, sala | Sala de laboratorio con cápsulas (18×16) |
| `central_generador` | 15×14 | 0,1,2 |  | industria, sala | Sala del generador con marco dorado (15×14; Central/instalación de Genesis) |
| `central_almacen` | 25×19 | 0,1,2 |  | industria, sala | Almacén industrial con contenedores, bidones y conos (25×19) |
| `central_pasillo` | 21×14 | 0,1,2 |  | industria, sala | Pasillo industrial en L con maquinaria (21×14) |
| `estacion_tren` | 27×17 | 0,1,2 | 13,16 | estacion, sala | Estación de tren: andén con vagón, bancos, máquina expendedora y taquilla (27×17) |
| `grandes_almacenes` | 19×18 | 0,1,2 |  | tienda, sala | Planta baja de grandes almacenes con mostradores y escaleras (19×18) |
| `grandes_almacenes_planta` | 18×17 | 0,1,2 |  | tienda, sala | Planta de grandes almacenes con estanterías (18×17) |
| `oficinas` | 39×25 | 0,1,2 |  | oficina, sala | Planta de oficinas con mesas, ordenadores y recepción (39×25; Consorcio) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `vacio` | tile | 0 | Negro de fuera de la habitación |
| `suelo_madera` | tile | 0 | Suelo de parqué |
| `suelo_lab` | tile | 0 | Suelo ajedrezado de laboratorio |
| `habitacion_casa` | room | — | Habitación de casa: 3 filas de pared, parqué y marco de madera |
| `habitacion_lab` | room | — | Habitación de laboratorio: pared verde claro, suelo ajedrezado y marco blanco |
| `alfombra_roja` | nine | 1 | Alfombra roja de cuadros |
| `alfombra_verde` | nine | 1 | Alfombra verde |
| `alfombra_azul` | nine | 1 | Alfombra azul con ribete dorado |
| `alfombra_granate` | nine | 1 | Alfombra granate con ribete dorado |
| `alfombra_lila` | nine | 1 | Alfombra lila con puntilla |
| `alfombra_beige` | nine | 1 | Alfombra beige con estrella |
| `habitacion_blanca` | room | — | Habitación de casa con marco blanco (el marco de museo y laboratorio) |
| `habitacion_museo` | room | — | Sala de museo: pared clara, suelo de madera oscura y marco blanco |

### Tileset 11 · InteriorTorre (74 stamps, 21 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `cama` | 3×4 | 2 |  | dormitorio | Cama de matrimonio morada (3×4) |
| `cama_individual` | 3×3 | 2 |  | dormitorio | Cama/colchoneta verde menta sin cabecero (3×3) |
| `escritorio_pc` | 3×3 | 2 |  | dormitorio, pc | Escritorio con PC y silla verde (3×3) |
| `comoda` | 1×2 | 2 |  | dormitorio | Cómoda con cajones |
| `estanteria_naranja` | 1×2 | 2 |  | dormitorio, libros | Estantería naranja estrecha |
| `armario_lateral` | 1×4 | 2 |  | dormitorio | Armario alto visto de lado (pared izquierda) |
| `consola` | 2×1 | 2 |  | salon | Videoconsola en el suelo |
| `tele` | 2×2 | 2 |  | salon | Televisor sobre mueble (2×2) |
| `mesa_comedor` | 5×3 | 2 |  | salon, cocina | Mesa de comedor con mantel y dos sillas (5×3) |
| `sofa` | 2×5 | 2 |  | salon | Sofá azul vertical (pared derecha) |
| `vitrina` | 2×3 | 2 |  | salon | Vitrina de madera con cristal |
| `estanteria_roja` | 2×3 | 2 |  | salon, libros | Estantería roja con libros (2×3) |
| `nevera` | 1×3 | 2 |  | cocina | Nevera blanca |
| `fregadero` | 2×3 | 2 |  | cocina | Fregadero y encimera (2×3) |
| `sartenes` | 2×2 | 2 |  | cocina, pared | Sartenes colgadas (va sobre la pared) |
| `taza` | 1×1 | 2 |  | cocina | Taza (sobre una mesa) |
| `planta` | 1×2 | 2 |  | decoracion | Planta en maceta (1×2) |
| `planta_alta` | 1×2 | 2 |  | decoracion | Planta alta enredadera (1×2) |
| `papelera` | 1×1 | 2 |  | decoracion | Papelera roja |
| `cuadro` | 1×1 | 2 |  | pared, decoracion | Cuadro pequeño (pared) |
| `reloj_pared` | 1×1 | 2 |  | pared, decoracion | Reloj de pared gris |
| `ventana_cortinas` | 2×2 | 1 |  | pared | Ventana con cortinas azules (pared, 2×2) |
| `ventana` | 2×1 | 1 |  | pared | Ventana de cristal azul (pared) |
| `escalera_subir_der` | 2×3 | 1,2 | 1,1 | escalera | Escalera que sube, pegada a la pared derecha (warp en door) |
| `escalera_subir_izq` | 2×3 | 1,2 | 0,1 | escalera | Escalera que sube, pegada a la pared izquierda |
| `escalera_bajar_der` | 2×3 | 1 | 0,1 | escalera | Escalera que baja (planta alta), pared derecha |
| `escalera_bajar_izq` | 2×3 | 1 | 1,1 | escalera | Escalera que baja (planta alta), pared izquierda |
| `pc_centro` | 2×3 | 2 |  | centro, pc | Terminal PC de almacenamiento (2×3) |
| `maquina_lab` | 3×5 | 2 |  | laboratorio | Máquina de laboratorio con cápsula turquesa (3×5) |
| `pizarras` | 4×2 | 2 |  | laboratorio, pared | Pizarras con gráficas (pared, 4×2) |
| `estanteria_lab` | 2×3 | 2 |  | laboratorio, libros | Estantería blanca con libros (2×3) |
| `ventanal_lab` | 1×2 | 2 |  | laboratorio, pared | Ventanal azul de laboratorio (pared) |
| `lab_ordenadores` | 5×4 | 2 |  | laboratorio, pc | Banco de ordenadores del laboratorio (5×4) |
| `lab_zona_maquina` | 5×7 | 0,1,2 |  | laboratorio | Zona elevada con máquina y ordenador (5×7, incluye suelo) |
| `vitrina_museo` | 3×2 | 2 |  | museo | Vitrina alargada de cristal sobre peana (3×2) |
| `vitrina_estrecha` | 1×2 | 2 |  | museo | Vitrina estrecha (1×2) |
| `fosil_pedestal` | 2×2 | 2 |  | museo, fosil | Fósil de concha sobre pedestal (2×2) |
| `fosil_pedestal_2` | 2×2 | 2 |  | museo, fosil | Fósil sobre pedestal blanco (2×2) |
| `esqueleto_fosil` | 3×3 | 2 |  | museo, fosil | Esqueleto fósil sobre peana (3×3) |
| `esqueleto_fosil_2` | 2×3 | 2 |  | museo, fosil | Esqueleto fósil de cola larga (2×3) |
| `panel_informativo` | 2×2 | 2 |  | museo, pared | Panel informativo iluminado (pared, 2×2) |
| `vitrinas_joyas` | 2×2 | 2 |  | museo | Dos vitrinas pequeñas con gemas (2×2) |
| `emblema_suelo` | 5×5 | 1 |  | solemne, suelo | Gran emblema circular en el suelo (5×5) |
| `emblema_anillo` | 4×4 | 1 |  | solemne, suelo | Emblema de anillo azul y dorado en el suelo (4×4) |
| `trofeo` | 1×3 | 2 |  | solemne | Trofeo dorado sobre peana (1×3) |
| `estatua_busto` | 1×3 | 2 |  | solemne, estatua | Estatua sobre pedestal (1×3) |
| `luz_suelo` | 1×1 | 2 |  | solemne, luz | Baldosa luminosa del suelo |
| `pantalla_pared` | 2×2 | 2 |  | solemne, pared | Cuadro/pantalla de pared (2×2) |
| `sala_fuego` | 16×22 | 0 |  | sala, solemne, fuego | Sala ceremonial con fosos de lava y braseros (16×22; Volcán Tizón / forja) |
| `sala_hielo` | 15×18 | 0,2 |  | sala, solemne, hielo | Sala ceremonial de hielo con arcos (15×18; Santuario del Alma, Gruta Escarcha) |
| `sala_sombra` | 15×17 | 0,2 |  | sala, solemne, sombra | Sala ceremonial de sombras con follaje azul (15×17; Mundo Distorsión, Archivo Hondo) |
| `sala_arena` | 13×18 | 0,1,2 |  | sala, solemne, arena | Arena de combate con emblema, estatuas y trofeo (13×18) |
| `vestibulo_solemne` | 31×21 | 0,1,2 | 15,20 | sala, solemne | Vestíbulo solemne: mostrador, tienda, escaleras laterales, alfombra en cruz y estatuas (31×21; suelo de baldosa azul) |
| `sala_octogonal` | 13×19 | 0,1,2 | 6,18 | sala, solemne | Sala octogonal con emblema central, setos y estatuas (13×19) |
| `sala_trono` | 13×22 | 0,1,2 |  | sala, solemne, oro | Sala del trono dorada con alfombra roja y estatuas (13×22; Pilar del Origen) |
| `pasillo_real` | 8×5 | 2 |  | solemne, alfombra | Pasillo con alfombra y barandillas doradas (8×5; azul) |
| `pilar_dintel` | 5×4 | 2 |  | pilar, vestigio, puerta | Dintel: dos pilares y viga con banda de hexágonos (5×4; se pasa por debajo, hueco de 3) |
| `pilar_monolito` | 2×3 | 2 |  | pilar, vestigio | Monolito de piedra con tres hexágonos tallados (2×3; la base bloquea) |
| `pilar_columna` | 1×3 | 2 |  | pilar, vestigio | Columna entera con capitel (1×3) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |
| `pilar_camara_nucleo` | 5×5 | 2 |  | pilar, nucleo, suelo | Cámara de núcleo: gran hexágono grabado con radios y zócalo central (5×5, calco de suelo) |
| `pilar_columna_quebrada` | 1×2 | 2 |  | pilar, vestigio | Columna quebrada con cascotes (1×2) |
| `pilar_arista` | 1×2 | 2 |  | pilar, cristal | Arista violeta: cristal afilado (1×2) |
| `pilar_pedestal` | 1×2 | 2 |  | pilar, fragmento | Pedestal hexagonal con hueco para el Fragmento (1×2) |
| `pilar_arista_grande` | 2×2 | 2 |  | pilar, cristal | Grupo de aristas violetas (2×2) |
| `pilar_glifo` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo |
| `pilar_glifo_2` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo (variante) |
| `pilar_losa_eco` | 2×2 | 2 |  | pilar, eco, suelo | Losa de eco: anillos concéntricos grabados (2×2, pisable) |
| `pilar_escalinata_ancha` | 5×3 | 2 |  | pilar, escalera | Escalinata ancha de piedra (5×3, pasable) |
| `pilar_placa_unown` | 2×2 | 2 |  | pilar, cartel | Estela con glifos Unown (2×2; evento de lectura encima) |
| `pilar_manantial` | 3×3 | 2 |  | pilar, agua | Manantial: pila circular de piedra con surtidor (3×3, bloquea) |
| `pilar_escalinata` | 3×3 | 2 |  | pilar, escalera | Escalinata de piedra (sube hacia el norte, 3×3, pasable) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `vacio` | tile | 0 | Negro de fuera de la habitación |
| `suelo_madera` | tile | 0 | Suelo de parqué |
| `suelo_lab` | tile | 0 | Suelo ajedrezado de laboratorio |
| `alfombra_roja` | nine | 1 | Alfombra roja de cuadros |
| `alfombra_verde` | nine | 1 | Alfombra verde |
| `alfombra_azul` | nine | 1 | Alfombra azul con ribete dorado |
| `alfombra_granate` | nine | 1 | Alfombra granate con ribete dorado |
| `alfombra_lila` | nine | 1 | Alfombra lila con puntilla |
| `alfombra_beige` | nine | 1 | Alfombra beige con estrella |
| `suelo_solemne` | tile | 0 | Suelo de baldosa solemne |
| `alfombra_rombos` | nine | 1 | Alfombra de rombos con ribete dorado (pasillos y cruces del vestíbulo) |
| `sala_blanco` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco blanco (para recintos de Pilar) |
| `sala_marron` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco marron (para recintos de Pilar) |
| `sala_naranja` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco naranja (para recintos de Pilar) |
| `sala_azul` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco azul (para recintos de Pilar) |
| `sala_pizarra` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco pizarra (para recintos de Pilar) |
| `sala_dorado` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco dorado (para recintos de Pilar) |
| `sala_morado` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa azul y marco morado (para recintos de Pilar) |
| `pilar_canal_v` | line | 2 | Canal de resonancia vertical |
| `pilar_enlosado` | nine | 1 | Enlosado antiguo con bordillo (nine): suelo de sala de Pilar sobre la roca |
| `pilar_canal` | line | 2 | Canal de resonancia horizontal (agua luminosa en un surco; bloquea) |

### Tileset 8 · InteriorLiga (75 stamps, 21 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `cama` | 3×4 | 2 |  | dormitorio | Cama de matrimonio morada (3×4) |
| `cama_individual` | 3×3 | 2 |  | dormitorio | Cama/colchoneta verde menta sin cabecero (3×3) |
| `escritorio_pc` | 3×3 | 2 |  | dormitorio, pc | Escritorio con PC y silla verde (3×3) |
| `comoda` | 1×2 | 2 |  | dormitorio | Cómoda con cajones |
| `estanteria_naranja` | 1×2 | 2 |  | dormitorio, libros | Estantería naranja estrecha |
| `armario_lateral` | 1×4 | 2 |  | dormitorio | Armario alto visto de lado (pared izquierda) |
| `consola` | 2×1 | 2 |  | salon | Videoconsola en el suelo |
| `tele` | 2×2 | 2 |  | salon | Televisor sobre mueble (2×2) |
| `mesa_comedor` | 5×3 | 2 |  | salon, cocina | Mesa de comedor con mantel y dos sillas (5×3) |
| `sofa` | 2×5 | 2 |  | salon | Sofá azul vertical (pared derecha) |
| `vitrina` | 2×3 | 2 |  | salon | Vitrina de madera con cristal |
| `estanteria_roja` | 2×3 | 2 |  | salon, libros | Estantería roja con libros (2×3) |
| `nevera` | 1×3 | 2 |  | cocina | Nevera blanca |
| `fregadero` | 2×3 | 2 |  | cocina | Fregadero y encimera (2×3) |
| `sartenes` | 2×2 | 2 |  | cocina, pared | Sartenes colgadas (va sobre la pared) |
| `taza` | 1×1 | 2 |  | cocina | Taza (sobre una mesa) |
| `planta` | 1×2 | 2 |  | decoracion | Planta en maceta (1×2) |
| `planta_alta` | 1×2 | 2 |  | decoracion | Planta alta enredadera (1×2) |
| `papelera` | 1×1 | 2 |  | decoracion | Papelera roja |
| `cuadro` | 1×1 | 2 |  | pared, decoracion | Cuadro pequeño (pared) |
| `reloj_pared` | 1×1 | 2 |  | pared, decoracion | Reloj de pared gris |
| `ventana_cortinas` | 2×2 | 1 |  | pared | Ventana con cortinas azules (pared, 2×2) |
| `ventana` | 2×1 | 1 |  | pared | Ventana de cristal azul (pared) |
| `escalera_subir_der` | 2×3 | 1,2 | 1,1 | escalera | Escalera que sube, pegada a la pared derecha (warp en door) |
| `escalera_subir_izq` | 2×3 | 1,2 | 0,1 | escalera | Escalera que sube, pegada a la pared izquierda |
| `escalera_bajar_der` | 2×3 | 1 | 0,1 | escalera | Escalera que baja (planta alta), pared derecha |
| `escalera_bajar_izq` | 2×3 | 1 | 1,1 | escalera | Escalera que baja (planta alta), pared izquierda |
| `pc_centro` | 2×3 | 2 |  | centro, pc | Terminal PC de almacenamiento (2×3) |
| `maquina_lab` | 3×5 | 2 |  | laboratorio | Máquina de laboratorio con cápsula turquesa (3×5) |
| `pizarras` | 4×2 | 2 |  | laboratorio, pared | Pizarras con gráficas (pared, 4×2) |
| `estanteria_lab` | 2×3 | 2 |  | laboratorio, libros | Estantería blanca con libros (2×3) |
| `ventanal_lab` | 1×2 | 2 |  | laboratorio, pared | Ventanal azul de laboratorio (pared) |
| `lab_ordenadores` | 5×4 | 2 |  | laboratorio, pc | Banco de ordenadores del laboratorio (5×4) |
| `lab_zona_maquina` | 5×7 | 0,1,2 |  | laboratorio | Zona elevada con máquina y ordenador (5×7, incluye suelo) |
| `vitrina_museo` | 3×2 | 2 |  | museo | Vitrina alargada de cristal sobre peana (3×2) |
| `vitrina_estrecha` | 1×2 | 2 |  | museo | Vitrina estrecha (1×2) |
| `fosil_pedestal` | 2×2 | 2 |  | museo, fosil | Fósil de concha sobre pedestal (2×2) |
| `fosil_pedestal_2` | 2×2 | 2 |  | museo, fosil | Fósil sobre pedestal blanco (2×2) |
| `esqueleto_fosil` | 3×3 | 2 |  | museo, fosil | Esqueleto fósil sobre peana (3×3) |
| `esqueleto_fosil_2` | 2×3 | 2 |  | museo, fosil | Esqueleto fósil de cola larga (2×3) |
| `panel_informativo` | 2×2 | 2 |  | museo, pared | Panel informativo iluminado (pared, 2×2) |
| `vitrinas_joyas` | 2×2 | 2 |  | museo | Dos vitrinas pequeñas con gemas (2×2) |
| `emblema_suelo` | 5×5 | 1 |  | solemne, suelo | Gran emblema circular en el suelo (5×5) |
| `emblema_anillo` | 4×4 | 1 |  | solemne, suelo | Emblema de anillo azul y dorado en el suelo (4×4) |
| `trofeo` | 1×3 | 2 |  | solemne | Trofeo dorado sobre peana (1×3) |
| `estatua_busto` | 1×3 | 2 |  | solemne, estatua | Estatua sobre pedestal (1×3) |
| `luz_suelo` | 1×1 | 2 |  | solemne, luz | Baldosa luminosa del suelo |
| `pantalla_pared` | 2×2 | 2 |  | solemne, pared | Cuadro/pantalla de pared (2×2) |
| `sala_fuego` | 16×22 | 0 |  | sala, solemne, fuego | Sala ceremonial con fosos de lava y braseros (16×22; Volcán Tizón / forja) |
| `sala_hielo` | 15×18 | 0,2 |  | sala, solemne, hielo | Sala ceremonial de hielo con arcos (15×18; Santuario del Alma, Gruta Escarcha) |
| `sala_sombra` | 15×17 | 0,2 |  | sala, solemne, sombra | Sala ceremonial de sombras con follaje azul (15×17; Mundo Distorsión, Archivo Hondo) |
| `sala_arena` | 13×18 | 0,1,2 |  | sala, solemne, arena | Arena de combate con emblema, estatuas y trofeo (13×18) |
| `vestibulo_solemne` | 31×21 | 0,1,2 | 15,20 | sala, solemne | Vestíbulo solemne: mostrador, tienda, escaleras laterales, alfombra en cruz y estatuas (31×21; suelo de baldosa roja) |
| `sala_octogonal` | 13×19 | 0,1,2 | 6,18 | sala, solemne | Sala octogonal con emblema central, setos y estatuas (13×19) |
| `sala_trono` | 13×22 | 0,1,2 |  | sala, solemne, oro | Sala del trono dorada con alfombra roja y estatuas (13×22; Pilar del Origen) |
| `sala_campeon` | 11×23 | 0,1,2 |  | sala, solemne | Salón alargado del campeón con alfombra roja y anillo (11×23; Columna Lanza, Bastión) |
| `pasillo_real` | 8×5 | 2 |  | solemne, alfombra | Pasillo con alfombra y barandillas doradas (8×5; roja) |
| `pilar_dintel` | 5×4 | 2 |  | pilar, vestigio, puerta | Dintel: dos pilares y viga con banda de hexágonos (5×4; se pasa por debajo, hueco de 3) |
| `pilar_monolito` | 2×3 | 2 |  | pilar, vestigio | Monolito de piedra con tres hexágonos tallados (2×3; la base bloquea) |
| `pilar_columna` | 1×3 | 2 |  | pilar, vestigio | Columna entera con capitel (1×3) |
| `pilar_zocalo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal de piedra (Reconstrucción) |
| `pilar_zocalo_gastado` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal gastado y agrietado (borde de un vacío) |
| `pilar_zocalo_vivo` | 1×1 | 2 |  | pilar, zocalo, reconstruccion | Zócalo hexagonal con brillo verde (tramo reconstruido o activo) |
| `pilar_camara_nucleo` | 5×5 | 2 |  | pilar, nucleo, suelo | Cámara de núcleo: gran hexágono grabado con radios y zócalo central (5×5, calco de suelo) |
| `pilar_columna_quebrada` | 1×2 | 2 |  | pilar, vestigio | Columna quebrada con cascotes (1×2) |
| `pilar_arista` | 1×2 | 2 |  | pilar, cristal | Arista violeta: cristal afilado (1×2) |
| `pilar_pedestal` | 1×2 | 2 |  | pilar, fragmento | Pedestal hexagonal con hueco para el Fragmento (1×2) |
| `pilar_arista_grande` | 2×2 | 2 |  | pilar, cristal | Grupo de aristas violetas (2×2) |
| `pilar_glifo` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo |
| `pilar_glifo_2` | 1×1 | 2 |  | pilar, suelo | Glifo Unown grabado en el suelo (variante) |
| `pilar_losa_eco` | 2×2 | 2 |  | pilar, eco, suelo | Losa de eco: anillos concéntricos grabados (2×2, pisable) |
| `pilar_escalinata_ancha` | 5×3 | 2 |  | pilar, escalera | Escalinata ancha de piedra (5×3, pasable) |
| `pilar_placa_unown` | 2×2 | 2 |  | pilar, cartel | Estela con glifos Unown (2×2; evento de lectura encima) |
| `pilar_manantial` | 3×3 | 2 |  | pilar, agua | Manantial: pila circular de piedra con surtidor (3×3, bloquea) |
| `pilar_escalinata` | 3×3 | 2 |  | pilar, escalera | Escalinata de piedra (sube hacia el norte, 3×3, pasable) |

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `vacio` | tile | 0 | Negro de fuera de la habitación |
| `suelo_madera` | tile | 0 | Suelo de parqué |
| `suelo_lab` | tile | 0 | Suelo ajedrezado de laboratorio |
| `alfombra_roja` | nine | 1 | Alfombra roja de cuadros |
| `alfombra_verde` | nine | 1 | Alfombra verde |
| `alfombra_azul` | nine | 1 | Alfombra azul con ribete dorado |
| `alfombra_granate` | nine | 1 | Alfombra granate con ribete dorado |
| `alfombra_lila` | nine | 1 | Alfombra lila con puntilla |
| `alfombra_beige` | nine | 1 | Alfombra beige con estrella |
| `suelo_solemne` | tile | 0 | Suelo de baldosa solemne |
| `alfombra_rombos` | nine | 1 | Alfombra de rombos con ribete dorado (pasillos y cruces del vestíbulo) |
| `sala_blanco` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco blanco (para recintos de Pilar) |
| `sala_marron` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco marron (para recintos de Pilar) |
| `sala_naranja` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco naranja (para recintos de Pilar) |
| `sala_azul` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco azul (para recintos de Pilar) |
| `sala_pizarra` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco pizarra (para recintos de Pilar) |
| `sala_dorado` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco dorado (para recintos de Pilar) |
| `sala_morado` | room | — | Sala solemne: pared de mármol con zócalo, suelo de baldosa roja y marco morado (para recintos de Pilar) |
| `pilar_canal_v` | line | 2 | Canal de resonancia vertical |
| `pilar_enlosado` | nine | 1 | Enlosado antiguo con bordillo (nine): suelo de sala de Pilar sobre la roca |
| `pilar_canal` | line | 2 | Canal de resonancia horizontal (agua luminosa en un surco; bloquea) |
