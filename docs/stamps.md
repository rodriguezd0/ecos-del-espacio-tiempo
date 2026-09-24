# Biblioteca de stamps y brushes

Piezas reutilizables para construir los mapas originales de Axis con los tilesets de Añil
(contrato: `docs/ARCHITECTURE.md` §5). **Este archivo se genera** con `node tools/stamps_doc.mjs`;
edita la guía en esa herramienta y el catálogo en las definiciones.

- **Stamp**: bloque fijo de tiles (edificio, árbol, mueble, boca de cueva…) en 1–3 capas, con metadatos
  (`door` = casilla de la puerta/warp relativa al stamp, `solid`, `tags`, `desc`).
- **Brush**: relleno inteligente sobre un conjunto de casillas (césped, caminos con bordes, agua, bosque,
  terrazas, habitaciones…). Se calcula con `paintBrush`.

## Archivos

| Archivo | Qué es |
|---|---|
| `game/src/content/stamps/<Imagen>.js` | Definición legible por tileset (`src` / `from` / `tiles` + metadatos + brushes) |
| `game/src/content/stamps/baked/<Imagen>.js` | **Generado** por `tools/stamps_bake.mjs`: rejillas de IDs resueltas (los mapas de Añil no se sirven en el juego) |
| `game/src/content/stamps/index.js` | API de carga y colocación (pura, sin DOM) |
| `game/src/content/stamps/brushes.js` | Algoritmos de brushes (puros) |
| `game/src/content/stamps/viewer.html` | Visor en el navegador: <http://localhost:8080/src/content/stamps/viewer.html> |

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

## Tipos de brush

| Tipo | Definición | Uso |
|---|---|---|
| `tile` | `{ tile, variants?, chance? }` | Relleno con variantes deterministas |
| `pattern` | `{ pattern: [x, y, w, h] }` | Mosaico por posición absoluta (césped 4×4, suelos de cueva 3×3) |
| `grid` | `{ grid: [[id, id], [id, id]] }` | Mosaico de IDs explícitos (agua de exterior) |
| `autotile` | `{ autotile: slot }` | Autotile resuelto por vecinos (agua de cueva, flores animadas) |
| `nine` | `{ nine: [x, y], inner?, fill? }` / `{ nine: 'ids', ids }` | Borde 3×3 + esquinas cóncavas 2×2 (orden NO, NE / SO, SE) |
| `forest` | `{ forest: { trees, size, period } }` | Bosque de árboles 2×6 apilados cada 4 filas (copas capa 2, troncos capa 1) |
| `cliff` | `{ cliff: { src, width, faceRows, rows? } }` | Macizo rocoso convexo con cara de 3 filas |
| `terrace` | `{ terrace: { rim, side, face } }` | Terraza de muros finos convexa (ancho ≥ 5) |
| `room` | `{ room: { wall, floor, floorShade, void, frame } }` | Habitación interior con marco (capas 0 y 2) |
| `cave` | `{ cave: { floor, void, ring } }` | Sala de cueva rectangular con paredes |
| `line` | `{ line: { ids \| src, axis } }` | Línea con extremos (salientes, vallas) |

## Convenciones y hallazgos

- **Capas**: suelo en 0; caminos, hierba alta, orillas y alfombras en 1; edificios, árboles y muebles en 2
  (como en Añil: así la sombra de un edificio cubre el camino de la capa 1).
- **Pasabilidad**: la da el tileset (`passages`/`priorities`/`terrainTags`); `solid` es solo informativo.
- **Agua de exterior**: el autotile `agua` de Añil solo tiene válidos los 4 bloques interiores; sus bordes llevan
  una **X roja**. No usar `{ autotile: 1 }`: usar el brush `agua` (grid) y encima `orilla` con la misma máscara.
  El agua de cueva (autotile 6) sí es un autotile completo.
