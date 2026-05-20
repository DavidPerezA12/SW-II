const assert = require("node:assert/strict");
const { beforeEach, describe, test } = require("node:test");
const request = require("supertest");

const app = require("../app");
const mongodb = require("../db/conn");
const { createInMemoryDb } = require("./helpers/inMemoryDb");

const baseFixtures = {
    videogames: [
        {
            _id: "mongo-game-1",
            id: 3328,
            slug: "the-witcher-3-wild-hunt",
            name: "The Witcher 3: Wild Hunt",
            released: "2015-05-18",
            rating: 4.7,
            metacritic: 92,
            playtime: 46,
            platforms: ["PC", "PlayStation 4"],
            genres: ["RPG", "Adventure"],
            stores: ["Steam", "GOG"],
            developers: ["CD Projekt RED"]
        },
        {
            _id: "mongo-game-2",
            id: 4200,
            slug: "portal-2",
            name: "Portal 2",
            released: "2011-04-18",
            rating: 4.6,
            metacritic: 95,
            playtime: 11,
            platforms: ["PC", "Xbox 360"],
            genres: ["Puzzle"],
            stores: ["Steam"],
            developers: ["Valve"]
        }
    ],
    developers: [
        {
            _id: "mongo-dev-1",
            id: 9023,
            name: "CD Projekt RED",
            slug: "cd-projekt-red",
            games_count: 25,
            games: [{ id: 3328, name: "The Witcher 3: Wild Hunt" }]
        },
        {
            _id: "mongo-dev-2",
            id: 1612,
            name: "Valve",
            slug: "valve",
            games_count: 50,
            games: [{ id: 4200, name: "Portal 2" }]
        }
    ],
    reviews: [
        {
            _id: "mongo-review-1",
            id: 1,
            gameId: 3328,
            gameName: "The Witcher 3: Wild Hunt",
            user: "player_01",
            rating: 5,
            comment: "Muy buen juego",
            createdAt: "2025-01-01T00:00:00.000Z"
        },
        {
            _id: "mongo-review-2",
            id: 2,
            gameId: 4200,
            gameName: "Portal 2",
            user: "player_02",
            rating: 4,
            comment: "Muy original",
            createdAt: "2025-01-02T00:00:00.000Z"
        }
    ],
    countries: [
        {
            _id: "mongo-country-1",
            gameId: 3328,
            gameName: "The Witcher 3: Wild Hunt",
            developer: "CD Projekt RED",
            country: "Poland"
        },
        {
            _id: "mongo-country-2",
            gameId: 4200,
            gameName: "Portal 2",
            developer: "Valve",
            country: "United States of America"
        }
    ]
};

beforeEach(() => {
    mongodb.__setDbForTests(createInMemoryDb(baseFixtures));
});

