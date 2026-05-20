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

        await request(app)
            .post("/games")
            .send(newGame)
            .expect(201);

        const response = await request(app)
            .get("/games/9999")
            .expect(200);

        assert.equal(response.body.id, 9999);
        assert.equal(response.body.name, "Test Game");
        assert.equal(response.body._id, undefined);
    });

    test("PUT /games/:id rechaza campos no permitidos", async () => {
        const response = await request(app)
            .put("/games/3328")
            .send({ id: 1 })
            .expect(400);

        assert.deepEqual(response.body.invalidFields, ["id"]);
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
            .send({ rating: 6 })
            .expect(400);

        const response = await request(app)
            .patch("/reviews/1")
            .send({ rating: 3, comment: "Actualizada" })
            .expect(200);

        assert.equal(response.body.review.rating, 3);
        assert.equal(response.body.review.comment, "Actualizada");
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
