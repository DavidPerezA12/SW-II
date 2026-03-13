# Diseño e implementación de  API REST

## 📑 Índice

- [Diseño e implementación de  API REST](#diseño-e-implementación-de--api-rest)
  - [📑 Índice](#-índice)
  - [🧑‍🤝‍🧑 Miembros del grupo](#-miembros-del-grupo)
  - [📖 Descripción](#-descripción)
  - [✨ Funcionalidades](#-funcionalidades)
    - [Endpoints disponibles](#endpoints-disponibles)
  - [🛠️ Tecnologías utilizadas](#️-tecnologías-utilizadas)
    - [APIs externa](#apis-externa)
  - [▶️ Ejecución](#️-ejecución)
  - [📂 Estructura del proyecto](#-estructura-del-proyecto)

## 🧑‍🤝‍🧑 Miembros del grupo

- Álvaro sanz Cortés
- David Perez Alonso
- Marcos Martínez Beaza

## 📖 Descripción

Diseño e implementación de una API REST en Node.js, Express y MongoDB para gestionar videojuegos(RAWG) y sus reseñas(WikiData).

El objetivo del proyecto es aprender cómo diseñar y desarrollar servicios web, incluyendo:

- Consumo de APIs externas
- Almacenamiento de datos en una base de datos NoSQL
- Creación de endpoints REST
- Documentación del servicio mediante OpenAPI(yaml).

## ✨ Funcionalidades

La API REST permitirá gestionar los siguientes recursos:

- Obtener información de videojuegos desde la API externa **RAWG** (formato JSON).
- Obtener información adicional o reseñas desde **WikiData / MediaWiki** (formato XML).
- Almacenar los datos obtenidos en un archivo JSON local (carpeta `/api/datasets`) para generar un **dataset inicial del proyecto**.
- Utilizar este dataset para **inicializar la base de datos MongoDB** mediante un script `npm run seed`.
- Almacenar y gestionar los datos en **MongoDB**.
- Realizar operaciones **CRUD** sobre la información almacenada en MongoDB.
- Permitir **paginación y filtrado** en las consultas de videojuegos.

### Endpoints disponibles

- **/** → Página de bienvenida con información sobre la API. [http://localhost:3001/]
- **/games**
  - **GET /games** → Obtener la lista de videojuegos.  [http://localhost:3001/games]
    - **Query params**:
      - `?search=the witcher` → Todos los juegos de "the witcher".
      - `?platform=pc` → Todos los juegos para PC.
      - `?genre=action` → Filtrar por género.
      - `?minRating=4.5` → Filtrar por valoración mínima
      - `?page=2&&limit=2` → Paginación con número de página y límite de resultados por página.
      - `?limit=10` → Limitar el número de resultados a 10.
      - `?sort=rating` → Ordenar por valoración ascendente.
      - `?sort=-name` → Ordenar por nombre descendente.
    - 










  - **GET /games/:slug** → Obtener detalles de un videojuego por su nombre. [http://localhost:3001/games/:slug]
  - **POST ...**
  - **PUT ...**
  - **DELETE ...**
- **/...**
  - **GET ...**
  
  
## 🛠️ Tecnologías utilizadas

- Node.js
- Express
- MongoDB
- Axios (para consumir APIs externas)
- dotenv (para gestionar variables de entorno)
- OpenAPI (para documentar la API)
- xml2js (para convertir XML a JSON)
  
### APIs externa

- RAWG Video Games Database API (JSON): [https://api.rawg.io/docs/]
  - Documentación: [https://api.rawg.io/docs/]
- MediaWiki API (WikiData) (XML): [https://www.wikidata.org/w/api.php]

Requiere API key (configurar `RAWG_API_KEY` en `.env`).

## ▶️ Ejecución

1. Clonar el repositorio y entrar a la carpeta del proyecto(api):

   ```bash
   git clone https://github.com/DavidPerezA12/SW-II.git
   cd SW-II/api
    ```

2. Crear el archivo `.env` dentro de la carpeta `api` con:

3. Dentro de la carpeta `api` ejecuta:

- 1. Instalar dependencias:
  
  ```bash
   npm install
  ```

- 2. Inicializar la base de datos con el dataset:
  
  ```bash
    npm run seed
  ```

- 3. Ejecutar servidor:
  
  ```bash
    npm start
  ```

## 📂 Estructura del proyecto
  
  ```bash
SW-II/
├── api/

  ```