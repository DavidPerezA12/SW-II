const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const axios = require("axios");

const { getDevelopers, getGames } = require("../services/rawg");

const originalGet = axios.get;

afterEach(() => {
    axios.get = originalGet;
});

test("getGames normaliza la respuesta de RAWG sin depender de la red", async () => {
    const calls = [];

    axios.get = async (url, options) => {
        calls.push({ url, options });

        return {
            data: {
                results: [
                    {
                        id: 1,
                        slug: "test-game",
                        name: "Test Game",
                        released: "2025-01-01",
                        background_image: "https://example.com/game.jpg",
                        rating: 4.5,
                        metacritic: 90,
                        playtime: 12,
                        platforms: [{ platform: { name: "PC" } }],
                        genres: [{ name: "Action" }],
                        stores: [{ store: { name: "Steam" } }],
                        esrb_rating: { name: "Teen" }
                    }
                ]
            }
        };
    };

    const games = await getGames();

    assert.equal(calls.length, 25);
    assert.equal(calls[0].url, "https://api.rawg.io/api/games");
    assert.equal(calls[0].options.params.page_size, 40);
    assert.deepEqual(games[0], {
        id: 1,
        slug: "test-game",
        name: "Test Game",
        released: "2025-01-01",
        background_image: "https://example.com/game.jpg",
        rating: 4.5,
        metacritic: 90,
        playtime: 12,
        platforms: ["PC"],
        genres: ["Action"],
        stores: ["Steam"],
        esrb_rating: "Teen"
    });
});

test("getDevelopers pagina RAWG sin depender de la red", async () => {
    const calls = [];

    axios.get = async (url, options) => {
        calls.push({ url, options });

        return {
            data: {
                results: [
                    {
                        id: options.params.page,
                        name: `Developer ${options.params.page}`
                    }
                ]
            }
        };
    };

    const developers = await getDevelopers();

    assert.equal(calls.length, 15);
    assert.equal(calls[0].url, "https://api.rawg.io/api/developers");
    assert.equal(calls[0].options.params.page_size, 36);
    assert.equal(developers.length, 15);
    assert.equal(developers[14].name, "Developer 15");
});
