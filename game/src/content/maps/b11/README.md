# Bloque 11 — Interludio 5: Bosque Neblino, Ruta 10, el Monte y el regreso a casa (T09, T10, Gael B4)

Guion: `docs/CAMPANA.md` «B11», §1.4 (Ruta 9/Neblino, Ruta 10, Cerro del Alba), §1.8 (fondos y música), §2.3
(C007, C047, C048, C049, C054), §2.5 (G7: la niebla del olvido hasta el P5), §2.6 (reintentos), §5.5 (Alerce, escena
6) y §6 (Gael B4). `docs/TABLILLAS.md` T09 «La memoria de Íker» y T10 «La cuadrilla perdida». Encuentros:
`docs/POKEDEX_DISTRIBUCION.md` (Ruta 10 baja/alta, Neblino; Altarianita, Lopunnita). Balance: `docs/BALANCE.md`.
**Fuente única de coordenadas:** `layout.js`.

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_9_neblino` | `ruta_9_neblino.js` + `_build.js` | 50×60 | 7 | Bosque lila de cristales: claros, senderos y veredas; el resto es bosque (`paint.js#forestFill` con trozos de alturas variadas para que los lindes no sean franjas, y `fillGaps` para los huecos cortos). El Albo entra por el norte (x 7–10, la misma x que en la Ruta 10), baja con meandros y cruza al este bajo un puente de troncos. Claro de la hoguera (descanso de campamento: cambia la franja horaria), loma del tronco hueco (C047) y repisa de cristal (C048) con Trepar, santuario musgoso (Lopunnita), 15 racimos de cristal que brillan, vivac de Nilo (maletín). Antes del P5: niebla espesa y franjas (todo el ancho, filas 5 y 50) que devuelven al lindero; después: bruma ligera y tono lila |
| `ruta_10` | `ruta_10.js` + `_build.js` | 60×40 | 7 | Faldas del Monte. **Tramo bajo** (filas 17–39, niveles 4–7): libre desde el cruce oeste de la Ruta 1, con C007; el Albo llega del campamento por el oeste (filas 20–23), traza una curva y sale al Neblino por x 7–10. **Tramo alto** (terraza de las filas 0–16, niveles 40–45, `encounterZones`): solo por la pared de raíces (Trepar). En el alto: el pinar vigilado por cuatro Honchkrow centinela (sigilo del T10), la cornisa del nordeste (cuadrilla y dormidero del Honchkrow Alfa) y la repisa de raíces del noroeste (C049) |
| `campamento_monte` | `campamento_monte.js` + `_build.js` | 40×28 | 1 | Campamento de Genesis al pie del Monte del Portal: tiendas, camión, contenedores, mesa de trabajo, barriles, focos, cajas **EXP-03**, perforadora de muestras, trípode sobre el aljibe, perímetro con barreras. Cascada y peñas al oeste. Tras `b11_exp03` queda abandonado: un parche borra `CAMP_PIECES` y quedan los pozos de sondeo tapados (eventos en `CAMP_HOLES`) y una caja vacía |
| `cerro_alba` | `cerro_alba.js` | 24×30 | 1 | Cornisa sobre Villa Alba (C054) y cima con el brasero (decorado; Ho-Oh es postgame). Se llega desde el mirador de la Ruta 1 con Correr + Trepar |
| `mnemos_casa_iker` | `mnemos_casa_iker.js` | 15×12 | 4 | Casa de Íker en la Aldea Mnemos (la puerta exterior la pone B10): Íker, su madre, el anciano, el Musharna, tres dibujos en la pared y el plano de la mesa |
| `mnemos_pozo_custodios` | `mnemos_pozo_custodios.js` | 17×15 | 2 | Pozo bajo la casa de té de Mnemos: sala oscura con el pilar del manantial y la **Tabla Mental** |

