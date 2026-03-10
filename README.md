# Diseño e implementación de  API REST

## 📑 Índice

- [Diseño e implementación de  API REST](#diseño-e-implementación-de--api-rest)
  - [📑 Índice](#-índice)
  - [🧑‍🤝‍🧑 Miembros del grupo](#-miembros-del-grupo)
  - [📖 Descripción](#-descripción)
  - [✨ Funcionalidades](#-funcionalidades)
    - [Requisitos previstos](#requisitos-previstos)
  - [🛠️ Tecnologías utilizadas](#️-tecnologías-utilizadas)
    - [APIs externa](#apis-externa)
  - [▶️ Ejecución](#️-ejecución)
  - [📂 Estructura del proyecto](#-estructura-del-proyecto)

## 🧑‍🤝‍🧑 Miembros del grupo

- Álvaro sanz Cortés
- David Perez Alonso
- Marcos Martínez Beaza

## 📖 Descripción

Diseño e implementación de una API REST en Node.js con MongoDB para gestionar videojuegos(RAWG) y sus reseñas(WikiData).

La API integrará información externa desde RAWG (JSON) y almacenará los datos integrados en la base de datos.

## ✨ Funcionalidades

- games (colección grande: ≥1000 documentos)
- platforms
- reviews (relacionada con games)

### Requisitos previstos

- CRUD completo sobre los recursos.
- Paginación y filtrado en `GET /games`.
- Carga automática de datos mediante scripts npm (seed).
- Respuestas en JSON y al menos una ruta en XML con XSD (se implementará en entregas posteriores).

## 🛠️ Tecnologías utilizadas

### APIs externa

- RAWG Video Games Database API (JSON): <https://api.rawg.io/docs/>
- MediaWiki API (WikiData) (XML): <https://www.wikidata.org/w/api.php>

Requiere API key (configurar `RAWG_API_KEY` en `.env`).

## ▶️ Ejecución

1. Clonar el repositorio y entrar a la carpeta del proyecto(api):

   ```bash
   git clone https://github.com/DavidPerezA12/SW-II.git
   cd SW-II/api
    ```

2. Crear el archivo `.env` dentro de la carpeta `api` con:

3. Dentro de la carpeta `api` ejecuta:

- Instalar dependencias:

- ```bash
   npm install
   ```

- Ejecutar servidor:

   ```bash
    npm start
    ```

## 📂 Estructura del proyecto
