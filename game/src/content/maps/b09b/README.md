# Bloque 9b — Interludio 4B: Ruta 8 (Marisma y Palafitos), Ciudad Nexo, Ruta 15 y Caleta Sonda

Guion: `docs/CAMPANA.md` «B09» (parte B), §1.3 (Nexo, Caleta Sonda), §1.4 (Ruta 8, Ruta 15), §2.3 (C044, C064, C072,
C075, C086), §2.5 (puertas G5 barro y G9 agua profunda), §2.6 (reintentos) y §5.5 (escalón 4 de Alerce).
`docs/TABLILLAS.md` T08 (arco completo), T11 y T12 (pistas en cola hasta Nadar). Encuentros:
`docs/POKEDEX_DISTRIBUCION.md` §7.3. Dinero: `docs/BALANCE.md` (`content/trainerMoney.js`).
**Fuentes únicas de coordenadas:** `ruta_8_layout.js`, `nexo_layout.js`, `ruta_15_layout.js`, `caleta_layout.js`,
`caleta_algas_layout.js`; enlaces con otros bloques en `links.js`.

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_8_marisma` | `ruta_8_marisma.js` + `_layout` + `_build` | 50×70 | 6 | Antigua Laguna Clara: dos pasos de barro (Terreno complicado) hacia Lúmina (SE) y Mnemos (N), Palafitos sobre islotes y pilotes, tres llanuras de barro con bombas de Genesis, 6 estacas, 4 pozas, juncales (lluvia: Goomy) |
| `palafitos_remedios` | `palafitos_remedios.js` | 13×11 | 4 | Casa de Doña Remedios: cura y fija el punto de cura en (6,6) |
| `palafitos_casa` | `palafitos_casa.js` | 13×11 | 4 | Familia de los Palafitos |
| `ciudad_nexo` | `ciudad_nexo.js` + `nexo_layout.js` + `nexo_build.js` + `nexo_pieces.js` | 64×52 | 1 | Puerto: estación de tren, Correos, Centro, tienda, plaza del mercado (4 puestos), Aduana Vieja (cerrada, DLC 2), astillero, faro en el espigón, pantalán del pescador, embarcadero del ferri con el yate amarrado, plataforma del Consorcio (Talasa) mar adentro, desembocadura del Albo (C075) |
| `nexo_centro`, `nexo_tienda` | plantillas de `services/` | — | 4 | Centro (marinera, viajero) y tienda (+ Red/Buceo Ball) |
| `nexo_estacion` | `nexo_estacion.js` | 27×17 | 4 | Estación: tren de `world/transport.js`, parada `nexo` (tras P4) |
| `nexo_correos` | `nexo_correos.js` | 15×12 | 4 | Don Evaristo tras el mostrador (evento `evaristo`, gancho de T14 para B16) |
| `nexo_casa_pescador`, `nexo_astillero`, `nexo_faro` | uno por interior | 13×11 / 27×21 / 13×11 | 4 | Astillero (Scizorita en el taller, (21,15)), faro con catalejo hacia la plataforma |
| `ruta_15` | `ruta_15.js` + `_layout` + `_build` | 90×40 | 1 | Sendero de los Acantilados: meseta con pinos y mirador; dos escaleras bajan a las calas; pantalán de los pescadores; rocas con Binacle visibles |
| `caleta_sonda` | `caleta_sonda.js` + `_layout` + `_build` | 36×32 | 1 | Meseta con el Centro, Faro Sonda (Ramón), tienda de pesca (Supercaña), casa de los buzos, playa, embarcadero del ferri, muelle de buzos, remolino del bosque de algas |
| `caleta_centro`, `caleta_tienda` | plantillas de `services/` | — | 4 | Centro pequeño; tienda de pesca (lista `fishing`) con el pescador de la Supercaña |
| `caleta_faro`, `caleta_casa_buzos` | uno por interior | 13×11 | 4 | Ramón (T11); buzos |
| `caleta_algas` | `caleta_algas.js` + `_layout` | 28×20 | 15 | Bosque de algas bajo la caleta (Buceo): C086, respiradero, Perla Grande oculta |

Arte propio (PROVISIONAL): `node tools/b09b_assets.mjs [--preview]` → `assets/objects/b09b_bomba.png` (fila 2 en
marcha, 4 parada), `b09b_estaca.png` (fila 2 sin leer; fila 4 patrones 0–3 = lecturas 1–4; fila 6 = 5),
`b09b_lodo.png` (2 burbujea, 4 calma, 6 losa, 8 hueco), `b09b_plataforma.png`, `b09b_prismaticos.png`,
`b09b_maletin.png`, `b09b_boya.png`.

## Enlaces

| Desde | Casilla / borde | Hacia | Estado |
|---|---|---|---|
| `ruta_8_marisma` borde este | filas 63–66 | `ciudad_lumina` (B09a) `east`, offset 54 | **activo**; Lúmina conecta `west`, −54 (filas 9–12) |
| `ruta_8_marisma` borde norte | x 30–33 | `aldea_mnemos` (B10) `north`, offset 0 | **activo**; Mnemos conecta `south`, 0 |
| `ciudad_nexo` borde norte | x 30–33 | `ruta_14_reserva` (B09a) `north`, offset 2 | **activo**; la Ruta 14 conecta `south`, −2 (x 28–31) |
| `ciudad_nexo` borde oeste | filas 20–23 | `ruta_15` `west`, offset 6 | interno (vuelta `east`, −6: filas 14–17 de la Ruta 15) |
| `ruta_15` borde oeste | filas 12–15 | `caleta_sonda` `west`, offset 2 | interno (vuelta `east`, −2: filas 10–13 de Caleta) |
| `ciudad_nexo` sur (y 51) · `ruta_15` sur (y 39) · `caleta_sonda` sur (y 31) | mar abierto | `mar_del_sur` (B13) `south`, offsets −126, −36 y 0 (`links.js`) | **activo** (B13): el mar conecta `north` con 126, 36 y 0 (ver `maps/b13/README.md`). El borde este de Nexo y el oeste de Caleta quedan como límite del mapa |
| Puertas | empujar desde la casilla de debajo | interiores | Remedios (17,30), familia (29,30); Nexo: estación (8,12), Correos (21,10), Centro (39,11), tienda (48,9), casa del pescador (15,29), astillero (50,30), faro (46,46); Caleta: Centro (30,9), tienda (13,8), faro (4,11), buzos (16,16) |
| Interiores | felpudo, pulsar ↓ | exterior | una casilla bajo la puerta (test «puertas de ida y vuelta») |
| `caleta_sonda` remolino | (31,28), Buceo | `caleta_algas` (5,10) | vuelta por la superficie en (5,10) |
| Transporte | `world/transport.js` | tren / ferri | tren: llegada a Nexo (8,13) ↓ (tras P4). Ferri: Nexo (26,40) ↓, Caleta (10,26) ↓ (tras P7) |

Puntos de Vuelo: Nexo (39,12), Caleta Sonda (30,10).

## Arco T08 «La laguna que fue clara» (Ruta 8)

| Paso | Dónde | Condición | Pone |
|---|---|---|---|
| Llegada: golpeteo de las bombas; el Core: «El agua de aquí está enferma.» | franja x 47, y 62–67 | `!b09_marisma_llegada` | `b09_marisma_llegada` |
| **Doña Remedios**: cura, fija el punto de cura y da la **segunda pista de T08** (descubrimiento directo si no estaba abierta) | `palafitos_remedios` (6,5) | — | `b09_t08_remedios`, T08 paso 2 |
| **Alerce** llega por el puente: «Quería ver el agua con mis propios ojos.» / «No. Las muestras las tomo yo.»; carga el lector en la Pokédex | al salir de la casa (17,31) | remedios y `!alerce` | `b09_t08_alerce` |
| **Tres técnicos de Genesis** (combates de guion, `bossBattle`, reintento sin pérdida en su casilla `front`: delante de los dos que miran al sur y a la espalda del que mira al oeste, (17,16)) | bombas (35,45), (40,10), (15,14); técnicos (36,47), (41,12), (16,16) | vista 3 | `b09_t08_bomba_1..3`, `b09_t08_bombas` |
| **Seis estacas**: con Alerce y las bombas paradas, nivel 1–5 según la distancia a la poza del origen | (36,53) (15,47) (44,30) (5,35) (28,12) (20,10) | — | `b09_t08_lectura_n`, `b09_t08_lecturas` |
| Resumen de Alerce (sin revelar la poza) | puesto (33,37) | — | — |
| **Pozas**: sin lecturas no se remueve; la equivocada no penaliza; la del origen (q3) da la **Tabla Tóxica** | q1 (13,18), q2 (43,13), **q3 (24,17)**, q4 (8,49) | Terreno complicado | `b09_t08_tablilla`, TOXICPLATE |
| Escena de la tarde (18:00): Remedios «Hace dieciséis años vinieron unos señores a medir la laguna, con aparatos como ese.» / Alerce «Son aparatos corrientes.»; los jóvenes se quedan; 2 Hierbas Revivir | islote grande (32,37) | tablilla | **`b09_marisma_sana`** (cambio del mundo), `b09_t08_regalo_remedios` |

Cambio del mundo con `b09_marisma_sana`: las bombas quedan paradas, los técnicos se van, desaparece la espuma, las
pozas se calman (la del origen queda como hueco), los vecinos y el cartel del Consorcio cambian de texto. Si la
partida se corta entre la Tablilla y la escena, `marismaOnEnter` repite la escena al volver. La escena es «esa tarde»:
a las 18:00 (si la losa sale de noche, a la tarde siguiente; entre las 17 y las 20 no se toca el reloj).

Orden libre: las bombas se pueden parar antes de hablar con Remedios (aviso neutro, sin el lector de la Pokédex, y
Alerce ya no pide pararlas al llegar). Una poza equivocada ya removida no vuelve a preguntar.

Decorado: las plantas de agua de ExteriorSafari (`helechos` = juncos, `matas_redondas` = nenúfares) llevan fondo de
agua y son transitables, así que solo van dentro del agua y sin tocar ninguna casilla pisable (`ruta_8_build.js`).

## Nexo, Ruta 15 y Caleta

| Qué | Dónde | Pone / efecto |
|---|---|---|
| Pescador del pantalán: **Caña Buena** | Nexo (13,45) | `b09_nexo_cana_buena`, GOODROD |
| Puesto de los herreros: pista **T12** (en cola hasta Nadar; el Core lo dice) | Nexo, se habla desde (36,23) | `b09_nexo_mercado_t12` |
| Prismáticos del muelle / catalejo del faro: la **plataforma del Consorcio** (Talasa, B13) | Nexo (24,48) / `nexo_faro` (6,3) | `b09_nexo_talasa_vista` |
| Ferri parado hasta P7; Aduana Vieja cerrada (DLC 2); casco del yate examinable (bloquea nadar dentro) | Nexo | — |
| Pescadora de las mareas (barco de velas cuadradas: anticipa P7) | Ruta 15 (64,36) | `b09_r15_mareas` |
| Binacle visibles en las rocas (Barbaracle 3 %), reaparecen al descansar (`rest_count`) | Ruta 15 (6,30) (52,30) (86,36); Caleta (3,21) (35,24) | `b09_roca_<id>` |
| Pescador de la tienda: **Supercaña** | `caleta_tienda` (3,6) | `b09_caleta_supercana`, SUPERROD |
| Ramón, el farero: pista **T11** (en cola hasta Nadar) | `caleta_faro` (4,5) | `b09_caleta_ramon_t11` |
| Extremo del muelle de buzos: casilla prevista para la resonancia del Buceo | Caleta (22,30) | **B13** pone `b13_dive_resonance` aquí |

## Células (§2.3)

| Célula | Clave | Mapa (x,y) | Etapa / acceso |
|---|---|---|---|
| C044 | `cell_marisma_1` | Ruta 8 (38,14), barro junto a la bomba del noreste | D · Terreno complicado |
| C072 | `cell_marisma_2` | Ruta 8 (18,38), aguas hondas de la laguna | F · Nadar |
| C075 | `cell_nexo_1` | Nexo (60,44), desembocadura del Albo | F · Nadar |
| C064 | `cell_caleta_1` | Caleta (26,29), frente al muelle de buzos | F · Nadar |
| C086 | `cell_caleta_2` | `caleta_algas` (22,7) | G · Buceo (cambio en `content/zygarde/cells.js`: mapa `caleta_algas`) |

## Entrenadores (`content/trainers/b09b.js`, niveles 33–36)

Técnica Noelia, Técnico Adrián, Técnico Marcos (bombas; Genesis, 40, `canLose`) · Pescadora Lorena (29,38) ·
Excursionista Julián (37,64) · Bichera Sara (18,21) · Marinero Rogelio (Nexo 20,35) · Nadadora Marina (Ruta 15, en el
agua junto al pantalán, 62,34) · Pescador Andrés (26,30) · Ornitólogo Bruno (36,19) · Excursionista Elena (55,9) ·
Veterano Tomás (49,18) · Buceadora Ainhoa (Caleta, en el agua junto al muelle, 20,28). Obligatorios: solo los tres
técnicos.

## Objetos

Ruta 8: Cura Total (20,46), Superrepelente (45,8), Lodo Negro (17,18), Mini Seta oculta (5,66), Revivir oculto (36,21),
Ultra Ball (45,40). Nexo: Perla oculta (3,41), Concha Cardumen (7,39), Escama Corazón oculta (55,34), Roca Lluvia
(48,48), Superrepelente oculto (53,5); Scizorita en el astillero. Ruta 15: Hiperpoción (10,6), Perla Grande oculta
(18,28), Polvo Estelar oculto (67,27), Perla (86,33), Elixir (76,6), Sal de Cardumen (28,26). Caleta: Barbaraclita
oculta (32,23), Red Ball (7,22), Superpoción oculta (24,5). Algas: Perla Grande oculta (19,11). Regalos: Caña Buena,
Supercaña, 2 Hierbas Revivir (Remedios).

## Encuentros (`content/encounters/b09b.js`)

Ruta 8 hierba 33–38 (Croagunk, Skorupi, Wooper de Paldea, Venipede, Toedscool, Carnivine, Stunky, Whirlipede; con
lluvia Goomy sustituye a Skorupi), Nadar 35–40, Caña Buena. Mar (Nexo, Ruta 15, Caleta): Nadar 42–50, Caña Buena 30–40,
Supercaña 45–50; hierba de las calas 30–38. Algas (Buceo) 48–54. El formato admite forma: `[peso, especie, mín, máx,
forma]` (añadido en `world/encounters.js`).

## Pruebas

- `node --test tests/b09b_reach.test.mjs` — BFS con la pasabilidad real: sin Terreno el barro cierra Lúmina↔Palafitos
  y la senda de Mnemos; con Terreno todo lo del arco es alcanzable; C072/C075/C064 y el remolino solo con Nadar; sin
  casillas trampa (a pie y nadando, con la misma regla de «¿Nadar?» del juego); puertas de ida y vuelta.
- `node --test tests/b09b_content.test.mjs` — mapas sin avisos, enlaces simétricos, células, dinero y niveles,
  encuentros, triangulación (solo q3 es coherente), guiones de T08, Caña Buena, Supercaña, T11/T12 en cola.
- `node tools/e2e_b09b.mjs [--headed] [--no-retry] [--from=marisma|nexo]` — recorrido completo con teclas reales
  (derrota simulada contra la primera técnica). Capturas y transcripción en `tools/cache/screens/e2e_b09b_*`.

URLs de prueba (servidor en `http://localhost:8080`, `&debug` para el panel):

