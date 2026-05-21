const axios = require("axios");
const xml2js = require("xml2js");

const WIKIDATA_URL = "https://query.wikidata.org/sparql";
const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";

const USER_AGENT = "VideogamesAPI/1.0 (student project)";
const XML_PARSER = new xml2js.Parser({
    explicitArray: false
});

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

const asArray = (value) => {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};

const bindingValue = (bindings, name) => {
    const binding = asArray(bindings).find(item => item.$?.name === name);

    if (!binding) {
        return null;
    }

    const value = binding.uri || binding.literal || null;

    if (value && typeof value === "object") {
        return value._ || null;
    }

    return value;
};

const parseSparqlXmlResults = async (xml) => {
    const parsed = await XML_PARSER.parseStringPromise(xml);
    const results = asArray(parsed.sparql?.results?.result);

    return results
        .map(result => {
            const bindings = result.binding;
            const gameUri = bindingValue(bindings, "game");
            const developerUri = bindingValue(bindings, "developer");
            const country = bindingValue(bindings, "countryLabel");

            return {
                game: bindingValue(bindings, "gameLabel"),
                gameId: gameUri?.split("/").pop() || null,
                developer: bindingValue(bindings, "developerLabel"),
                developerId: developerUri?.split("/").pop() || null,
                country
            };
        })
        .filter(country => country.country);
};

const runCountryQuery = async (query) => {

    const response = await axios.get(WIKIDATA_URL, {
        params: {
            query,
            format: "xml"
        },
        headers: {
            "Accept": "application/sparql-results+xml",
            "User-Agent": USER_AGENT
        },
        responseType: "text",
        timeout: 30000
    });

    return parseSparqlXmlResults(response.data);
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
