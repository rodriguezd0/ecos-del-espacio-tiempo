# Bloque 10 — Pilar de la Memoria (P5): Aldea Mnemos y el Archivo Hondo

Guion: `docs/CAMPANA.md` «B10», §1 (atlas: Mnemos entre la Ruta 8 y la Ruta 9), §2.3 (C045, C046, C074), §3.0
(verso V), §3.1 (crisis), §5 (Consorcio Génesis: cameo de Casia) y §6 (Gael pasó antes). `docs/TABLILLAS.md` T09
(primera pista). Encuentros y regalos: `docs/POKEDEX_DISTRIBUCION.md`. Dinero y niveles: `docs/BALANCE.md`.
**Fuente única de coordenadas:** `mnemos_layout.js` (aldea), `hondo_layout.js` (mazmorra) y `archivo_layout.js`
(Archivo de papel).

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `aldea_mnemos` | `aldea_mnemos.js` + `mnemos_build.js` | 48×44 | 9 | Aldea de bambú, cerezos y archivos (tres cerezales en claros del bosque, sin bosque debajo). Plaza con estrado y farolillos, terraza alta del Santuario (escalera roja), estanque de lotos con islote (C074, Nadar), bambú tras la casa de té (C045), risco del este (Trepar) con la **Losa del Olvido** (Spiritomb), árbol de miel. **Niebla del olvido** (`001-Fog01`) hasta `p5_restored`: el camino del norte da vueltas. BGM `PrismaVilla1` |
| `mnemos_centro` | `mnemos_centro.js` | plantilla | — | Centro Pokémon (`pokemonCenterMap`) + una viajera |
| `mnemos_herbolario` | `mnemos_herbolario.js` | 15×12 | — | Tienda (`shopMap`) + hierbas y Miel. Elio en el mostrador (saludo según la historia) y Tomé |
| `mnemos_casa_te` | `mnemos_casa_te.js` | 15×12 | 4 | Casa de té de Sabina (regalo: Sinistea) y el pozo de B11 (`teaHouseWellEvents`) |
| `mnemos_casa_olvido` | `mnemos_casa_olvido.js` | 13×11 | 4 | Casa de Olvido Arrieta: libro de visitas (firma de Gael) y calcos sobre la mesa, libretas en las estanterías, mapa de Axis en el cuadro de la pared (8,2) |
| `mnemos_casa_jacinta` | `mnemos_casa_jacinta.js` | 13×11 | 4 | Casa de Jacinta (nota de Nerea) |
| `mnemos_santuario` | `mnemos_santuario.js` | 13×19 | 11 | Santuario de los Glifos (`sala_octogonal` sin su emblema de Poké Ball: cinco losas con glifos en el parqué): dos estelas (traducción parcial; completa con la Clave Glífica), el nicho del cofre, Amaro (**Gardevoirita** tras el P5) |
| `mnemos_archivo` | `mnemos_archivo.js` | 23×17 | 4 | El Archivo de papel: estanterías, escáneres del Consorcio, mesa de lectura. Escalera abajo en (19,4) (se entra desde (18,5) hacia la derecha) |
| `archivo_hondo` | `archivo_hondo.js` + `hondo_build.js` | 46×38 | 11 | La mazmorra: espiral de seis estancias sin suelo más abajo (vacío negro), tono `pilarTone('P5')`. BGM `Emociones`, fondo `Templo` |

Arte propio (PROVISIONAL, D30): `node tools/b10_assets.mjs [--preview]` → `assets/objects/b10_bambu.png`,
`b10_palanca.png` (fila = posición 0–3), `b10_umbral.png` (umbrales bajos: 0–6 umbral glífico con k glifos
encendidos, 8 losa de las Dos Manos), `b10_hueco_rollo.png`, `b10_mural.png`. Los pasos que se abordan desde el norte
usan umbrales de una casilla de alto (un sprite alto taparía al jugador); los del sur, la `losa_dintel` de B02.

## Enlaces

