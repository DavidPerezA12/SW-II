// FUNCIONES SOBRE LA API DE RAWG, obtener datos, etc.
// https://api.rawg.io/api/games
// https://api.rawg.io/api/developers

const axios = require("axios");
require("dotenv").config();

const RAWG_URL_BASE = "https://api.rawg.io/api";

/*
    Obtener 100 juegos de RAWG
    10 juegos por página x 10 páginas = 100 juegos
*/
const getGames = async () => {
    try {
        let allGames = [];

        for (let page = 1; page <= 25; page++) {
            const response = await axios.get(`${RAWG_URL_BASE}/games`, {
                params: {
                    key: process.env.RAWG_API_KEY,
                    page,
                    page_size: 40
                }
            });

            const cleanGames = response.data.results.map(game => ({
                id: game.id,
                slug: game.slug,
                name: game.name,
                released: game.released,
                background_image: game.background_image,
                rating: game.rating,
                metacritic: game.metacritic,
                playtime: game.playtime,

                platforms: game.platforms?.map(p => p.platform.name) || [],

                genres: game.genres?.map(g => g.name) || [],

                stores: game.stores?.map(s => s.store.name) || [],

                esrb_rating: game.esrb_rating?.name || null
            }));

            allGames = allGames.concat(cleanGames);
        }

        return allGames;

    } catch (error) {
        console.error("Error fetching games from RAWG:", error.message);
        throw error;
    }
};

/*
    Obtener 100 developers de RAWG
*/
const getDevelopers = async () => {
    try {

        let allDevelopers = [];

        for (let page = 1; page <= 15; page++) {

            const response = await axios.get(`${RAWG_URL_BASE}/developers`, {
                params: {
                    key: process.env.RAWG_API_KEY,
                    page: page,
                    page_size: 36
                }
            });

            allDevelopers = allDevelopers.concat(response.data.results);
        }

        return allDevelopers;

    } catch (error) {
        console.error("Error fetching developers from RAWG:", error.message);
        throw error;
    }
};


module.exports = {
    getGames,
    getDevelopers
};