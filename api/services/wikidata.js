const axios = require("axios");
const xml2js = require("xml2js");

const WIKIDATA_URL = "https://query.wikidata.org/sparql";

const parser = new xml2js.Parser();

const getGameInfo = async (gameName) => {
    const safeName = gameName.replace(/"/g, '\\"');

    const query = `
SELECT ?gameLabel ?developerLabel ?countryLabel WHERE {
  ?game wdt:P31 wd:Q7889;
        rdfs:label ?gameLabel;
        wdt:P178 ?developer.

  ?developer wdt:P17 ?country.

  FILTER(LANG(?gameLabel) = "en").
  FILTER(CONTAINS(LCASE(?gameLabel), LCASE("Portal 2")))

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 10
`;

    const response = await axios.get(WIKIDATA_URL, {
        params: {
            query,
            format: "xml"
        },
        headers: {
            "User-Agent": "VideogamesAPI/1.0 (student project)"
        }
    });

    const result = await parser.parseStringPromise(response.data);

    // 🔥 convertir a formato usable
    const results = result.sparql.results?.[0]?.result || [];

    const parsed = results.map(r => {
        const getValue = (name) => {
            const found = r.binding.find(b => b.$.name === name);
            return found?.literal?.[0]?._ || found?.uri?.[0] || null;
        };

        return {
            name: getValue("gameLabel"),
            developer: getValue("developerLabel"),
            country: getValue("countryLabel")
        };
    });

    return parsed;
};

module.exports = {
    getGameInfo
};