| Desde | Casilla / borde | Hacia | Llegada / notas |
|---|---|---|---|
| Mnemos borde sur | x 30–33, y 43 | `ruta_8_marisma` (B09b) | `south`, offset 0 (`pending_links.js`, `linkIfReady`). **Activo** (registrada) |
| Mnemos borde norte | x 22–24, y 0 | `ruta_9_neblino` (B11) | `north`, offset 0 ↔ `NEBLINO.south` de `maps/b11/layout.js`. **Activo**, pero el muro de niebla (y 4) devuelve a y 15 hasta `p5_restored` |
| Mnemos puertas | Archivo (9,12), Olvido (16,13), Santuario (33,12), té (7,32), herbolario (25,32), Centro (39,35), Jacinta (40,23) | interiores | Archivo cerrado por un evento hasta `b10_archivo_abierto`. Punto de vuelo (39,36) |
| Mnemos casa de Íker | (5,19) | `mnemos_casa_iker` (B11) | evento `ikerDoorEvent` importado de `events/b11_t09.js` |
| `mnemos_archivo` escalera | (19,5) | `archivo_hondo` (4,4) ↓ | vuelta por la escalinata (3–5, 1) pulsando arriba → (18,6) |
| Hondo núcleo | escalera (29,22), pisar (29,20) | `mnemos_archivo` (18,6) | solo tras el P5; la escena del núcleo ya devuelve a la mesa (11,14) |

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| **Llegada con la niebla**: Fausta no recuerda el nombre de la aldea | franja y 37 | `!b10_llegada` | `b10_llegada` |
| El camino del norte da vueltas (muro de niebla) | y 4 | `!p5_restored` | — |
| **Olvido Arrieta** en la plaza: encarga **cinco notas de nombres** (nota en la Libreta) | (19,19) | `b10_llegada` | `b10_olvido_conocida`, `b10_nota_libreta` |
| Notas a Sabina (té; regala **Sinistea** 35), Tomé (herbolario), Jacinta, Amaro (Santuario) y Bruno (estanque), en cualquier orden | varios | nota en mano | `b10_nota_<clave>`, `b10_sinistea` |
| Olvido abre el Archivo | (10,13) | las cinco | `b10_notas_repartidas`, `b10_archivo_abierto` |
| **Cameo de Casia** (Génesis): cuenta células y núcleos; «Nosotros también salvamos lo que se pierde.» Olvido baja por su camino | `mnemos_archivo` (auto) | archivo abierto | `b10_casia`, `b10_olvido_baja` |
| Técnicos Baltasar y Noemí (combates normales, desaparecen tras el P5) | `mnemos_archivo` | — | derrota del entrenador |
| Estancias 1–5 del Hondo (ver abajo) | `archivo_hondo` | en cadena | `b10_suelo`, `b10_manos`, `b10_lectura`, `b10_rollos`, `b10_mural` |
| **Olvido**: «¡Existes! Eres una nota a pie de página que camina.» Combate de guion (Chimecho 38, Beheeyem 38, Bronzong 39, Spiritomb 40) | antesala (24–26, 11–12) | `b10_mural` | `b10_olvido_retada`, `b10_olvido_vencida`. Perder: se cura, vuelve a (25,11), sin perder dinero |
| **Núcleo**: Fragmento 5, verso V completo, Clave Glífica, «…Eres tú.», Gael, inscripción T09, **Trepar**, llamada de Alerce (silencios largos) | pedestal (25,19) | `b10_olvido_vencida` | `p5_restored`, `verse_5`, `GLYPHKEY`, pista T09, hito `climb`, `b10_alerce` |
| **Informe tachado** de la Laguna Clara: «Los tachones también son memoria.» **Piedra Espíritu** | `mnemos_archivo` (auto) | `p5_restored` | `b10_informe`, `b10_piedra_espiritu` |
| La niebla se ha levantado; Ruta 9 abierta | Mnemos al entrar | `p5_restored` | `b10_niebla_levantada` (B11 lo consulta) |

**Mazmorra — reglas** (puras en `content/events/b10_hondo_logic.js`). Cada losa de recuerdo (`pilar_losa_eco`)
reproduce un eco-custodio translúcido las veces que haga falta.
1. **Suelo Olvidado**: rejilla invisible de 9×5; el eco cruza el único camino seguro dejando huellas; pisar fuera
   devuelve al borde (sin daño). Cruzado, el camino queda marcado con glifos.
2. **Dos Manos**: dos ecos tiran de dos palancas de cuatro posiciones hasta dejarlas en 2 y 3; las palancas se quedan
   donde las deja el jugador.
3. **Lectura**: la custodia lee un relato de seis glifos; se tocan en ese orden en el umbral glífico (un error apaga
   todos). El relato se copia en la Libreta.
4. **Rollos**: el eco coloca cuatro rollos de colores en la estantería (verde→3.º, rojo→1.º, ocre→4.º, azul→2.º); un
   error los devuelve a la cesta. C046 en el paso obligatorio de detrás.
