# Bloque 19 — Interludio 9: la Calzada del Rey (T15)

Guion: `docs/CAMPANA.md` «B19» (+ §1.4 Sima del Eje, §2.3 —ninguna célula en zonas de Forma Completa—, §2.5 G14, §2.6
reintentos, §5.5 escalón 9 de Alerce), `docs/TABLILLAS.md` T15 y Crónica XV, `docs/POKEDEX_DISTRIBUCION.md` §7.1 y §7.3
(«Calzada del Rey», «Sima del Eje», Salamence Alfa, Salamencita, Metagrossita), `docs/BALANCE.md`.
Entrada: `p9_restored` (Reconstrucción y Vuelo; nivel ~66). Salida: **`b19_calzada`** (la Calzada llega a la Puerta de las
Quince; `content/story/journal.js`).

**Fuentes únicas de coordenadas:** `calzada_layout.js`, `taller_layout.js`, `sima_layout.js`; tramos en
`content/events/b19_spans_logic.js`; enlaces con otros bloques en `links.js`.

## Mapas

| id | Archivos | Tamaño | TS | Qué es |
|---|---|---|---|---|
| `calzada_rey` | `calzada_rey.js` + `_layout` + `_build` + `calzada_patch.js` | 48×62 | 1 | Brazo este de la Sima. Sur: sendero de la Ruta 7, Mirador de la Calzada (plaza de estrado con estela) y campamento de los Peregrinos del Rey (tiendas, estandartes, hoguera, puesto, trozo del Resonador). Centro: el vacío de borde a borde (panorama `sima`) con las pilas A y B, agujas lejanas y los tres tramos. Norte: la Peña del Rey (risco con el taller y la Puerta de la Bajada, calzada antigua, ruinas, estela) y la cima del Salamence Alfa. |
| `calzada_taller` | `calzada_taller.js` + `taller_layout.js` | 19×15 | 2 | Taller del Rey: cama de piedra, banco con cinceles, sillares hexagonales, losa con el puente grabado y cientos de rayas, herramientas; la Tabla Draco en su hornacina. |
| `sima_eje` | `sima_eje.js` + `_layout` + `_build` | 40×56 | 1 | Oeste: cornisa desde la Senda del Mirador, Repisa Norte (estela), sendero con un hueco (Reconstrucción, G14), rellano de la Metagrossita (hueco propio) y cornisa al Mirador Sur. Este: Puerta de la Bajada y la Calzada del Rey, que baja por escaleras y dos rellanos hasta un último tramo roto. Centro: el Umbral ante la roca de la Puerta de las Quince. |

Tiles propios: ninguno nuevo en los atlas. `tiles.js` (estrado de la Calzada, escaleras, zócalos del kit, vacío 503,
suelo invisible 391) y `rim.js` (vacío + bordes de roca, copia del lenguaje de `b17/rim.js` para no depender de un
módulo que otro bloque edita). Arte propio (PROVISIONAL, D30): `node tools/b19_assets.mjs [--preview]` →
`objects/b19_piedra.png` (losa forzada: flota / se agrieta), `b19_aguja.png` (aguja dormida / despierta),
`b19_resonador.png` (activo / apagado), `b19_estandarte.png`, `b19_tablilla.png` (Tabla Draco / hornacina vacía),
`b19_taller.png` (piezas del taller). El abismo usa el panorama procedural `sima` de B18 (`render/panorama.js`).

## Enlaces

