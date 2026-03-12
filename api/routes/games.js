// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
//const rawg  = require(`../services/rawg`);

// Obtener todos los juegos
router.get('/', async (req, res) => {
    try {
        
        // Rawg API -> Web Backend = Prueba. NO SE USA PORQUE se usa MongoDB
        //const games = await rawg.getGames();

        // MongoDB -> Web Backend
        const database = mongodb.getDb();
        const games = await database.collection("videogames").find({}).toArray(); //Devuelva todos sino find({id: "123"})
        console.log("Games:", games);
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching games', error: err });
    }
});

module.exports = router;