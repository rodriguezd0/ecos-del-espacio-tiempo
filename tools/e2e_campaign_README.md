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
- Capturas PNG de hitos y combates.

Ante un error del conductor, el navegador permanece abierto. Se corrige el módulo del bloque y se actualiza `campaign_retry.json`; el conductor vuelve a importarlo, conserva la misma partida y omite sus etapas ya verificadas. Una derrota del juego vuelve al punto de cura por las reglas reales y se reintenta viajando por los accesos normales.

`e2e_campaign_double.mjs` es un banco independiente de presentación con fixtures; **no forma parte de la campaña continua**. Su prueba de dobles/coop tiene un alcance distinto.

Estado al guardar este arnes: **B01–B06 ejecutados y guardados con la misma partida QAut8uoab; B07–B21 preparados y pendientes de terminar el recorrido real**. B07 ya esta en curso. Consultar `campaign_checkpoint.json` para bloques cerrados y `campaign_live.json` para la etapa exacta. Los módulos preparados no implican que esos bloques hayan sido recorridos.
