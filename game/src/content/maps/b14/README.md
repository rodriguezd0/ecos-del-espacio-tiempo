# Bloque 14 — Pilar de los Ecos (P7): Arrecife del Eco, Ruinas de Antea y Fosa del Eco

Guion: `docs/CAMPANA.md` «B14» (Pilar de los Ecos, caracolas, causalidad pasado → presente, Fausto, Bramaluna Alfa),
§1.4 (Mar del Sur y su fondo), §1.8 (fondos Sub / Templo / Pradera3), §2.3 (C077–C084), §2.5–§2.6 (reintentos y
caracolas tras el P7), §2.8 (Buceo), §3.0 (verso VII), §5.4 (Genesis: dragado de Antea, planos de la corona), T13.
Encuentros: `docs/POKEDEX_DISTRIBUCION.md` §7.3 («Fondo del Mar del Sur», «Arrecife del Eco y Pilar de los Ecos»).
**Fuente única de coordenadas:** `layout.js`. Estado de entrada: `b13_talasa`, `zyg_core_4`, `zyg_dive` (capacidad
`dive`). Salida: `p7_restored` (+ Fragmento F07, `verse_7`, pista T13).

## Mapas

| id | Archivo(s) | Tamaño | TS | Notas |
|---|---|---|---|---|
| `arrecife_eco` | `arrecife_eco.js` + `arrecife_build.js` | 44×36 | 15 | Submarino (burbuja, oscuridad .8). Muralla hundida con la Puerta de Antea (norte), draga de Genesis, campana de dragado (oeste), corales, cajas «ANTEA — Catalogado», 4 respiraderos, 2 buceadores |
| `arrecife_campana` | `arrecife_campana.js` + `campana_build.js` | 17×13 | 4 | Interior de la campana de dragado (laboratorio de Genesis): 2 técnicos, la jefa Adela, consola |
| `fondo_mar_sur` | `fondo_mar_sur.js` + `fondo_build.js` | 180×50 | 15 | Fondo del Mar del Sur con las **mismas coordenadas** que `mar_del_sur` (B13, 190×50: el fondo cubre x 0–179; desde x 171, la Fosa Abisal bajo el sector este). Praderas de algas someras (no gastan burbuja), 13 respiraderos, 6 haces de luz (= los remolinos de B13), C077–C081; la raíz de roca del Islote Lumbre al pie del borde sur (x 21–41, bajo el islote de la superficie) |
| `antea_{1,2}_{presente,antea}` | `antea_N_<capa>.js` + `antea_N_build.js` | 32×24 | 15 / 7 | Salas 1 (Plaza de la Caracola) y 2 (Calle de los Pescadores): presente sumergido ↔ Antea seca |
| `antea_{3,4}_{presente,antea,primigenia}` | ídem | 32×26 | 15 / 2 / 7 | Salas 3 (Barrio Alto) y 4 (Puerta de la Fosa): presente ↔ Antea (templo) ↔ era primigenia (selva, Bramaluna) |
| `fosa_eco` | `fosa_eco.js` + `fosa_build.js` | 30×26 | 15 | Cámara del núcleo: nido de la Bramaluna, núcleo del Pilar, estela T13, corriente ascendente tras el P7 |

Capas: `antea_defs.js#roomDef` (presente: TS15, Buceo, oscuridad .84, sin seguidor, Sub; Antea: TS7 salas 1–2 / TS2
salas 3–4, Templo; primigenia: TS7, Pradera3). Cada capa de una sala es un mapa gemelo del mismo tamaño: golpear una
caracola hace `warp` a la **misma casilla** del gemelo. Nombre de zona «Pilar de los Ecos»; música/fondos por zona
en `services/zones.js`. Arte propio (PROVISIONAL, generado): `node tools/b14_assets.mjs [--preview]` → caracola
(4 estados), estatua de pie y caída, rueda/palanca, brote/helecho/helecho gigante, raíz viva y petrificada, draga
(trabajando/parada/envejecida), campana, corales, cajas, puertas de bronce, equipo de Fausto, puesto de redes, haz de
luz y la Bramaluna Alfa (seguidor de Añil ×1,5).

