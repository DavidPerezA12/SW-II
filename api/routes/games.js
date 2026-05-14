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
        const {id, search, platform, genre, store, minRating,page,limit,sort} = req.query;
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
            filter.platforms = { $regex: new RegExp(`^${platform}$`, "i") };
        }

        //?genre=shooter
        if (genre) {
            filter.genres = { $regex: new RegExp(`^${genre}$`, "i") };
        }

        //?store=steam
        if (store) {
            filter.stores = { $regex: new RegExp(`^${store}$`, "i") };
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
router.get('/:id', async (req, res) => {
    const database = mongodb.getDb();
    const game_name = await database.collection('videogames').findOne({id: Number(req.params.id)});
    console.log("Game found:", game_name);
    try {
        if (game_name.length == 0) {
            res.status(404).json({message:`El videojuego ${req.params.id} no se encuentra en la base de datos`});
        } else {
            res.json(game_name);
        }
    } catch (e) {
        res.status(500).json({ message: 'Error fetching game by name', error: e });
    }
});

// GET /games/:id/country
router.get('/:id/country', async (req, res) => {
    const database = mongodb.getDb();

    try {
        const gameId = Number(req.params.id);

        const countries = await database
            .collection('countries')
            .find({ gameId })
            .toArray();

        if (countries.length === 0) {
            return res.status(404).json({
                message: `No country information found for game ${gameId}`
            });
        }

        return res.json(countries);

    } catch (e) {
        return res.status(500).json({
            message: 'Error fetching country information',
            error: e.message
        });
    }
});


// GET /games/:id/enriched
router.get('/:id/enriched', async (req, res) => {
    const database = mongodb.getDb();

    try {
        const gameId = Number(req.params.id);

        const game = await database
            .collection('videogames')
            .findOne({ id: gameId });

        if (!game) {
            return res.status(404).json({
                message: `El videojuego ${gameId} no se encuentra en la base de datos`
            });
        }

        const countries = await database
            .collection('countries')
            .find({ gameId })
            .toArray();

        const reviews = await database
            .collection('reviews')
            .find({ gameId })
            .toArray();

        return res.json({
            game,
            wikidata: {
                countries
            },
            reviews
        });

    } catch (e) {
        return res.status(500).json({
            message: 'Error fetching enriched game',
            error: e.message
        });
    }
});

// GET /games/:id/reviews
// Obtener reviews de un videojuego
router.get('/:id/reviews', async (req, res) => {

    const database = mongodb.getDb();

    try {

        const gameId = Number(req.params.id);

        // Verificar si el juego existe
        const game = await database
            .collection('videogames')
            .findOne({ id: gameId });

        if (!game) {

            return res.status(404).json({
                message: `El videojuego ${gameId} no se encuentra en la base de datos`
            });
        }

        // Buscar reviews
        const reviews = await database
            .collection('reviews')
            .find({ gameId })
            .toArray();

        return res.status(200).json({
            gameId,
            gameName: game.name,
            reviews_length: reviews.length,
            reviews
        });

    } catch (e) {

        return res.status(500).json({
            message: 'Error fetching game reviews',
            error: e.message
        });
    }
});

// Crear un videojuego
router.post('/', async (req, res) => {

    const database = mongodb.getDb();

    try {

        const newGame = req.body;

        const requiredFields = [
            "id",
            "name",
            "platforms",
            "genres",
            "stores"
        ];

        const missingFields = requiredFields.filter(field => {
            return !newGame[field];
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Missing required fields",
                missingFields
            });
        }

        // Validar arrays vacíos
        if (
            !Array.isArray(newGame.platforms) || newGame.platforms.length === 0 ||
            !Array.isArray(newGame.genres) || newGame.genres.length === 0 ||
            !Array.isArray(newGame.stores) || newGame.stores.length === 0
        ) {
            return res.status(400).json({
                message: "Platforms, genres and stores must be non-empty arrays"
            });
        }

        // Verificar si existe
        const gameExist = await database
            .collection("videogames")
            .findOne({ id: newGame.id });

        if (gameExist) {
            return res.status(409).json({
                message: "Game already exists"
            });
        }

        const result = await database
            .collection("videogames")
            .insertOne(newGame);

        return res.status(201).json({
            message: "Game created successfully",
            insertedId: result.insertedId
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

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