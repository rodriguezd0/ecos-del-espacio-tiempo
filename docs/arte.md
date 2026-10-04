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
| Proporciones | Referencias BW de Añil usadas para estudiar escala y paso. **Kit de protagonistas, revisado el 03-10-2026 (§9)**: figura de 29 filas (coronilla 2, suela 30), cabeza de 18 filas ocupadas sobre rejilla de 20; pecho estrecho, hombros y manos abiertos. Rejilla de cabeza de 18 columnas para el masculino y 22 para la melena de la femenina; ojos e iris alineados en las dos opciones. |
| Adultos | Mismo esqueleto con el torso estirado 1 px (`tall: 1`). El anciano baja la cabeza 1 px. |
| Niños | Cuerpo propio (`kids.mjs`, 9 filas) y cabeza 4 filas más abajo (`headLift: 4`), como `nino`/`nina` de Añil: ≈5 filas más bajos que un adulto. |
| Mochila (D06) | `prota_bag.mjs` (kit de protagonistas, §9): correas de frente, volumen detrás de la espalda y correa al hombro de perfil, bolsa con solapa de espaldas; sigue el rebote y el torso de cada pose. Colores A/a/D/z de la paleta. (`backpack.mjs` es la versión para las plantillas antiguas; ya no la usa ningún personaje, pero se conserva con sus tests.) |
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
  `kids.mjs` (cuerpo infantil + cabezas de niño/niña), `backpack.mjs` (mochila del kit antiguo, sin uso),
  `overlays.mjs` (abrigo largo, delantal y falda), `heads_cast.mjs` / `heads_b01.mjs`
  (cabezas por matrices de caracteres), `palettes.mjs` (todas las paletas), `zygarde.mjs`, `battle_back.mjs`,
  `battle_front.mjs`, `battle_front_b01.mjs` (sprites grandes con formas + sombreado de celda de `raster.mjs`),
  `roster.mjs` (qué hojas se generan).
- Campaña (§7–8): `palettes_campaign.mjs`, `heads_campaign.mjs` (Guardianes, Sol, oficios; `withGlasses`),
  `heads_genesis.mjs`, `front_kit.mjs` + `battle_front_campaign.mjs` (frontales), `overlays.mjs` (también peto,
  capa corta, maletín, `recolorOverlay`, `recolorPoses`), `follower_src.mjs` (lee los seguidores de Añil),
  `rider.mjs` (jinete sentado), `mounts.mjs` (10% y 50%), `actions.mjs` (buceo, trepar, pesca) y `flight.mjs` (Vuelo).
- Protagonistas, kit nuevo (§9): `prota_kit.mjs` (rejilla, capas, ensamblado), `prota_heads.mjs` (cabeza del
  masculino), `prota_heads_f.mjs` (cabeza de la femenina), `prota_body.mjs` (torso, brazos, piernas y ciclo de
  caminar), `prota_body_f.mjs` (chaqueta y pantalón corto de la femenina), `prota_run.mjs` (correr), `prota_bag.mjs`
  (mochila) y `prota_field.mjs` (jinete, pierna colgante, trepar). `rider.mjs` reúne los datos de cada uno (`PROTAS`).