## Enlaces

| Desde | Casilla | Hacia | Llegada / notas |
|---|---|---|---|
| `caleta_sonda` (B09b) remolino del arrecife | (4,28), nadando + A | `arrecife_eco` | (22,31) ↑ «¿Bucear?» |
| `arrecife_eco` superficie | (22,31) + A | `caleta_sonda` | (4,28) |
| `arrecife_eco` escotilla de la campana | (8,13) (pisar) | `arrecife_campana` | (8,10) ↑ |
| `arrecife_campana` felpudo | (8–9,10) ↓ | `arrecife_eco` | (8,14) ↓ |
| `arrecife_eco` Puerta de Antea | (22,3) | `antea_1_presente` | (16,21) ↑ — tapada por el cabezal de la draga hasta `b14_draga_apartada` |
| `arrecife_eco` borde este | x 43, y 14–20 | `fondo_mar_sur` | borde oeste y 20–26 (conexión, desfase 6) |
| `fondo_mar_sur` haces de luz | (20,8) (52,20) (76,30) (110,12) (138,36) (150,10) + A | `mar_del_sur` (B13) | misma (x, y); son los remolinos de B13 (`mar_layout.js#WHIRLPOOLS`), que bajan aquí con `dive` del mapa |
| `antea_1_presente` boca sur / norte | (16,22) / (16,3) | `arrecife_eco` / `antea_2_presente` | (22,5) ↓ / (16,21) ↑ — la norte, tapada por la estatua caída hasta `b14_estatua = 1` |
| `antea_2_presente` sur / norte | (16,22) / (16,3) | `antea_1_presente` / `antea_3_presente` | (16,5) ↓ / (16,23) ↑ — la norte, tras el aljibe (corriente hasta `b14_compuerta`) |
| `antea_3_presente` sur / norte | (16,24) / (16,3) | `antea_2_presente` / `antea_4_presente` | (16,5) ↓ / (16,23) ↑ — la norte está en la terraza alta |
| `antea_3_antea` norte ↔ `antea_4_antea` sur | (16,3) / (16,24) | — | (16,23) ↑ / (16,5) ↓ |
| `antea_3_primigenia` senda norte ↔ `antea_4_primigenia` senda sur | (16,4) ↑ / (16,23) ↓ | — | (16,23) ↑ / (16,5) ↓ |
| `antea_4_presente` boca de la Fosa | (16,3) | `fosa_eco` | (15,23) ↑ — corriente hasta `b14_aliviadero` |
| `fosa_eco` salida sur | (15,24) | `antea_4_presente` | (16,5) ↓ |
| `fosa_eco` corriente ascendente (tras el P7) | (24,19) + A | `caleta_sonda` | (4,28) nadando |

Caracolas (casilla / se golpea desde): sala 1 (16,13)/(16,14 ↑); sala 2 (8,17)/(8,16 ↓); sala 3 (16,18)/(16,19 ↑) y
(24,7)/(24,8 ↑) en la terraza alta; sala 4 (16,19)/(16,20 ↑). Existen en todas las capas y funcionan tras el P7.

## La mazmorra: causalidad pasado → presente (un solo sentido)

