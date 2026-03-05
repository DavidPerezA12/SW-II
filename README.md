# Proyecto SW2 – API de Videojuegos

## Miembros del grupo
- Álvaro sanz Cortés
- David Perez Alonso
- Marcos Martínez Beaza
- 

## Temática
Diseño e implementación de una API REST en Node.js con MongoDB para gestionar videojuegos y sus reseñas.
La API integrará información externa desde RAWG (JSON) y almacenará los datos integrados en la base de datos.

## API externa
- RAWG Video Games Database API (JSON): https://api.rawg.io/docs/
Requiere API key (configurar `RAWG_API_KEY` en `.env`).

## Recursos principales (mínimo 3)
- games (colección grande: ≥1000 documentos)
- platforms
- reviews (relacionada con games)

## Requisitos previstos
- CRUD completo sobre los recursos.
- Paginación y filtrado en `GET /games`.
- Carga automática de datos mediante scripts npm (seed).
- Respuestas en JSON y al menos una ruta en XML con XSD (se implementará en entregas posteriores).