| Desde | Casilla | Hacia | Notas |
|---|---|---|---|
| `calzada_rey` borde sur | x 2–5 | `ruta_7` (B09a) | Conexión `south`, offset −58 (la Ruta 7 conecta `north`, +58, `b09a/links.js`: se abre sola al registrarse este mapa). |
| `calzada_rey` taller | empujar ↑ en (21,4) | `calzada_taller` (9,12) ↑ | Vuelta: claridad (9,13) empujando ↓ → (21,5) ↓. |
| `calzada_rey` Puerta de la Bajada | empujar ↑ en (5,4) | `sima_eje` (35,6) ↓ | Vuelta: boca (35,5) empujando ↑ → (5,5) ↓. |
| `sima_eje` cornisa norte | (11–12, 0) pulsando ↑ | `senda_mirador` (B17) (x, 48) ↑ | **Warps, no conexión**: los bordes de la Sima los ocupa el Puente de B18 (`b17/links.js`). En la Senda, B19 añadió (aditivo) `warps: descentWarps('senda_mirador')`: (11–12, 49) pulsando ↓ → aquí (x, 1) ↓. |
| `sima_eje` cornisa sur | (3–4, 55) pulsando ↓ | `mirador_sur` (B17) (x, 1) ↓ | Igual: en el Mirador Sur, `warps: descentWarps('mirador_sur')`: (3–4, 0) pulsando ↑ → aquí (x, 54) ↑. |
| `sima_eje` Umbral | empujar ↑ en (18,37) | `puerta_quince` (B20) (16,31) ↑ | Solo si `puerta_quince` está registrado (si no, la puerta de piedra no se abre). **B20** vuelve a `def.puertaQuinceArrival` = (18,38) ↓ (`b20_puerta.js#toSima`). |

## Secuencia, flags y reintentos (`content/events/b19_common.js`)

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Antes del P9: Leocadia, «Casandra se ha ido a Lúmina… máquinas que hacen cantar a las piedras» (sin piedras) | franja del sendero (2–5, 55) | `!p9_restored` | `b19_llegada_antes` |
| Bienvenida de Leocadia; pista T15 (descubrimiento directo si hacía falta) | misma franja | `p9_restored` | `b19_llegada` |
| Casandra junto al trozo del Resonador: el mito del Rey «traicionado»; **segunda pista T15**; Tadeo deja pasar; Zygarde explica las piedras forzadas | (22,42), hablar desde (22,43) | — | `b19_casandra_intro`, `b19_tramo_tutorial` |
| **Tramos 1–3** (ver abajo) | brazo de la Sima | `b19_casandra_intro` / el tramo anterior | `b19_tramo_1..3`; vars `b19_tramo_<n>_caidas`, `_pie`, `_listo`, `b19_derrumbes`; `b19_derrumbe_visto` |
| Casandra cruza con su Noivern y reta al jugador (Druddigon 63, Noivern 63, Shelgon 64, Kommo-o 65; `bossBattle`) | al alzar el tramo 3; revancha pisando (33–35, 14) | — | `b19_casandra_llega` → `b19_casandra_vencida`. Perder: curado en (34,17) ↑, se vuelve a hablar/pisar la franja |
| Taller del Rey: **Tabla Draco** (`giveTablet` → Crónica XV, cierra T15), lectura, Casandra, **Salamencita**, se apaga el Resonador, parte de los Peregrinos se queda | hornacina (9,3), desde (9,4) ↑ | `b19_casandra_vencida` (paso) | `b19_taller_visto`, `b19_tablilla`, `b19_salamencita`, `b19_resonador_apagado`, `b19_cuidadores` |
| **Alerce, antes de la bajada**: cura al equipo; «Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir.»; después espera junto a la Bajada (cura si se le habla) | al salir del taller | `b19_tablilla` | `b19_alerce` |
| Salamence Alfa nv 64 (captura opcional; reaparece al descansar en la hoguera) | cima (44,3) | — | `b19_alfa` (+ `b19_alfa_capturado`), var `b19_alfa_descanso` |
| Sima: llegada | cualquier entrada | — | `b19_sima_llegada` |
| Fin de la Calzada sin la Tablilla: «Falta un trozo del camino» | (31–33, 40) | `!b19_tablilla` | `b19_sima_camino_incompleto` |
| Con la Tabla Draco el zócalo del borde brilla y se alza el **último tramo** | zócalo (27,42), desde (28,42) ← | `b19_tablilla` | `b19_sima_camino_completo`, `b19_sima_ultimo_tramo` |
| El Umbral: «Aquí termina la Calzada del Rey»; aviso si faltan Tablillas | (24, 41–43) | último tramo | **`b19_calzada`** |
| Sendero del oeste (G14) y rellano de la Metagrossita | zócalos (4,24)/(4,27) y (6,31) | Reconstrucción | `b19_sima_paso`; self switch A de `sima_zocalo_rellano` |

