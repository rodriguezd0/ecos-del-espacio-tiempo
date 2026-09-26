# Bloque 2 — Pilar del Umbral (P1): Villa Zaguán, explanada y Ruinas del Dintel

Guion: `docs/CAMPANA.md` B02 (+ §1.3–1.5, §2.3, §3.0, §3.1, §5.4, §6.2) · `docs/TABLILLAS.md` T01 (se abre aquí) ·
`docs/POKEDEX_DISTRIBUCION.md` §7.3–7.4 · D07, D08, X06, X15. Coordenadas en casillas (x → derecha, y → abajo).
**Fuentes únicas de coordenadas:** `villa_zaguan_layout.js`, `explanada_umbral_layout.js`, `ruinas_dintel_layout.js`.

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `villa_zaguan` | `villa_zaguan.js` + `_build.js` + `_layout.js` | 40×36 | 1 | Aldea de huertos: Centro, Arboleda de los Nombres, campanario en su terraza, escuela (cerrada), Casa del Dintel, huertos vallados con granero, estanque (Caña Vieja), hierba alta |
| `zaguan_centro` | `zaguan_centro.js` | 19×14 | 4 | `pokemonCenterMap` (services): enfermera, PC, tienda del Centro, descanso; tutorial la 1.ª vez |
| `casa_dintel` | `casa_dintel.js` | 13×11 | 4 | Casa de Casilda (está en casa tras `b02_salida`) |
| `zaguan_casa_vecina` | `zaguan_casa_vecina.js` | 13×11 | 4 | La vecina de las puertas (su marido dentro) |
| `zaguan_casa_huerto` | `zaguan_casa_huerto.js` | 15×12 | 4 | Hortelana y su hijo |
| `explanada_umbral` | `explanada_umbral.js` + `_layout.js` | 30×30 | 7 | Macizo de roca con la boca de la ruina, dintel exento, plaza enlosada, kit exterior de Pilar; camino de `camino_arena` (el mismo pincel que la calle de Zaguán: sin costura en la conexión) |
| `ruinas_dintel` | `ruinas_dintel.js` + `_build.js` + `_layout.js` | 44×40 | 2 | Cinco salas en un nivel, kit de Pilar, `tone: pilarTone('P1')`, `dark` (luz del Core, 2 antorchas, tragaluz) |

Arte propio del bloque (PROVISIONAL, D30): `node tools/b02_assets.mjs [--preview]` → `assets/objects/` `piedra_dintel(_viva)`,
`losa_dintel`, `tragaluz`, `arca_zygarde`, `banco_piedra`, `grieta_roca`.

## Enlaces

| Desde | Casilla | Hacia | Llegada |
|---|---|---|---|
| `villa_zaguan` puerta del Centro | 26,14 | `zaguan_centro` | 9,12 ↑ (`CENTER_ENTRY`) |
| `villa_zaguan` Casa del Dintel | 6,23 | `casa_dintel` | 6,9 ↑ |
| `villa_zaguan` casa de la vecina | 13,25 | `zaguan_casa_vecina` | 6,9 ↑ |
| `villa_zaguan` casa de los hortelanos | 26,25 | `zaguan_casa_huerto` | 7,10 ↑ |
| Interiores (felpudo, pulsar ↓) | — | `villa_zaguan` | casilla bajo su puerta, mirando ↓ |
| `explanada_umbral` boca de la ruina | 15,8 · 16,8 | `ruinas_dintel` | 21,34 ↑ |
| `ruinas_dintel` claridad de la entrada | 21,35 (empujar ↓) | `explanada_umbral` | 15,13 ↓ |

Las puertas de Exterior1 (y la claridad de la cueva) están sobre tiles **no pasables**: el warp salta al empujar contra
ellos (cambio aditivo en `world/world.js#checkPlayerTouch`, como las puertas-evento de RMXP).

**Conexiones sin fundido** (`offset` = coordenada de ESTE mapa donde cae la 0 del vecino):

- Norte → `ruta_1`, `offset: 5`: camino x 18–21 = x 13–16 de la Ruta 1 (su enlace pendiente `south`, −5, ya activo).
- Oeste → `explanada_umbral`, `offset: 3`: camino y 16–18 = y 13–15 de la explanada (su `east`, −3).
- Sur → `ruta_2` (B03), `offset: 5` (`maps/b02/pending_links.js`): camino x 18–21 = x 13–16 de la Ruta 2 (su `north`,
  −5). Se activa sola al estar registrada; si no, cuatro avisos neutros en y 35.