| Sala | Qué bloquea (presente) | Solución (eco) | Estado |
|---|---|---|---|
| 1 | Estatua de la tañedora caída sobre la boca norte | En Antea, empujar la estatua por su ranura desde (15,6) mirando al oeste: queda en la hornacina (10,6); en el presente aparece caída allí | var `b14_estatua` = 1 |
| 2 | Corriente violenta que sale del aljibe (16,9–11) | En Antea, acompañar a **Fausto** por su día: la fuente → el puesto de redes → la compuerta del aljibe (la rueda se gira entre los dos) → la caracola del muelle. Una parada fuera de orden reinicia el día (sin castigo). En el presente el aljibe queda seco (bolsa de aire) | var `b14_fausto` 0–3, `b14_compuerta`, `b14_fausto_despierto` (Real de plata) |
| 3 | Muro liso entre el barrio bajo y la terraza alta (y 10–12) | En la era primigenia, coger el brote (27,19) y plantarlo en la tierra húmeda (9,13): en Antea crece una raíz trepable en (9,12) (sube a (9,9)); en el presente queda petrificada. Con la caracola de la terraza se vuelve al presente arriba | `b14_brote_3`, `b14_helecho_3` |
| 4 | Corriente de la boca de la Fosa (15–17,4) y (16,6) | Brote (26,13) → tierra (7,12) en la era primigenia → raíz en Antea (7,11) al balcón → **palanca del aliviadero** (5,6) desde (6,6) ← | `b14_brote_4`, `b14_helecho_4`, `b14_aliviadero` |

**Bramaluna Alfa** (salas 3–4, era primigenia): patrulla determinista (`content/events/b14_bramaluna.js#patrolAt`,
posición = f(fotograma)); cono de visión de 5 casillas (efecto `visionCone`), rugido de aviso a ≤ 8 casillas. Si ve
al jugador: rugido, embestida de una casilla, fundido y **vuelta a la última caracola** (var `b14_caracola`
'mapa:x:y:dir'), sin combate ni daño; la primera vez, Zygarde lo explica (`b14_bramaluna_vista`, var
`b14_bramaluna_pillado`). Las caracolas y los puntos de interacción nunca quedan a la vista (test).

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Tobías (monedas de las mareas), Carmela (Fausto no ha vuelto), Zygarde; **Real de cobre** | Caleta Sonda, playa (vigilante en paralelo: en tierra y quieto) | capacidad `dive`, sin Fausto ni P7 | `b14_caleta_intro`, `b14_tobias_moneda` (si la escena no llegó a verse, Tobías da la moneda al hablarle) |
| Llegada al arrecife | (22,30) | | `b14_arrecife_llegada` |
| La draga tapa la puerta (pista del Core: la campana) | cabezal (22,5) | | `b14_draga_vista` |
| Técnicos Rufino y Eulalia; **jefa Adela** (combate de guion sin pérdida; planos de la corona, «Al doctor le interesa…», el chico de la caleta) | campana | hasta el P7 | `b14_jefa_vencida`, `b14_draga_apartada` |
| Entrada en las ruinas; tutorial de la caracola; primer eco / primera era primigenia | salas | | `b14_antea_entrada`, `b14_caracola_tuto`, `b14_primer_eco`, `b14_primigenia_vista` |
| Fausto despierta y vuelve solo a Caleta (Real de plata) | sala 2 (Antea) | rutina en orden | `b14_fausto_despierto`, `b14_fausto_real` |
| Si se pasó la sala 2 sin terminar su rutina (basta la compuerta), **el P7 lo suelta igualmente** («Fausto vuelve»); su Real de plata le espera en la playa | Fosa → Caleta | `p7_restored` sin `b14_fausto_despierto` | `b14_fausto_soltado`, `b14_fausto_despierto` |
| Llegada a la Fosa | `fosa_eco` | | `b14_fosa_entrada` |
| **Bramaluna Alfa del eco** (franja y 16, x 3–26): combate obligatorio nv 56, Energía Potenciadora, Paleosíntesis, Danza Dragón / Triturar / Garra Dragón / Acróbata; sin huida; captura desactivada (`rules.catchCondition`: «¡La Poké Ball la atraviesa como si fuera bruma! Es un eco: no hay nada que atrapar.») | nido | | `b14_bramaluna_eco` |
| **Núcleo** (15,12) desde (15,13) ↑: `restorePillar(7)` → F07, verso VII; efecto local (mareas, hielo del norte, la draga); inscripción **T13** («La decimotercera tabla espera en el hielo más viejo.») y `openClue('T13')`; la Bramaluna se queda **real** en el nido | Fosa | eco vencido, F06 | `p7_restored`, `verse_7`, `b14_t13` |
| Bramaluna real (visible, nv 58, captura opcional, ratio de la especie 10; si se vence reaparece al descansar: `rest_count`) | nido (15,6) | `p7_restored` | `b14_bramaluna_real_vencida` + var `b14_bramaluna_descanso` / `b14_bramaluna_capturada` |
| Escena final: mareas a su hora, Fausto, Carmela, el ferri vuelve, Zygarde: el hielo del norte se ha retirado | Caleta Sonda (al pisar tierra) | `p7_restored` | `b14_caleta_final` |
| Parte de retirada en la consola (la draga envejecida por el eco) | campana | `p7_restored` | `b14_campana_abandonada` |

