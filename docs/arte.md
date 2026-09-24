# Arte de personajes — estado y decisiones (PROVISIONAL, D30)

Todo el arte de personajes de este documento es **provisional** y está pendiente de la decisión **D30**
(arte final de protagonistas y resto del elenco). Cada entrada del registro
`game/src/content/characters.js` lleva `provisional: true` y `decision: 'D30'`. Nada de lo aquí propuesto
fija canon: donde la biblia deja un campo abierto, la solución es una propuesta para aprobar o descartar.

Visor: `http://localhost:8080/?scene=sprites` (←/→ personaje · Z modo: caminar, correr y, en los protagonistas,
montura 10%, nado 50%, buceo, trepar, pesca y Vuelo · X zoom · C combate · E alterna con las clases genéricas de
Añil). Parámetros: `&char=<id>`, `&run`, `&mode=<walk|run|ride10|ride50|dive|climb|fish|vuelo>`, `&battle`, `&anil`
(empieza en las clases de Añil; con `&char=<alias>`).

## 1. Método técnico

| Aspecto | Decisión |
|---|---|
| Resolución de arte | Nativo **32×32 por frame**, exportado con **ampliación exacta ×2** (frame 64×64, píxeles de 2×2), como fija la biblia §13.1 ("32×32 nativos, entrega 64×64"). |
| Charset | Hoja **256×256**, 4×4 al estilo Essentials: filas abajo, izquierda, derecha, arriba; columnas = patrón 0..3 (0 y 2 de pie, 1 y 3 pasos opuestos). La derecha es el espejo de la izquierda. |
| Paso | En los frames de paso el cuerpo sube 1 px nativo (rebote BW). |
| Correr | Hoja `_run` con 4 frames distintos: 0/2 paso cruzado (agachado 1 px), 1/3 zancada, brazos flexionados y cabeza adelantada 1 px en perfil. |
| Proporciones | Estudiadas (no copiadas) de charsets BW de Añil (`cheren.png`, `chaval1.png`, `hilda.png`): cabeza ≈16×15 nativos con la coronilla en la fila 3, cara de ~7 filas con ojos 2×2 (pupila + brillo exterior), cuerpo ≈13 filas; figura total ≈28 filas. |
| Adultos | Mismo esqueleto con el torso estirado 1 px (`tall: 1`). El anciano baja la cabeza 1 px. |
| Niños | Cuerpo propio (`kids.mjs`, 9 filas) y cabeza 4 filas más abajo (`headLift: 4`), como `nino`/`nina` de Añil: ≈5 filas más bajos que un adulto. |
| Mochila (D06) | `backpack.mjs` transforma las poses de cuerpo de los protagonistas: correas de frente (columnas 6 y 11), volumen detrás de la espalda y correa al hombro de perfil, bolsa con solapa de espaldas; sigue el rebote de cada frame. Colores A/a/D/z de la paleta. |
| Luz | Desde arriba-izquierda; 2–3 tonos por material; contorno oscuro de silueta y líneas interiores de color. |
| Combate espalda | Tira de **5 frames de 160×160** (nativo 80×80 ×2): 0 estático, 1 preparar, 2 brazo arriba con Poké Ball, 3 lanzar, 4 seguimiento (formato de Essentials: ancho > 2×alto ⇒ 5 frames). Se recorta por abajo, como en BW. |
| Combate frente | 160×160 (nativo 80×80 ×2), proporción ≈4 cabezas. |

No se ha copiado ni recoloreado ningún sprite de Añil ni oficial. Los charsets de Añil se usaron solo para
medir proporciones y el ritmo del ciclo de paso.

## 2. Herramientas (regenerar todo)

