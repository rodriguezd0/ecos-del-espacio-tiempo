# Bloque 7 — Interludio 3: Ruta 6 y la Cantería Solano (T04, Mega Aro)

Guion: `docs/CAMPANA.md` «B07», §1.4 (Ruta 6), §1.8 (fondos y música), §2.3 (C035, C056), §3.1 (crisis fase 1), §5
(Ulises Garrido, sin combate) y X14 (Mega Aro). `docs/TABLILLAS.md` T04 «La cantera cerrada». Encuentros:
`docs/POKEDEX_DISTRIBUCION.md` §7.3 «Ruta 6 y Cantería Solano» y §7.7 (Mega Aro; Absolita en la cornisa). Balance:
`docs/BALANCE.md`. **Fuente única de coordenadas:** `layout.js` (y las salas ASCII de
`content/events/b07_strata_rooms.js`).

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_6` | `ruta_6.js` + `ruta_6_build.js` | 30×70 | 5 | Cañón escalonado: tres rellanos anidados (caras en y 15–17 y 57–59, escaleras de una columna pisable) entre paredes de roca en tramos que se estrechan a saltos. En el medio, la **Cantería Solano**: dos bancales de roca al este (boca de las galerías y corte de los estratos en la cara del bajo; barro y bancal alto con C035), la herrería de los Solano, el patio con el camión del Consorcio, sillares y cargas. El **derrumbe** (escombros como eventos) corta el camino de Estrato en y 43–46. Cornisa del oeste (Absolita) y repisa del este (C056): solo con Trepar. BGM `PrismaRuta2`, fondo `ZonaEscarpada` |
| `canteria_solano` | `canteria_solano.js` | 60×16 | 2 | Las **galerías estratificadas**: Galería del Ocre (tierra), de la Arcilla (roja) y el último estrato (gris), unidas por pozos. Rocas por capas y escombros macizos como eventos; oscuridad suave con antorchas. BGM `Cueva` |
| `canteria_herreria` | `canteria_herreria.js` | 15×11 | 4 | Herrería de Bea: fragua y yunque (arte propio), estantes y un catre para descansar durante el rescate. Aquí se forja el Mega Aro |

Arte propio (PROVISIONAL, D30): `node tools/b07_assets.mjs [--preview]` → `assets/objects/b07_estratos.png` (rocas
por estrato: fila 2 ocre, 4 gris, 6 roja, 8 negra), `b07_escombros.png` (fila = suelo, columna = forma),
`b07_corte.png`, `b07_tablilla.png`, `b07_veta.png`, `b07_fragua.png`, `b07_yunque.png`, `b07_sillares.png`,
`b07_carga.png`, `b07_pozo.png`.

## Enlaces

| Desde | Casilla / borde | Hacia | Llegada / notas |
|---|---|---|---|
| `ruta_6` borde norte | x 13–17, y 0 | `villa_brontia` (B05) | `north`, offset −7 ↔ Brontia `south`, offset 7 (x 20–24 de Brontia, `maps/b05/links.js`). **Activo**. Los vendavales los pone Brontia en su salida (y 36) hasta `p3_restored` |
| `ruta_6` borde sur | x 13–17, y 69 | `ciudad_estrato` (B08) | `south`, offset −13 ↔ Estrato `north`, offset 13 (Estrato abre su camino norte en x 26–30: `maps/b08/layout.js` lo adoptó). Se activa solo con `linkIfReady` (`pending_links.js`); mientras no exista, aviso neutro y un paso atrás |
| `ruta_6` puerta de la herrería | (6,28) | `canteria_herreria` | (7,9) ↑; salida (6–8, 9) pulsando abajo → (6,29) |
| `ruta_6` boca de las galerías | empujar (24,40) desde (24,41) | `canteria_solano` | (8,11) ↑ = llegada a la Sala 1 (la sala se reinicia si no estaba resuelta). Cerrada por los técnicos hasta `b07_tecnicos`; Bea no deja entrar hasta la lección (`b07_alerce`) |
| `canteria_solano` salida de luz | (8,12), pisar | `ruta_6` | (24,41) ↓ |
| Sala 1 → Sala 2 → Sala 3 | pozo (E) de cada sala | misma galería | tapado con tablones hasta sacar a sus Timburr; cuerda (U) para volver a la sala de arriba |
| Última sala (salida) | por guion (pozo de ventilación) | `ruta_6` | (24,41) ↓ con Quino, tras la Tablilla y la piedra |

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| **La voladura** y **Bea Solano**: Quino y su cuadrilla de Timburr atrapados (segunda pista de T04; descubrimiento directo si faltaba la primera) | franja y 20, x 3–26 | `!b07_llegada` | `b07_llegada`, pista T04 paso 2 |
| **Técnicos del Consorcio** en el perímetro de voladura: dos combates de guion (`bossBattle`: Houndour 26/Skorupi 27; Bronzor 27/Duosion 27) | franja y 42, x 21–27, o hablarles | `b07_llegada && !b07_tecnicos` | vars `b07_perimetro`, `b07_tecnico_0/1`; `b07_tecnicos`. Perder: curado en (24,42), sin perder dinero; «Otra vez usted» |
| **Ulises Garrido** (sin combate) se niega a parar («la carga de las doce»); llegan los canteros y lo **señalan en público**; retira las cargas y se va: «No lo hago por ti» | patio | tras los técnicos | `b07_garrido` (las cargas desaparecen) |
| **Alerce en persona** y la regla de los estratos ante el corte de la cantera: «Nunca rompas la capa que sostiene a otra» | corte (20,40) | tras Garrido | `b07_alerce` (abre las galerías). Si la partida se cortó a mitad de la cadena, se retoma pisando (24,43) |
| Galerías: rescate estratigráfico (abajo) | `canteria_solano` | `b07_alerce` | `b07_timburr_1..3`, `b07_quino`, var `b07_sala_1..3`, `b07_derrumbes`, `b07_llamada_derrumbe` |
| Bajo la última pizarra: **Tabla Pétrea** (STONEPLATE, Crónica IV; cierra T04) y la **veta de piedra activadora** | Sala 3 | toda la pizarra rota | `b07_tablilla` |
| Quino arranca un trozo de la veta y sale por la ventilación (ya libre, espera al pie de su pila, fuera del pasillo) | Sala 3 | Quino fuera y Tablilla | `b07_piedra` |
| **Fiesta de los canteros** y **denuncia pública** (aviso en el camión y en el tablón, copia para Estrato); Bea: «En Solano, al que saca a alguien de la roca le damos un anillo de la roca.» | patio, al salir | `b07_piedra && !b07_rescate` | `b07_denuncia`, `b07_rescate` |
| **Mega Aro**: Bea lo forja; Alerce: «Es una Piedra Activadora. Responde a los lazos… Te va a hacer falta.» Los Timburr despejan el derrumbe | herrería (auto al entrar) | `b07_rescate && !b07_megaring` | **`b07_megaring` (salida del bloque)**, `b07_ruta_despejada`, `b07_alerce_se_fue`; objeto clave `MEGARING` |

**Mazmorra — reglas (TABLILLAS T04).** Cada roca tiene el color de su capa (de arriba abajo: arenisca ocre, caliza
gris, arcilla roja, pizarra negra; la tabla de tiza de Quino en la Sala 1 lo recuerda). Una roca **sostiene** a
las vecinas en cruz de una capa más alta: romperla antes provoca un pequeño derrumbe y la sala vuelve a su estado
inicial (la primera vez llama Alerce por la Pokédex). Las pilas se leen de arriba abajo en la pantalla: quien entra
por el sur topa con la capa que aguanta a las demás, así que hay que dar la vuelta —por pasarelas y salientes— para
empezar por arriba. Los atrapados están bajo la roca de abajo de su pila; el pozo de cada sala sigue tapado hasta
sacarlos. Sala 1: tutorial (2 capas, 1 Timburr); Sala 2: dos pilas de 3 capas a las que se baja por salientes;
Sala 3: Quino bajo una pila de 3 y la gran pila de 4 capas entrelazadas sobre la Tablilla. Reglas puras y
solucionador BFS en `content/events/b07_strata_logic.js`.

**Reintentos (CAMPANA §2.6):** derrumbe = la sala se reinicia; salir y volver a bajar reinicia una sala no resuelta
(las resueltas conservan sus rocas rotas); combates de guion sin pérdida; una derrota salvaje lleva al último punto
de cura (Centro de Brontia). Catre de la herrería para descansar (`restSpotEvent`, kind `bed`).

## Células, objetos y entrenadores

| Código | Clave | Casilla | Dónde |
|---|---|---|---|
| C035 | `cell_ruta_6_1` | ruta_6 (25,24) | bancal alto de la Cantería, tras el barro (Terreno complicado) |
| C056 | `cell_ruta_6_2` | ruta_6 (25,48) | repisa de la pared este (Trepar: pared en (24,53); se vuelve por (24,50)) |

Objetos: Ruta 6 — Super Ball ×2, Superpoción, Éter (oculto), Cura Total, Revivir (oculto), Superrepelente,
Hiperpoción, Pepita (oculta) y la **Absolita** en la cornisa del oeste (Trepar: pared en (5,10), bajada en (5,7)).
Galerías — Piedra Dura, Hiperpoción, Polvoestelar (oculto), Revivir (oculto).
`content/trainers/b07.js`: Excursionista Bruno, Veterana Carmen (vigila la escalera del rellano alto), Montañero
Ramiro, Minero Tino, Excursionista Nora, Minera Eva (25–29) y los dos técnicos (40 de base, combates de guion).

## Cambios en el mundo

Tras `b07_garrido`: sin cargas en los bancales. Tras `b07_denuncia`: el camión y el tablón llevan el aviso de los
canteros. Tras `b07_rescate`: Quino, los canteros y la cuadrilla en el patio. Tras `b07_ruta_despejada`: sin
derrumbe (camino de Estrato abierto), parte de sus piedras apiladas a los lados del camino (`RUTA6.rubblePiles`) y
un cantero junto al paso. Galerías: resueltas se quedan abiertas (§2.4:
cambios solo aditivos), la veta queda como un hueco que brilla. Flags que pueden consultar otros bloques:
`b07_megaring` (Diario, salida), `b07_ruta_despejada`, `b07_denuncia` (Estrato ya sabe lo de la Cantería).

Puesta en escena: los personajes de las escenas caminan por el suelo (`content/events/b07_path.js`, búsqueda en
anchura sobre la pasabilidad, esquivando a la gente) en vez de atravesar el bancal; los puestos de escena
(canteros ante Garrido, fiesta, retirada del Consorcio, llegada de Alerce) están en `CANTERIA` de `layout.js` y
`tests/b07_staging.test.mjs` comprueba que todos son suelo pisable y que cada recorrido existe.

## Pruebas rápidas

- Llegada a la Cantería: `?scene=map&map=ruta_6&x=15&y=18&dir=2&party=LUCARIO:32&flags=p3_restored&core=1&zygarde=run,ram,terrain&noenc=1&debug`
- Técnicos y Garrido: `?scene=map&map=ruta_6&x=24&y=44&dir=8&party=LUCARIO:34&flags=p3_restored,b07_llegada&core=1&zygarde=run,ram,terrain&noenc=1&debug`
- Galerías (Sala 1): `?scene=map&map=canteria_solano&x=8&y=11&dir=8&party=LUCARIO:32&flags=p3_restored,b07_llegada,b07_tecnicos,b07_garrido,b07_alerce&core=1&zygarde=run,ram,terrain&noenc=1&debug`
- Última sala: `?scene=map&map=canteria_solano&x=48&y=12&dir=8&flags=b07_alerce,b07_timburr_1,b07_timburr_2,b07_timburr_3&core=1&zygarde=run,ram,terrain&noenc=1&debug`
- Herrería y Mega Aro: `?scene=map&map=ruta_6&x=6&y=29&dir=8&flags=p3_restored,b07_llegada,b07_tecnicos,b07_garrido,b07_alerce,b07_quino,b07_tablilla,b07_piedra,b07_rescate,b07_denuncia&debug`
- `node --test tests/b07_strata.test.mjs tests/b07_reach.test.mjs tests/b07_content.test.mjs tests/b07_staging.test.mjs` ·
  `node tools/preview_map.mjs ruta_6 --pass` · **recorrido completo**: `node tools/e2e_b07.mjs` (≈6 min;
  `--from=canteria|galerias|herreria` para empezar más tarde; `--no-retry` sin la derrota simulada). Capturas
  `tools/cache/screens/e2e_b07_*` y transcripción `e2e_b07_dialogos.txt`.

## Coordinación con otros bloques

- **B05** (Villa Brontia): su salida sur se conecta sola al registrarse la Ruta 6 (offset 7 ↔ −7); los vendavales
  siguen siendo suyos hasta `p3_restored`. Sin cambios en sus archivos.
- **B06**: la pista T04 la abre el núcleo del P3. Los combates de guion usan el helper común
  `content/common/bossBattle.js` (`bossBattle`).
- **B08** (Ciudad Estrato, en paralelo): camino norte de Estrato en x 26–30 con `north` → `ruta_6` offset 13 (ya en
  `maps/b08/layout.js`). La Ruta 6 conecta `south` offset −13 en cuanto `ciudad_estrato` está registrado.
- **B19** (Calzada del Rey): el atlas enlaza la Calzada con la Ruta 6 sin dirección; no hay paso en este mapa (queda
  para B19 si lo necesita).
- **Postgame** (B22/B24): el cuarto encuentro de Entei «en la Cantería» y la prueba de Cobalion («proteger a unos
  Timburr de un derrumbe») pueden reutilizar las galerías y `b07_strata_logic.js`.
