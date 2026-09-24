# Bloque 1 — Villa Alba e interiores (agente *town*)

Guion: `docs/bloques/B01_apertura.md` §2, §4.1–§4.4 y §4.7 · Decisiones D01, D03, D05, D05b, X01.
Coordenadas en casillas (x → derecha, y → abajo). **Fuente única de las coordenadas del pueblo:**
`villa_alba_layout.js` (puertas, llegadas a interiores, salidas y puesto del policía) y `LAB` en
`content/events/b01_town_lab.js` (posiciones del laboratorio). Cambiarlas ahí mantiene los warps coherentes.

## Mapas

| id | Archivo | Tamaño | Tileset | Notas |
|---|---|---|---|---|
| `villa_alba` | `villa_alba.js` + `villa_alba_build.js` | 46×36 | 7 | Construcción con MapBuilder + stamps |
| `casa_prota_1f` | `casa_prota_1f.js` | 15×12 | 4 | Salón-cocina, la madre, escalera |
| `casa_prota_2f` | `casa_prota_2f.js` | 13×10 | 4 | Habitación: **inicio de partida** (`start` = 8,6 ↓) |
| `casa_gael` | `casa_gael.js` | 15×12 | 4 | Libros e informes, nota de Gael (sin familia) |
| `laboratorio_alerce` | `laboratorio_alerce.js` | 20×16 | 4 | Máquina con 3 Poké Balls, puerta cerrada al fondo |
| `casa_vecinos_n` | `casa_vecinos_n.js` | 13×11 | 4 | Vecino (marido de la vecina del relámpago) |
| `casa_vecinos_se` | `casa_vecinos_se.js` | 13×11 | 4 | Madre del niño y su Lillipup |

Brushes propios de habitación (`common.js`): `habitacion_calida` (pared menta) y `habitacion_beige` (dormitorio),
con los tiles de las casas de Añil. Las salidas de casa son warps `dirTrigger: 2` sobre el felpudo (el felpudo
inferior no es pasable) con flechas `FlechaSalida` debajo.

## Enlaces con otros mapas

| Desde | Casilla | Hacia | Llegada |
|---|---|---|---|
| `villa_alba` puerta casa roja SO | 10,25 | `casa_prota_1f` | 7,10 ↑ |
| `villa_alba` puerta casa verde NO | 9,12 | `casa_gael` | 7,10 ↑ |
| `villa_alba` puerta laboratorio E | 37,18 | `laboratorio_alerce` | 9,13 ↑ |
| `villa_alba` puerta casa roja N | 30,13 | `casa_vecinos_n` | 6,9 ↑ |
| `villa_alba` puerta casa verde SE | 33,26 | `casa_vecinos_se` | 6,9 ↑ |
| Interiores (felpudo, pulsar ↓) | — | `villa_alba` | casilla bajo su puerta, mirando ↓ |
| `casa_prota_2f` escalera | 10,4 (se pisa desde 9,4) | `casa_prota_1f` | 11,4 ← |
| `casa_prota_1f` escalera | 12,4 (se pisa desde 11,4) | `casa_prota_2f` | 9,4 ← |

**Conexiones sin fundido** (`TOWN_EXITS`; `offset` = x del pueblo donde cae la x 0 del vecino):

- Norte → `laberinto_profundidad`, `offset: 3`. Camino del pueblo x 22–23 = entrada del Laberinto x 19–20
  (su `VILLA_OFFSET = 3`, conexión de vuelta `south`, `offset: -3`).
- Sur → `ruta_1`, `offset: 8`. Hueco del bosque x 20–25 (camino x 21–24) = borde norte de la Ruta 1 x 12–17
  (camino x 13–16; su `VILLA_OFFSET = 8`, conexión de vuelta `north`, `offset: -8`).

**Escolta del policía (§4.6 → §4.7):** el agente del norte pone `b01_escorted` y hace
`ctx.warp('laboratorio_alerce', LAB.escort.x, LAB.escort.y, LAB.escort.dir)` = **(9,11) mirando ↑**. La escena del
regreso arranca sola al entrar (policía en 10,11; el Core y el inicial siguen al jugador).

