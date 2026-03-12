// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
const rawg  = require(`../services/rawg`);

// Obtener todos los juegos
router.get('/', async (req, res) => {
    try {
        
        // OBTIENE LOS DATOS DE LA API DIRECTO
        // const games = await rawg.getGames();

        // OBTIENE LOS DATOS DE MONGO
        const dbConnect = mongodb.getDb();
        console.log("Games:", dbConnect);
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching games', error: err });
    }
});

module.exports = router;