## Secuencia, flags y escenas (`content/events/b02_*.js`)

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Tutorial del Centro | `zaguan_centro` auto | `!b02_centro_tutorial` | `b02_centro_tutorial` |
| Gael espera («Llegué antes. No me ha dejado pasar.») | explanada, franja x 24 (y 13–15) o hablarle | `b01_left_town` | `b02_gael_espera` |
| Casilda bloquea, brilla el dintel, C009 | explanada, franja ante el dintel o hablarle | `!b02_casilda_acompana` | C009, `b02_casilda_acompana`, var `b02_casilda_sala`=1 |
| Antesala (comentario) | ruinas auto | sala 1 y `!b02_antesala` | `b02_antesala` |
| Galería (comentario) | franja x 12–14, y 23 | `!b02_galeria` | `b02_galeria`, sala 2 |
| Piedras giratorias | piedras en (23,18) (7,18) (13,18) | — | var `b02_<piedra>`, `b02_<piedra>_viva` |
| Losa deslizante | al encender la 3.ª piedra | — | `b02_dinteles` |
| Cámara de Geodude (comentario) | franja x 17–19, y 11 | `b02_dinteles` | `b02_camara_geodude`, sala 3 |
| Sacar al Geodude (A mantenido) → roca | Geodude (3,7) desde (4,7) | — | `b02_geodude_libre`, `b02_roca_rota`, sala 4 |
| Regalo del Geodude (nv 8) | tras la roca o hablarle en (8,8) | — | `b02_geodude_regalo` (si se acepta) |
| Combate de la Guardiana | salida del túnel (28,5) o hablarle | `b02_roca_rota` | `b02_casilda_vencida` (+3 Pociones, Cuerda Huida), sala 5 |
| Derrota → cura en la antesala | `ruinas_dintel` auto | `b02_casilda_derrota` | lo quita (Casilda cura: «Otra vez. Con cabeza.») |
| Núcleo: Fragmento 1, Arca, verso I | columna hueca (35,20) desde (35,21) | `b02_casilda_vencida` | `p1_restored`, F01, `verse_1`, `ZYGARDECUBE`, `b02_arca_abierta`, `b02_nucleo` |
| Casilda abre el atajo | tras el núcleo (o al volver) | `b02_nucleo` | `b02_atajo`, sala 6 |
| Salida al atardecer | explanada auto | `b02_nucleo` y `!b02_salida` | reloj a las 18:30, `reachMilestone('run')` (10 %, `zyg_10`), `b02_gael_se_va`, `CLUENOTEBOOK`, `b02_libreta`, pista T01, `b02_salida`. Si el jugador llega por el este (p. ej. Cuerda Huida desde el Núcleo), un fundido lo lleva al pie del dintel (15,13) |
| Casilda en casa | `casa_dintel` (9,7) | `b02_salida` | pista verbal de la célula más escondida de la comarca (CAMPANA §2.2): C024, mirador de la Ruta 1 tras la grava |

Casilda es UN evento en las ruinas; su casilla depende de la sala (`b02_ruinas_casilda.js`, se recoloca en `onEnter`).

## Células (`events/b02_cells.js`)

| Código | Clave | Casilla | Dónde |
|---|---|---|---|
| C008 | `cell_zaguan_1` | villa_zaguan (18,11) | calle principal, junto a la Arboleda |
| C009 | `cell_zaguan_2` | — (guion) | Casilda al aceptar acompañar (`giveCell`: `state.addCell` + `checkZygardeProgress`) |
| C010 | `cell_umbral_1` | ruinas_dintel (15,30) | antesala |
| C011 | `cell_umbral_2` | ruinas_dintel (5,21) | Galería, junto al estanque quieto |
| C012 | `cell_umbral_3` | ruinas_dintel (12,9) | Cámara de Geodude |

Con C001–C005 del Bloque 1 son las 10 obligatorias antes del núcleo; si faltan, al salir el Core dice «Me faltan N
partes» y el 10 % se forma al recoger la que falte (activación diferida del sistema de Zygarde).

## Puzzle de la Galería de los Dinteles (D08, `events/b02_puzzle.js`, puro)