- Marisma desde Lúmina, con Terreno:
  `/?scene=map&map=ruta_8_marisma&x=48&y=64&dir=4&party=STARAPTOR:58,TORTERRA:58&zygarde=run,ram,terrain&zcells=44&zcores=2&flags=b01_dex_received,p1_restored,p2_restored,p3_restored,p4_restored,zyg_10,zyg_core_2&noenc=1&debug`
- Arco T08 con las bombas paradas (solo faltan estacas y pozas): añadir
  `,b09_t08_remedios,b09_t08_alerce,b09_t08_bomba_1,b09_t08_bomba_2,b09_t08_bomba_3,b09_t08_bombas` a `flags`.
- Nexo: `/?scene=map&map=ciudad_nexo&x=31&y=2&dir=2&party=STARAPTOR:58&zygarde=run,ram,terrain&flags=p4_restored&noenc=1&debug`
- Caleta con Nadar y Buceo (C064, bosque de algas): `/?scene=map&map=caleta_sonda&x=34&y=11&dir=4&party=STARAPTOR:58&zygarde=run,ram,terrain,swim,dive&noenc=1&debug`

## Pendiente / coordinación

- **B13**: trazado del `mar_del_sur` (añadir offsets en `links.js`), hito `b13_dive_resonance` en Caleta (22,30),
  segunda pista de T11 (Lucía, Islote Lumbre) y de T12 (Volcán Tizón), plataforma Talasa.
- **B16**: página de T14 en el evento `evaristo` de `nexo_correos.js`.
- **P7**: los ferris (`world/transport.js`, `takeFerry`) ya consultan `p7_restored`.
- Arte provisional de bombas, estacas, lodo, plataforma, prismáticos, maletín y boyas (X04).
