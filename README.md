# Diseño e implementación de API REST

## 📑 Índice

- [Diseño e implementación de API REST](#diseño-e-implementación-de-api-rest)
  - [📑 Índice](#-índice)
  - [🧑‍🤝‍🧑 Miembros del grupo](#-miembros-del-grupo)
  - [📖 Descripción](#-descripción)
  - [📚 Documentación del proyecto](#-documentación-del-proyecto)
  - [✨ Funcionalidades](#-funcionalidades)
    - [Endpoints disponibles](#endpoints-disponibles)
  - [🛠️ Tecnologías utilizadas](#️-tecnologías-utilizadas)
    - [APIs externas](#apis-externas)
  - [▶️ Ejecución](#️-ejecución)
  - [📂 Estructura del proyecto](#-estructura-del-proyecto)

## 🧑‍🤝‍🧑 Miembros del grupo

- Álvaro Sanz Cortés
- David Pérez Alonso
- Marcos Martínez Baeza

## 📖 Descripción

Diseño e implementación de una API REST en Node.js, Express y MongoDB para consultar y gestionar información sobre videojuegos, desarrolladores, reseñas y países relacionados. Los datos de videojuegos y desarrolladores se obtienen inicialmente desde **RAWG** en formato JSON, y la información de países asociados a desarrolladores se obtiene desde **Wikidata** en formato XML.

El objetivo del proyecto es aprender cómo diseñar y desarrollar servicios web, incluyendo:

- Consumo de APIs externas
- Almacenamiento de datos en una base de datos NoSQL
- Creación de endpoints REST
- Documentación del servicio mediante OpenAPI (YAML), disponible en `docs/openapi.yaml`.
- Modelo de datos de MongoDB documentado en `docs/modelo-datos.md`.

## 📚 Documentación del proyecto

La documentación pedida en el enunciado está repartida en estos archivos:

| Requisito | Archivo o carpeta |
|---|---|
| Documento de diseño de la interfaz REST | `docs/documentacion/Documentacion.pdf` |
| Especificación OpenAPI del servicio | `docs/openapi.yaml` |
| Modelo de datos de la base de datos | `docs/modelo-datos.md` |
| Schema asociado al XML de países | `docs/countries.xsd` |
| Datasets para inicializar MongoDB | `api/datasets/` |
| Scripts de carga de datos | `api/seeds/` |
| Instrucciones para ejecutar el proyecto | Este `README.md` |

## ✨ Funcionalidades

La API REST permite gestionar los siguientes recursos:

- Obtener información de videojuegos desde la API externa **RAWG** (formato JSON).
- Obtener información adicional de países asociados a desarrolladores desde **Wikidata** (formato XML).
- Almacenar los datos obtenidos en datasets locales dentro de la carpeta `/api/datasets`.
- Utilizar estos datasets para **inicializar la base de datos MongoDB** mediante un script `npm run seed`.
- Almacenar y gestionar los datos en **MongoDB**.
- Realizar operaciones **CRUD** sobre videojuegos y reseñas almacenados en MongoDB.
- Consultar desarrolladores y países, incluyendo filtros, búsquedas y relaciones con videojuegos.
- Permitir **paginación y filtrado** en las consultas de videojuegos, desarrolladores y reseñas.

Las operaciones CRUD completas se implementan sobre `/games` y `/reviews`. Los recursos `/developers` y `/countries` se usan principalmente como recursos de consulta, ya que proceden de APIs externas y sirven para enriquecer la información de los videojuegos.

### Endpoints disponibles

- **/** → Página de bienvenida con información sobre la API y sus endpoints. [http://localhost:3001/]
- **/games**
  - **GET /games** → Obtener la lista de videojuegos.  [http://localhost:3001/games]
    - **Query params**:
      - `?id=1234` → Obtener un juego específico por su ID.
      - `?search=the witcher` → Todos los juegos de "the witcher".
      - `?platform=pc` → Todos los juegos para PC.
      - `?genre=action` → Filtrar por género.
      - `?minRating=4.5` → Filtrar por valoración mínima
      - `?page=2&limit=2` → Paginación con número de página y límite de resultados por página.
      - `?limit=10` → Limitar el número de resultados a 10.
      - `?sort=rating` → Ordenar por valoración ascendente.
      - `?sort=-name` → Ordenar por nombre descendente.
  - **GET /games/:id** → Obtener detalles de un videojuego por su ID. [http://localhost:3001/games/3328]
  - **GET /games/:id/country** → Obtener en XML los países asociados a un videojuego. [http://localhost:3001/games/3328/country]
  - **GET /games/:id/reviews** → Obtener reseñas de un videojuego. [http://localhost:3001/games/3328/reviews]
  - **GET /games/:id/enriched** → Obtener el videojuego junto con países y reseñas. [http://localhost:3001/games/3328/enriched]
  - **POST /games** → Agregar un nuevo videojuego a la base de datos.
  - **PUT /games/:id** → Actualizar la información de un videojuego por su ID.
  - **DELETE /games/:id** → Eliminar un videojuego por su ID.
  
- **/developers**
  - **GET /developers** → Obtener la lista de desarrolladores. [http://localhost:3001/developers]
    - **Query params**:
      - `?search=Electronic Arts` → Todos los desarrolladores que contengan "Electronic Arts" en su nombre.
      - `?gameId=3328` → Desarrolladores asociados a un juego específico.
      - `?limit=50` → Limitar el número de resultados a 50.
      - `?page=2&limit=20` → Paginación con número de página y límite de resultados por página.
      - `?sort=-games_count` → Ordenar por número de juegos de mayor a menor.
  - **GET /developers/:id** → Obtener detalles de un desarrollador por su ID. [http://localhost:3001/developers/9023]

- **/reviews**
  - **GET /reviews** → Obtener la lista de reseñas. [http://localhost:3001/reviews]
    - **Query params**:
      - `?id=4` → Obtener una reseña por su ID.
      - `?rating=5` → Filtrar por valoración.
      - `?page=2&limit=20` → Paginación con número de página y límite de resultados por página.
  - **GET /reviews/:gameId** → Obtener reseñas asociadas a un videojuego. [http://localhost:3001/reviews/3328]
  - **POST /reviews** → Agregar una nueva reseña.
  - **PATCH /reviews/:id** → Actualizar parcialmente una reseña.
  - **DELETE /reviews/:id** → Eliminar una reseña por su ID.

- **/countries**
  - **GET /countries** → Obtener información de países en XML. [http://localhost:3001/countries]
    - **Query params**:
      - `?country=Poland` → Filtrar por país.
      - `?developer=CD Projekt RED` → Filtrar por desarrollador.
      - `?gameName=The Witcher 3: Wild Hunt` → Filtrar por nombre del videojuego.

## 🛠️ Tecnologías utilizadas

- Node.js
- Express
- MongoDB
- Axios (para consumir APIs externas)
- dotenv (para gestionar variables de entorno)
- OpenAPI (para documentar la API)
- xml2js (para convertir XML a JSON)
  
### APIs externas

- RAWG Video Games Database API (JSON): [https://api.rawg.io/docs/]
  - Documentación: [https://api.rawg.io/docs/]
- Wikidata Query Service (XML): [https://query.wikidata.org/]

Requiere API key (configurar `RAWG_API_KEY` en `.env`).

## ▶️ Ejecución

1. Clonar el repositorio y entrar a la carpeta del proyecto (`api`):

   ```bash
   git clone https://github.com/DavidPerezA12/SW-II.git
   cd SW-II/api
    ```

2. Crear el archivo `.env` dentro de la carpeta `api`. Se puede copiar el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

   El contenido debe quedar con estas variables:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/sw2-videogames
   PORT=3001
   RAWG_API_KEY=tu_api_key_de_rawg
   ```

   MongoDB debe estar arrancado antes de ejecutar los scripts. Los datasets están incluidos en la carpeta `api/datasets`, por lo que la API puede cargarlos aunque las APIs externas no estén disponibles.

3. Instalar dependencias:
  
   ```bash
   npm install
   ```

4. Inicializar la base de datos con el dataset:
  
   ```bash
   npm run seed
   ```

5. Ejecutar servidor:
  
   ```bash
   npm start
   ```

6. Abrir en el navegador:

   ```bash
   http://localhost:3001
   ```

## 📂 Estructura del proyecto
  
  ```bash
SW-II/
├── api/
│   ├── datasets/
│   ├── routes/
│   ├── seeds/
│   ├── services/
│   ├── views/
│   └── package.json
├── docs/
│   ├── openapi.yaml
│   ├── countries.xsd
│   ├── modelo-datos.md
│   └── documentacion/
└── README.md
  ```