**Reintentos (§2.6):** perder contra la Bramaluna del eco cura y deja al jugador en el manantial del eco de la sala 4
(`antea_4_presente` (21,11) ↑); contra Adela, se queda en la campana y se le vuelve a hablar; contra la Bramaluna
real, en (15,13). Las embestidas de la Bramaluna no cuestan nada. Los manantiales del eco (salas 4) curan y recargan.

**Cambios del mundo tras el P7:** mareas normales (textos de Caleta), Fausto en la playa, cartel del ferri
«Servicio reanudado» (`b09b_caleta.js`, `FERRY_UNLOCK_FLAG = p7_restored` en `transport.js`), Ruta 11 abierta (la
lee B05/Brontia con `p7_restored`), la draga inservible (coral y óxido) y la campana abandonada; los ecos de helechos
de la Fosa se desvanecen.

## Células, objetos, entrenadores y encuentros

- **Células:** C077 `cell_fondo_sur_1` (84,18) · C078 `cell_fondo_sur_2` (103,37) · C079 `cell_fondo_sur_3` (32,46, en la
  cala de la raíz del Islote Lumbre) · C080 `cell_fondo_sur_4` (43,45, al este de esa raíz) · C081 `cell_fondo_sur_5`
  (163,27) — `fondo_mar_sur`; C082 `cell_ecos_1` (16,17)
  `antea_1_presente` · C083 `cell_ecos_2` (6,6) `antea_3_presente` (terraza alta) · C084 `cell_ecos_3` (16,10)
  `antea_4_presente` (obligatorias las tres del Pilar).
- **Regalos:** Real de cobre (Tobías), Real de plata (Fausto al despertar).
- **Objetos:** arrecife: Red Ball ×2 (29,31), Buceo Ball ×3 (6,19), Perla (39,11, oculta), Perla Grande (10,31,
  oculta), Concha Cardumen (18,27); sala 1: Perla Grande (22,8, oculta), Real de cobre (25,10), Buceo Ball ×2 (5,7),
  Escama Corazón (Antea, 25,18); sala 2: Perla (25,20, oculta), Hiperpoción (4,13), Red Ball ×2 (Antea, 29,12);
  sala 3: Buceo Ball ×2 (27,21), Trozo Estrella (4,7, oculto), Hueso Raro (Antea, 27,22), Seta Grande (primigenia,
  3,18), Escama Dragón (primigenia, 28,5); sala 4: Restaurar Todo (26,6), Perla Grande (5,22, oculta), Máx. Revivir
  (Antea, 8,5), Mini Seta ×2 (primigenia, 28,21); fondo: Tatsugirita (152,42, oculta), Diente Marino (17,44), Escama
  Marina (93,20), Trozo Estrella (67,44, oculto), Perla Grande (44,14, oculta), Buceo Ball ×3 (123,12), Elixir (160,12).
- **Entrenadores (49–52):** Buceador Casimiro (arrecife 14,24), Buceadora Rocío (34,18), Técnico Rufino y Técnica
  Eulalia (campana; solo hasta el P7), jefa Adela (campana, combate de guion), Buceadora Anselma (fondo 64,22),
  Buceador Genaro (fondo 156,28). Datos en `content/trainers/b14.js`.
