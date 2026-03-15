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
        const {id, search, platform, genre, minRating,page,limit,sort} = req.query;
        const filter = {};
        
        //?id=1234
        if (id){
            console.log("ID recibido:", id);
            const id_game = Number(id);
            filter.id = id_game;
        }

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
        
        const games_witout__id = games.map(({_id, ...game}) => game);
        
        res.status(200).json({
            videogames_length: games_witout__id.length,
            videogames:games_witout__id
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

// Crear un videojuego
router.post('/',async (req,res) => {
    const database = mongodb.getDb();
    try {
        const newGame = req.body;
        console.log(newGame);

        if(!newGame.id){
            res.status(200).json({message: "Id required"});
        }

        const game_exist = await database.collection("videogames").findOne({id: newGame.id});
        if(game_exist){
            return res.status(400).json({
                message: "Game already exists"
            });
        }

        const result = await database
            .collection("videogames")
            .insertOne(newGame)

        res.status(201).json({
            message: "Game created succesfully",
            id: result.id
        })
    } catch (e) {
        res
    }
})

// Actualizar un videojuego
router.put('/:id', async (req,res) => {
    const database = mongodb.getDb();
    try {
        const number_id = Number(req.params.id);
        const newData = req.body;

        const game_exist = await database
            .collection("videogames")
            .findOne({ id: number_id });

        if (!game_exist) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        await database
            .collection("videogames")
            .updateOne(
                { id: number_id },
                { $set: newData }
            );

        res.status(200).json({
            message: "Game updated successfully",
            id: number_id
        });

        
    } catch (e) {
        res.status(500).json({
            message: "Error updating game",
            error: e
        });
    }
})

// Eliminar un juego por id permanentemente
router.delete('/:id', async (req, res) => {
    const database = mongodb.getDb();
    try {
        const number_id = Number(req.params.id);
        const game_delete = await database.collection('videogames').findOne({ id: number_id });
        if (!game_delete) {
            res.status(404).json({ message: 'Game not found' });
        }
        console.log("Game to delete:", game_delete);

        await database.collection('videogames').deleteOne(game_delete);

        res.status(200).json({ message: `Game ${game_delete.name} deleted successfully` });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting game', error: e });
    }
});


module.exports = router;