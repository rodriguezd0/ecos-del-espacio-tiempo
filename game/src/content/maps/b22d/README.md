# B22d — Sellos, sueños y Cierzo

Postgame IV de `docs/CAMPANA.md §8`. Los accesos requieren `game_cleared` y `b21_fin`: el epílogo termina antes de iniciar estas búsquedas. Los mapas propios no tienen encuentros aleatorios.

| Encuentro | Nivel | Pista y acceso |
| --- | ---: | --- |
| Regirock | 70 | Fermín, en su casa de Estrato, baja a leer el relieve de la Mina. Golpear pico → lámpara → vagoneta abre la Cueva Sellada del Pico. Un error reinicia los ecos. |
| Regice | 70 | Rosendo abre la trampilla de los Talleres del Hielo. La talla vieja enseña una cruz; los nueve bloques se pueden tallar y deshacer. |
| Registeel | 70 | Rosalía baja de las Crónicas al muelle del museo. Péndulo, rueda de escape y pesa reparan el reloj; el paso sur requiere Embestida. |
| Regigigas | 75 | El sello del segundo piso del Archivo exige Regirock, Regice y Registeel en el equipo, sin huevos. El Coloso vuelve a comprobar el equipo al despertar. |
| Heatran | 72 | Brasa entrega la Piedra Magma en la Forja; la orilla sur del cráter activo levanta una calzada de basalto. La piedra se conserva. |
| Darkrai | 70 | Mamá da el rumor. El primer sueño profundo nocturno en la cama de casa abre la pesadilla; todos los desenlaces permiten despertar. Un KO se recupera en el siguiente sueño profundo. |
| Cresselia | 70 | Mamá teje el Atrapasueños después de encontrarse con Darkrai. La figura aparece de noche sobre el mar del Islote Lumbre. |
| Mewtwo | 80 | La verja del Mar Boreal exige 300 especies vistas. Tres prototipos distintos desbloquean el ascensor del original. Cierzo es un proyecto extranjero abandonado. |
| Marshadow | 70 | Casilda da el aviso en el núcleo actual del Umbral. De noche hay que seguir seis posiciones de la sombra que se mueve a destiempo. |

Los nueve originales usan capturas normales. Capturar fija un flag permanente; debilitarlos guarda `rest_count`, y reaparecen después de descansar. Huir no altera el encuentro. Perder cura el equipo, conserva el dinero y el punto de cura, y devuelve al lugar de reintento. Darkrai siempre devuelve a la cama. Las Balls contra los prototipos no gastan objeto ni turno.

Los prototipos son Mewtwo fallidos de nivel 70/72/74: ataque físico, defensa y Mutatipo, respectivamente. Cada victoria tiene su propio flag; repetir la misma prueba no abre seguros adicionales. El original permite la captura únicamente tras las tres victorias distintas.

## Mapas y regresos

`layout.js` es la fuente única de coordenadas. Se conservan las identidades recuperadas del WIP; los nuevos accesos se incorporan a los mapas actuales de la campaña.

| Mapa propio | Regreso |
| --- | --- |
| `mina_galena_sellada` | Mina Galena `(7,16)` |
| `boreal_cueva_sellada` | Talleres del Hielo `(15,10)` |
| `lumina_tuneles` | Sótano del museo `(17,15)` |
| `archivo_coloso` | Archivo piso 2 `(25,10)`, fuera de la subida `(25,11)` |
| `alba_pesadilla` | Cama de casa `(8,6)`; puerta y desenlaces del combate permiten despertar |
| `instalacion_cierzo` | Puerta del edificio en Mar Boreal `(4,6)` |
| `cierzo_laboratorio` | Tres alfombras independientes devuelven al vestíbulo |
| `cierzo_nucleo` | Ascensor del vestíbulo `(23,4)` |

La verja existente de Cierzo `(6,7)` mantiene su descripción durante la campaña y se abre a pie al cumplir el registro. La puerta verdadera del edificio está en `(4,5)`. Las llegadas quedan fuera de los disparadores de retorno. El Coloso utiliza el segundo piso reformado del Archivo, no las coordenadas antiguas de la cámara del núcleo.

## Integración

Guiones `content/events/b22d_*`: reglas comunes, combates, cuatro Regis, Heatran, sueños, Cierzo y sombras. Hooks aditivos en B01/B02/B08/B09a/B10/B13/B15, conservando los eventos de B22a y las pistas de B22b. Casilda se integra mediante `withMarshadowHint(events)`; su aparición de revanchas `b22e_guardian_casilda` llama a `casildaHint(ctx)` antes del menú, incluso cuando ya dejó las ruinas durante la campaña.

La pesadilla oculta a los acompañantes, tiene cuatro siluetas distintas que desaparecen al tocarlas y devuelve al pueblo al cruzar sus bordes. La puerta de casa permite despertar antes del combate; volver a dormir reinicia las siluetas.

Los PNG de objetos se regeneran con `node tools/b22d_assets.mjs`; los Pokémon usan sus hojas existentes de Añil. No se modifica el atlas compartido.

## Verificación

`node --test tests/b22d_*.test.mjs`: persistencia, requisitos, errores de puzzles, pérdida segura, paso real por puertas, ocho mapas, capturas con el motor real y restricciones de los tres prototipos.

`node tools/e2e_b22d.mjs`: un Chrome, teclas reales, puzzles, nueve capturas, KO/descanso, derrota y regreso. Admite `--only=regis|heatran|suenos|cierzo|sombra`. El fixture aporta equipo y Balls para abreviar combates; el motor decide los resultados y aplica las capturas. Capturas y transcripción en `tools/cache/screens/e2e_b22d_*`.
