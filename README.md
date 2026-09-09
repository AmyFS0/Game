# NEON RIFT

Shooter arcade futurista **endless** creado con HTML5 Canvas, CSS y JavaScript puro.

## Hangar principal

Antes de iniciar una partida puedes configurar:

- **Modo:** Solo Run o Local Co-op para 2 jugadores.
- **Piloto del jugador 1 y jugador 2.**
- **Dimensión inicial.**
- **Nivel inicial del 1 al 10.**
- **Dificultad:** Cadet, Normal o Rift.
- **Volumen de música y efectos.**
- Consulta de controles desde el mismo menú.

### Pilotos

- **Nova:** equilibrada.
- **Byte:** más vida y potencia.
- **Flux:** máxima velocidad.
- **Echo:** disparos de alto daño.

## Música galáctica

El juego incluye un **Galactic Synth Engine** hecho con Web Audio API. La banda sonora se genera de forma procedural en el navegador con drones espaciales, arpegios y sintetizadores, por lo que no necesita archivos de música externos.

Por las restricciones de autoplay de los navegadores, el audio comienza después de una interacción del usuario. La música se activa al pulsar **LAUNCH INTO THE RIFT** o el botón **MUSIC ON**.

## Endless Multiverse

- El escenario avanza infinitamente hacia la derecha.
- Aparecen portales multidimensionales durante la carrera.
- Cada portal aumenta el nivel y cambia la dimensión.
- Dimensiones: Neon City, Crystal Void, Cyber Jungle, Solar Grave y The Rift.
- Los aliens se vuelven más resistentes y peligrosos con cada nivel.
- Cada quinto nivel puede aparecer el jefe **Rift Behemoth**.
- Las naves pueden ser destruidas.
- En cooperativo, una nave destruida puede reconstruirse al alcanzar el siguiente portal si el compañero sigue con vida.
- Los impactos alienígenas usan salpicaduras de plasma neón estilizadas y partículas.

## Controles

### Player 1

- `W A S D`: mover nave
- `F`: disparar
- `G`: Rift Pulse cuando está cargado

### Player 2

- `Flechas`: mover nave
- `Enter`: disparar
- `Shift`: Rift Pulse cuando está cargado

### General

- `P`: pausa

## Cómo ejecutar

1. Abre el repositorio en VS Code.
2. Abre `index.html` con Live Server o directamente en un navegador moderno.
3. Configura la expedición en el hangar.
4. Pulsa **LAUNCH INTO THE RIFT**.

## Tecnología

- HTML5 Canvas
- CSS
- JavaScript
- Web Audio API

No requiere motor de juego, librerías externas de gameplay ni archivos de audio.