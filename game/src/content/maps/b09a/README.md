# Bloque 9a — Ruta 7, Ciudad Lúmina y Ruta 14 / Reserva del Delta

Guion: `docs/CAMPANA.md` «B09» (parte A), §1.4 (Ruta 7, Lúmina, Ruta 14), §2.3 (C041–C043, C071, C088), §2.5 (puerta
G6: el Paso del Derrumbe), §2.6 (reintentos), §5 (Vértice, Genesis) y §6.3 (Gael B3). `docs/TABLILLAS.md` §4.5 (T07),
§4.6 (T06) y §4.8 (Alfas). Encuentros: `docs/POKEDEX_DISTRIBUCION.md` §7.3. Dinero: `docs/BALANCE.md`.
**Fuentes únicas de coordenadas:** `ruta_7_layout.js`, `lumina_layout.js`, `ruta_14_layout.js`, `museo_layout.js`;
enlaces con otros bloques en `links.js`.

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_7` | `ruta_7.js` + `_layout` + `_build` | 90×30 | 5 | Valle de Estrato a Lúmina: vía del tren (fila 5, paso a nivel x 60–63), Paso del Derrumbe (x 76–78) cerrado hasta `p4_restored`, andén abandonado con barro (C041), hierba agitada (Audino), charca, verja de la Calzada del Rey (norte, B19) |
| `ciudad_lumina` | `ciudad_lumina.js` + `lumina_layout.js` + `lumina_build.js` | 72×64 | 3 | Terraza del museo con escalinata (x 34–36), vía y topera (fila 15), Parque de las Eras (hierba, estanque, C042, tutor), patio de la guardería, verja norte (Mirador Sur, B17) |
| `lumina_museo` | `lumina_museo.js` | 35×19 | 4 | Planta baja: dos alas (arco izquierdo → x 18–20, derecho → x 27–29), fósiles, escalera a la galería y escalera del personal al sótano |
| `lumina_museo_galeria` | `lumina_museo_galeria.js` | 48×16 | 4 | Galería + Sala de Antea (calco, vitrina helada, placa Unown) + Sala de las Crónicas (se abre tras T06) |
| `lumina_museo_taller` | `lumina_museo_taller.js` | 32×20 | 4 | Sótano: Sala de Réplicas (6 palés), taller con báscula, archivo (ficha de 1962, ficha de la Laguna Clara), muelle de carga |
| `lumina_hotel` | `lumina_hotel.js` | 26×22 | 4 | Hotel Mirador: la Gala, recepcionista con descanso (posada `storm: true`) |
| `lumina_centro` | `lumina_centro.js` | plantilla | — | Centro Pokémon (Iván, pista T07) |
| `lumina_almacenes` / `_2` | `lumina_almacenes.js`, `lumina_almacenes_2.js` | 19×18 / 18×17 | 4 | Grandes Almacenes: planta baja (general, Balls) y planta 2 (6 piedras evolutivas + Cordón Unión) |
| `lumina_guarderia`, `lumina_trastos`, `lumina_pasteleria` | `lumina_small.js` + uno por casa | 15×12 | 4 | Guardería (Piedra Oval; Audinita tras T06), tienda de trastos (Rotom de noche), pastelería (Milcery) |
| `lumina_estacion` | `lumina_estacion.js` | 27×17 | 4 | Estación central (tren de `world/transport.js`, parada `lumina`) |
| `ruta_14_reserva` | `ruta_14_reserva.js` + `_layout` + `_build` | 60×60 | 6 | Delta del Albo: dos brazos que entran por el borde oeste, cruzados solo por dos pasarelas de tablones (x 12–14 y 28–30; tablero de la fila 481 de ExteriorSafari, la única del muelle que se pisa entera), valla de la Reserva (puerta y guarda), colmena, pradera, laguna (Nadar, C071, remolino de Buceo), huerto (C043, Applin, árbol de miel), seto con el enjambre y Reserva interior |
| `reserva_fondo` | `reserva_fondo.js` | 22×16 | 15 | Fondo de la laguna (Buceo): C088 y una Perla oculta |

Arte propio (PROVISIONAL): `node tools/b09a_assets.mjs` → `assets/objects/b09_via.png`, `b09_via_1.png`,
`b09_topera.png`, `b09_losas.png`, `b09_colmena.png`, `b09_derrumbe.png`, `b09_flores.png`, `b09_furgoneta.png`.

## Enlaces

| Desde | Casilla / borde | Hacia | Llegada / estado |
|---|---|---|---|
| `ruta_7` borde oeste | filas 20–23 | `ciudad_lumina` `west`, offset −10 | filas 30–33 de Lúmina (vuelta `east`, +10) |
| `ruta_7` borde este | filas 16–19 | `ciudad_estrato` (B08) `east`, offset −6 | filas 22–25 de Estrato; la vía entra por su fila 11 (= fila 5). B08 conecta `west`, +6: **verificado** |
| `ruta_7` borde norte | x 60–63 | `calzada_rey` (B19) `north`, offset 58 | pendiente: verja con aviso hasta que el mapa exista |
| `ciudad_lumina` borde sur | x 34–37 | `ruta_14_reserva` `south`, offset 6 | x 28–31 de la Ruta 14 (vuelta `north`, −6) |
| `ciudad_lumina` borde oeste | filas 9–12 | `ruta_8_marisma` (B09b) `west`, offset −54 | filas 63–66 de la Ruta 8. B09b conecta `east`, +54: **verificado** |
| `ciudad_lumina` borde norte | x 33–36 (verja en (33,1)) | `mirador_sur` (B17) `north`, offset 20 | pendiente: B17 debe abrir su camino sur en x 13–16 y conectar `south`, −20; la verja se quita sola |
| `ruta_14_reserva` borde sur | x 28–31 | `ciudad_nexo` (B09b) `south`, offset −2 | x 30–33 de Nexo. B09b conecta `north`, +2: **verificado** |
| Lúmina: puertas | empujar la puerta desde la casilla de debajo | interiores | trastos (5,8), pastelería (13,8), hotel (43,8), guardería (53,8), museo (36–37,22), estación (61,28), Centro (57,43), almacenes (65,47) |
| Interiores | felpudo/alfombra, pulsar ↓ | `ciudad_lumina` | una casilla bajo la puerta (museo: cada arco a su ala) |
| `lumina_museo` | escalera (9,15) / escalera del personal (31,14) | galería (19,13) / sótano (3,5) | la del personal solo se baja de noche con T06 abierta, o tras T06 |
| `lumina_museo_taller` muelle | (29–30,17), pulsar ↓ | `ciudad_lumina` (44,21) | salida del muelle junto al museo |
| `ruta_14_reserva` remolino | (48,12), Buceo | `reserva_fondo` (10,9) | vuelta por el respiradero (13,8) |
| `lumina_estacion` | andén (22,6) | tren (`transport.js`) | llegada a Lúmina en (61,29) ↓ |

`links.js#linkIfReady` activa cada enlace pendiente en cuanto el mapa vecino está registrado; si no existe, las
casillas del borde dan un aviso neutro y devuelven al jugador un paso.

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| El Core ante la Sima: «Al norte, el suelo se acaba. Muy hondo.» | al entrar en la Ruta 7 | `!b09_r7_llegada` | `b09_r7_llegada` |
| El Paso del Derrumbe: escombros y mineros; se despeja con P4 | Ruta 7, x 76–78 | `p4_restored` | — |
| El botones lleva al jugador a la Gala | al entrar en Lúmina (o hablarle en (66,31)) | `!b09_gala_invitacion` | `b09_gala_invitacion` |
| **Gala** (Vértice mecenas, «Nos está midiendo.», Rosalía abre **T06**, Gael cita en la escalinata) | Hotel Mirador | invitación, `!b09_gala` | `b09_gala`, pista T06 |
| **Gael B3** (Staravia 32, Lucario 32, Gabite 31, Absol 32, inicial evolucionado 34) | franja y 28, x 33–37 (escalinata) | `b09_gala`, `!b09_gael_b3` | `b09_gael_b3` (+ `b09_gael_b3_ganado` si gana el jugador). Perder: la historia sigue |
| Iván pide ayuda (pista **T07**) | Centro Pokémon (6,8) | — | `b09_ivan` |
| La guarda deja pasar (con Iván, o descubrimiento directo: abre T07 igual) | puerta de la valla (36,33–36) | — | `b09_reserva_paso` |
| La colmena y su losa que zumba (2.ª pista); tres obreras → tres flores | Reserva | — | `b09_t07_colmena`, var `b09_t07_obreras`, `b09_t07_flor_pradera/ribera/huerto` |
| Flores ante la colmena: **Vespiquen Alfa nv 36** (captura opcional) | (40,29) | tres flores | `b09_t07_flores`, `b09_t07_alfa`. Perder: curado en (40,29); huir: se esconde hasta volver a hablar |
| La colmena se muda al fondo; **Tabla Bicho**, Scolipedita, Reserva abierta | idem | Alfa vencido o capturado | `b09_t07_tablilla`, `b09_scolipedita`, `b09_reserva_abierta` (el enjambre deja el seto) |
| Rosalía de noche: «han cambiado todas las etiquetas» (2.ª pista T06) | planta baja del museo | noche, `b09_gala` | `b09_t06_noche` |
| Pistas: báscula (16), ficha de 1962 (1), foto (2), calco Unown (4), vitrina helada (8) | sótano, galería, Sala de Antea | — | var `b09_t06_pistas` (bits) + notas sueltas en la Libreta |
| **Sala de Réplicas**: elegir un palé. Error → «No.», los palés se recolocan y vuelta a (7,13) | sótano | — | var `b09_t06_intento` |
| La original: el Core confirma; los restauradores se la llevan al muelle | idem | acierto | `b09_t06_original`, `b09_t06_persecucion` |
| **Combate doble del muelle** (Bruno: Bronzor 35, Magneton 36 · Noemí: Elgyem 35, Duosion 35, Skuntank 36) | muelle (17–19,15) | persecución | `b09_t06_restauradores`. Perder: curado en (17,15), reintento |
| Final: **Tabla Acero**, Eevee nv 10, Rosalía abre **T08** («El museo no puede protegerla; tú sí.») | sótano | combate ganado | `b09_t06_tablilla`, `b09_eevee`, `b09_t08_pista` |
| Ficha de la Expedición a la Laguna Clara; Rosalía, junto al archivo (10,16): «Nunca publicaron nada.» (después vuelve a la Sala de las Crónicas) | archivo (7,15) | tras T06 | `b09_ficha_laguna` |
| Regalos: Piedra Oval (guardería); Audinita (tras T06); Milcery nv 15 (pastelería); Rotom nv 20 (trastos, de noche) | Lúmina | — | `b09_piedra_oval`, `b09_audinita`, `b09_milcery`, `b09_rotom` |
| Fósiles: Cráneo → Cranidos, Coraza → Shieldon (nv 25) | paleontólogo (27,6) del museo | fósil en la Mochila | `b09_fosil_craneo` / `b09_fosil_coraza` |