- Revisión visual de un protagonista: `node tools/cache/art/prota_review.mjs protagonista_m|protagonista_f` (con
  `REF_DIR=<carpeta de las referencias>` añade la fila de referencias: la del chico para él, las de las chicas para
  ella) → `tools/cache/art/<id>_{compare,big,game}.png` (la fila de NPC incluye al otro protagonista).
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
**Kit recuperado y revisado (03-10-2026, referencias de estilo BW del autor)**: integra las pasadas de la rama
de pausa con el kit propio de protagonistas (§9).
Cabeza grande (18 filas ocupadas sobre la rejilla de 18 × 20) y cuerpo corto, figura de 29 filas como los adultos. Pelo: coronilla
con banda de brillo ancha y **dos mechones barridos hacia atrás y a su izquierda** separados por una raya oscura,
más una punta que sale hacia ese lado (silueta con dirección, distinta de las puntas verticales de Gael); flequillo
en tres mechones con punta que deja ver la frente, patillas y orejas visibles; de perfil, volumen detrás con
puntas hacia atrás y nariz de 1 px; de espaldas, mechones hacia su izquierda y nuca en tres puntas. Ojos 2×3
(párpado oscuro, brillo blanco exterior, pupila con **iris castaño cálido #7A4A2C**, propuesta). Brazos con manos
de 2×2 y balanceo al andar; piernas de 4 filas con zapatos de suela clara. La espalda de combate usa el mismo pelo
barrido con brillos en banda.
Propuestas no canónicas: color de ojos (castaño), tono de piel claro, forma exacta de los mechones.

### Protagonista femenina — `protagonista_f` (+ `_run`, `_back`) · PROPUESTA D30 (X32 recuperada del WIP)
Canon usado: **azul marino profundo casi nocturno con lectura azul** (#5A6CB4 luces, #34427E base, #222C58,
#141A38) y el mismo lenguaje BW y acento verde. El resto procede de la propuesta de desarrollo **X32** de la rama de pausa y sigue **provisional D30**.
**Kit recuperado y revisado (03-10-2026, referencias de estilo BW del autor)**, con el kit de protagonistas (§9):
- **Proporciones**: las del masculino (figura de 29 filas, cabeza de 18 filas ocupadas, cara, ojos y barbilla en las mismas
  filas y columnas); la melena sobresale 2 px por lado (cabeza de 22 px), así que su silueta es más ancha abajo.
- **Pelo**: media melena hasta los hombros con **anillo de brillo en la coronilla** (como las chicas BW de las
  referencias), raya a su izquierda y **flequillo barrido hacia su derecha** en tres mechones con punta; las puntas
  se **abren hacia fuera** a la altura de los hombros (de frente a su derecha, de perfil en la nuca, de espaldas a
  su derecha). Por su izquierda el pelo va recogido en una **trenza fina** que cae por delante del hombro con una
  **goma verde #B9FF66**: es su acento (visible de frente, de perfil y de espaldas) y la chaqueta no lleva verde.
- **Cara**: párpado y ojos en las filas 14–16, alineados con los del masculino con **iris azul #3E64B0** (propuesta) y barbilla más suave.
- **Ropa**: **chaqueta corta crema** cerrada con cuello azul noche (contraste claro/oscuro con él), **pantalón corto
  marino** con 1 px de vuelo por lado en el muslo (de frente y de espaldas), **mallas oscuras** y **botines teja**.
- **Mochila (D06)** teja (#EA8A6C / #C45C42 / #8E3C2C / #5A221A), a juego con los botines; la misma forma que la de él.
- **Espalda de combate**: melena con anillo de brillo, mechones hacia las puntas, punta abierta a su derecha y la
  trenza con eslabones y goma verde sobre el hombro izquierdo; mochila con asa, solapa, hebilla y bolsillo.
No copia a Dawn, Hilda/Touko, May, Rosa ni a las chicas de las referencias (sin gorra, coletas, falda ni vestido;
de las referencias se tomó el estilo: cabeza grande, contorno casi negro, 3 tonos por material, brillo en anillo).
Se distingue de la ayudante del laboratorio (pelo negro liso, bata larga) por el azul, la silueta de la melena, la
trenza y el conjunto corto. Propuestas no canónicas: nombre (abierto), peinado, prendas, colores de ropa, ojos.

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
Rehecho a partir de la **referencia del autor** (hoja 4×4 de 32×32): **cabeza redondeada verde** de 11 px (luz
arriba a la izquierda con brillo, contorno verde muy oscuro), **un solo ojo** en la parte baja de la cara (pupila
oscura con brillo blanco, cerco del verde del proyecto #B9FF66 y párpado oscuro: mirada seria), un **aro oscuro**
bajo la cabeza y un **cuerpo oliva que se estrecha hacia una punta**. Mide ≈11×14 px nativos y **flota**: la punta
queda en la fila 25 del frame (la sombra la pone el motor). De lado se inclina con la punta hacia atrás y el ojo
va en el borde delantero (la derecha es el espejo de la izquierda); de espaldas no hay ojo y asoma una **mancha
rojiza** en el cuerpo (también se entrevé de perfil). Ciclo de 4 frames: reposo, cabeza aplastada 1 px (la punta
no se mueve), reposo, todo elevado 1 px; el cerco del ojo late en 1 y 3. **No es la forma 10%.** Paleta en
`CORE_PALETTE` (`tools/pixel_chars/zygarde.mjs`). La pantalla de Zygarde (Arca) dibuja este mismo charset.

### Célula de Zygarde — `zygarde_celula`
Según la referencia del autor: **haba alargada en diagonal** (≈14×13 px nativos) con dos lóbulos, el bajo verde
lima que aclara hacia un **centro luminoso** blanco suave y el alto, hacia la punta, más oliva; contorno casi
negro de 1 px y un pequeño pedúnculo abajo a la izquierda. Flota (0/1/2/1 px) con un **pulso** del centro
(se aviva en 1–3) y un destello junto a la punta en el pico. Las 4 filas son idénticas. Los eventos `zygardeCell`
la muestran por defecto dentro de su brillo hexagonal (`world/zygarde/eventTypes.js`; `sprite: ''` la quita).
Las esferas y tanques de Genesis (`colector`, `b13_tanque`) siguen mostrando el núcleo encerrado como una
luz verde que late, como dice su texto: no es el sprite del Core.

Regenerar ambos: `node tools/pixel_build.mjs zygarde_core zygarde_celula --preview`. Tests: `tests/art_zygarde.test.mjs`.

## 4. Preguntas para el autor (D30 y relacionadas)

1. **Masculino**: ¿se aprueba esta silueta de pelo y la chaqueta azul petróleo cerrada como base, o se
   retoma la candidata C de V07?
2. **Femenina** (X32): ¿se aprueba la media melena con trenza y goma verde, la chaqueta crema y el pantalón corto
   con mallas y botines? ¿Nombre?
3. **Gael**: ¿se ratifica el rubio y la paleta histórica bordó/gris/azul? ¿Ojos #58A0D8?
4. **Profesor (D03)**: edad, pelo, gafas sí/no, abrigo de campo o bata.
5. **Core**: rehecho con la referencia del autor (cabeza verde con un ojo y cuerpo oliva en punta). ¿Se
   aprueba el cerco verde del ojo y la mancha rojiza de la espalda? (D06 resuelto: los protagonistas llevan
   mochila y el Core los sigue en el mapa.)
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
- La vista de perfil se obtiene por espejo (como en BW): el flequillo, el tirador y la trenza de la femenina
  cambian de lado al mirar a la derecha (la trenza está a su izquierda; el perfil izquierdo es el fiel).

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

## 9. Kit de protagonistas (integrado y revisado el 03-10-2026)

Los dos protagonistas se hicieron con un kit propio, separado de las plantillas del elenco (`body_jacket.mjs`,
`assemble.mjs`), que usan los NPC. Los protagonistas ya no dependen de las cabezas antiguas (`heads_protas.mjs`, conservado como
referencia histórica) ni de las ramas antiguas de `rider.mjs` y `actions.mjs`.

**Rejilla** (`prota_kit.mjs`, `PROTA`): frame nativo 32×32; columnas 7..24 (18 px) para cabeza y cuerpo.
- Cabeza: matriz de **20 filas** por vista (`down`, `left`, `up`) desde la fila 0: pelo desde la fila 2, ojos en
  15–16, barbilla en la 18 y su base en la 19. Mide **18 columnas o 18 + 2·pad (pad ≤ 2)** y se centra sobre la rejilla, de modo que
  una melena puede sobresalir sin mover la cara (`checkHead` valida filas y ancho). Se dibuja encima de todo.
- Cuerpo: capas `{ x, y, rows }` (helper `part(y, rows, x)`) en la rejilla del cuerpo (x 0..17, y 0 = fila 18):
  hombros en y1–y2, bajo de la chaqueta en y7, cadera en y8 y suela/contorno en y12 (fila 30).
- Orden de capas: `armBack` (brazo lejano) → `legs` → `torso` → `bag` → `arms` → cabeza.
- Pose: `{ key, lift, headX?, torsoDx?, torsoDy?, torso, arms, armBack?, legs }`. `lift` (−1 paso, +1 agachado al
  correr) mueve cabeza, torso, brazos y mochila; **las piernas no**, porque cada pose las dibuja apoyadas.
- Ensamblado: `buildProtaFrame(pose, headRows, palette, { skip, extra })` y `buildProtaSheet({ head, palette },
  poses)` (3 poses por dirección con p2 = p0, o 4; la derecha es el espejo de la izquierda).

**Plantillas reutilizables** (solo símbolos comunes; cada protagonista las viste con su paleta):
- `prota_body.mjs` → `PARTS` (`TORSO_DOWN/UP/LEFT`, `ARMS_DOWN0/1`, `ARMS_LEFT0/1/3`, `ARMBACK_LEFT1`,
  `LEGS_DOWN0/1`, `LEGS_LEFT0/1/3`), `PROTA_WALK` (poses de caminar) y `mirrorPart` (espejo con luz/sombra).
- `prota_run.mjs` → `PROTA_RUN` (0/2 paso cruzado agachado, 1/3 zancada; de perfil torso y cabeza −1 px).
- `prota_bag.mjs` → `PROTA_BAG` (correas / bolsa de perfil / bolsa de espaldas) y `withBag(poses)`, que sigue
  `torsoDx`/`torsoDy`.
- `prota_field.mjs` → `kitWalkSheet`, `kitRunSheet`, `kitRiderFrame` (cadera cerrada o pierna sentada),
  `KIT_HANGING_LEG`, `kitClimbCycle` (brazos por encima de la cabeza; usa el torso y las piernas de las poses del
  protagonista y abre los brazos 1 px si la cabeza es más ancha que la rejilla).
- Utilidades: `recolorPart` (cambiar símbolos), `shiftPart`, `withProtaBag`.

**Cada protagonista** (`rider.mjs` → `PROTAS`: `{ head, palette, walk?, run?, bag? }`; sin `walk`/`run`/`bag` usa
los comunes). Montura, nado, buceo, pesca, trepar y Vuelo salen de ahí (el jinete usa la pose 0 de su `walk`); en
`roster.mjs` los dos se declaran con `protagonist(id)`.
- **Masculino**: `PROTA_M_HEAD` (`prota_heads.mjs`, 18 px) con las poses y la mochila comunes.
- **Femenina** (X32): `PROTA_F_HEAD` (`prota_heads_f.mjs`, 22 px: melena con las puntas hacia fuera y trenza con
  goma verde) y `PROTA_WALK_F` / `PROTA_RUN_F` (`prota_body_f.mjs`): las poses comunes con su chaqueta (sin tirador
  verde ni línea de cremallera de perfil) y el pantalón corto con vuelo (`flareShorts`: +1 px por lado en el muslo
  de las piernas de frente/espaldas), a las mismas alturas de hombros y cadera. Espalda de combate:
  `battle_back.mjs` → `CONFIGS.protagonista_f` (máscara de melena, anillo de brillo `ring`, rayas y `drawBraid`).

**Regenerar y revisar**: `node tools/pixel_build.mjs protagonista_f [--preview] [--lineup]` (o `protagonista_m`);
comparativas con `REF_DIR=<carpeta de las referencias> node tools/cache/art/prota_review.mjs protagonista_f`; visor
`?scene=sprites&char=protagonista_f` (Z modos, C combate).

Tests: `tests/prota_kit.test.mjs` (partes, capas, rebote, espejo, mochila, proporciones BW, jinete,
API de campo de los dos) y `tests/prota_f.test.mjs` (cabeza de 22 px centrada con la cara del masculino, misma
altura, goma verde en los 16 frames y nunca en la chaqueta, vuelo del pantalón, alturas de las poses, paleta y
espalda de combate). También verifican los 18 PNG exportados, los ciclos completos y que ningún píxel opaco de campo se pierda fuera del frame.

## 10. Retratos humanos de combate (pase de arte, 04-10-2026)

El creador vio los sprites de combate de los humanos «muy cuadrados». Causa técnica (ya corregida en
`battle/scene/camera.js`): la cámara del combate ampliaba ×1,3–1,4 en la entrada y ×1,08–1,14 al enfocar, con muestreo
al vecino más cercano, así que los píxeles de arte (2×2) salían como bloques irregulares de 2 y 3 px. Ahora el zoom es
siempre 1 y **no se amplían de más**: todos se dibujan 1:1 (frame 160×160 = nativo 80×80 ×2, como los de Añil; medido
con `tools/cache/cb_pixscale.mjs`: todos tienen píxel de 2×2 exacto).

Se rehízo la geometría del cuerpo de los trece frontales: caderas y hombros en tres cuartos, rodillas flexionadas,
peso sobre una pierna, mangas separadas del torso y pliegues en chaquetas, abrigos y falda. Gael presenta una Ball,
Alerce sostiene su libreta y los técnicos tienen poses diferentes. Se conservan vestuario, paletas y accesorios del
elenco; la revisión compara también los entrenadores `CHICO`, `CAZABICHOS` y `CIENTIFICO` de Añil a escala real.

`front_kit.mjs` construye las prendas y extremidades. Las cabezas se dibujan en una capa independiente del atrezo;
`front_layout.mjs` compone la figura en la rejilla nativa, con el apoyo común de los pies y aire sobre la cabeza.
Las figuras exportadas miden 120–128 px dentro del frame de 160×160. El PNG se genera a ×2 entero; el juego lo
dibuja a ×1. No hay puntas sueltas ni contornos cortados.

Las dos espaldas conservan las cabezas del kit y los cinco tiempos del lanzamiento. El torso tiene hombros
curvos, pliegues y un giro que acompaña al brazo; la mochila se estrecha, inclina y muestra solapa y bolsillo
lateral. El corte inferior sigue siendo intencional, como en BW. La trenza y su goma verde se conservan.

Verificación: 36 pruebas de arte y protagonistas, PNG reproducibles desde las fuentes y 15 capturas de Chrome
del visor real, sin errores de carga ni ejecución. `node tools/e2e_battle_art.mjs` repite la integración;
`node tools/review_battle_art.mjs` genera las comparativas y métricas. La evidencia está en
`tools/cache/arte-final/` (`fronts.png`, `backs.png`, `metrics.json`, `browser/result.json`).

El pase técnico y visual está integrado; los diseños propios conservan la etiqueta provisional hasta la
aprobación artística del autor (D30).


### Revisión del kit, 03-10-2026

Se recuperaron selectivamente las fuentes de protagonistas de la rama de pausa. Se corrigieron la alineación de
la cara femenina y el largo de su chaqueta de perfil, el tirador masculino que quedaba bajo el brazo y las ondas
de nado que excedían el frame. Las 18 hojas se regeneran con el constructor del proyecto. Los ciclos completos
de caminar, correr, montura, nado, buceo, trepar, pesca, Vuelo y lanzamiento se verifican junto al registro.

La revisión en Chrome recorre los ocho modos de ambos protagonistas y el lanzamiento, sin errores de carga ni
de ejecución: 18 capturas y el resultado en `tools/cache/art/browser/`. Las hojas completas comparadas entre
opciones M/F están en `tools/cache/art/modes/`; las comparativas con NPC, en `tools/cache/art/`.
La aprobación del autor D30 sigue pendiente. El pase del 04-10 del apartado anterior renueva la composición de
las espaldas de combate; el corte inferior permanece intencional, como en BW.
