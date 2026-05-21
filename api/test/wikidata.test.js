const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const axios = require("axios");

const { getCountries } = require("../services/wikidata");

const originalGet = axios.get;

const sparqlXml = (bindings) => {
    const results = bindings.map(binding => `
        <result>
            ${Object.entries(binding).map(([name, value]) => {
                const tag = value.startsWith("http") ? "uri" : "literal";

                const lang = tag === "literal" ? ' xml:lang="en"' : "";

                return `<binding name="${name}"><${tag}${lang}>${value}</${tag}></binding>`;
            }).join("")}
        </result>
    `).join("");

    return `<?xml version="1.0"?>
        <sparql xmlns="http://www.w3.org/2005/sparql-results#">
            <head></head>
            <results>${results}</results>
        </sparql>`;
};

afterEach(() => {
    axios.get = originalGet;
});

test("getCountries consume XML del SPARQL exacto sin depender de la red", async () => {
    axios.get = async (url, config) => {
        assert.equal(url, "https://query.wikidata.org/sparql");
        assert.equal(config.params.format, "xml");
        assert.equal(config.headers.Accept, "application/sparql-results+xml");

        return {
            data: sparqlXml([
                {
                    game: "http://www.wikidata.org/entity/Q123",
                    gameLabel: "Portal 2",
                    developer: "http://www.wikidata.org/entity/Q456",
                    developerLabel: "Valve",
                    countryLabel: "United States of America"
                }
            ])
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

    axios.get = async (url, config) => {
        calls.push(url);

        if (url === "https://www.wikidata.org/w/api.php") {
            assert.equal(config.params.format, "json");

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
            assert.equal(config.params.format, "xml");

            return {
                data: sparqlXml([])
            };
        }

        assert.equal(config.params.format, "xml");

        return {
            data: sparqlXml([
                {
                    game: "http://www.wikidata.org/entity/Q789",
                    gameLabel: "The Witcher 3: Wild Hunt",
                    developer: "http://www.wikidata.org/entity/Q900",
                    developerLabel: "CD Projekt RED",
                    countryLabel: "Poland"
                }
            ])
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