- **Encuentros** (`content/encounters/b14.js`; clásico y visible): fondo (Buceo 48–54), arrecife y capa presente
  (Relicanth, Lanturn, Corsola 50–55), capa de eco (Cranidos, Shieldon, Corsola de Galar, Dreepy, Drakloak 50–55; en
  Antea en toda la sala, en la era primigenia solo en la hierba alta). **Ninguna Paradoja** salvo la Bramaluna de
  guion.

## Pruebas

- `node --test tests/b14_reach.test.mjs` — BFS por mapa y capa con la pasabilidad real: la Puerta de Antea, la boca
  norte de la sala 1, el aljibe, la terraza, la Fosa y el núcleo no se pueden saltar; sin casillas trampa; células,
  objetos, entrenadores, respiraderos y haces alcanzables; sigilo posible con la patrulla real (BFS en el tiempo).
- `node --test tests/b14_content.test.mjs` — entrenadores, tablas, combate del eco (sin huida ni captura), Bramaluna
  real y su reaparición, caracolas, patrullas, escenas de Caleta, el P7 que suelta a Fausto (su Real de plata en la
  playa, sin repetirse), la moneda de Tobías si no se vio la escena, C079–C080 bajo el Islote Lumbre y células.
- `node tools/e2e_b14.mjs [--from=|--only=|--to=caleta|arrecife|sala1|sala2|sala3|sala4|fosa|regreso|fondo]
  [--no-retry]` — recorrido completo con teclas reales (≈ 10–13 min), capturas `tools/cache/screens/e2e_b14_*`. El
  conductor espera a que la ventana de elección exista y comprueba el cursor antes de confirmar (con la CPU cargada
  se perdían pulsaciones), y cura al equipo antes de la jefa Adela (el piloto no usa objetos). Su equipo va a nivel
  84–85: el piloto solo usa su primer movimiento de daño y, a nivel 72, el Magneton de Rufino o el equipo de Adela lo
  tumbaban a veces. El equilibrio real (tramo ~51) se valora jugando a mano.
- URL de entrada (servidor en :8080):
  `/?scene=map&map=caleta_sonda&x=12&y=20&dir=2&party=AZUMARILL:72,TOGEKISS:70,TORTERRA:70&flags=p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,zyg_10,zyg_50,zyg_core_2,zyg_core_3,zyg_core_4,zyg_dive,b13_talasa,b13_dive_resonance&zygarde=run,ram,terrain,climb,swim,detect,dive&zcells=76&zcores=4&fragments=6&core=1&noenc=1&debug`.
  Salas sueltas: `map=antea_3_primigenia&x=16&y=19&dir=8` (+ `flags=…,b14_draga_apartada,b14_caracola_tuto`),
  `map=fosa_eco&x=15&y=23&dir=8`, `map=fondo_mar_sur&x=2&y=23&dir=6`.

## Coordinación con otros bloques

- **B09b** (Caleta Sonda): `caleta_sonda.js` añade `...b14CaletaEvents()`; el cartel del ferri lee `p7_restored`.
- **B13** (Mar del Sur, ya registrado): el fondo usa sus mismas coordenadas (la superficie mide 190×50; el fondo, 180×50:
  las 10 columnas del este, junto al Volcán Tizón, no tienen remolinos); sus remolinos (`WHIRLPOOLS`) coinciden con los
  haces y `underwater.surface` solo deja emerger bajo los haces (3×3). El remolino directo al arrecife está en Caleta
  (4,28); si B13 quiere uno en mar abierto (su boya del arrecife, (8,36)), basta un `diveSpot` con `to: 'arrecife_eco',
  tx: 22, ty: 31`.
- **B05/B15** (Brontia, Ruta 11, el norte): leen `p7_restored`; la pista T13 apunta al hielo más viejo.