```
node tools/pixel_build.mjs [id ...] [--preview] [--lineup] [--out=tools/cache/pixel/draft]
```
- Fuentes en `tools/pixel_chars/`: `body_jacket.mjs` (plantilla de cuerpo y paso), `body_run.mjs` (carrera),
  `kids.mjs` (cuerpo infantil + cabezas de niño/niña), `backpack.mjs` (mochila de los protagonistas),
  `overlays.mjs` (abrigo largo, delantal y falda), `heads_protas.mjs` / `heads_cast.mjs` / `heads_b01.mjs`
  (cabezas por matrices de caracteres), `palettes.mjs` (todas las paletas), `zygarde.mjs`, `battle_back.mjs`,
  `battle_front.mjs`, `battle_front_b01.mjs` (sprites grandes con formas + sombreado de celda de `raster.mjs`),
  `roster.mjs` (qué hojas se generan).
- Campaña (§7–8): `palettes_campaign.mjs`, `heads_campaign.mjs` (Guardianes, Sol, oficios; `withGlasses`),
  `heads_genesis.mjs`, `front_kit.mjs` + `battle_front_campaign.mjs` (frontales), `overlays.mjs` (también peto,
  capa corta, maletín, `recolorOverlay`, `recolorPoses`), `follower_src.mjs` (lee los seguidores de Añil),
  `rider.mjs` (jinete sentado), `mounts.mjs` (10% y 50%), `actions.mjs` (buceo, trepar, pesca) y `flight.mjs` (Vuelo).
- Un id puede ser un personaje (todas sus hojas) o una hoja concreta: `node tools/pixel_build.mjs protagonista_f_ride50`.
- `--out=<carpeta>` escribe los PNG en otra carpeta para iterar sin tocar el juego en marcha.
- Salida: `game/assets/characters/<id>.png`. Con `--preview`, vistas ×6 con rejilla en
  `tools/cache/pixel/<id>.png`; con `--lineup`, todo el elenco sobre césped real de Añil en
  `tools/cache/pixel/_lineup.png`, `_lineup_2.png`… (12 hojas por página, frames alineados abajo-centro).
- Mapa regional: `node tools/pixel_map.mjs [--preview]` (§6).
- `tools/pixel.mjs` es la biblioteca base y también CLI de inspección:
  `zoom`, `crop`, `palette`, `bbox` (ver su cabecera).
- El constructor avisa de píxeles sueltos; los tests (`npm test`) comprueban tamaños, bloques 2×2 exactos,
  ausencia de semitransparencias y de píxeles aislados.

Cambiar un color = editar `palettes.mjs` y volver a ejecutar el constructor: las paletas son la forma rápida
de iterar con el autor.

## 3. Personajes y decisiones tomadas