Arte propio (PROVISIONAL, D30): `node tools/b11_assets.mjs` → `assets/objects/b11_caja_exp03.png`,
`b11_perforadora.png`, `b11_cristal_lila.png` (fila = variante), `b11_sondeo.png`, `b11_tablilla.png` (fila 2 Oscura,
fila 4 Mental), `b11_brasero.png`. Se reutiliza (solo lectura) el maletín de B09b (`b09b_maletin.png`) para el vivac de
Nilo. Utilidades de pintado compartidas por los mapas del bloque: `paint.js` (`forestFill`, `fillGaps`, `raggedForest`
y **`decorate`/`safeStamp`**, que solo colocan un detalle sobre suelo despejado —sin sustituir árboles, caminos,
orillas, hierba alta ni otras piezas— y fuera de las casillas reservadas: eventos, su acceso y la vista de los
entrenadores. Con `globalThis.__B11_DECOR_DEBUG = true` listan en Node lo que no cabe).

## Enlaces

| Desde | Casilla / borde | Hacia | Llegada / notas |
|---|---|---|---|
| `ruta_1` borde oeste (cruce) | filas 16–17 | `ruta_10` | Enlace pendiente de B01 (`maps/b01/pending_links.js`): `ruta_10` conecta `east` offset 4 (sus filas 20–21). **Activo** |
| `ruta_10` borde sur | x 20–23, y 39 | `ruta_9_neblino` | `south` offset 0 ↔ Neblino `north` offset 0 |
| `ruta_10` borde oeste (tramo alto) | filas 6–8 | `campamento_monte` | `west` offset 0 ↔ campamento `east` offset 0 |
| `ruta_9_neblino` borde sur | x 22–24, y 59 | `aldea_mnemos` (B10) | `linkIfReady('aldea_mnemos')` (`pending_links.js`): **activo** (B10 registrado; su calle norte en x 22–24, offset 0). Sin Mnemos: aviso neutro y un paso atrás |
| `campamento_monte` senda | x 9–12, y 0 | `montana_portal` (B01/B12) | (17,48) ↑. Vuelta: `montana_portal` borde sur (x 16–18, pulsando abajo) → (10,1) ↓ |
| `ruta_1` raíces del mirador | (24,7), desde (23,7) mirando al este | `cerro_alba` | (5,27) ↑. Requiere Trepar; solo se añade si `cerro_alba` está registrado. Salida: franja y 29 (x 4–6) → `ruta_1` (23,7) ← |
| `aldea_mnemos` puerta de Íker | (5,19) (`BUILDINGS.iker` de B10) | `mnemos_casa_iker` | `ikerDoorEvent` (b11_t09.js). Salida: pisar la fila 11 → vuelve a donde se entró (var `b11_t09_regreso`) |
| `mnemos_casa_te` pozo | (12,9) (`TEA_WELL` de B10) | `mnemos_pozo_custodios` | `teaHouseWellEvents` (b11_t09.js); solo tras `b11_t09_pozo_abierto`. Salida: pisar (8,13) |

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| **Niebla del olvido** (G7): cruzar la franja y 5 o y 50 devuelve al lindero; Zygarde la reconoce una vez | Neblino | `!p5_restored` | `b11_niebla_vista` |
| Llegada: la niebla se ha retirado | Neblino, franjas y 5 / y 50 | `p5_restored && !b11_neblino_intro` | `b11_neblino_intro` |
| **Nilo** escondido (solo de noche; de día, su vivac —maletín— y una pista de Zygarde): primera pista T10 y, al volver a hablarle, la segunda | Neblino (13,17) | noche, `!b11_t10_cuadrilla` | `b11_t10_nilo_visto`, `b11_t10_nilo_cuenta` (pistas T10 1–2) |
| Pista de Zygarde hacia casa («Tu pueblo…» se sugiere al pasar) | Ruta 10, franja y 30 | `p5_restored && !b11_regreso` | `b11_pista_casa` |
| **Sigilo**: cuatro centinelas giran con un reloj fijo (`b11_t10.js#SENTINELS`); si te ven, alarma y vuelta al punto seguro (31,13) | Ruta 10, pinar alto | `!b11_t10_alfa` | var `b11_sigilo_pillado` |
| **Cuadrilla** en la cornisa (descubrimiento directo de T10 si faltaba Nilo) | Ruta 10 (44,2)/(45,1) | cornisa | `b11_t10_cuadrilla_vista`, `b11_t10_cuadrilla` |
| **Honchkrow Alfa** Nv 42 (combate de guion salvaje: perder = curado, de vuelta a lo alto de la cornisa con un aviso y sin perder dinero; capturable). Reaparece si se descansa después | Ruta 10 (49,1) | tras la cuadrilla | `b11_t10_alfa` (+`_capturado`), var `b11_alfa_descanso` |
| **Tabla Oscura** (DREADPLATE, cierra T10) | Ruta 10 (49,2) | Alfa vencido | `b11_t10_tablilla` |
| **Deserción de Nilo**: espera con la cuadrilla al pie de la cornisa (se presenta si no se le encontró en el Neblino), deja Genesis, entrega los planos de Talasa y cuenta que allí guardan la «Muestra Z-4» en un tanque de presión (CAMPANA §2.4, N4) | Ruta 10 (46,9) | Tablilla y cuadrilla | `b11_t10_espera`, `b11_planos_talasa` (nota de la Libreta), `b11_nilo_desertor` |
| Primer regreso a Villa Alba | Villa Alba (auto) | `p5_restored && !b11_regreso` | `b11_regreso` |
| **Mamá y el huevo de Togepi** («Una Togepi puso un huevo en el jardín y no ha vuelto. Creo que es para ti.»). Equipo lleno: lo guarda. Si aún no se ha visto la escena del laboratorio, cuenta que Gael iba hacia allí | casa (auto) | `p5_restored && !b11_huevo` | `b11_huevo` (o `b11_huevo_aviso`), `b11_mama_gael` |
| **Gael frente a Alerce** («Usted sabía quiénes eran desde el principio.» / «Sabía de qué eran capaces.»); Gael se va al Monte. Al volver a hablarle, Alerce tiene línea propia hasta el P6 (antes y después de Gael B4) | laboratorio (auto) | `p5_restored && !b11_gael_alerce` | `b11_gael_alerce` |
| Campamento: primera visita (perforación, cajas EXP-03, Zygarde «Esa piedra… resuena.») | franja x 37 | sin `b11_gael_alerce` | `b11_campamento_visto` |
| **Genesis se lleva EXP-03** y levanta el campamento | franja x 37 | `b11_gael_alerce && !b11_exp03` | `b11_exp03` (parche de tiles) |
| **Gael B4** al pie del Monte (Staraptor 41, Lucario 41, Gabite 41, Absol 42, inicial final 43). Perder no corta la historia | campamento, senda | `b11_exp03 && b11_gael_alerce` | **`b11_gael_b4` (salida del bloque)** |
| **T09**: Íker (segunda pista), tres dibujos → tres lugares, el pozo bajo la casa de té, el Musharna abre el paso | casa de Íker / casa de té | B10 (Mnemos) | `b11_t09_iker`, var `b11_t09_dibujo`, `b11_t09_dibujos`, `b11_t09_pozo_deducido`, `b11_t09_pozo_abierto` |
| **Tabla Mental** (MINDPLATE, cierra T09); al volver, Íker recuerda y regala la Chimechita | pozo (8,4); casa de Íker (auto) | | `b11_t09_tablilla`, `b11_t09_iker_curado` |
| Cerro del Alba: llegada, C054, brasero | `cerro_alba` | Trepar | `b11_cerro_visto` |

