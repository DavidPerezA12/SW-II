const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
const rawg  = require(`../services/rawg`);

// Obtener todos los juegos
router.get('/', async (req, res) => {
    try {
        //const dbConnect = mongodb.getDb();
        const games = await rawg.getGames(1);
        console.log("Games:", games);
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching games', error: err });
    }
});

module.exports = router;