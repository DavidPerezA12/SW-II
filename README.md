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
  - [✅ Pruebas](#-pruebas)
  - [📂 Estructura del proyecto](#-estructura-del-proyecto)

## 🧑‍🤝‍🧑 Miembros del grupo

- Álvaro Sanz Cortés
- David Pérez Alonso
- Marcos Martínez Baeza

## 📖 Descripción

Diseño e implementación de una API REST en Node.js, Express y MongoDB para consultar y gestionar información sobre videojuegos, desarrolladores, reviews y países relacionados. Los datos de videojuegos y desarrolladores se obtienen inicialmente desde **RAWG** en formato JSON, y la información de países asociados a desarrolladores se obtiene desde **Wikidata** en formato XML.

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
| Documento de diseño de la interfaz REST | `docs/Diseno_Interfaz_REST.docx` |
| Especificación OpenAPI del servicio | `docs/openapi.yaml` |
| Modelo de datos de la base de datos | `docs/modelo-datos.md` |
| Schema asociado al XML de países | `docs/countries.xsd` |
| Datasets para inicializar MongoDB | `api/datasets/` |
| Scripts de carga de datos | `api/seeds/` |
| Instrucciones para ejecutar el proyecto | Este `README.md` |

El proyecto integra datos externos de RAWG y Wikidata en datasets locales para que la API pueda ejecutarse aunque esas APIs no estén disponibles. La colección principal, `videogames`, contiene 1000 documentos y permite búsquedas con filtros, ordenación y paginación. Sobre `/games`, `/developers` y `/reviews` se implementan operaciones CRUD, mientras que `/countries` se mantiene como recurso XML de consulta con su schema en `docs/countries.xsd`.

## ✨ Funcionalidades

La API REST permite gestionar los siguientes recursos:

- Obtener información de videojuegos desde la API externa **RAWG** (formato JSON).
- Obtener información adicional de países asociados a desarrolladores desde **Wikidata** (formato XML).
- Almacenar los datos obtenidos en datasets locales dentro de la carpeta `/api/datasets`.
- Utilizar estos datasets para **inicializar la base de datos MongoDB** mediante un script `npm run seed`.
- Almacenar y gestionar los datos en **MongoDB**.
- Realizar operaciones **CRUD** sobre videojuegos, desarrolladores y reviews almacenados en MongoDB.
- Consultar desarrolladores y países, incluyendo filtros, búsquedas y relaciones con videojuegos.
- Permitir **paginación y filtrado** en las consultas de videojuegos, desarrolladores y reviews.

Las operaciones CRUD completas se implementan sobre `/games`, `/developers` y `/reviews`. El recurso `/countries` se mantiene como recurso de consulta en XML, ya que procede de Wikidata y sirve para enriquecer la información de los videojuegos con países asociados a sus desarrolladores.

### Endpoints disponibles

- **/** → Página de bienvenida con información sobre la API y sus endpoints. [http://localhost:3001/]
- **/games**
  - **GET /games** → Obtener la lista de videojuegos.  [http://localhost:3001/games]
    - **Query params**:
      - `?id=1234` → Obtener un juego específico por su ID.
      - `?search=the witcher` → Todos los juegos de "the witcher".
      - `?platform=pc` → Todos los juegos para PC.
      - `?genre=action` → Filtrar por género.
      - `?store=steam` → Filtrar por tienda.
      - `?minRating=4.5` → Filtrar por valoración mínima
      - `?page=2&limit=2` → Paginación con número de página y límite de resultados por página.
      - `?limit=10` → Limitar el número de resultados a 10.
      - `?sort=rating` → Ordenar por valoración ascendente.
      - `?sort=-name` → Ordenar por nombre descendente.
      - Campos permitidos para `sort`: `id`, `name`, `released`, `rating`, `metacritic`, `playtime`.
  - **GET /games/:id** → Obtener detalles de un videojuego por su ID. [http://localhost:3001/games/3328]
  - **GET /games/:id/country** → Obtener en XML los países asociados a un videojuego. [http://localhost:3001/games/3328/country]
  - **GET /games/:id/reviews** → Obtener reviews de un videojuego. [http://localhost:3001/games/3328/reviews]
  - **GET /games/:id/enriched** → Obtener el videojuego junto con países y reviews. [http://localhost:3001/games/3328/enriched]
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
      - Campos permitidos para `sort`: `id`, `name`, `slug`, `games_count`.
  - **GET /developers/:id** → Obtener detalles de un desarrollador por su ID. [http://localhost:3001/developers/9023]
  - **POST /developers** → Agregar un nuevo desarrollador a la base de datos.
  - **PUT /developers/:id** → Actualizar la información de un desarrollador por su ID.
  - **DELETE /developers/:id** → Eliminar un desarrollador por su ID.

- **/reviews**
  - **GET /reviews** → Obtener la lista de reviews. [http://localhost:3001/reviews]
    - **Query params**:
      - `?id=4` → Obtener una review por su ID.
      - `?rating=5` → Filtrar por valoración.
      - `?page=2&limit=20` → Paginación con número de página y límite de resultados por página.
  - **GET /reviews/game/:gameId** → Obtener reviews asociadas a un videojuego. [http://localhost:3001/reviews/game/3328]
  - **POST /reviews** → Agregar una nueva review.
  - **PATCH /reviews/:id** → Actualizar parcialmente una review por su ID.
  - **DELETE /reviews/:id** → Eliminar una review por su ID.

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

Para la ejecución de la entrega no hace falta consultar RAWG en directo: los datasets necesarios ya están incluidos en `api/datasets`. La variable `RAWG_API_KEY` puede mantenerse en `.env` con un valor de ejemplo.

Los scripts de carga usan los datasets locales para que la API funcione aunque RAWG o Wikidata no estén disponibles durante la ejecución.

## ▶️ Ejecución

### 1. Preparar el proyecto

Clonar el repositorio y entrar a la carpeta de la API:

   ```bash
   git clone https://github.com/DavidPerezA12/SW-II.git
   cd SW-II/api
   ```

Crear el archivo `.env` dentro de `api`. Se puede copiar el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

   El contenido debe quedar con estas variables:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/sw2-videogames
   PORT=3001
   RAWG_API_KEY=tu_api_key_de_rawg
   ```

Instalar dependencias:

   ```bash
   npm install
   ```

### 2. Arrancar MongoDB

MongoDB debe estar arrancado antes de inicializar la base de datos. Por ejemplo, con Docker:

   ```bash
   docker run --name sw2-mongo -p 27017:27017 -d mongo:7
   ```

Si el contenedor ya existe y está parado:

   ```bash
   docker start sw2-mongo
   ```

Los datasets están incluidos en `api/datasets`, por lo que la API puede cargarlos sin depender de que las APIs externas estén disponibles.

### 3. Inicializar la base de datos

Este paso solo es necesario la primera vez, si la base de datos está vacía o si se quieren volver a cargar los datos incluidos en `api/datasets`. Si MongoDB ya contiene los datos del proyecto, se puede pasar directamente al paso 4.

Desde la carpeta `api`:
  
   ```bash
   npm run seed
   ```

### 4. Ejecutar la API

Desde la carpeta `api`:
  
   ```bash
   npm start
   ```

La API queda disponible en:

   ```bash
   http://localhost:3001
   ```

### 5. Ejecutar el cliente web

El repositorio incluye un cliente SPA en `client/`. Consume la API mediante peticiones HTTP a `http://localhost:3001`, por lo que hay que dejar la API arrancada y abrir otro terminal:

Opción con Python:

   ```bash
   cd SW-II/client
   python3 -m http.server 8080
   ```

Después abrir en el navegador:

```bash
http://localhost:8080
```

Opción con Node:

```bash
cd SW-II
npx serve client
```

Después abrir la URL que indique `serve`. Si `serve` intenta usar `3001`, elegir otro puerto para no ocupar el puerto de la API. Por ejemplo:

```bash
http://localhost:3000
```

Resumen rápido de terminales:

```bash
# Terminal 1: MongoDB
docker start sw2-mongo

# Terminal 2: API
cd SW-II/api
npm start

# Terminal 3: Cliente
cd SW-II/client
python3 -m http.server 8080
# alternativa desde SW-II:
# npx serve client
```

### 6. Ejecutar las pruebas

Desde la carpeta `api`:

```bash
npm test
```

## ✅ Pruebas

El proyecto incluye pruebas automatizadas para validar el comportamiento real de las rutas principales de la API. Se ejecutan con:

```bash
npm test
```

Este comando realiza dos comprobaciones:

- Verifica la sintaxis de los archivos principales con `node --check`.
- Ejecuta pruebas HTTP sobre la aplicación Express con `node:test` y `supertest`.

Las pruebas de rutas están en `api/test/routes.test.js` y cubren casos de `/games`, `/developers`, `/reviews` y `/countries`, incluyendo:

- Filtros, ordenación y paginación.
- Respuestas correctas para códigos `200`, `400` y `409`.
- Creación y consulta de videojuegos.
- Actualización parcial de reviews.
- Respuestas XML del recurso `/countries`.
- Comprobación de que no se expone el campo interno `_id` de MongoDB.

Para que las pruebas sean reproducibles, se utiliza una base de datos en memoria definida en `api/test/helpers/inMemoryDb.js`. Por tanto, `npm test` no necesita que MongoDB esté arrancado ni modifica los datos reales de la base de datos.

## 📂 Estructura del proyecto
  
  ```bash
SW-II/
├── api/
│   ├── datasets/
│   ├── test/
│   ├── routes/
│   ├── seeds/
│   ├── services/
│   ├── views/
│   └── package.json
├── client/
│   ├── css/
│   ├── js/
│   └── index.html
├── docs/
│   ├── openapi.yaml
│   ├── countries.xsd
│   ├── modelo-datos.md
│   └── Diseno_Interfaz_REST.docx
└── README.md
  ```