**Derrotas (§2.6).** Gael B3, el Alfa y el doble del muelle usan `scriptedBattle` (`events/b09a_common.js`):
`canLose` + `noMoneyLoss`, sin «fuera de combate»; al perder, equipo curado y de vuelta a la casilla de reintento. El
Alfa vencido sin capturar y Applin (visible fijo nv 34) reaparecen al descansar (`rest_count`).

**Noche.** Hora < 6 o ≥ 20. El recepcionista del hotel ofrece «Descansar» → Mañana / Tarde / Noche (y «hasta
tormenta»). Tras T06 el museo cierra de noche (Rosalía despide al jugador).

## Células

| Código | id | Mapa | Casilla | Etapa |
|---|---|---|---|---|
| C041 | `cell_ruta_7_1` | `ruta_7` | (38,11), bajo el andén, tras el barro | D (Terreno complicado) |
| C042 | `cell_lumina_1` | `ciudad_lumina` | (5,42), Parque de las Eras | D |
| C043 | `cell_reserva_1` | `ruta_14_reserva` | (51,42), huerto | D |
| C071 | `cell_reserva_2` | `ruta_14_reserva` | (45,13), laguna | F (Nadar) |
| C088 | `cell_reserva_3` | `reserva_fondo` | (14,6) | G (Buceo) |

