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
        
        
        // Por si hay un filtro (?= ...)
        console.log("Games:", req.query);
        // SOLO  FUNCIONAN LOS FILTROS CON strings -> Ej: /games?platforms.platform.slug=playstation4
        if (req.query) { 
            const filter = { ...req.query };
            // Para que el filtro se use si contiene este valor -> /games?slug=the-witcher -> todos los juegos que contengan "the-witcher" en su nombre
            // Se pueden anidar varios filtros -> /games?slug=the-witcher&platforms.platform.slug=playstation4
            for (const key in filter) { 
                const value = filter[key];
                if (typeof value === "string") {
                    filter[key] = { $regex: value, $options: "i" };
                }
            }
            console.log("Filter applied:", filter);
            const games = await database.collection("videogames").find(filter).toArray();  //Devuelva los juegos filtrados con la característica en común
            res.json(games);
        } else {
            const games = await database.collection("videogames").find({}).toArray(); //Devuelva todos
            res.json(games);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching games', error: err });
    }
});

// Obtener el juego por nombre (Solo 1)
router.get('/:slug', async (req, res) => {
    const database = mongodb.getDb();
    const game_name = await database.collection('videogames').findOne({slug: req.params.slug});
    console.log("Game found:", game_name);
    try {
        if (game_name.length == 0) {
            res.status(404).json({message:`El videojuego ${req.params.slug} no se encuentra en la base de datos`});
        } else {
            res.json(game_name);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching game by name', error: err });
    }
});


module.exports = router;