# Bloque 3 — Interludio 1: Zaguán, Ruta 2 y llegada a Ciudad Caudal

Guion: `docs/CAMPANA.md` B03 (+ §1.3–1.4, §2.3, §5.5 escena 2, §6.2–6.3), `docs/TABLILLAS.md` T01 (y la pista inicial
de T02), `docs/POKEDEX_DISTRIBUCION.md` §7.3 (Villa Zaguán y Ruta 2, Ciudad Caudal) y §7.4 (Repartir Exp, Caña Vieja).
Coordenadas en casillas (x → derecha, y → abajo). **Fuente única de Caudal:** `caudal_layout.js`.

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_2` | `ruta_2.js` | 30×70 | 1 | Pradera con cercado de Wooloo, dos arroyos con puentes de tablones, estanque (Caña Vieja; Nadar), alto con rampa de grava (Correr), árbol de miel |
| `ciudad_caudal` | `ciudad_caudal.js` + `ciudad_caudal_build.js` + `caudal_layout.js` | 64×56 | 3 | Río Albo, puente dorado de la entrada, Esclusa mayor, Canal de los Molinos y del Mercado, plaza, Barrio bajo, estación, Jardín del Canal |
| `caudal_centro` | `caudal_centro.js` | 19×14 | 4 | Plantilla `pokemonCenterMap` (curación, PC, tienda, descanso) |
| `caudal_tienda` | `caudal_tienda.js` | 15×12 | 4 | Plantilla `shopMap` (general + Malla Ball y Miel) |
| `caudal_esclusas` | `caudal_esclusas.js` | 15×12 | 4 | Casa de las Esclusas: Leandro Alcántara (antes de B04) y su aprendiz |
| `caudal_molino` | `caudal_molino.js` | 15×12 | 4 | Molino harinero: rueda por dentro (a trompicones hasta P2), molineros (2 Mieles) |
| `caudal_casa_bajo` | `caudal_casa_bajo.js` | 13×11 | 4 | Casa del Barrio bajo: charcos de día y sacos hasta P2 |
| `caudal_estacion` | `caudal_estacion.js` | 27×17 | 4 | Stamp `estacion_tren`; taquilla `stationEvent('caudal')` (suspendida hasta P4) |

Arte propio (PROVISIONAL, D30) de `node tools/b03_assets.mjs [--preview]` → `assets/objects/noria.png` (rueda de molino:
dir 2 gira · 4 parada · 6 al revés · 8 a trompicones), `compuerta.png` (tramos de compuerta con rebose) y
`b03_objetos.png` (hierba muerta, banco de piedra en 3 piezas, sacos, tierra/hoyo/brote, charcos, cuerda, hierba nueva).

## Enlaces

| Desde | Casillas | Hacia | Estado |
|---|---|---|---|
| `ruta_2` norte | x 13–16, `offset −5` | `villa_zaguan` (B02, sur x 18–21, `offset 5`) | activo (se abre solo con `maps/b03/pending_links.js`) |
| `ruta_2` sur | x 13–16, `offset −17` | `ciudad_caudal` norte x 30–33 (`offset 17`) | activo |
| `ciudad_caudal` oeste | sendero y 3–5, río y 10–13, `offset −29` | `ruta_3` (B04): su camino este y 32–34 y su Albo y 39–42 (`east`, `offset 29`) | activo si `ruta_3` está registrada (B04 debe poner la vuelta) |
| `ciudad_caudal` este | y 29–30, `offset 15` | `ruta_4` (B05, oeste y 14–15, `offset −15`) | activo si `ruta_4` está registrada; si no, aviso «vega inundada» |
| `ciudad_caudal` sur | x 44–47, `offset 30` | `senda_mirador` (B17/B18, norte x 14–17, `offset −30`) | cerrado con verja y cartel hasta que exista; la verja desaparece sola |

Puertas de Caudal (warp en la casilla de la puerta; se sale a la casilla de debajo):

| Edificio | Puerta | Interior (llegada) |
|---|---|---|
| Centro Pokémon | (20,24) | `caudal_centro` (9,12) |
| Tienda «MART» | (41,29) | `caudal_tienda` (4,9) |
| Casa de las Esclusas | (44,7) | `caudal_esclusas` (7,10) |
| Molino harinero | (5,23) | `caudal_molino` (7,10) |
| Casa del Barrio bajo | (29,47) | `caudal_casa_bajo` (6,9) |
| Estación | (57,43) y (58,43) | `caudal_estacion` (13,15) / (14,15) — el vano oscuro tiene dos casillas; la fila 9 del stamp `grandes_almacenes` no es transitable, la puerta real es la fila 10 |
| Molino del Diezmo | (14,35) | `molino_diezmo` (7,10) (B05; `maps/b05/links.js` MOLINO_DOOR ya lo usa). Cerrado con aviso mientras no exista |

Otros puntos: Punto de Vuelo (20,25) (`flyPoint`); llegada del tren (57,44) (`world/transport.js`, `TRAIN.caudal`);
plaza y rosetón (29–33, 20–23) para la escena de B04 (`events/b04_caudal.js`, que B04 ya añade a la definición).

## Células (CAMPANA §2.3, `events/b03_common.js` B03_CELLS)

| Código | Clave | Mapa (casilla) | Etapa | Dónde |
|---|---|---|---|---|
| C013 | `cell_ruta_2_1` | ruta_2 (16,18) | A | bajo el puente del primer arroyo, en la orilla de guijarros |
| C015 | `cell_ruta_2_2` | ruta_2 (4,38) | B | alto de la rampa de grava (`gravelSlope`: montado en el 10 %) |
| C070 | `cell_zaguan_3` | ruta_2 (23,31) | F | estanque (Nadar) |
| C014 | `cell_caudal_1` | ciudad_caudal (39,11) | A | pasarela de la Esclusa mayor; aparece tras la escena de Gael («se me escapó… hacia ti») |
| C068 | `cell_caudal_2` | ciudad_caudal (33,42) | F | canal del Mercado junto al tercer puente (Nadar; se entra al agua desde el embarcadero) |

## Escenas y flags

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| T01: segunda pista (el jardinero) | `villa_zaguan` (16,15) | `p1_restored` | `b03_t01_jardinero`, `advanceClue('T01', 2)` |
| T01: vista cenital de la espiral | campana de `villa_zaguan` (35–36,9) | `p1_restored` | `b03_t01_vista` (y la segunda pista si faltaba) |
| T01: latido del Core, excavación, Tabla Pradal | banco de piedra (14–16,13) | `b03_t01_vista` | `giveTablet('MEADOWPLATE')` (Crónica I, cierra T01), `b03_t01_tablilla` |
| T01: Mirta regala la Semilla Milagro | (11,13) | `b03_t01_tablilla` | `b03_t01_semilla` |
| Lía: Repartir Exp | `zaguan_centro` (4,7) | `p1_restored` y sin `b03_lia_repartir` | `b03_lia_repartir` |
| Gael B2 + llamada de Alerce | boca norte de Caudal (y 1, x 28–35: Gael llama y el jugador baja al puente, (31,8)) o extremos del puente dorado (29–33, 9 ó 14) | sin `b03_gael_b2` | `b03_gael_b2` (salida), `b03_gael_b2_ganado`, `b03_llamada_alerce` |
| Anselmo: pista T02 | Caudal (16,38) | — | `b03_anselmo_t02`, `openClue('T02')` |
| Caña Vieja | pescador del embarcadero (37,41) | — | `b03_cana_vieja`, `OLDROD` |
| Gyaradosita (POKEDEX §7.7) | el mismo pescador | Caña Vieja dada y Nadar de Zygarde | `b03_gyaradosita`, `GYARADOSITE` |
| Leandro | `caudal_esclusas` (7,5) | antes / después de `p2_restored` | `b03_leandro_visto` |

**Cambios en el mundo:** con `b03_t01_tablilla` la hierba muerta de la Arboleda pasa a hierba nueva con flores y
aparece un brote. En Caudal (reloj de juego, TEC-06): de día charcos en el Barrio bajo y ruedas a trompicones, de noche
ruedas paradas (un evento paralelo refresca las páginas al cambiar día/noche); la del Diezmo no gira nunca antes de P2
(«el río ya no lo mueve», Anselmo). Con `p2_restored` (B04) desaparecen charcos y sacos, las ruedas giran y los vecinos
cambian de frase; la del Diezmo gira al revés hasta que el jugador tiene la `SPLASHPLATE` (T02, B05). Árbol de miel (Ruta 2, tronco en (10,37)): se unta Miel y hay Pokémon tras un descanso
(var `rest_count`).

**Reintentos sin pérdida:** Gael B2 tiene `canLose` (si se pierde, cura y la historia sigue con otra frase, §2.6); T01
no tiene estado de fallo; los regalos esperan a recogerse.

**Integración con B02 (ediciones mínimas en sus archivos):** `maps/b02/villa_zaguan.js` usa
`events: withT01(zaguanEvents(…))` (quita su banco y su campana genéricos `banco_piedra*`, `campana_0/1` y añade el
arco T01 en las mismas casillas); `maps/b02/zaguan_centro.js` añade `...liaCentroEvents()`. Las posiciones salen de
`ARBOLEDA` y `CAMPANARIO` de `villa_zaguan_layout.js`.

## Decisiones y notas

- **Repartir Exp:** en los datos de Añil `EXPSHARE` es equipable (bolsillo 1). «Desactivable» = quitárselo al Pokémon;
  el Repartir Exp general de gen. 6 necesitaría tocar `battle/scene/setup.js` (`player.expAll`): pendiente.
- **La célula de Gael:** «Se me escapó de las manos… hacia ti» se escenifica con el brillo que sale de su mano hacia el
  jugador y cae en la Esclusa mayor, donde el registro sitúa C014.
- Bajo puentes, pasarelas y embarcaderos (también el del estanque de la Ruta 2) la capa 0 no es agua (como en la Ciudad
  Azulona de Añil): así no salta el aviso de nadar al pulsar A a lo largo del tablero.
- **Sin rodeos al B2:** toda llegada desde la Ruta 2 pisa la boca norte (y 1, x 28–35), donde Gael llama desde el
  puente; antes se podía cruzar el río por las pasarelas de la esclusa (o irse a la Ruta 3) sin la escena. Bordes
  cerrados: el oeste solo se abre en el sendero de la ribera (y 3–5) y el río; la orilla x 48 junto a la verja de la
  Senda del Mirador está vallada (el enlace futuro solo entra por x 44–47).

## Pruebas rápidas

- Entrada del bloque (B01 y B02 hechos): añadir a cualquier URL
  `&party=TURTWIG:16,STARLY:13&flags=b01_dex_received,b01_left_town,b02_centro_tutorial,b02_libreta,p1_restored,zyg_10&vars=starter:TURTWIG,gael_starter:LITTEN&zygarde=run&zform=10&zcells=12&debug`
- T01: `?scene=map&map=villa_zaguan&x=19&y=14&dir=4` + lo anterior.
- Ruta 2: `?scene=map&map=ruta_2&x=14&y=2&dir=2` + lo anterior (con `zygarde=all` se puede nadar a C070).
- Gael en el puente: `?scene=map&map=ciudad_caudal&x=31&y=5&dir=2` + lo anterior.
- De noche: `&time=23`. Tras P2: `&flags=…,p2_restored`.
- `node --test tests/content_b03.test.mjs` · `node tools/validate_content.mjs` ·
  **recorrido completo**: `node tools/e2e_b03.mjs [--desde=zaguan|ruta2|caudal]` (≈5 min, capturas
  `tools/cache/screens/e2e_b03_*`).