5. **Mural**: seis paneles desordenados (`415263`) que se intercambian hasta contar la historia (`123456`); los
   errores no penalizan; cada Tablilla que se tenga añade una pista opcional. Manantial que cura antes de Olvido.

## Células, objetos, entrenadores y regalos

| Código | Clave | Casilla | Dónde |
|---|---|---|---|
| C045 | `cell_mnemos_1` | aldea_mnemos (6,24) | claro del bambú tras la casa de té (entrada por (9,23)) |
| C046 | `cell_memoria_1` | archivo_hondo (7,23) | Estancia de los Rollos, paso obligatorio al Mural |
| C074 | `cell_mnemos_2` | aldea_mnemos (15,28) | islote del estanque (Nadar, etapa F) |

Objetos: Mnemos — Ultra Ball ×2, Hiperpoción (oculta), Revivir, Ocaso Ball ×2 (oculta), Más PP (risco, Trepar).
Hondo — Hechizo, Cura Total (oculta), Ultra Ball ×3, Cuchara Torcida, Máximo Repelente (oculto).
`content/trainers/b10.js`: Médium Tadeo, Exorcista Brígida, Estudiante Delfina (aldea); Investigadora Leonor,
Cerebrito Ismael, Médium Remigio (Hondo); técnicos Baltasar y Noemí (Archivo); Olvido (guardiana).
Regalos: Sinistea (Sabina), Gardevoirita (Amaro, tras el P5), Spiritomb 40 (Losa del Olvido, de noche con la Piedra
Espíritu; si huye, vuelve tras descansar). Árbol de miel (34,27): untado con Miel, tabla `MNEMOS_HONEY`.
Encuentros (`content/encounters/b10.js`): Mnemos día/noche; el Archivo Hondo con Unown en sus 28 formas.

## Pruebas rápidas

Estado base (`B`): `flags=b01_dex_received,b01_left_town,p1_restored,p2_restored,p3_restored,p4_restored,zyg_10,zyg_core_2,b09_gala&fragments=4&zygarde=run,ram,terrain&zcells=44&zcores=2&core=1&noenc=1&party=TORTERRA:48,STARAPTOR:47&debug`
- Llegada: `?scene=map&map=aldea_mnemos&x=31&y=41&dir=8&` + `B`
- Archivo abierto: `?scene=map&map=aldea_mnemos&x=9&y=14&dir=8&` + `B` añadiendo a `flags`
  `b10_llegada,b10_olvido_conocida,b10_nota_sabina,b10_nota_tome,b10_nota_jacinta,b10_nota_amaro,b10_nota_bruno,b10_notas_repartidas,b10_archivo_abierto`
- Archivo Hondo: `?scene=map&map=archivo_hondo&x=4&y=4&dir=2&` + lo anterior + `b10_casia,b10_olvido_baja,b10_hondo_visto`
- Mural y Olvido: `?scene=map&map=archivo_hondo&x=7&y=21&dir=8&` + lo anterior + `b10_suelo,b10_manos,b10_lectura,b10_rollos`
- Mnemos sin niebla: la llegada añadiendo `b10_llegada,p5_restored` a `flags` y con `fragments=5`
- `node --test tests/b10_reach.test.mjs tests/b10_content.test.mjs` · `node tools/preview_map.mjs aldea_mnemos --pass` ·
  **recorrido completo**: `node tools/e2e_b10.mjs` (≈10 min; `--from=archivo|hondo|mural`, `--gender=F`,
  `--no-retry`). Capturas `tools/cache/screens/e2e_b10_*` y transcripción `e2e_b10_dialogos.txt`.

## Coordinación con otros bloques

- **B09b** (Ruta 8 / Marisma Turbia): borde sur de Mnemos x 30–33, offset 0 en ambos sentidos.
- **B11** (Ruta 9 / Bosque Neblino, T09): borde norte x 22–24, offset 0. Mnemos importa de `events/b11_t09.js`
  `ikerDoorEvent` (casa de Íker, (5,19)) y `teaHouseWellEvents` (pozo de la casa de té); los mapas
  `mnemos_casa_iker` y `mnemos_pozo_custodios` son de B11. El flag `b10_niebla_levantada` lo usa su E2E.
- **B06**: los combates de guion usan `scriptedBattle` de `events/b06_common.js`; los entrenadores que se retiran,
  `trainerUntil`.
- Archivos compartidos tocados (aditivo): `tools/preview_map.mjs` (sprites `asset:`, patrón de página, orden en y) y
  `tools/validate_content_lib.mjs` (filas de encuentro como objeto `{species, form, min, max, weight}`).