describe("games routes", () => {
    test("GET /games filtra, ordena, pagina y no expone _id de MongoDB", async () => {
        const response = await request(app)
            .get("/games")
            .query({
                search: "witcher",
                platform: "pc",
                genre: "rpg",
                minRating: "4",
                sort: "-rating",
                page: "1",
                limit: "1"
            })
            .expect(200);

        assert.equal(response.body.videogames_length, 1);
        assert.equal(response.body.videogames[0].id, 3328);
        assert.equal(response.body.videogames[0].name, "The Witcher 3: Wild Hunt");
        assert.equal(response.body.videogames[0]._id, undefined);
    });

    test("GET /games rechaza parámetros inválidos con 400", async () => {
        const response = await request(app)
            .get("/games")
            .query({ limit: "abc" })
            .expect(400);

        assert.equal(response.body.message, "limit debe ser un número positivo");
    });

    test("POST /games crea un videojuego y después puede consultarse por id", async () => {
        const newGame = {
            id: 9999,
            name: "Test Game",
            platforms: ["PC"],
            genres: ["Action"],
            stores: ["Steam"]
        };

        const createResponse = await request(app)
            .post("/games")
            .send(newGame)
            .expect(201);

        assert.equal(createResponse.body.id, 9999);
        assert.equal(createResponse.body.insertedId, undefined);
        assert.equal(createResponse.body.game._id, undefined);

        const response = await request(app)
            .get("/games/9999")
            .expect(200);

        assert.equal(response.body.id, 9999);
        assert.equal(response.body.name, "Test Game");
        assert.equal(response.body._id, undefined);
    });

    test("POST /games rechaza campos no permitidos y valida tipos como PUT", async () => {
        await request(app)
            .post("/games")
            .send([])
            .expect(400)
            .expect(response => {
                assert.equal(response.body.message, "El cuerpo de la petición debe ser un objeto JSON");
            });

        await request(app)
            .post("/games")
            .send({
                id: 9998,
                name: "Invalid Game",
                platforms: ["PC"],
                genres: ["Action"],
                stores: ["Steam"],
                admin: true
            })
            .expect(400)
            .expect(response => {
                assert.deepEqual(response.body.invalidFields, ["admin"]);
            });

        await request(app)
            .post("/games")
            .send({
                id: 9997,
                name: "Invalid Game",
                platforms: ["PC"],
                genres: ["Action"],
                stores: ["Steam"],
                rating: "hola"
            })
            .expect(400);

        await request(app)
            .post("/games")
            .send({
                id: 9996,
                name: "Invalid Game",
                platforms: ["PC"],
                genres: ["Action"],
                stores: ["Steam"],
                metacritic: 101
            })
            .expect(400);

        await request(app)
            .post("/games")
            .send({
                id: 9995,
                name: "Invalid Game",
                platforms: ["PC"],
                genres: ["Action"],
                stores: ["Steam"],
                playtime: -1
            })
            .expect(400);
    });

    test("PUT /games/:id rechaza campos no permitidos", async () => {
        const response = await request(app)
            .put("/games/3328")
            .send({ id: 1 })
            .expect(400);

        assert.deepEqual(response.body.invalidFields, ["id"]);
    });

    test("PUT /games/:id valida tipos y rangos de campos editables", async () => {
        await request(app)
            .put("/games/3328")
            .send({ rating: "hola" })
            .expect(400);

        await request(app)
            .put("/games/3328")
            .send({ platforms: "PC" })
            .expect(400);

        await request(app)
            .put("/games/3328")
            .send({ genres: [] })
            .expect(400);

        await request(app)
            .put("/games/3328")
            .send({ metacritic: 101 })
            .expect(400);
    });

    test("PUT /games/:id acepta los campos editables por el cliente", async () => {
        await request(app)
            .put("/games/3328")
            .send({
                background_image: "https://example.com/witcher.jpg",
                metacritic: 93,
                playtime: 50,
                esrb_rating: "Mature"
            })
            .expect(200);

        const response = await request(app)
            .get("/games/3328")
            .expect(200);

        assert.equal(response.body.background_image, "https://example.com/witcher.jpg");
        assert.equal(response.body.metacritic, 93);
        assert.equal(response.body.playtime, 50);
        assert.equal(response.body.esrb_rating, "Mature");
    });

    test("PUT /games/:id rechaza renombrar videojuegos con recursos relacionados", async () => {
        const response = await request(app)
            .put("/games/4200")
            .send({ name: "Portal Dos" })
            .expect(409);

        assert.equal(response.body.message, "No se puede cambiar el nombre de un videojuego con recursos relacionados");
        assert.equal(response.body.dependencies.reviews > 0, true);
        assert.equal(response.body.dependencies.countries > 0, true);
        assert.equal(response.body.dependencies.developers > 0, true);
    });

    test("DELETE /games/:id rechaza eliminar videojuegos con recursos relacionados", async () => {
        const response = await request(app)
            .delete("/games/4200")
            .expect(409);

        assert.equal(response.body.message, "No se puede eliminar un videojuego con recursos relacionados");
        assert.equal(response.body.dependencies.reviews > 0, true);
        assert.equal(response.body.dependencies.countries > 0, true);
        assert.equal(response.body.dependencies.developers > 0, true);

        await request(app)
            .get("/games/4200")
            .expect(200);
    });

    test("DELETE /games/:id elimina un videojuego sin dependencias", async () => {
        await request(app)
            .post("/games")
            .send({
                id: 9994,
                name: "Juego temporal",
                platforms: ["PC"],
                genres: ["Action"],
                stores: ["Steam"]
            })
            .expect(201);

        await request(app)
            .delete("/games/9994")
            .expect(200);

        await request(app)
            .get("/games/9994")
            .expect(404);
    });

    test("GET /games/:id/enriched devuelve videojuego, países y reviews relacionados", async () => {
        const response = await request(app)
            .get("/games/3328/enriched")
            .expect(200);

        assert.equal(response.body.game.id, 3328);
        assert.equal(response.body.wikidata.countries[0].country, "Poland");
        assert.equal(response.body.reviews[0].rating, 5);
    });
});