**Los tramos (puzzle de T15, «estabilizar los tramos con la Reconstrucción auténtica en tres puntos»).** Reglas puras en
`content/events/b19_spans_logic.js`, eventos en `b19_spans.js`. Los Peregrinos alzan a la fuerza piedras de la Calzada
con el trozo del Resonador: cada piedra (evento sobre el vacío que escribe un suelo invisible) aguanta **un paso** y cae
al dejarla. La Calzada de verdad sigue debajo y no encaja mientras quede una forzada: hay que pisarlas **todas, una
vez cada una**, y acabar junto a la **aguja** (la aguja despierta); A → la Reconstrucción alza el tramo entero
(parche persistente de `calzada_patch.js`, página «estabilizado» de la aguja). Cada tramo tiene **una sola solución**
(test). Sin salida → el tramo se hunde, Zygarde sostiene al jugador y lo devuelve al borde (`b19_derrumbes`); volver a
la orilla también reinicia las piedras (**tramos reiniciables**); al entrar en el mapa se reinician los tramos a medias.

**Reintentos (§2.6).** Casandra y el Alfa usan el helper común `bossBattle` (`canLose` + `noMoneyLoss`): sin derrota
general, curados y a su casilla. El Alfa vencido sin capturar vuelve tras descansar (`rest_count`). Hoguera de los
Peregrinos = descanso de campamento (`runRest({ kind: 'camp' })`).

**Cambios en el mundo (flags que otros consultan).** `b19_calzada` (entrada de B20; Diario). `b19_cuidadores`: los
Peregrinos que se quedan cambian sus frases (estandartes, campamento, entrenadores); `b19_resonador_apagado`: el trozo del
Resonador queda apagado. La Ruta 7 abre su camino norte (B09a) y la Senda del Mirador y el Mirador Sur sus bajadas (B17).

## Células, objetos, entrenadores y encuentros

Sin células (CAMPANA §2.3: ninguna en zonas de Forma Completa). Objetos: Calzada `DRAGONSCALE` (pila A), `MAXREVIVE`
(pila B), `RARECANDY` (Peña), `PPUP` (cima), `FULLRESTORE` oculto (pila A, esquina suroeste), `ULTRABALL`×3 (sendero);
Sima **`METAGROSSITE`** (rellano), `MAXREVIVE`, `STARPIECE` oculto, `FULLRESTORE`, `ULTRABALL`×3 (Umbral), `PPUP`.
Regalos: **Salamencita** (Casandra, T15). Puesto del Peregrino (`CAMP_STOCK`: Ultra Ball, Hiperpoción, Poción Máxima,
Cura Total, Revivir, Repelente Máximo) filtrado por la tienda general del progreso (`campStock`: el campamento se visita
desde el P4 por la Ruta 7 y no adelanta objetos). Entrenadores (`content/trainers/b19.js`, 62–64, dinero de BALANCE):
Peregrinos Ciriaco y Benigna (pila A), Nicanor y Úrsula (pila B), veterano Isidro (Peña), Olaya y Ruperto (Sima, oeste)
y Casandra (guion). Encuentros (`content/encounters/b19.js`, cueva/ruina de POKEDEX §7.3) por zonas: pilas, Peña y cima
(Calzada, 60–64); cornisas, sendero, rellanos y la calzada de la Sima (60–65); nunca el campamento, los tramos ni el
Umbral (x 11–24 desde la fila 30 queda fuera de las zonas).

**Visita temprana (antes del P9).** La Ruta 7 abre su camino norte al existir este mapa (desde el P4). En el Mirador no
hay piedras ni Resonador; Leocadia recibe al jugador y su frase depende de la época (antes del P8: Casandra ha ido a
Lúmina «porque la tierra anda revuelta»; tras el P8, Genesis ya ocupa el Mirador Sur: «máquinas que hacen cantar a las
piedras»). La estela del Mirador solo se lee con la Clave Glífica (P5).