**Reintentos (CAMPANA §2.6):** Honchkrow Alfa y Gael B4 son combates de guion sin pérdida (`wildBossBattle` /
`scriptedBattle`); la alarma del sigilo solo devuelve al punto seguro (sin combate); las elecciones del T09 se pueden
repetir; el huevo espera en casa si no hay sitio. Descanso: hoguera del Neblino (`runRest` kind `camp`, fija el punto
de cura) y cama de casa.

## Huevos (sistema nuevo, `world/eggs.js`)

`createEgg(db, species, opts)` crea un Pokémon con `egg: true` y `eggSteps` (pasos de eclosión de la especie; Togepi
2560); `addEggToParty` lo añade sin registrarlo en la Pokédex; cada paso del jugador (`mapScene.js#stepTaken` →
`eggStep`) descuenta y, al llegar a 0, se ejecuta la escena de eclosión (registro, grito, mote opcional). Pruebas:
`tests/b11_eggs.test.mjs`.

## Células, objetos y entrenadores

| Código | Clave | Casilla | Dónde |
|---|---|---|---|
| C007 | `cell_ruta_10_1` | ruta_10 (11,27) | tramo bajo, junto al Albo |
| C047 | `cell_neblino_1` | ruta_9_neblino (35,6) | loma del tronco hueco (pared en (35,10), se sube desde (35,11)) |
| C048 | `cell_neblino_2` | ruta_9_neblino (42,37) | repisa de cristal (pared en (41,42), desde (41,43)) |
| C049 | `cell_ruta_10_2` | ruta_10 (14,1) | repisa de raíces del noroeste (pared en (15,5), desde (15,6)) |
| C054 | `cell_cerro_alba_1` | cerro_alba (18,15) | cornisa (pared en (11,22), desde (11,23)) |

