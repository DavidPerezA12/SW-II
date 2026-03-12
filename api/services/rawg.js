//GET https://api.rawg.io/api/platforms?key=YOUR_API_KEY
// GET https://api.rawg.io/api/games?key=YOUR_API_KEY&dates=2019-09-01,2019-09-30&platforms=18,1,7
const axios = require("axios");
require("dotenv").config();

const RAWG_URL_BASE = "https://api.rawg.io/api";

// Obtener 2 juegos de RAWG (PRUEBA)
const getGames = async (page = 1, page_size = 4) => {
    try {
        const response = await axios.get(`${RAWG_URL_BASE}/games`, {
            params: {
                key: process.env.RAWG_API_KEY,
                page: page,
                page_size: page_size
            }
        });

        return response.data.results;

    } catch (error) {
        console.error("Error fetching games from RAWG:", error.message);
        throw error;
    }
};

getGames();

module.exports = {
    getGames
};