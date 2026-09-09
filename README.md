# NEON RIFT

Shooter arcade futurista **endless** creado con HTML5 Canvas, CSS y JavaScript puro.

## Qué cambió

- El escenario avanza infinitamente hacia la derecha.
- Portales multidimensionales aparecen durante la partida.
- Cada portal aumenta el nivel y cambia de dimensión.
- 5 dimensiones visuales: Neon City, Crystal Void, Cyber Jungle, Solar Grave y The Rift.
- Enemigos alienígenas aparecen de forma procedural y se vuelven más resistentes y peligrosos con cada nivel.
- Tipos de alien: Skitter, Manta, Eye, Brute y el jefe Rift Behemoth.
- Las criaturas pueden embestir o disparar plasma contra las naves.
- Las naves tienen vida propia y pueden ser destruidas.
- Efectos de impacto, chispas y salpicaduras de plasma alienígena estilizadas.
- Puntuación, distancia, niveles y contador de aliens eliminados.

## Multiplayer

Actualmente incluye **cooperativo local para 2 jugadores en el mismo teclado**. No necesita servidor.

### Jugador 1

- `W A S D`: mover nave
- `F`: disparar

### Jugador 2

- `Flechas`: mover nave
- `Enter`: disparar

En cooperativo, si una nave es destruida y la otra sobrevive hasta cruzar el siguiente portal, la nave caída regresa con parte de su vida.

## Cómo ejecutar

1. Abre el repositorio en VS Code.
2. Abre `index.html` con Live Server o directamente en un navegador moderno.
3. Elige **SOLO RUN** o **LOCAL CO-OP**.

## Tecnología

El juego no utiliza librerías externas de videojuegos. Toda la lógica de movimiento, disparos, enemigos, partículas, portales, progresión y renderizado está implementada con Canvas 2D y JavaScript.

> Nota: el multiplayer actual es local. Para convertirlo a multiplayer online real se necesitaría sincronización de red mediante un servidor WebSocket/Socket.IO u otra solución de networking.