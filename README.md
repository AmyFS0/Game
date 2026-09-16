# NEON RIFT

Shooter arcade futurista de pantalla abierta creado con HTML5 Canvas, CSS y JavaScript puro. Dos mundos, diez dimensiones, música generativa y un descenso hacia el corazón de la Grieta.

## Historia

Hace un siglo, el experimento conocido como **El Gran Resquicio** partió la realidad en diez fragmentos. Dos mundos quedaron cosidos por una Grieta viva:

- **ANILLO NEÓN** — el vestigio luminoso de la humanidad, cinco dimensiones que aún respiran.
- **EXPANSIÓN HUECA** — el vacío que sueña con devorar todo lo que queda.

**NOVA**, la última corredora del Rift, debe cruzar las diez dimensiones, superar oleadas cada vez más hostiles, esquivar trampas y orbes de tiempo para alcanzar el corazón de la fractura y enfrentar al tirano que abrió la Grieta.

## Cómo jugar

1. Abre `index1.html` en tu navegador o usa Live Server en VS Code.
2. Pulsa **START MISSION**.
3. Antes de cada nivel, el briefing muestra la historia y el objetivo. Pulsa **DEPLOY** para descender.

## Controles

- `WASD`: mover a Nova
- `Mouse`: apuntar
- `Click`: disparar
- `Shift`: correr
- `1`, `2`, `3`: cambiar arma
- `Space`: Quantum Dash
- `Q`: Energy Shield
- `E`: Overcharge
- `M` / botón `♪ MUSIC`: silenciar la música

## Campaña: 2 mundos ⨯ 5 niveles

La dificultad crece con cada nivel: enemigos con más vida, velocidad y daño, más oleadas, más trampas y eventos temporales más frecuentes.

### Mundo I · ANILLO NEÓN
1. NEON CITY
2. CRYSTAL PLANET
3. CYBER JUNGLE
4. FLOATING ISLES
5. THE RIFT GATE — jefe **RIFT WARDEN**

### Mundo II · EXPANSIÓN HUECA
6. ASHEN WASTES
7. OBSIDIAN VAULT
8. MIRROR MAZE
9. STARLESS DEEP
10. THE HOLLOW CROWN — jefe final **RIFT TYRANT**

## El sistema de vida

Nova dispone de **3 vidas**. Si su HP llega a cero, pierde una vida y **revive al instante** en el mismo nivel (barriendo balas cercanas y empujando enemigos), conservando oleadas, puntuación y progreso. Si se quedan las 3 vidas, la misión termina en derrota.

## Sorpresas en el campo

- **Trampas**: espinas fijas, minas que avisan parpadeando antes de armarse y láseres giratorios. Dependen del nivel.
- **Recursos (6 orbes)**: Protección (bloquea balas), Salud (+30 HP), Energía (+40 EN), Rage (daño y velocidad), Velocidad de tiempo (slow-mo).
- **Fracturas temporales**: eventos aleatorios — **TIME FRACTURE** (el juego se ralentiza) y **RIFT SURGE** (los enemigos entran en overdrive).
- **Enemigos**: Scout, Guardian, Sniper y Wraith (rápido, aparece en el mundo II).

## Música

Banda sonora **generativa** sintetizada con Web Audio API (sin archivos). El tempo y la escala cambian según el mundo; se silencia con la tecla `M` o el botón del menú.

## Tecnología

- HTML5 Canvas
- CSS
- JavaScript puro + Web Audio API

No necesita motor de juego ni dependencias externas.