Objetos: Ruta 10 — **Altarianita** (3,13), Hiperpoción, Ultra Ball ×2, Revivir (oculto), Poké Ball, Poción, Baya
Aranja (oculta). Neblino — **Lopunnita** (junto al santuario), Cura Total, Ultra Ball ×2, Piedra Lunar, Hiperpoción y
Mini Seta (ocultas). Cerro — Más PP (18,3), Superrepelente (oculto). T09 — Chimechita.
`content/trainers/b11.js`: Joven Tomás y Chica Nuria (tramo bajo, 6–7), Montañero Elías, Ornitóloga Marisa, Veterana
Amparo (tramo alto, 40–42), Médium Celia, Excursionista Rubén, Bichera Lucía, Veterano Andrés (Neblino, 38–41), los
técnicos del campamento (40–41) y Gael B4. Dinero según `BALANCE.md`.

## Cambios en el mundo

Tras `p5_restored`: sin niebla espesa en el Neblino. Tras `b11_t10_alfa`: sin centinelas (el Alfa vuelve al
dormidero si se descansa, pero los centinelas no). Tras `b11_exp03`: el
campamento vacío con los pozos de sondeo. Tras `b11_gael_alerce`: la vecina cuenta que Gael se fue; Alerce tiene
una línea nueva hasta `b11_gael_b4`. Flags para otros bloques: **`b11_gael_b4`** (salida, Diario),
`b11_exp03` (Genesis tiene el cristal: B12 puede dejar los pozos de perforación en `montana_portal`),
`b11_planos_talasa` (B13, N4), `b11_t09_tablilla`, `b11_t10_tablilla`, `b11_huevo`.

## Pruebas rápidas

Flags de B01 necesarios en Villa Alba (si no, el prólogo toma el control):
`B01=b01_woke,b01_met_mom,b01_lab_intro_seen,b01_starter_chosen,b01_signal_heard,b01_police_entered,b01_core_found,b01_escorted,b01_gael_duel_done,b01_mom_gift,b01_dex_received,b01_left_town`.

