# Arte de personajes — estado y decisiones (PROVISIONAL, D30)

Todo el arte de personajes de este documento es **provisional** y está pendiente de la decisión **D30**
(arte final de protagonistas y resto del elenco). Cada entrada del registro
`game/src/content/characters.js` lleva `provisional: true` y `decision: 'D30'`. Nada de lo aquí propuesto
fija canon: donde la biblia deja un campo abierto, la solución es una propuesta para aprobar o descartar.

Visor: `http://localhost:8080/?scene=sprites` (←/→ personaje · Z caminar/correr · X zoom · C combate).
Parámetros: `&char=<id>`, `&run`, `&battle`.

## 1. Método técnico

| Aspecto | Decisión |
|---|---|
| Resolución de arte | Nativo **32×32 por frame**, exportado con **ampliación exacta ×2** (frame 64×64, píxeles de 2×2), como fija la biblia §13.1 ("32×32 nativos, entrega 64×64"). |
| Charset | Hoja **256×256**, 4×4 al estilo Essentials: filas abajo, izquierda, derecha, arriba; columnas = patrón 0..3 (0 y 2 de pie, 1 y 3 pasos opuestos). La derecha es el espejo de la izquierda. |
| Paso | En los frames de paso el cuerpo sube 1 px nativo (rebote BW). |
| Correr | Hoja `_run` con 4 frames distintos: 0/2 paso cruzado (agachado 1 px), 1/3 zancada, brazos flexionados y cabeza adelantada 1 px en perfil. |
| Proporciones | Estudiadas (no copiadas) de charsets BW de Añil (`cheren.png`, `chaval1.png`): cabeza ≈16×15 nativos, cara pequeña con ojos 2×2 (pupila + brillo exterior), cuerpo ≈13 filas. |
| Adultos | Mismo esqueleto con el torso estirado 1 px (`tall: 1`). El anciano baja la cabeza 1 px. |
| Luz | Desde arriba-izquierda; 2–3 tonos por material; contorno oscuro de silueta y líneas interiores de color. |
| Combate espalda | Tira de **5 frames de 160×160** (nativo 80×80 ×2): 0 estático, 1 preparar, 2 brazo arriba con Poké Ball, 3 lanzar, 4 seguimiento (formato de Essentials: ancho > 2×alto ⇒ 5 frames). Se recorta por abajo, como en BW. |
| Combate frente | 160×160 (nativo 80×80 ×2), proporción ≈4 cabezas. |

No se ha copiado ni recoloreado ningún sprite de Añil ni oficial. Los charsets de Añil se usaron solo para
medir proporciones y el ritmo del ciclo de paso.

## 2. Herramientas (regenerar todo)

```
node tools/pixel_build.mjs [id ...] [--preview] [--lineup]
```
- Fuentes en `tools/pixel_chars/`: `body_jacket.mjs` (plantilla de cuerpo y paso), `body_run.mjs` (carrera),
  `overlays.mjs` (abrigo largo y falda), `heads_protas.mjs` / `heads_cast.mjs` (cabezas por matrices de
  caracteres), `palettes.mjs` (todas las paletas), `zygarde.mjs`, `battle_back.mjs`, `battle_front.mjs`
  (sprites grandes con formas + sombreado de celda de `raster.mjs`), `roster.mjs` (qué hojas se generan).
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
(1 píxel nativo, visible de frente y de perfil), **sin mochila**.
Propuestas no canónicas: color de ojos oscuro neutro, tono de piel claro, forma exacta de las puntas.

### Protagonista femenina — `protagonista_f` (+ `_run`, `_back`) · PROPUESTA
Canon usado: **azul marino profundo casi nocturno con lectura azul** (#5A6CB4 luces, #34427E base, #222C58,
#141A38) y el mismo lenguaje BW y acento verde. Todo lo demás es **propuesta provisional D30**:
melena por los hombros con raya y flequillo ladeado (sin gorra, sin coletas), chaqueta corta **blanco hueso**
cerrada con cuello interior azul noche (contrasta con el pelo oscuro y con la chaqueta del masculino),
**verde en el tirador** (igual que él), pantalón corto oscuro sobre mallas oscuras, calzado oscuro.
Altura idéntica al masculino (biblia: "compatible con el estándar humano").

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
5. **Core**: color del núcleo (azul provisional) y si debe viajar a pie como seguidor o en brazos (D06:
   transporte del Core frente a un sprite sin mochila).
6. ¿Hacen falta hojas de bici, surf, pesca o retratos de diálogo? (no producidas todavía).

## 5. Limitaciones conocidas

- Los adultos comparten esqueleto con los jóvenes (solo +1 px de torso); no hay niños ni cuerpos
  excepcionales todavía.
- Los sprites de combate grandes se generan con formas y sombreado automático: correctos y coherentes, pero
  menos pulidos que un trabajo a mano; son los primeros candidatos a sustituir cuando haya arte aprobado.
- Sin hojas de bici/surf/pesca/buceo, sin retratos, sin sombra propia (la sombra la pone el motor).
- La vista de perfil se obtiene por espejo (como en BW): el flequillo y el tirador cambian de lado al mirar
  a la derecha.