describe("developers routes", () => {
    test("GET /developers filtra por videojuego y ordena resultados", async () => {
        const response = await request(app)
            .get("/developers")
            .query({ gameId: "3328", sort: "-games_count" })
            .expect(200);

        assert.equal(response.body.developers_length, 1);
        assert.equal(response.body.developers[0].name, "CD Projekt RED");
        assert.equal(response.body.developers[0]._id, undefined);
    });

    test("POST /developers detecta ids duplicados", async () => {
        await request(app)
            .post("/developers")
            .send([])
            .expect(400)
            .expect(response => {
                assert.equal(response.body.message, "El cuerpo de la petición debe ser un objeto JSON");
            });

        const response = await request(app)
            .post("/developers")
            .send({
                id: 9023,
                name: "CD Projekt RED",
                slug: "cd-projekt-red",
                games: [{ id: 3328, name: "The Witcher 3: Wild Hunt" }]
            })
            .expect(409);

        assert.match(response.body.message, /Ya existe un desarrollador/);
    });

    test("POST /developers no expone _id interno de MongoDB", async () => {
        const response = await request(app)
            .post("/developers")
            .send({
                id: 7003,
                name: "Nuevo estudio",
                slug: "nuevo-estudio",
                games: [{ id: 3328, name: "The Witcher 3: Wild Hunt" }]
            })
            .expect(201);

        assert.equal(response.body.id, 7003);
        assert.equal(response.body.insertedId, undefined);
        assert.equal(response.body.developer._id, undefined);
    });

    test("POST /developers valida estructura y existencia de juegos asociados", async () => {
        await request(app)
            .post("/developers")
            .send({
                id: 7000,
                name: "Nuevo estudio",
                slug: "nuevo-estudio",
                games: ["Portal 2"]
            })
            .expect(400);

        await request(app)
            .post("/developers")
            .send({
                id: 7001,
                name: "Nuevo estudio",
                slug: "nuevo-estudio",
                games: [{ id: 99999, name: "Juego inexistente" }]
            })
            .expect(404);

        await request(app)
            .post("/developers")
            .send({
                id: 7002,
                name: "Nuevo estudio",
                slug: "nuevo-estudio",
                games: [{ id: 3328, name: "Nombre incorrecto" }]
            })
            .expect(400);
    });

    test("PUT y DELETE /developers/:id actualizan y eliminan desarrolladores", async () => {
        await request(app)
            .put("/developers/1612")
            .send({ name: "Valve Corporation", games_count: 51 })
            .expect(200);

        const updated = await request(app)
            .get("/developers/1612")
            .expect(200);

        assert.equal(updated.body.name, "Valve Corporation");
        assert.equal(updated.body.games_count, 51);

        await request(app)
            .delete("/developers/1612")
            .expect(200);

        await request(app)
            .get("/developers/1612")
            .expect(404);
    });
});

