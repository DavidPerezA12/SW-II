const axios = require("axios");

const WIKIDATA_URL = "https://query.wikidata.org/sparql";
const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";

const USER_AGENT = "VideogamesAPI/1.0 (student project)";

const searchGameEntities = async (gameName) => {

    const response = await axios.get(WIKIDATA_API_URL, {
        params: {
            action: "wbsearchentities",
            search: gameName,
            language: "en",
            format: "json",
            limit: 5
        },
        headers: {
            "User-Agent": USER_AGENT
        },
        timeout: 30000
    });

    return (response.data.search || [])
        .map(result => result.id)
        .filter(id => /^Q\d+$/.test(id));
};

const mapCountryResults = (results) => {
    return results
        .filter(r => r.countryLabel?.value)
        .map(r => {
            return {
                game: r.gameLabel?.value || null,
                gameId: r.game?.value?.split("/").pop() || null,
                developer: r.developerLabel?.value || null,
                developerId: r.developer?.value?.split("/").pop() || null,
                country: r.countryLabel.value
            };
        });
};

const runCountryQuery = async (query) => {

    const response = await axios.get(WIKIDATA_URL, {
        params: {
            query,
            format: "json"
        },
        headers: {
            "User-Agent": USER_AGENT
        },
        timeout: 30000
    });

    const results = response.data.results?.bindings || [];

    return mapCountryResults(results);
};

const getCountriesByExactLabel = async (gameName) => {

    const safeName = gameName.replace(/"/g, '\\"');

    const query = `
        SELECT ?game ?gameLabel ?developer ?developerLabel ?countryLabel WHERE {

            ?game rdfs:label ?label;
                  wdt:P31/wdt:P279* wd:Q7889;
                  wdt:P178 ?developer.

            FILTER(STR(?label) = "${safeName}" && LANG(?label) IN ("en", "mul"))

            ?developer wdt:P17 ?country.

            SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en,mul".
            }
        }
        LIMIT 5
    `;

    return runCountryQuery(query);
};

const getCountriesByEntitySearch = async (gameName) => {

    const entityIds = await searchGameEntities(gameName);

    if (entityIds.length === 0) {
        return [];
    }

    const query = `
        SELECT ?game ?gameLabel ?developer ?developerLabel ?countryLabel WHERE {

            VALUES ?game { wd:${entityIds[0]} }

            ?game wdt:P31/wdt:P279* wd:Q7889;
                  wdt:P178 ?developer.

            ?developer wdt:P17 ?country.

            SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en,mul".
            }
        }
        LIMIT 5
    `;

    return runCountryQuery(query);
};

const getCountries = async (gameName) => {

    const exactResults = await getCountriesByExactLabel(gameName);

    if (exactResults.length > 0) {
        return exactResults;
    }

    return getCountriesByEntitySearch(gameName);
};

module.exports = {
    getCountries
};