**Punto de cura** (`HOME_HEAL_POINT`): `casa_prota_1f` (4,6) ↑. Se fija al despertar y cada vez que la madre cura
(`setHomeHealPoint(ctx)` → `ctx.setHealPoint`).

## Ajustes DECIDIDO-DEV (docs/CAMPANA.md «B01 — ajustes»)

- **Elenco (X07)** — `CAST` en `events/b01_town_common.js`: el policía es el **Agente Olmedo** (hablante de todas sus
  líneas), los dueños del Laberinto son la **familia Arenzana** (carteles y línea del agente) y la ayudante es **Lía**
  (sprite `ayudante` de `content/characters.js`).
- **Células (§2.3)** — catálogo del bloque con casillas en `events/b01_cells.js` (`B01_CELLS`; las claves son las del
  registro global `content/zygarde/cells.js`):

| Código | Clave | Mapa (casilla) | Dónde |
|---|---|---|---|
| C001 | `cell_villa_alba_1` | villa_alba (22,16) | parterre central; aparece con la Pokédex y la escena forzada al salir del laboratorio («Aquí. Una parte de mí.», `events/b01_town_cell.js`) |
| C002 | `cell_ruta_1_1` | ruta_1 (14,19) | puente de troncos (único cruce del arroyo) |
| C003 | `cell_ruta_1_2` | ruta_1 (13,27) | hueco entre las rocas del estrechamiento |
| C004 | `cell_ruta_1_3` | ruta_1 (11,46) | camino junto al Bichero Luis |
| C005 | `cell_ruta_1_4` | ruta_1 (16,56) | junto al cartel del Pilar del Umbral |
| C006 | `cell_ruta_1_5` | ruta_1 (24,32) | claro del este (opcional) |
| C024 | `cell_ruta_1_6` | ruta_1 (22,8) | mirador del nordeste, tras la cuesta de grava (`gravelSlope`, etapa B: montado en el 10 %) |

- **Ruta 1** — topógrafos del Consorcio Meridiano (8,15) y (10,15) (sprites `genesis_tecnico`/`genesis_tecnica` del
  arte de campaña; reserva `anil:cientifico/a`) con su trípode (9,15) junto al cruce oeste,
  «Lecturas de campo. Siga, por favor.», hasta `p1_restored`; mirador `LOOKOUT` (terraza x 18–25, y 6–12; rampa x 21–22);
  cruce oeste `WEST_CROSSING` (camino de tierra y 16–17, cartel «RUTA 10» en 12,15).
- **Enlaces pendientes** (`maps/b01/pending_links.js`): mientras el mapa no esté registrado hay un aviso neutro y un
  paso atrás; al registrarlo (gen_registries) la conexión se activa sola:

| Destino | Bloque | Conexión | Aviso mientras tanto | El destino debe… |
|---|---|---|---|---|
| `villa_zaguan` | B02 | `south`, offset −5 | «El sendero sigue hacia Villa Zaguán, pero por ahora no puedes continuar.» (y=59, x 13–16) | abrir su camino norte en x 18–21 y conectar `north` con offset 5 |
| `ruta_10` | B11 | `west`, offset −4 | «El camino del oeste está cortado por un desprendimiento.» (x 4, y 16–17; rocas en x 0–3) | abrir su salida este en y 20–21 y conectar `east` con offset 4 |

- **Habitación** — el evento `vista_monte` (5,3) pinta el Monte del Portal con su gran cascada animada en los cristales
  de la ventana (`assets/objects/ventana_monte.png`, generado con `node tools/b01_assets.mjs`, que también crea el
  trípode). Examinar la ventana lo describe.
- **Monte del Portal** — `montana_portal` se llama así (X22).

