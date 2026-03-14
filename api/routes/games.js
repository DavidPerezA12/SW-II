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
        
        // Filtros disponibles
        const {search, platform, genre, minRating,page,limit,sort} = req.query;
        const filter = {};
        
        //?search=the witcher
        if (search){
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } }
            ];
        }

        //?platform=pc
        if (platform) {
            filter["platforms.platform.slug"] = platform;
        }

        //?genre=shooter
        if (genre){
            filter["genres.slug"] = genre;
        }

        //?minRating=4.5
        if(minRating){
            filter["rating"] = { $gte: Number(minRating) };
        }

        //?limit=2
        let limitNumber;
        if(limit){
            limitNumber = parseInt(limit);
        } else {
            limitNumber = 1000;
        }

        //?page=2&&limit=2
        let pageOption;
        if(page){
            pageOption = Number(page);
        } else {
            pageOption = 1;
        }

        //games?sort=rating /games?sort=-name
        let sortOption = {};
        if(sort){
            if(sort.startsWith("-")){
                sortOption = {[sort.slice(1)] : -1}; //sort= -name // sort.slice(1)= name
            }else{
                sortOption = {[sort] : 1};
            }
        }
        const games = await database
            .collection("videogames")
            .find(filter)
            .skip((pageOption - 1) * limitNumber)
            .limit(limitNumber)
            .sort(sortOption)
            .toArray();
        
        res.status(200).json({
            videogames_length: games.length,
            videogames:games
        });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching games', error: e });
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
    } catch (e) {
        res.status(500).json({ message: 'Error fetching game by name', error: e });
    }
});


module.exports = router;