- **Terrain tags** útiles (tileset 7): hierba alta 388 (morada) y 396 (verde); salientes 651/657/652; arena 416–434.
- **Brushes convexos**: `cliff`, `terrace`, `room` y `cave` trabajan sobre el rectángulo/forma convexa; para
  formas en L combina varios trazos o usa los recortes probados (`sala_cruz`…). Las alfombras y estanques `nine`
  quedan mejor rectangulares.
- **Bosque**: ancho par; alto ideal 4k+2 para que la última fila sea de troncos. Un tipo de árbol por columna
  (`mix: 'tree'` para variar árbol a árbol).
- **Salidas de interior**: `salida_casa` / `salida_lab` se colocan con la esquina en (puertaX − 2 | − 1, fila
  inferior del suelo); el warp queda en `door` (fila del marco).
- **Bocas de cueva** sobre una sala con suelo x0..x1, y0..y1: `boca_norte` en (x, y0 − 4), `salida_luz_sur`
  en (x, y1), `boca_oeste` en (x0 − 3, y), `boca_este` en (x1, y).
- **Recortes `from`**: los mapas del tileset 1 (Exterior1) comparten casi todos los IDs con ExteriorBosqueCeleste;
  el horneado avisa de cuántos tiles difieren y cada recorte se revisó dibujado con el tileset destino.
- Nada de esto es canon: los stamps son piezas gráficas. La distribución de los mapas de Axis se decide aparte
  (biblia §05: el pueblo inicial sigue pendiente de aprobación artística).

## Herramientas

| Comando | Para qué |
|---|---|
| `node tools/find_tiles.mjs <Imagen> [--rows=a-b]` | Hojas del tileset original con nº de fila/columna e ID (`tools/cache/stamps/tiles`) |
| `node tools/find_tiles.mjs --map=<id> --region=x,y,w,h [--as=<ts>]` | Recorte de un mapa de Añil con coordenadas (dibujable con otro tileset) |
| `node tools/find_tiles.mjs --dump=<id> --region=… ` / `--usage=<tile> [--tileset=<ts>]` | IDs de un recorte / dónde se usa un tile |
| `node tools/stamps_components.mjs <Imagen> --rows=a-b` | Rectángulos de objetos separados por tiles vacíos |
| `node tools/stamps_bake.mjs [Imagen]` | Hornea y valida (IDs, puertas, compatibilidad de recortes) |
| `node tools/preview_stamps.mjs <Imagen> [--only=a,b] [--tag=t]` | Hojas de contacto de stamps y brushes (`tools/cache/stamps/preview`) |
| `node tools/stamps_demo.mjs` | Composiciones de prueba técnica (`tools/cache/stamps/demo`) |
| `node tools/stamps_doc.mjs` | Regenera este documento |
| `node --test tests/stamps.test.mjs` | Sincronía definición↔horneado, IDs válidos y algoritmos |

Para añadir un stamp: localiza el rectángulo con `find_tiles`, añádelo a la definición, hornea, revisa la hoja
con `preview_stamps --only=<nombre>` y ejecuta los tests.

## Catálogo

### Tileset 7 · ExteriorBosqueCeleste (81 stamps, 20 brushes)

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

### Tileset 4 · Interior1 (39 stamps, 11 brushes)

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

### Tileset 2 · Cueva1 (40 stamps, 14 brushes)

| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |
|---|---|---|---|---|---|
| `sala_cruz` | 20×18 | 0,1,2 | 9,17 | sala | Sala de cueva en cruz con 4 salidas (norte: boca oscura, oeste/este: túneles, sur: luz exterior) |
| `roca_grande` | 2×3 | 2 |  | roca, tierra | Roca grande (tierra y musgo verde) |
| `boca_norte` | 3×4 | 2 | 1,2 | salida, tierra | Boca oscura en la pared norte (tierra y musgo verde); colocar en (x, y0-4) |
| `salida_luz_sur` | 3×2 | 2 | 1,1 | salida, tierra | Claridad de salida en la pared sur (tierra y musgo verde); colocar en (x, y1) |
| `roca_grande_hielo` | 2×3 | 2 |  | roca, hielo | Roca grande (suelo gris azulado y paredes azules) |
| `boca_norte_hielo` | 3×4 | 2 | 1,2 | salida, hielo | Boca oscura en la pared norte (suelo gris azulado y paredes azules); colocar en (x, y0-4) |
| `salida_luz_sur_hielo` | 3×2 | 2 | 1,1 | salida, hielo | Claridad de salida en la pared sur (suelo gris azulado y paredes azules); colocar en (x, y1) |
| `roca_grande_volcan` | 2×3 | 2 |  | roca, volcan | Roca grande (suelo rojizo y paredes moradas) |
| `boca_norte_volcan` | 3×4 | 2 | 1,2 | salida, volcan | Boca oscura en la pared norte (suelo rojizo y paredes moradas); colocar en (x, y0-4) |
| `salida_luz_sur_volcan` | 3×2 | 2 | 1,1 | salida, volcan | Claridad de salida en la pared sur (suelo rojizo y paredes moradas); colocar en (x, y1) |
| `roca_grande_gris` | 2×3 | 2 |  | roca, gris | Roca grande (suelo gris y musgo verde) |
| `boca_norte_gris` | 3×4 | 2 | 1,2 | salida, gris | Boca oscura en la pared norte (suelo gris y musgo verde); colocar en (x, y0-4) |
| `salida_luz_sur_gris` | 3×2 | 2 | 1,1 | salida, gris | Claridad de salida en la pared sur (suelo gris y musgo verde); colocar en (x, y1) |
| `roca_grande_morada` | 2×3 | 2 |  | roca, morada | Roca grande (suelo morado y paredes oscuras) |
| `boca_norte_morada` | 3×4 | 2 | 1,2 | salida, morada | Boca oscura en la pared norte (suelo morado y paredes oscuras); colocar en (x, y0-4) |
| `salida_luz_sur_morada` | 3×2 | 2 | 1,1 | salida, morada | Claridad de salida en la pared sur (suelo morado y paredes oscuras); colocar en (x, y1) |
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

| Brush | Tipo | Capa | Descripción |
|---|---|---|---|
| `vacio` | tile | 0 | Negro de roca maciza (fuera de las salas) |
| `suelo` | pattern | 0 | Suelo de cueva: tierra y musgo verde |
| `sala` | cave | — | Sala rectangular (tierra y musgo verde): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `suelo_hielo` | pattern | 0 | Suelo de cueva: suelo gris azulado y paredes azules |
| `sala_hielo` | cave | — | Sala rectangular (suelo gris azulado y paredes azules): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `suelo_volcan` | pattern | 0 | Suelo de cueva: suelo rojizo y paredes moradas |
| `sala_volcan` | cave | — | Sala rectangular (suelo rojizo y paredes moradas): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `suelo_gris` | pattern | 0 | Suelo de cueva: suelo gris y musgo verde |
| `sala_gris` | cave | — | Sala rectangular (suelo gris y musgo verde): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `suelo_morada` | pattern | 0 | Suelo de cueva: suelo morado y paredes oscuras |
| `sala_morada` | cave | — | Sala rectangular (suelo morado y paredes oscuras): suelo + paredes (3 a los lados, 4 filas arriba, 1 abajo) |
| `agua` | autotile | 0 | Agua de cueva (autotile 6; en tilesets 12–15 es hielo, lava, agua morada/azul) |
| `estanque` | nine | 1 | Estanque rectangular con marco de roca (agua fija) |
| `saliente` | line | 1 | Saliente de cueva (ledge): se salta hacia el sur |

### Tileset 1 · Exterior1 (74 stamps, 18 brushes)

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
| `hierba_alta` | tile | 1 | Hierba alta clásica (encuentros, tag Grass) |
| `hierba_alta_oscura` | tile | 1 | Hierba alta de hojas oscuras (encuentros) |
| `flores_amarillas` | autotile | 1 | Flores amarillas animadas |
| `acantilado` | cliff | 1 | Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas |

### Tileset 3 · Exterior2 (45 stamps, 17 brushes)

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

### Tileset 5 · Exterior3 (44 stamps, 17 brushes)

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
