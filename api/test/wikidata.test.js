const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const axios = require("axios");

const { getCountries } = require("../services/wikidata");

const originalGet = axios.get;

afterEach(() => {
    axios.get = originalGet;
});

test("getCountries devuelve resultados del SPARQL exacto sin depender de la red", async () => {
    axios.get = async (url) => {
        assert.equal(url, "https://query.wikidata.org/sparql");

        return {
            data: {
                results: {
                    bindings: [
                        {
                            game: { value: "http://www.wikidata.org/entity/Q123" },
                            gameLabel: { value: "Portal 2" },
                            developer: { value: "http://www.wikidata.org/entity/Q456" },
                            developerLabel: { value: "Valve" },
                            countryLabel: { value: "United States of America" }
                        }
                    ]
                }
            }
        };
    };

    const countries = await getCountries("Portal 2");

    assert.deepEqual(countries, [
        {
            game: "Portal 2",
            gameId: "Q123",
            developer: "Valve",
            developerId: "Q456",
            country: "United States of America"
        }
    ]);
});

test("getCountries usa búsqueda de entidad cuando el SPARQL exacto no devuelve países", async () => {
    const calls = [];

    axios.get = async (url) => {
        calls.push(url);

        if (url === "https://www.wikidata.org/w/api.php") {
            return {
                data: {
                    search: [
                        { id: "Q789" },
                        { id: "not-a-qid" }
                    ]
                }
            };
        }

        if (calls.length === 1) {
            return { data: { results: { bindings: [] } } };
        }

        return {
            data: {
                results: {
                    bindings: [
                        {
                            game: { value: "http://www.wikidata.org/entity/Q789" },
                            gameLabel: { value: "The Witcher 3: Wild Hunt" },
                            developer: { value: "http://www.wikidata.org/entity/Q900" },
                            developerLabel: { value: "CD Projekt RED" },
                            countryLabel: { value: "Poland" }
                        }
                    ]
                }
            }
        };
    };

    const countries = await getCountries("The Witcher 3");

    assert.deepEqual(calls, [
        "https://query.wikidata.org/sparql",
        "https://www.wikidata.org/w/api.php",
        "https://query.wikidata.org/sparql"
    ]);
    assert.equal(countries[0].country, "Poland");
});
