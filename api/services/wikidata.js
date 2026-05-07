const axios = require("axios");
const xml2js = require("xml2js");

const WIKIDATA_URL = "https://query.wikidata.org/sparql";

const parser = new xml2js.Parser();

const getCountries = async (gameName) => {

    const safeName = gameName.replace(/"/g, '\\"');

    const query = `
        SELECT ?gameLabel ?developerLabel ?countryLabel WHERE {

            ?game rdfs:label "${safeName}"@en;
                  wdt:P31 wd:Q7889;
                  wdt:P178 ?developer.

            ?developer wdt:P17 ?country.

            SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en".
            }
        }
        LIMIT 5
    `;

    const response = await axios.get(WIKIDATA_URL, {
        params: {
            query,
            format: "xml"
        },
        headers: {
            "User-Agent": "VideogamesAPI/1.0 (student project)"
        },
        timeout: 10000
    });

    const result = await parser.parseStringPromise(response.data);

    const results = result.sparql.results?.[0]?.result || [];

    const parsed = results.map(r => {

        const getValue = (name) => {
            const found = r.binding.find(
                b => b.$.name === name
            );

            return (
                found?.literal?.[0]?._ ||
                found?.uri?.[0] ||
                null
            );
        };

        return {
            game: getValue("gameLabel"),
            developer: getValue("developerLabel"),
            country: getValue("countryLabel")
        };
    });

    return parsed;
};

module.exports = {
    getCountries
};