describe("reviews routes", () => {
    test("GET /reviews pagina resultados y devuelve total del filtro", async () => {
        const response = await request(app)
            .get("/reviews")
            .query({ rating: "5", limit: "1", page: "1" })
            .expect(200);

        assert.equal(response.body.total, 1);
        assert.equal(response.body.reviews_length, 1);
        assert.equal(response.body.reviews[0].gameId, 3328);
    });

    test("PATCH /reviews/:id valida rating y actualiza solo campos permitidos", async () => {
        await request(app)
            .patch("/reviews/1")
            .send([])
            .expect(400)
            .expect(response => {
                assert.equal(response.body.message, "El cuerpo de la petición debe ser un objeto JSON");
            });

        await request(app)
            .patch("/reviews/1")
            .send({ rating: 6 })
            .expect(400);

        const response = await request(app)
            .patch("/reviews/1")
            .send({ rating: 3, comment: "Actualizada" })
            .expect(200);

        assert.equal(response.body.review.rating, 3);
        assert.equal(response.body.review.comment, "Actualizada");
    });

    test("GET /reviews/game/:gameId consulta reviews por videojuego", async () => {
        const response = await request(app)
            .get("/reviews/game/3328")
            .expect(200);

        assert.equal(response.body.reviews_length, 1);
        assert.equal(response.body.reviews[0].gameId, 3328);
    });

    test("POST y DELETE /reviews crean y eliminan reviews", async () => {
        const response = await request(app)
            .post("/reviews")
            .send({
                id: 3,
                gameId: 3328,
                gameName: "The Witcher 3: Wild Hunt",
                user: "tester",
                rating: 5,
                comment: "Nueva review"
            })
            .expect(201);

        assert.equal(response.body.id, 3);
        assert.equal(response.body.insertedId, undefined);

        const created = await request(app)
            .get("/reviews")
            .query({ id: "3" })
            .expect(200);

        assert.equal(created.body.reviews[0].comment, "Nueva review");

        await request(app)
            .delete("/reviews/3")
            .expect(200);

        const afterDelete = await request(app)
            .get("/reviews")
            .query({ id: "3" })
            .expect(200);

        assert.equal(afterDelete.body.reviews_length, 0);
    });

    test("POST /reviews rechaza reviews de videojuegos inexistentes o incoherentes", async () => {
        await request(app)
            .post("/reviews")
            .send({
                id: 4,
                gameId: 99999,
                gameName: "Juego inexistente",
                user: "tester",
                rating: 5,
                comment: "Review huérfana"
            })
            .expect(404);

        await request(app)
            .post("/reviews")
            .send({
                id: 5,
                gameId: 3328,
                gameName: "Nombre inventado",
                user: "tester",
                rating: 5,
                comment: "Review incoherente"
            })
            .expect(400);
    });

    test("PATCH /reviews/:id valida coherencia de gameId y gameName", async () => {
        await request(app)
            .patch("/reviews/1")
            .send({ gameId: 99999 })
            .expect(404);

        await request(app)
            .patch("/reviews/1")
            .send({ gameId: 4200, gameName: "Nombre incorrecto" })
            .expect(400);

        const response = await request(app)
            .patch("/reviews/1")
            .send({ gameId: 4200, gameName: "Portal 2" })
            .expect(200);

        assert.equal(response.body.review.gameId, 4200);
        assert.equal(response.body.review.gameName, "Portal 2");
    });
});

describe("countries routes", () => {
    test("GET /countries devuelve XML filtrado por país", async () => {
        const response = await request(app)
            .get("/countries")
            .query({ country: "poland" })
            .expect("Content-Type", /application\/xml/)
            .expect(200);

        assert.match(response.text, /<country>Poland<\/country>/);
        assert.doesNotMatch(response.text, /United States of America/);
    });
});

describe("global API errors", () => {
    test("devuelve 404 global en JSON", async () => {
        const response = await request(app)
            .get("/ruta-inexistente")
            .expect("Content-Type", /application\/json/)
            .expect(404);

        assert.equal(response.body.message, "Recurso no encontrado");
    });
});
