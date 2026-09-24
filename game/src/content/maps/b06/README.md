# Bloque 6 — Pilar del Impulso (P3)

Guion: `docs/CAMPANA.md` «B06», §1.4 (Ruta 5, Meseta del Impulso), §1.5 (P3), §2.3 (C028–C034), §2.4 (N2), §3.0
(verso III), §3.1 (crisis fase 1), §5 (Casia) y §6 (Gael, combate doble). `docs/TABLILLAS.md` (T04 se abre aquí; T03:
segunda pista de Abril si sigue abierta). Encuentros: `docs/POKEDEX_DISTRIBUCION.md` §7.3.
**Fuente única de coordenadas:** `layout.js` (y las salas ASCII de `content/events/b06_wind_rooms.js`).

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_5` | `ruta_5.js` + `ruta_5_build.js` | 60×40 | 1 | Meseta ventosa: redil y granero del pastor, línea eléctrica muerta, dos oteros (de bosque a bosque) con el paso cerrado por troncos (Embestida: único camino a la Meseta), hondonada de C028, molino de viento del altiplano (Drifloon tras el P3), otero con escalera |
| `meseta_impulso` | `meseta_impulso.js` + `_build.js` | 50×50 | 1 | Parque Eólico vallado (nave del Colector, 6 aerogeneradores + 3 fuera), peña del Anillo con escalinata y dintel, praderas, estanque, explanada de Cyclizar |
| `parque_eolico` | `parque_eolico.js` | 46×21 | 4 | Almacén (`central_almacen`) + sala del Colector (`central_generador`), puerta de servicio (warp interno) |
| `anillo_vientos` | `anillo_vientos.js` | 44×40 | 1 | Lo alto de la mesa: círculo de piedras, 3 monolitos del ritmo, terraza de la Sala de las Campanas con estrado y núcleo, boca de las galerías, campamento de Abril. Tinte P3 al 45 % |
| `galerias_soplo` | `galerias_soplo.js` | 26×30 | 2 | Pasarelas de `pilar_enlosado` sobre pozos; Flechas (abajo) y Remolino (arriba). Tinte P3 |

Arte propio (PROVISIONAL, D30): `node tools/b06_assets.mjs [--preview]` → `assets/objects/rafagas.png`,
`rafagas_fuertes.png`, `veleta.png`, `colector.png`, `aerogenerador.png`, `campana_viento.png`, `hoguera.png`.

## Enlaces

| Desde | Casilla / borde | Hacia | Llegada |
|---|---|---|---|
| `ruta_5` borde oeste | filas 18–21 | `villa_brontia` (B05) `west`, offset 0 | filas 18–21 de Brontia (acordado con `maps/b05/links.js`). Se activa sola con `linkIfReady` (`pending_links.js`); si Brontia no existiera, aviso neutro y un paso atrás |
| `ruta_5` borde este | filas 13–16 | `meseta_impulso` `east`, offset −9 | filas 22–25 de la Meseta (vuelta: `west`, offset 9) |
| `meseta_impulso` puerta de la nave | empujar (17,14) desde (17,15) | `parque_eolico` | (10,18) ↑ |
| `parque_eolico` salida sur | (9–12,19), pulsar ↓ | `meseta_impulso` | (17,15) ↓ |
| `parque_eolico` puerta de servicio | empujar (12,4) desde (12,5) | sala del Colector (mismo mapa) | (35,13) ↑ |
| `parque_eolico` hueco sur de la sala | pisar (34–36,14) | almacén | (12,5) ↓ |
| `meseta_impulso` dintel de la peña | pisar (39,9) (arriba de la escalinata) | `anillo_vientos` | (21,36) ↑ |
| `anillo_vientos` escalinata sur | (20–22,39), pulsar ↓ | `meseta_impulso` | (39,13) ↓ |
| `anillo_vientos` boca de las galerías | empujar (31–32,24) desde arriba | `galerias_soplo` | (10,28) ↑ |
| `galerias_soplo` salida de luz | (10,29), pisar | `anillo_vientos` | (31,23) ↑ |
| `galerias_soplo` boca del techo (Remolino) | pisar (7,4) | Sala de las Campanas | (24,17) ↓ |
| `anillo_vientos` losa de la Sala | A en (26,17) | Remolino (rellano) | (7,5) ↓ |

Pendiente para **B07** (Ruta 6): los vendavales se retiran con `p3_restored` (Brontia ya lo lee en su salida sur,
`maps/b05/links.js`). Abril dice en la despedida que «en la Ruta 6 ya se podrá pasar».

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Llegada: el Parque parado, «Ahí dentro hay algo mío» | Meseta, franja x 2 (filas 22–25) | `!b06_meseta_intro` | `b06_meseta_intro` |
| Gael y los técnicos; **doble** (Staravia 24 + inicial evolucionado 25 vs Magnemite 22 + Solosis 22) | Meseta, puerta del Parque (16–18,21), (17,20) o hablar | `!b06_doble_ganado` | `b06_gael_parque`, `b06_doble_ganado`. Perder: curado en (17,22) y Gael «Otra vez» |
| Infiltración: Rubén (Stunky 23, Venipede 22), Olga (Bronzor 23, Croagunk 24) | Almacén | visión | desaparecen con `b06_colector_roto` |
| **Casia**: «No somos un consorcio. Somos Genesis.», doctrina; combate (Solosis 23, Magnemite 24, Elgyem 25) | Sala del Colector, franja (34–36,11), hablar o tocar la esfera | `!b06_colector_roto` | `b06_casia_presentada`; perder → puerta del Colector (35,13) curado; reintento «¿Otra medición?» |
| El Colector se rompe: C029–C032, **N2** → Terreno complicado («Ahora recuerdo cómo se pisa la tierra blanda.»); Casia «Solo lo estábamos escuchando.» | idem | victoria | `b06_casia_vencida`, `b06_colector_roto`, `zyg_core_2` |
| Gael ante las pantallas (curiosidad) | idem | tras Casia | `b06_gael_pantallas`; se va al salir el jugador (`b06_gael_se_fue`, onEnter de la Meseta) |
| Abril (tedio): «Cinco años vigilando una piedra que no hace nada.»; la boca sopla hacia fuera hasta romper el Colector | Anillo (34,23) y la boca | — | `b06_abril_conocida` (+ 2ª pista de T03 si seguía abierta) |
| **Abril** reta: «Termina rápido, que se me enfría la comida.» (Emolga 26, Drifloon 26, Staravia 27, Cyclizar 28) | al empujar la boca o hablarle | `b06_colector_roto && !b06_abril_vencida` | `b06_abril_retada`, `b06_abril_vencida`; perder → (34,24) curado y reintento corto («¿Otra vez tú?…»). Pista verbal de C028 |
| Galería de las Flechas (C033) | `galerias_soplo` | — | vars ninguna |
| Galería del Remolino: dos veletas | idem | — | `b06_veleta_remolino_a` (3), `b06_veleta_remolino_b` (1) |
| Sala de las Campanas: Norte larga (mantener A), Este corta, Oeste corta | `anillo_vientos` | — | var `b06_campana_paso`, flag `b06_campanas` (el vendaval se calma), `b06_abril_sala` |
| **Núcleo**: `restorePillar(3)` (Fragmento 3, verso III con el Core y Abril), efecto local, pista **T04**, «Vale. Esto no es aburrido.» | pedestal (21,10), desde (21,11) | `b06_campanas` y Fragmento 2 | `p3_restored`, `verse_3`, `b06_parque_luz`, `b06_abril_despedida` |

Tras `p3_restored`: sin ráfagas en el Anillo ni en las galerías; los aerogeneradores giran; el molino de la Ruta 5 gira
parejo y los **Drifloon vuelven a él** (CAMPANA «Cambio en el mundo»); en el Parque una operaria de Brontia; Abril ya no
está (su tienda tiene una nota y la hoguera se apaga); **crisis fase 1** (derivada de los flags). Opcional: el pastor de
la Ruta 5 y sus dos Wooloo perdidas (`b06_wooloo_1/2`, premio `LEFTOVERS`), Cyclizar visible fijo (nv 24; si se
debilita reaparece al descansar: var `b06_cyclizar_descanso`).

**Derrotas (§2.6).** Los tres combates de guion (doble, Casia, Abril) usan `scriptedBattle` (`events/b06_common.js`):
`canLose` + `noMoneyLoss`, sin «fuera de combate» ni cambio del punto de cura del jugador; al perder, equipo curado y de
vuelta a la casilla de reintento. Una derrota salvaje lleva al último punto de cura normal (Centro de Brontia o la
tienda de Abril si se descansó allí).

## Mazmorra (reglas del viento)

`content/events/b06_wind_logic.js` (puro) y `b06_wind.js` (eventos). Fuerza 1 (flechas claras) se remonta montado;
fuerza 2 (dobles galones azules) nunca; las ráfagas se encadenan; si el viento choca o da la vuelta, devuelve al
jugador a la casilla desde la que entró. Veleta: gira su sector N→E→S→O. `tests/b06_wind.test.mjs` demuestra con un
solucionador BFS que las Flechas exigen montar y pasan por C033, que el Remolino solo se abre con **las dos** veletas y
que la Sala alcanza las tres campanas (C034 en el camino a la Norte) con un vendaval que solo deja salir.

## Pruebas rápidas

- Ruta 5 con Embestida: `?scene=map&map=ruta_5&x=2&y=19&dir=6&party=TORTERRA:30&zygarde=run,ram&zcells=24&zcores=1&fragments=2&flags=p1_restored,p2_restored&noenc=1&debug`
- Puerta del Parque (doble con Gael): `?scene=map&map=meseta_impulso&x=17&y=24&dir=8&party=TORTERRA:30,LUXRAY:28&zygarde=run,ram&zcells=25&zcores=1&fragments=2&flags=p1_restored,p2_restored,b06_meseta_intro&vars=gael_starter:LITTEN&noenc=1&debug`
- Casia: `?scene=map&map=parque_eolico&x=35&y=13&dir=8&party=TORTERRA:32&zygarde=run,ram&zcells=24&zcores=1&fragments=2&flags=p1_restored,p2_restored,b06_doble_ganado&debug`
- Anillo con Abril: `?scene=map&map=anillo_vientos&x=31&y=22&dir=2&party=TORTERRA:32&zygarde=run,ram,terrain&zcells=32&zcores=2&fragments=2&flags=p1_restored,p2_restored,b06_colector_roto&debug`
- Galerías: `?scene=map&map=galerias_soplo&x=10&y=28&dir=8&zygarde=run,ram,terrain&zcells=32&zcores=2&fragments=2&flags=p2_restored,b06_colector_roto,b06_abril_vencida&noenc=1&debug`
- Sala de las Campanas y núcleo: `?scene=map&map=anillo_vientos&x=24&y=17&dir=2&zygarde=run,ram,terrain&zcells=33&zcores=2&fragments=2&flags=p1_restored,p2_restored,b06_colector_roto,b06_abril_vencida&debug`
- `node --test tests/b06_wind.test.mjs tests/b06_content.test.mjs tests/b06_reach.test.mjs` (el último comprueba a pie
  que sin Embestida no se llega a la Meseta, que al Parque solo se entra por la puerta guardada y que todos los objetos
  se pueden coger) · `node tools/preview_map.mjs anillo_vientos --pass` ·
  **recorrido completo**: `node tools/e2e_b06.mjs` (≈6 min; `--from=anillo|galerias|sala` para un tramo; `--no-retry`
  sin las derrotas simuladas). Capturas `tools/cache/screens/e2e_b06_*`, transcripción `e2e_b06_dialogos.txt`.
- `?fragments=N` (world/devTools.js) da los Fragmentos F01…F0N: la cadena de resonancia exige el Fragmento 2.