## Flags y escenas

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Despertar (§4.1) | `casa_prota_2f` auto | `!b01_woke` | `b01_woke` |
| La madre (§4.1) | `casa_prota_1f` auto | `b01_woke && !b01_met_mom` | `b01_met_mom` |
| Cura en casa | madre (hablar) | `b01_starter_chosen` | punto de cura |
| Regalo: cura + 3 Pociones (§4.7) | `casa_prota_1f` auto | `b01_dex_received && !b01_mom_gift` | `b01_mom_gift` |
| Llegada al laboratorio (§4.3) | `laboratorio_alerce` auto | `!b01_lab_intro_seen && !b01_starter_chosen` | `b01_lab_intro_seen` |
| Elección de inicial (§4.3) | Poké Balls de la máquina | tras la llegada | vars `starter`, `gael_starter`; `b01_starter_chosen` |
| La señal (§4.4) | `villa_alba` auto al salir | `b01_starter_chosen && !b01_signal_heard` | `b01_signal_heard` |
| El policía entra (§4.4) | `villa_alba` franja y=10 (x 21–24) o hablarle | `b01_signal_heard && !b01_police_entered` | `b01_police_entered` |
| Regreso y duelo (§4.7) | `laboratorio_alerce` auto | `b01_escorted && !b01_gael_duel_done` | `b01_gael_duel_done`, `b01_dex_received` |
| C001 en el parterre | `villa_alba` auto (al salir del laboratorio) | `b01_dex_received` y sin `cell_villa_alba_1` | célula C001 |
| Sale del pueblo | `villa_alba` franja y=34 | `b01_dex_received && !b01_left_town` | `b01_left_town` |

Límites: el policía (22,8) y su casilla libre (23,8) cierran el camino norte salvo entre `b01_police_entered` y
`b01_escorted`; la franja y=32 (x 20–25) devuelve al jugador hasta tener la Pokédex. No se sale del laboratorio sin
elegir tras la presentación. Combate `gael_1` (`content/trainers/b01_town.js`): inicial con ventaja nv 5,
`canLose` (perder cura y la historia sigue).

Módulos de eventos: `content/events/b01_town_common.js` (flags, constantes), `b01_town_home.js`,
`b01_town_village.js`, `b01_town_lab.js`, `b01_town_return.js`, `b01_town_picture.js` (ventana con el sprite del
inicial), `b01_town_path.js` (rutas a pie BFS para que los NPC rodeen muebles).

## Pruebas rápidas

- `?scene=map&map=casa_prota_2f&party=none&debug` — inicio de partida.
- `?scene=map&map=laboratorio_alerce&party=none&flags=b01_woke,b01_met_mom&debug` — llegada y elección.
- `?scene=map&map=villa_alba&x=22&y=14&dir=8&party=TURTWIG:5&flags=b01_woke,b01_met_mom,b01_starter_chosen,b01_signal_heard&debug` — el policía entra.
- `?scene=map&map=laboratorio_alerce&x=9&y=11&dir=8&party=TURTWIG:5&core=1&flags=b01_woke,b01_met_mom,b01_lab_intro_seen,b01_starter_chosen,b01_signal_heard,b01_police_entered,b01_core_found,b01_escorted&vars=starter:TURTWIG,gael_starter:LITTEN&debug` — regreso y duelo.
- `?party=none|ESPECIE:nivel,…` (world/devTools.js) sustituye el equipo de prueba.
- C001: `?scene=map&map=laboratorio_alerce&x=9&y=13&dir=2&party=TURTWIG:5&core=1&flags=b01_woke,b01_met_mom,b01_lab_intro_seen,b01_starter_chosen,b01_signal_heard,b01_police_entered,b01_core_found,b01_escorted,b01_gael_duel_done,b01_dex_received&debug` y bajar.
- Ruta 1: `?scene=map&map=ruta_1&x=13&y=16&dir=4&party=TURTWIG:8&core=1&noenc=1&debug` (cruce oeste y topógrafos).
- `node --test tests/b01_town.test.mjs tests/north_b01.test.mjs tests/content_b01.test.mjs` ·
  `node tools/preview_map.mjs villa_alba --pass` · `node tools/validate_content.mjs` ·
  **recorrido completo**: `node tools/e2e_b01.mjs` (≈4 min, capturas `tools/cache/screens/e2e_b01_*`).