### Protagonista masculino — `protagonista_m` (+ `_run`, `_back`)
Respeta la biblia §13.1: **castaño cobrizo** (#E8A060 / #BC6630 / #8C4424 / #5C2A1A), **sin gorra**, silueta de
pelo con dirección (dos puntas altas hacia atrás/derecha y flequillo en dos mechones que dejan ver la
frente; nada de "casco"), **chaqueta azul petróleo cerrada** (#3E8E96 / #256870 / #194A52), **camiseta clara
reducida** visible solo en el cuello, **pantalón y calzado oscuros**, **tirador de cremallera verde #B9FF66**
(1 píxel nativo, visible de frente y de perfil).
**Mochila (D06, 24-09-2026)**: color arena (#E2C890 / #BC9A5E / #8A6A3A / #5A4222), elegido para contrastar
con el azul petróleo sin competir con el cobrizo del pelo ni con el acento verde. Correas visibles de frente,
volumen detrás de la espalda de perfil, bolsa con solapa de espaldas; en el sprite de combate de espaldas,
bolsa con asa, solapa, hebilla y bolsillo, con las correas pasando por encima de los hombros.
**2.ª pasada de cabeza**: la coronilla baja 2 filas (fila 3) y la cabeza se estrecha a 16 px; la cara crece a
~7 filas (ojos en filas 13–14). El contorno del pelo es irregular (puntas, patillas, mechones de nuca y un
mechón suelto a cada lado de espaldas) y lleva mechones con dirección y brillos en banda: ya no se lee como un
casco, y la proporción queda como la de `cheren.png` de Añil (figura ≈28 filas).
Propuestas no canónicas: color de ojos oscuro neutro, tono de piel claro, forma exacta de las puntas.

### Protagonista femenina — `protagonista_f` (+ `_run`, `_back`) · PROPUESTA
Canon usado: **azul marino profundo casi nocturno con lectura azul** (#5A6CB4 luces, #34427E base, #222C58,
#141A38) y el mismo lenguaje BW y acento verde. Todo lo demás es **propuesta provisional D30**:
melena por los hombros con raya y flequillo ladeado (sin gorra, sin coletas), chaqueta corta **blanco hueso**
cerrada con cuello interior azul noche (contrasta con el pelo oscuro y con la chaqueta del masculino),
**verde en el tirador** (igual que él), pantalón corto oscuro sobre mallas oscuras, calzado oscuro.
**Mochila (D06)** color teja (#EA8A6C / #C45C42 / #8E3C2C / #5A221A): legible sobre la chaqueta clara y bajo la
melena; de espaldas asoma por debajo del pelo. Coronilla 1 fila más baja en la 2.ª pasada para igualar la
altura de cabeza del masculino. Altura idéntica al masculino (biblia: "compatible con el estándar humano").

### Gael — `gael` (+ `gael_front`)
Antecedente del autor **a ratificar** (§13.3), aplicado tal cual: pelo #E0C870 / #A08840 / #F8F8C8 / #604820,
chaqueta bordó #782030 / #481018 / #A03848, ropa inferior #404040 / #606060, botas #203050 / #406090,
ojos claros (#58A0D8 en el sprite frontal). Diseño nuevo, no basado en Silver: puntas rubias hacia arriba y
atrás, frente despejada, chaqueta abierta en V con camiseta gris oscuro y cremallera metálica (sin verde, para
no compartir el acento del Core). Expresión **seria sin cejas fruncidas**; pose de combate con la mano en la
cadera.

### Profesor — `profesor` (+ `profesor_front`) · D03 abierto
Propuesta neutral: adulto, pelo castaño oscuro corto con raya, **abrigo largo claro de campo** (no bata de
laboratorio ni uniforme), jersey pizarra, pantalón y zapatos marrones. **Sin emblemas, sin gafas, sin nada que
insinúe Genesis.** Edad, pelo, ojos, bata/camiseta y accesorios siguen abiertos (D03).

### Policía — `policia` (§13.8, genérico)
Uniforme azul marino, camisa celeste, gorra de plato con placa dorada. Sin nombre, rango ni rasgo propio.

### Vecinos — `vecino`, `vecina`, `anciano`
NPC genéricos del pueblo: vecino (chaqueta ocre, vaqueros, piel morena), vecina (moño, rebeca coral, falda
larga azul noche), anciano (coronilla calva, pelo cano, cejas y bigote grises, rebeca marrón).

### Madre — `madre` (D01)
Adulta cálida con ropa de casa: castaño medio con raya a un lado, flequillo barrido y **coleta baja** (se ve
de perfil y de espaldas), ojos suaves y sonrisa pequeña; **jersey de punto color miel**, **delantal crema** con
peto y lazo a la espalda, pantalón pardo y zapatillas de casa rojizas. Nada canónico más allá de D01 (vive con
el protagonista, cura al equipo en casa).

### Ayudante del laboratorio — `ayudante` · PROPUESTA
NPC genérico del laboratorio de Alerce, sin nombre. Propuesta: **mujer joven**, melena corta negra azulada a la
altura de la mandíbula con flequillo recto y **horquilla amarilla**, **bata clara azulada** (abrigo largo, la
misma pieza que el profesor pero en blanco frío) sobre jersey coral. Si los diálogos la tratan en masculino,
se cambia el peinado/paleta en `heads_b01.mjs`/`palettes.mjs`.

### Casilda Roquer, Guardiana del Umbral — `guardiana` (+ `guardiana_front`) (D07, X06) · alias `casilda`
**Casilda Roquer** (64, escepticismo; CAMPANA B02). Se usa con `sprite: 'casilda'` en el mapa y
`sprite: 'casilda_front'` en combate (alias de `guardiana` / `guardiana_front`, §7).
Veterana escéptica que custodia por tradición familiar. Pelo **cano** con raya al medio y
**moño alto**, cejas rectas grises, arrugas bajo los ojos y boca firme (seria, no hostil). **Chaqueta de campo
oliva**, pañuelo teja al cuello, pantalón de trabajo pardo y **botas altas**: ropa sobria de exploración de
ruinas, sin emblemas. Frontal de combate con **brazos cruzados** (escepticismo), correa de zurrón cruzada y
bolsillos.

### Niños del pueblo — `nino`, `nina`
Cuerpo infantil propio (ver §1). Niño: pelo castaño revuelto con remolino, camiseta celeste, pantalón corto
caqui, zapatillas rojas. Niña: castaño rojizo con flequillo recto y dos coletas bajas con gomas rosas, vestido
amarillo y sandalias rosas. Ojos grandes (3 filas). Los charsets de Añil del mismo nombre siguen disponibles
como `anil:nino` / `anil:nina`.

### Clases genéricas de entrenador (arte de Añil) — `content/anilClasses.js`
Para las rutas no se inventa arte: cada alias une un charset de `Graphics/Characters` con el sprite frontal de
`Graphics/Trainers` que viste igual (parejas comprobadas a ojo). Uso: `overworld: 'anil:bichero'` (mapa) y
`sprite: 'anil:bichero'` (combate); `getCharacter('anil:<alias>')` y `getBattleSprite('anil:<alias>')`.

| Alias | Clase | Charset | Combate |
|---|---|---|---|
| `joven` / `chica` | Joven / Chica | chaval3 / chica1 | CHICO / CHICA |
| `aspirante` / `aspirante_f` | Aspirante | guay / guaya | GUAY / GUAYA |
| `bichero` / `bichera` | Bichero / Bichera | cazabichos / cazabichas | CAZABICHOS / CAZABICHAS |
| `excursionista` / `excursionista_f` | Excursionista | campista / campistaa | CAMPISTO / CAMPISTA |
| `montanero` | Montañero | montanero | MONTANERO |
| `nadador` / `nadadora` | Nadador / Nadadora | nadador / nadadora | NADADOR / NADADORA |
| `pescador` / `pescadora` | Pescador / Pescadora | pescador / pescadoraow | PESCADOR / PESCADORA |
| `cientifico` / `cientifica` | Científico / Científica | cientifico / cientifica | CIENTIFICO / CIENTIFICA |
| `cerebrito` / `estudiante` | Cerebrito / Estudiante | cerebrito / estudianta | CEREBRITO / ESTUDIANTA |
| `dama` / `joven_rica` | Dama / Joven rica | damisela / jovenrica | DAMISELA / JOVENRICA |
| `ornitologo` | Ornitólogo | ornitologo | ORNITOLOGO |
| `karateka` / `karateka_f` | Karateka | luchador / luchadora | KARATEKA / KARATEKAA |
| `veterano` / `veterana` | Veterano / Veterana | veterano / veterana | VETERANO / VETERANA |
| `fotografa`, `marinero`, `tecnico`, `medium`, `exorcista`, `malabarista`, `motorista`, `pokemaniaco` | (igual) | mismo nombre | mismo nombre en mayúsculas |
| `mecanico` / `mecanica` | Mecánico / Mecánica | operario / operaria | MECANICO / MECANICA |

### Zygarde Core — `zygarde_core` (acompañante de campo)
Forma pequeña de núcleo coherente con el diseño oficial: **cuerpo gelatinoso verde** con dos antenas,
**placa hexagonal oscura** al frente y **núcleo luminoso** (azul celeste; el color del núcleo es una elección
provisional, se cambia en `CORE_PALETTE`). Espalda con dibujo hexagonal tenue. Ciclo de 4 frames de rebote
blando (normal, aplastado, normal, estirado y elevado 1 px) con pulso del núcleo. **No es la forma 10%.**

### Célula de Zygarde — `zygarde_celula`
Gota verde pequeña con núcleo oscuro y brillo, que flota (0/1/2/1 px) con destellos rotando. Las 4 filas
son idénticas: sirve para eventos con "animación en parada" en cualquier dirección.

## 4. Preguntas para el autor (D30 y relacionadas)

1. **Masculino**: ¿se aprueba esta silueta de pelo y la chaqueta azul petróleo cerrada como base, o se
   retoma la candidata C de V07?
2. **Femenina**: ¿melena, chaqueta clara y pantalón corto con mallas? ¿Dónde va el verde (tirador, horquilla…)?
3. **Gael**: ¿se ratifica el rubio y la paleta histórica bordó/gris/azul? ¿Ojos #58A0D8?
4. **Profesor (D03)**: edad, pelo, gafas sí/no, abrigo de campo o bata.
5. **Core**: color del núcleo (azul provisional). (D06 resuelto: los protagonistas llevan mochila y el Core
   los sigue en el mapa.)
6. ¿Hacen falta retratos de diálogo? (Montura, nado, buceo, trepar, pesca y Vuelo ya están, §8.)
7. **Ayudante** (Lía, X07): ¿mujer (propuesta actual) u hombre? **Casilda**: ¿encaja el moño alto?
8. **Elenco de la campaña (§7)**: aprobar o corregir los diseños propuestos de Leandro, Abril, Fermín, Olvido, Sol,
   Vértice, Casia, Garrido, técnicos/investigadores de Genesis, enfermera, dependiente, molinero, buzo y archivista.
9. **Personajes secundarios con alias de Añil** (Ramón, Remedios, Rosalía, Rosendo, Evaristo, Quino, Bea, Darío):
   ¿arte propio o se quedan con charsets de Añil?

## 5. Limitaciones conocidas

- Los adultos comparten esqueleto con los jóvenes (solo +1 px de torso); los niños tienen cuerpo propio,
  pero no hay cuerpos excepcionales (corpulentos, muy altos).
- Los niños no balancean los brazos al andar de frente (solo de perfil).
- Los sprites de combate grandes se generan con formas y sombreado automático: correctos y coherentes, pero
  menos pulidos que un trabajo a mano; son los primeros candidatos a sustituir cuando haya arte aprobado.
- Sin retratos ni sombra propia (la sombra la pone el motor). Las hojas de montura, nado, buceo, trepar, pesca
  y Vuelo existen desde la 3.ª pasada (§8); no hay bici (Axis no la usa: la montura es Zygarde 10%).
- Las monturas usan como base los seguidores de Añil (ZYGARDE_1 y ZYGARDE) muestreados a resolución nativa: si se
  sustituye el arte de Zygarde, basta con regenerar (`pixel_build.mjs protagonista_m_ride10 …`).
- La vista de perfil se obtiene por espejo (como en BW): el flequillo y el tirador cambian de lado al mirar
  a la derecha.

## 6. Mapa regional de Axis (ilustración PROVISIONAL, D30 · X02) — para el agente *services*

Generador: `node tools/pixel_map.mjs [--preview]` (geografía en `tools/pixel_map_data.mjs`, que sigue el esquema
ASCII y la lógica de CAMPANA §1.1–1.2). Se pinta a 240×160 nativos y se amplía ×2.

| Archivo | Contenido |
|---|---|
| `game/assets/ui/region_map.png` | 480×320: **solo relieve**, costa, ríos y lagos (lo que usa `ui/screens/regionMap.js`, que dibuja encima rutas, lugares y cursor). |
| `game/assets/ui/region_map_marcado.png` | 480×320: relieve + caminos (blancos, con sombra) + marcadores (pueblos/ciudades azul, Pilares rombo dorado, lugares marrón, postgame malva): referencia visual o fondo si se quiere sin marcadores propios. |
| `game/assets/ui/region_map.json` | `coords: { id: [x, y] }` (píxeles del PNG) y `places: { id: { name, kind, xy, cell, mapIds, pillar?, parent?, flyOnly? } }`, más `paths` y `seaPaths` (pares de ids) e `image`/`marked` (rutas de los PNG). Coincide con `REGION_MAP` de services (su test lo comprueba). |

- **Rejilla**: cada lugar está en el **centro de una casilla de 16 px** (`xy = [16·cx + 8, 16·cy + 8]`, `cell = [cx, cy]`),
  igual que `ui/logic/regionMapData.js` (30×20 casillas). No hay dos lugares en la misma casilla salvo los que llevan
  `parent` (el Archivo Hondo, P5, dentro de Aldea Mnemos).
- `kind`: `town`, `city`, `route`, `pillar` (con `pillar: n`; la Sima lleva `pillars: [9, 10]`), `place`, `sea`, `post`.
- `mapIds`: ids de mapa de CAMPANA (existentes o previstos) que se sitúan en ese punto → `pointForMap`.
- Lugares principales (x, y): Villa Alba (168, 136) · Laberinto (168, 120) · Ruta 1 (168, 152) · Villa Zaguán (168, 168) ·
  Ruinas del Dintel P1 (152, 168) · Ciudad Caudal (184, 200) · Garganta del Albo P2 (120, 184) · Villa Brontia (312, 200) ·
  Meseta del Impulso P3 (424, 168) · Ciudad Estrato (360, 264) · Cerro Plomo P4 (440, 248) · Ciudad Lúmina (72, 232) ·
  Aldea Mnemos / Archivo Hondo P5 (40, 168) · Monte del Portal (88, 72) · Aljibe P6 (72, 40) · Ciudad Nexo (88, 280) ·
  Caleta Sonda (24, 296) · Arrecife del Eco P7 (40, 312) · Villa Boreal (408, 88) · Lagos del Alma P8 (408, 40) ·
  Sima del Eje P9/P10 (216, 232) · Cumbre Azur (248, 40) · Mesa de los Vientos (440, 136, solo Vuelo). El resto, en el JSON.
- Relieve: cordillera nevada al norte con el **Monte del Portal** (NO, con la gran cascada en su flanco este) y la
  **Cumbre Azur** (la más alta, con anillo de nubes y el destello de Columna Lanza); fiordo del **Mar Boreal** que baja
  hasta el Paso del Norte; tierras heladas del NE (Lagos del Alma, Villa Boreal, Gruta Escarcha); **Río Albo** desde la
  cascada por la Garganta y Caudal hasta la **Sima del Eje** (abismo con resplandor violeta), reaparece y forma el Delta
  junto a Nexo; bosque lila del Neblino, bambú y cerezos de Mnemos, Marisma Turbia, Reserva tropical, Meseta con el
  Parque Eólico, cañón de Estrato, Dunas de Ceniza grises; mar del sur con Islote Lumbre, Talasa, Volcán Tizón y Bastión.
- Tests: `tests/art_region_map.test.mjs` (tamaño, ×2 exacto, JSON al día con el generador, casillas únicas, pueblos
  en tierra y mares en agua, los diez Pilares presentes).

## 7. Elenco de la campaña (PROVISIONAL, D30) — CAMPANA §3, §5, §6

Mismo método que §1 (32×32 nativos ×2, frontales 80×80 ×2). Descripciones de CAMPANA/X06/X08/D14; lo que el
canon no fija (colores, peinados, poses) es propuesta. **Genesis nunca usa el verde de Zygarde** (lo comprueba
`tests/art_campaign.test.mjs`): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31 y magenta #B03A8C; emblema de
dos tubos de ensayo cruzados sobre un círculo (en gorras, petos, batas y la tableta de Casia).

| Id (charset) | Frontal | Quién | Diseño propuesto |
|---|---|---|---|
| `leandro` | `leandro_front` | Leandro Alcántara (38, orgullo), Maestre de Esclusas | Levita azul río con botones de latón, camisa blanca, botas de agua, tupé y barba de días. Frontal: mano en la cadera y la gran llave de esclusa al hombro |
| `abril` | `abril_front` | Abril Céspedes (19, tedio) | Rubio ceniza revuelto por el viento, cortavientos mostaza con capucha gris, auriculares cian, pantalón corto y mallas. Frontal: manos en los bolsillos, párpados a media asta |
| `fermin` | `fermin_front` | Fermín Galena (51, carga familiar) | Casco de minero ocre con lámpara, barba canosa, chaqueta gris plomo con banda reflectante. Frontal: pico al hombro, cejas caídas |
| `olvido` | `olvido_front` | Olvido Arrieta (78, fascinación) | Moño bajo cano con un lápiz, gafas redondas, rebeca sepia, falda granate. Frontal: libreta abierta, sonrisa |
| `sol` | `sol_front` | Sol Galena (TABLILLAS T05, combate) | Casco blanco con lámpara, trenza, chaqueta teja con banda amarilla. Frontal: manos en la cadera |
| `vertice` | `vertice_front` | Dr. Aurelio Vértice (63, D14) | Traje carbón con alfiler magenta, pelo plateado hacia atrás, barba blanca corta, gafas redondas violeta (gala, B09) |
| `vertice_lider` | `vertice_front` | Vértice como Líder Supremo | Bata blanca y capa corta carbón (Talasa, P9). Frontal: manos a la espalda |
| `casia` | `casia_front` | Dra. Casia Varela (41) | Melena lisa con raya, bata larga con solapas carbón y ribete magenta. Frontal: tableta contra el pecho |
| `garrido` | `garrido_front` | Ulises Garrido (47), excapataz | Pelo gris al rape, barba de días, bata de director sobre ropa carbón. Frontal: casco de obra bajo el brazo |
| `genesis_tecnico` / `genesis_tecnica` | `…_front` | Técnicos de campo | Gorra y mono petróleo con visor magenta, peto blanco con emblema, guantes y botas carbón, maletín (coleta en la técnica) |
| `genesis_investigador` / `genesis_investigadora` | — | Investigadores | Bata corta blanca con emblema sobre ropa petróleo, gafas-visor magenta |
| `enfermera` | — | Centros Pokémon de Axis | Cofia blanca con banda rosa, moño castaño, uniforme rosa pálido y delantal blanco (propio, no el de Añil) |
| `dependiente` | — | Tiendas | Camisa celeste, delantal azul marino, pantalón caqui |
| `molinero` | — | Anselmo (70) y molineros | Boina, pelo y bigote blancos, chaleco marrón, delantal enharinado |
| `buzo` | — | Fausto y buzos de Caleta Sonda | Neopreno con franja cian y gafas de buceo en la frente |
| `archivista` | — | Archivo Hondo, museo | Gafas redondas, chaleco sepia |

**Alias** (`content/characters_campaign.js` → `CHARACTER_ALIASES`; `getCharacter`/`getBattleSprite` los resuelven y
devuelven la entrada del destino con `alias` y `aliasOf`): `casilda` → `guardiana` (+ `casilda_front`), `alerce` →
`profesor` (+ `alerce_front`), `olmedo` → `policia`, `lia` → `ayudante`, `anselmo` → `molinero`, `fausto` → `buzo`,
`nilo` → `genesis_tecnico`, `iker` → `nino`, `sixto` → `anciano`; con charsets de Añil (provisionales, sin combate):
`ramon` → `anil:capitan` (farero), `remedios` → `anil:anciana1` (curandera), `rosalia` → `anil:empresariaa` (curadora),
`rosendo` → `anil:anciano2` (tallista), `evaristo` → `anil:anciano1` (Correos), `quino` → `anil:operario`,
`bea` → `anil:minera`, `dario` → `anil:empresario`.

**Oficios genéricos con arte de Añil** (`content/anilClasses.js`, con sprite de combate): `anil:pescador`/`pescadora`,
`anil:minero`/`minera` (torneo de Estrato, T05), `anil:buceador`/`buceadora` (Escalera de Estanques, B04),
`anil:cientifico`, `anil:marinero`, `anil:excursionista`, `anil:montanero`… Otros NPC sin combate pueden usar
charsets de Añil directamente: `anil:cocinero`, `anil:Repartidor`, `anil:secretaria`, `anil:capitan`, `anil:anciana1`.

**Uso**: mapa `sprite: 'leandro'`; entrenador `{ sprite: 'leandro_front', overworld: 'leandro' }` (el sprite de combate
es el id del frontal o de su alias). Alerce y Gael no tienen variantes: CAMPANA no pide cambios de edad ni de abrigo.
Si el combate doble con aliado (Gael en B06, Alerce en Talasa) llega a mostrar al compañero, harán falta
`gael_back`/`profesor_back` (pendiente).

## 8. Monturas y acciones de Zygarde (PROVISIONAL, D30) — para el agente *zygarde*

Hojas por protagonista (`protagonista_m_*` y `protagonista_f_*`), registradas como variantes:
`getCharacter('protagonista_f').variants` → `{ run, ride10, ride50, dive, climb, fish, vuelo }` y
`playerVariant('F', 'ride50')` → `'protagonista_f_ride50'` (content/characters.js).

| Variante | Id | Hoja | Uso |
|---|---|---|---|
| `ride10` | `…_ride10` | charset 4×4, frames **96×96**, abajo-centro | Montado en Zygarde 10% (Correr). Es la **pareja completa** (10% de Añil + jinete): mientras se monta, el jugador usa esta hoja como `characterName` y se oculta el seguidor. No hace falta elevar al jugador (`yOffset`): el jinete ya va dibujado encima. Patrones = ciclo de galope del 10%; el jinete sigue su bote |
| `ride50` | `…_ride50` | charset 4×4, 96×96 | Nadando sobre el 50% (Nadar): cuerpo bajo la línea de agua con espuma animada en los 4 patrones. Úsese como `charsets.surf` (el motor ya aplica el bote de surf) |
| `dive` | `…_dive` | charset 4×4, 96×96 | Buceo: protagonista dentro de la burbuja verde (sin relleno: se ve el fondo) con destellos hexagonales que giran; patrones = patadas. Para `?…&mode` de buceo o el mapa de fondo |
| `climb` | `…_climb` | charset 4×4, 64×64 | Trepar: de espaldas, 4 frames; las 4 filas son iguales (sirve en cualquier dirección) |
| `fish` | `…_fish_offset` | charset 4×4, 96×96 | Pesca (para *services*): 0 caña atrás, 1 en alto, 2 lanzada, 3 lanzada con sedal. El id lleva **`_offset`** → `render/charsets.js` la dibuja 16 px más abajo, como las de Essentials (pies en la fila 38 de 48) |
| `vuelo` | `…_vuelo` | `effect` 8×1, 96×96 | Vuelo: 0 aura, 1 red hexagonal, 2–6 disgregación de los pies a la cabeza en hexágonos que suben, 7 chispas. Al revés (7 → 0) = llegada. Mismo ancla que un charset (pies en la fila 46 de 48) |
| — | `zygarde_hex` | `effect` 4×2, 32×32 | Partículas sueltas: fila 0 celda hexagonal de la red (brillante, media, tenue, chispa); fila 1 partícula que se apaga |

- Frames: `frameRect(entry, dir, patrón)` usa `frameW/frameH` de la entrada (96 para montura/nado/buceo/pesca); un
  `effect` se recorre por índice (`x = (i % cols) · frameW`). `render/charsets.js` deduce el frame de la imagen
  (ancho/4), así que las hojas 4×4 funcionan tal cual como `characterName`.
- Visor: `?scene=sprites&char=protagonista_f&mode=ride50` (Z cambia de modo: caminar, correr, 10%, 50%, buceo,
  trepar, pesca, Vuelo; el Vuelo se ve de ida y de vuelta).
- Regenerar: `node tools/pixel_build.mjs protagonista_m_ride10 …` (fuentes en `tools/pixel_chars/mounts.mjs`,
  `actions.mjs`, `flight.mjs`). Tests: `tests/art_campaign.test.mjs`.
