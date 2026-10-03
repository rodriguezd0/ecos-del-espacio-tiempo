# B22a — Eje y Alma después del final

Solo comienza después de `game_cleared` y del despertar del epílogo (`b21_fin`). Todo se resuelve en solitario.

- Aljibe: la grieta de la explanada lleva a la Hondura. La losa anclada conecta las islas; el puente de la Mirada
  lleva al Corazón. Sus tres caras abren el pedestal con la Griseosfera y Giratina Origen, nivel 75.
- Senda del Lazo: Anclaje fija el nudo y abre Cumbre Azur. El dintel conduce a Columna Lanza; las escaleras permiten
  regresar a pie hasta la Senda.
- Columna: el no elegido del Cruce aparece con su orbe y el elegido en el equipo. Arceus reaparece después del
  descanso del final, en un combate de una sola fase Normal.
- Alma: última pregunta de Uxie con las quince Crónicas; reflejos móviles de Mesprit; Azelf con Mochila habilitada.
- Red de Convergencia: solo Laberinto, aljibe, Origen y Columna, y únicamente nodos conocidos. Olmedo permite
  volver al Laberinto. La página del Origen se compone directamente con B21, sin registro diferido.

Capturados no vuelven. Debilitados reaparecen tras un descanso; perder cura al equipo y permite reintentar.
Giratina acepta captura desde el tercer turno. Arceus exige menos del 50 % de PS. Intentos bloqueados no consumen
Ball ni turno. La parte de las caras ancladas y las orientaciones persiste al guardar.

Pruebas: `tests/b22a_content.test.mjs` y `tests/b22a_reach.test.mjs` (14 casos). Recorrido real:
`node tools/e2e_b22a.mjs --only=giratina|senda|columna|alma` (cada opción por separado).
Incluye caída, Anclaje con giro real, derrota y reintento, capturas de los seis legendarios y regresos.
Arte reproducible: `node tools/b22a_assets.mjs --check`.