## Pruebas rápidas

Base `B` = `party=GARCHOMP:82,METAGROSS:80,DRAGONITE:80,LUCARIO:80&fragments=9&noenc=1&core=1&zygarde=all&zcells=100&zcores=5&vars=starter:TURTWIG,gael_starter:LITTEN&flags=b01_dex_received,b02_libreta,p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,p7_restored,p8_restored,p9_restored,zyg_10,zyg_50,zyg_complete,zyg_core_2,zyg_core_3,zyg_core_4,zyg_core_5,zyg_rebuild_tutorial&debug`

- Llegada desde la Ruta 7: `/?scene=map&map=calzada_rey&x=3&y=60&dir=8&` + `B`
- Primer tramo: `/?scene=map&map=calzada_rey&x=13&y=42&dir=8&` + `B` (añadir `,b19_llegada,b19_casandra_intro` a `flags`)
- Casandra (tramo 3): `x=34&y=23` con `…,b19_tramo_1,b19_tramo_2` en `flags`
- Taller: `/?scene=map&map=calzada_taller&x=9&y=12&dir=8&` + `B` con `…,b19_tramo_3,b19_casandra_llega,b19_casandra_vencida`
- Sima desde la Bajada: `/?scene=map&map=sima_eje&x=35&y=6&dir=2&` + `B` (con `,b19_tablilla` para el último tramo)
- `node --test tests/b19_content.test.mjs tests/b19_reach.test.mjs` · `node tools/validate_content.mjs` ·
  `node tools/preview_map.mjs calzada_rey --pass` · **recorrido completo**: `node tools/e2e_b19.mjs` (≈6 min;
  `--from=<tramo>` / `--only=<tramo>` con tramos `antes llegada tramo1 tramo2 tramo3 taller alfa bajada oeste`;
  `--no-retry` sin la derrota simulada contra Casandra). Capturas `tools/cache/screens/e2e_b19_*`, transcripción
  `e2e_b19_dialogos.txt`.

## Coordinación y archivos compartidos

- **B17** (Senda del Mirador, Mirador Sur): edición mínima y aditiva en `b17/senda_mirador.js` y `b17/mirador_sur.js`:
  import de `descentWarps` (`b19/links.js`) y `warps: descentWarps('<id>')` (los warps al final de sus bajadas que su
  `links.js` pide a B19). Sus avisos de «bajada cerrada» desaparecen solos al existir `sima_eje`.
- **B20**: `sima_eje` declara `puertaQuinceArrival` (18,38) ↓; el warp del Umbral va a `PUERTA.arrive` (16,31) ↑.
- **B09a**: nada que tocar (su `links.js` ya abría la Ruta 7 al registrarse `calzada_rey`).
- `content/services/zones.js`: `calzada_taller` en el grupo de la Calzada (nombre «Taller del Rey», fondo Cueva).
- Textos DECIDIDO-DEV a revisar por el autor: todos los diálogos de Peregrinos (Leocadia, Tadeo, Tarsicio, la cocinera,
  el niño, el mercader, los entrenadores y cuidadores), el mito del Rey que cuentan, Casandra (presentación, duelo,
  reacción a la Crónica, la Salamencita que su Noivern trajo «del nido de la cima»), las inscripciones de las estelas
  (Mirador, Peña, Repisa, Umbral), las líneas de Zygarde, las de Alerce que rodean la línea de CAMPANA y la explicación
  de las piedras forzadas. **Regla de los Peregrinos** (coherencia interna): «al taller del Rey se llega por su
  Calzada, a pie, o no se llega»; por eso nunca cruzaron volando pese a tener Pokémon voladores, y Casandra la rompe
  por primera vez al ver la luz verde (cruza con su Noivern). Registrado en `docs/DECISIONES.md` (X31). Canon literal: la Crónica XV, «Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir.»,
  el equipo de Casandra, el Salamence Alfa 64 y la pista inicial/segunda de T15 (`content/story/clues.js`).