- Niebla del olvido (sin P5): `?scene=map&map=ruta_9_neblino&x=21&y=1&dir=2&noenc=1&debug`
- Neblino de noche (Nilo, C047/C048): `?scene=map&map=ruta_9_neblino&x=23&y=57&dir=8&time=22&flags=p5_restored&zygarde=run,ram,terrain,climb&party=TORTERRA:62&noenc=1&debug`
- Sigilo, cuadrilla, Alfa: `?scene=map&map=ruta_10&x=30&y=17&dir=8&time=22&flags=p5_restored,b11_neblino_intro,b11_t10_nilo_visto,b11_t10_nilo_cuenta&zygarde=run,ram,terrain,climb&party=TORTERRA:62,STARAPTOR:60&noenc=1&debug`
- Regreso a casa (huevo y laboratorio): `?scene=map&map=ruta_1&x=14&y=3&dir=8&time=11&flags=<B01>,p5_restored&party=TORTERRA:62&noenc=1&debug`
- Campamento y Gael B4: `?scene=map&map=campamento_monte&x=37&y=7&dir=4&flags=<B01>,p5_restored,b11_regreso,b11_huevo,b11_gael_alerce&vars=gael_starter:LITTEN&zygarde=run,ram,terrain,climb&party=TORTERRA:62,STARAPTOR:60&noenc=1&debug`
- T09 (Mnemos, puerta de Íker): `?scene=map&map=aldea_mnemos&x=5&y=20&dir=8&time=11&flags=p5_restored,b10_llegada,b10_niebla_levantada,b10_archivo_abierto,b10_informe&party=TORTERRA:62&noenc=1&debug`
- Cerro del Alba: `?scene=map&map=ruta_1&x=23&y=7&dir=6&flags=<B01>&zygarde=run,ram,terrain,climb&noenc=1&debug`
- `node --test tests/b11_eggs.test.mjs tests/b11_reach.test.mjs tests/b11_content.test.mjs tests/b11_decor.test.mjs`
  (`b11_decor`: ningún stamp sustituye tiles ya pintados; `b11_reach`: además, nada de hierba alta al norte de la
  niebla antes del P5 y franjas de niebla de todo el ancho) · **recorrido completo**:
  `node tools/e2e_b11.mjs` (≈10 min; `--from=neblino|ruta10|villa|campamento|t09|cerro`, `--only=<tramo>`,
  `--no-retry`). Capturas `tools/cache/screens/e2e_b11_*` y transcripción `e2e_b11_dialogos.txt`.

## Coordinación con otros bloques

- **B01**: ediciones mínimas y aditivas (una línea cada una) en `villa_alba.js`, `casa_prota_1f.js`,
  `laboratorio_alerce.js`, `b01_town_lab.js` (línea de Alerce tras la escena), `ruta_1.js` (raíces del Cerro, solo si
  `cerro_alba` existe) y `montana_portal.js` (su borde sur baja al campamento).
- **B10** (Aldea Mnemos): conexión sur del Neblino ↔ norte de Mnemos (x 22–24, offset 0); la puerta de Íker
  (`ikerDoorEvent`) y el pozo de la casa de té (`teaHouseWellEvents`) los coloca B10 con las funciones de `b11_t09.js`.
- **B12** (P6, Monte del Portal ampliado): `montana_portal` sigue siendo el mapa del prólogo; al ampliarlo faltan
  C050, C051 y C076, y conviene conservar la llegada (17,48) desde el campamento y su borde sur.
- **B13** (Talasa, N4): `b11_planos_talasa` indica que el jugador tiene los planos que entregó Nilo (nota de la
  Libreta `b11_planos_talasa`: «…Abajo, en un tanque de presión, guardan la "Muestra Z-4"»). Nilo solo dice lo que
  ha oído; la escena del tanque y el Porygon de regalo son de B13.
- **B12** (P6): la Médium del Neblino menciona las sombras que bajan del Monte de noche (fase 1–2, TABLILLAS T10);
  el P6 es quien las detiene.