Inscripción de la antesala (traducción grabada por la madre de Casilda): «El primero mira al alba. El segundo, al agua
que no se va. El tercero, a quien entra.» Cada A gira la piedra 90° (arriba → derecha → abajo → izquierda); empiezan
mirando a la pared. Piedra 1 (23,18): al este, donde cae la luz del tragaluz. Piedra 2 (7,18): al oeste, al estanque
quieto (el arroyo del este sale de la sala: señuelo). Piedra 3 (13,18): al sur, a la puerta de la antesala. Cada zócalo
lleva 1, 2 o 3 muescas (se leen al examinar la piedra por primera vez) para que «el primero/segundo/tercero» sea legible. La ranura
solo se enciende si la orientación es correcta **y el Core está a 3 casillas o menos**; fallar no penaliza. Las piedras
se giran de lado (desde el hueco de su alcoba) para que el jugador no las tape.

**Tras el puzzle (atasco del creador, 25-09):** el recorrido E2E pasa entero, así que no había bloqueo en el camino
normal; faltaba guía. Al cruzar la losa, el Geodude de la grieta (3,7) queda fuera de pantalla y en la oscuridad, y lo
primero que se ve es la roca del túnel (24,5), que «no se mueve». Pistas diegéticas (Casilda, nunca Zygarde): tras
«rascar por las noches» añade «Viene del fondo. De la pared del oeste.»; al hablarle en la Cámara antes de sacarlo, «Ese
rascar viene de la pared del oeste…»; y la roca, mientras el Geodude siga atrapado, añade «Del fondo de la sala, hacia el
oeste, llega un rascar de piedra contra piedra.». Además, red de seguridad para un bloqueo posible: si las tres
ranuras quedan encendidas sin `b02_dinteles` (partida cortada durante la animación de la losa), una piedra resuelta
ya no gira y no había forma de abrirla; ahora el auto `escena_losa_galeria` desliza la losa al volver a la sala.

## Combates y encuentros

- `content/trainers/b02.js`: Excursionista Remo (Zubat 6, Machop 7), Montañero Paco (Geodude 7, Machop 8), Arqueóloga
  Inés (Zubat 8, Onix 9) y la Guardiana Casilda (Bonsly 11 con Cabeza Roca —sin el combo Robustez + Azote—, Nacli 11,
  Hippopotas 12 con Chorro Arena y Baya Aranja; `CombateLider`).
- `content/encounters/b02.js`: Zaguán (hierba día/noche 7–12 y Caña Vieja), explanada (misma hierba) y ruina (cueva 5–9).

## Cambios en el mundo

- Zaguán: vecinos, tablón y casas cambian de texto con `p1_restored`; de noche, antes del P1, crujen puertas.
- `content/story/crisis.js#LOCAL_CALM` (+ `crisisSky.js`): con `p1_restored` cesan los temblores ambientales en Villa
  Alba, Ruta 1, Laberinto, Zaguán y explanada.
- Villa Alba: `events/b02_world.js#villaAlbaStarlyEvents` (Starly en los tejados tras el P1), añadido en `b01/villa_alba.js`.
- Ruta 1: los topógrafos se van con `p1_restored` (B01). Core: frases propias en ruinas/explanada (`content/companion.js`).

## Para el Bloque 3 (T01, Lía)

- Arboleda: `ARBOLEDA` (Fundador 2×6 en (9,8), tronco fila 13; banco de piedra centrado en (15,13), 3 casillas;
  árboles de nombre y placas) y `CAMPANARIO` (terraza x 31–37, escalera (33,11), campana (35,6)). B03 ya sustituye el
  banco y la campana genéricos con `withT01` (`events/b03_t01.js`) y añade a Lía en `zaguan_centro`.

## Pruebas

- `node --test tests/content_b02_maps.test.mjs tests/content_b02_scenes.test.mjs`
- `node tools/validate_content.mjs` · `node tools/preview_map.mjs villa_zaguan --pass` (y `explanada_umbral`, `ruinas_dintel`)
- Recorrido completo: `node tools/e2e_b02.mjs [--from=zaguan|ruinas|nucleo]` (capturas `tools/cache/screens/e2e_b02_*`).
- URLs: `?scene=map&map=villa_zaguan&x=19&y=3&dir=2&party=TURTWIG:12&flags=b01_dex_received,b01_left_town&core=1&zcores=1&zcells=5&debug`
  · `?scene=map&map=explanada_umbral&x=24&y=14&dir=4&party=TURTWIG:12&flags=b01_left_town&core=1&zcores=1&zcells=6&debug`
  · `?scene=map&map=ruinas_dintel&x=21&y=34&dir=8&party=TURTWIG:15&flags=b01_left_town,b02_casilda_acompana&vars=b02_casilda_sala:1&core=1&zcores=1&zcells=9&debug`