## Pruebas rápidas

Base: `?scene=map&party=STARAPTOR:58,TORTERRA:58,LUXRAY:56,LUCARIO:56&fragments=4&zygarde=run,ram,terrain&zcells=40&zcores=2&vars=starter:TURTWIG,gael_starter:LITTEN&noenc=1&debug` más:

- Ruta 7 desde Estrato: `&map=ruta_7&x=87&y=17&dir=4&flags=b01_dex_received,p1_restored,p2_restored,p3_restored,p4_restored`
- Llegada a Lúmina y Gala: `&map=ciudad_lumina&x=69&y=31&dir=4&flags=p4_restored`
- Gael B3: `&map=ciudad_lumina&x=35&y=30&dir=8&flags=p4_restored,b09_gala_invitacion,b09_gala`
- T07 (Iván en el Centro): `&map=ciudad_lumina&x=57&y=44&dir=8&flags=p4_restored,b09_gala_invitacion,b09_gala,b09_gael_b3`
- T06 de noche: `&map=lumina_museo&x=28&y=16&dir=8&time=22&flags=p4_restored,b09_gala_invitacion,b09_gala,b09_gael_b3`
- Sala de Réplicas: `&map=lumina_museo_taller&x=7&y=13&dir=8&time=22&flags=p4_restored,b09_gala,b09_gael_b3,b09_t06_noche&vars=b09_t06_pistas:31`
- `node --test tests/b09a_reach.test.mjs tests/b09a_content.test.mjs` (a pie: el derrumbe corta la Ruta 7 hasta P4, la
  escalinata exige a Gael, la escalera del personal solo de noche, la Reserva exige permiso y el interior T07; objetos,
  células y entrenadores alcanzables; lógica de T06 con una sola original y de T07; enlaces simétricos).
- **Recorrido completo**: `node tools/e2e_b09a.mjs` (≈13 min; `--from=t07|t06` para un tramo; `--no-retry` sin las
  derrotas simuladas de Gael, el Alfa y el muelle). Capturas `tools/cache/screens/e2e_b09a_*`, transcripción
  `e2e_b09a_dialogos.txt`.

## Archivos compartidos tocados

- `world/transport.js`: llegada del tren a Lúmina `{ x: 61, y: 29, dir: 2 }`.
- `content/zygarde/cells.js`: C088 en el mapa `reserva_fondo`.
- `game/data/items_axis.json`: entrada `SCOLIPITE` (copia de la de Añil) con el singular «Scolipedita» (Añil lo trae
  como «Scolipeditas» y el regalo de T07 decía «¡Has obtenido Scolipeditas!»).
