# Partida continua de QA

`e2e_campaign.mjs` crea una partida desde el título y encadena B01–B21 en un solo navegador y con el mismo `GameState`. El nombre único empieza por `QA`; el almacenamiento del contexto de Chrome queda aislado del de los jugadores.

```powershell
& .\.tools\node-v24.21.0-win-x64\node.exe tools/e2e_campaign.mjs
# Reanudar la misma partida guardada por UI:
& .\.tools\node-v24.21.0-win-x64\node.exe tools/e2e_campaign.mjs --resume
```

Requiere el servidor en `http://localhost:8080`. No abre URLs de desarrollo, no teletransporta y no prepara banderas, equipos, dinero, niveles, objetos ni soluciones de puzzles. Las rutas consultan mapas y colisión; las teclas ejecutan los pasos, escenas, puzzles, descanso, compras, montura, Vuelo y PC. El piloto decide movimientos, objetos existentes, cambios y aprendizaje dentro del combate real; conserva el azar y todos los resultados del motor.

El conductor aplica texto instantáneo y desactiva las animaciones desde Opciones. Mantiene Shift, el control normal de carrera. Cada bloque termina con un guardado mediante el menú de pausa.

La evidencia vive en `tools/cache/campaign/`:

- `campaign_identity.json`: identidad QA que debe seguir usándose.
- `campaign_checkpoint.json` y `campaign_browser_storage.json`: último guardado real y almacenamiento para `--resume`.
- `campaign_checkpoint_Bxx.json`, `campaign_dialogos_Bxx.json`: estados y diálogos por bloque desde B04/B05.
- `campaign_live.json`: consulta periódica del estado real; incluye los resultados de combate registrados desde la carga actual.
- `campaign_failure.json`: fallo del conductor y estado en que se detuvo; puede permanecer tras corregirlo, por lo que debe compararse con el estado vivo.
- `campaign_connections.jsonl`: casillas observadas antes y después de cada conexión recorrida desde B08.
- `campaign_final_before_reload.json`, `campaign_final_dialogos.json`: evidencia anterior a la recarga final, cuando B21 se complete.
- `campaign_b13_before_reload_save.json`, `campaign_b13_before_reload_slot.json`, `campaign_b13_after_reload_save.json`: datos vivos, payload exacto de la ranura y datos cargados en la recarga intermedia. El payload fija la hora de referencia; al cerrar Guardar el reloj vivo puede haber avanzado.
- Capturas PNG de hitos y combates.

Ante un error del conductor, el navegador permanece abierto. Se corrige el módulo del bloque y se actualiza `campaign_retry.json`; el conductor vuelve a importarlo, conserva la misma partida y omite sus etapas ya verificadas. Una derrota del juego vuelve al punto de cura por las reglas reales y se reintenta viajando por los accesos normales.

`e2e_campaign_double.mjs` es un banco independiente de presentación con fixtures; **no forma parte de la campaña continua**. Su prueba de dobles/coop tiene un alcance distinto.

Estado actual: **B01–B13 ejecutados y guardados con la misma partida QAut8uoab; B14 activo y B15–B21 pendientes de terminar el recorrido real**. El último guardado está en Caleta Sonda, con 77 células, 12 Tablillas, cuatro Núcleos y seis Fragmentos. B13 completó Talasa y el doble Casia/Garrido con Alerce, N4/Porygon, Buceo/pilotes, Lumbre/baile/fiesta y Tizón/coladas/jefa/forja, incluidos los regresos tras derrotas reales. Togepi eclosionó caminando y se depositó por PC; Porygon evolucionó a Porygon2. El equipo guardado es Torterra49/Golem47/Inteleon50/Rotom39/Rampardos40/Porygon2 42. Sinistea y Eevee también siguen en el PC. Consultar `campaign_checkpoint.json` para bloques cerrados y `campaign_live.json` para la etapa exacta. Los módulos preparados no implican que esos bloques hayan sido recorridos.

Al empezar B14 se comprobó la recarga normal de ese guardado: Guardar → recargar página → Continuar → Cargar. Identidad, posición, Pokémon completos y huecos del PC, colección, pistas, viajes, autointerruptores, bolsa y demás campos persistentes coincidieron con el payload escrito por Guardar. Hora guardada y cargada: minuto 1219, sin retroceso. Las pruebas focalizadas del arnés pasan 80/80, incluidas diez del checkpoint y diez de la recarga final preparada.

Los regresos de células opcionales de B09/B11 (tierra, grava y Trepar) y B13 (Nadar) ya se recorrieron; los de B15 (Buceo y costa norte) siguen preparados. Cada recogida camina hasta el evento físico y verifica la colección observada. El cierre B21 guarda, recarga la página y usa Continuar/Cargar para contrastar los datos persistentes completos contra el payload de la ranura, incluido el reloj, además de la habilitación del postgame.
