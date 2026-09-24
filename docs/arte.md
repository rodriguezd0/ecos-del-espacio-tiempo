# Arte de personajes — estado y decisiones (PROVISIONAL, D30)

Todo el arte de personajes de este documento es **provisional** y está pendiente de la decisión **D30**
(arte final de protagonistas y resto del elenco). Cada entrada del registro
`game/src/content/characters.js` lleva `provisional: true` y `decision: 'D30'`. Nada de lo aquí propuesto
fija canon: donde la biblia deja un campo abierto, la solución es una propuesta para aprobar o descartar.

Visor: `http://localhost:8080/?scene=sprites` (←/→ personaje · Z caminar/correr · X zoom · C combate ·
E alterna con las clases genéricas de Añil). Parámetros: `&char=<id>`, `&run`, `&battle`, `&anil`
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
- `--out=<carpeta>` escribe los PNG en otra carpeta para iterar sin tocar el juego en marcha.
- Salida: `game/assets/characters/<id>.png`. Con `--preview`, vistas ×6 con rejilla en
  `tools/cache/pixel/<id>.png`; con `--lineup`, todo el elenco sobre césped real de Añil en
  `tools/cache/pixel/_lineup.png`.
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

### Guardiana del Umbral — `guardiana` (+ `guardiana_front`) (D07)
Veterana escéptica de unos 60 años que custodia por tradición familiar. Pelo **cano** con raya al medio y
**moño alto**, cejas rectas grises, arrugas bajo los ojos y boca firme (seria, no hostil). **Chaqueta de campo
oliva**, pañuelo teja al cuello, pantalón de trabajo pardo y **botas altas**: ropa sobria de exploración de
ruinas, sin emblemas. Frontal de combate con **brazos cruzados** (escepticismo), correa de zurrón cruzada y
bolsillos. Nombre: pendiente (D07).

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
6. ¿Hacen falta hojas de bici, surf, pesca o retratos de diálogo? (no producidas todavía).
7. **Ayudante**: ¿mujer (propuesta actual) u hombre? **Guardiana**: nombre (D07) y si el moño alto encaja.

## 5. Limitaciones conocidas

- Los adultos comparten esqueleto con los jóvenes (solo +1 px de torso); los niños tienen cuerpo propio,
  pero no hay cuerpos excepcionales (corpulentos, muy altos).
- Los niños no balancean los brazos al andar de frente (solo de perfil).
- Los sprites de combate grandes se generan con formas y sombreado automático: correctos y coherentes, pero
  menos pulidos que un trabajo a mano; son los primeros candidatos a sustituir cuando haya arte aprobado.
- Sin hojas de bici/surf/pesca/buceo, sin retratos, sin sombra propia (la sombra la pone el motor).
- La vista de perfil se obtiene por espejo (como en BW): el flequillo y el tirador cambian de lado al mirar
  a la derecha.
