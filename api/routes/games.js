// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
const xml2js = require("xml2js");
//const rawg  = require(`../services/rawg`);

const removeMongoId = ({ _id, ...document }) => document;

const isPositiveInteger = (value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
};

const isValidNumber = (value) => {
    return !Number.isNaN(Number(value));
};

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
            if (!isPositiveInteger(id)) {
                return res.status(400).json({ message: "El id debe ser un número positivo" });
            }

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
            if (!isValidNumber(minRating)) {
                return res.status(400).json({ message: "minRating debe ser un número" });
            }

            filter["rating"] = { $gte: Number(minRating) };
        }

        //?limit=2
        let limitNumber;
        if(limit){
            if (!isPositiveInteger(limit)) {
                return res.status(400).json({ message: "limit debe ser un número positivo" });
            }

            limitNumber = parseInt(limit);
        } else {
            limitNumber = 1000;
        }

        //?page=2&&limit=2
        let pageOption;
        if(page){
            if (!isPositiveInteger(page)) {
                return res.status(400).json({ message: "page debe ser un número positivo" });
            }

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
        
        const gamesWithoutId = games.map(removeMongoId);
        
        res.status(200).json({
            videogames_length: gamesWithoutId.length,
            videogames: gamesWithoutId
        });
    } catch (e) {
        res.status(500).json({ message: 'Error al obtener los videojuegos', error: e });
    }
});

// Obtener el juego por nombre (Solo 1)
router.get('/:id', async (req, res) => {
    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const database = mongodb.getDb();
        const game_name = await database.collection('videogames').findOne({id: Number(req.params.id)});

        if (!game_name) {
            return res.status(404).json({message:`El videojuego ${req.params.id} no se encuentra en la base de datos`});
        } else {
            res.json(removeMongoId(game_name));
        }
    } catch (e) {
        res.status(500).json({ message: 'Error al obtener el videojuego', error: e.message });
    }
});

// GET /games/:id/country
router.get('/:id/country', async (req, res) => {

    const database = mongodb.getDb();

    try {

        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const gameId = Number(req.params.id);

        let countries = await database
            .collection('countries')
            .find({ gameId: gameId })
            .toArray();

        if (countries.length === 0) {

            return res.status(404).json({
                message: `No se ha encontrado información de países para el videojuego ${gameId}`
            });
        }

        // Eliminar _id de MongoDB
        countries = countries.map(country => {

            const { _id, ...rest } = country;

            return rest;
        });

        // Convertir JSON -> XML
        const builder = new xml2js.Builder();

        const xml = builder.buildObject({
            countries: {
                country: countries
            }
        });

        // Respuesta XML
        res.set('Content-Type', 'application/xml');

        return res.status(200).send(xml);

    } catch (e) {

        return res.status(500).json({
            message: 'Error al obtener la información de países',
            error: e.message
        });
    }
});


// GET /games/:id/enriched
router.get('/:id/enriched', async (req, res) => {
    const database = mongodb.getDb();

    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

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
            game: removeMongoId(game),
            wikidata: {
                countries: countries.map(removeMongoId)
            },
            reviews: reviews.map(removeMongoId)
        });

    } catch (e) {
        return res.status(500).json({
            message: 'Error al obtener el videojuego enriquecido',
            error: e.message
        });
    }
});

// GET /games/:id/reviews
// Obtener reviews de un videojuego
router.get('/:id/reviews', async (req, res) => {

    const database = mongodb.getDb();

    try {

        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

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
            reviews: reviews.map(removeMongoId)
        });

    } catch (e) {

        return res.status(500).json({
            message: 'Error al obtener las reviews del videojuego',
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
                message: "Faltan campos obligatorios",
                missingFields
            });
        }

        if (!isPositiveInteger(newGame.id)) {
            return res.status(400).json({
                message: "El id debe ser un número positivo"
            });
        }

        // Validar arrays vacíos
        if (
            !Array.isArray(newGame.platforms) || newGame.platforms.length === 0 ||
            !Array.isArray(newGame.genres) || newGame.genres.length === 0 ||
            !Array.isArray(newGame.stores) || newGame.stores.length === 0
        ) {
            return res.status(400).json({
                message: "Platforms, genres y stores deben ser arrays no vacíos"
            });
        }

        // Verificar si existe
        const gameExist = await database
            .collection("videogames")
            .findOne({ id: Number(newGame.id) });

        if (gameExist) {
            return res.status(409).json({
                message: "El videojuego ya existe"
            });
        }

        newGame.id = Number(newGame.id);

        const result = await database
            .collection("videogames")
            .insertOne(newGame);

        return res.status(201).json({
            message: "Videojuego creado correctamente",
            insertedId: result.insertedId
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
});

// Actualizar un videojuego
router.put('/:id', async (req,res) => {
    const database = mongodb.getDb();
    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const number_id = Number(req.params.id);
        const newData = req.body;
        const allowedFields = [
            "name",
            "slug",
            "released",
            "rating",
            "platforms",
            "genres",
            "stores",
            "developers"
        ];
        const invalidFields = Object.keys(newData).filter(field => {
            return !allowedFields.includes(field);
        });

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos no se pueden actualizar",
                invalidFields
            });
        }

        const game_exist = await database
            .collection("videogames")
            .findOne({ id: number_id });

        if (!game_exist) {
            return res.status(404).json({
                message: "Videojuego no encontrado"
            });
        }

        await database
            .collection("videogames")
            .updateOne(
                { id: number_id },
                { $set: newData }
            );

        res.status(200).json({
            message: "Videojuego actualizado correctamente",
            id: number_id
        });

        
    } catch (e) {
        res.status(500).json({
            message: "Error al actualizar el videojuego",
            error: e
        });
    }
})

// Eliminar un juego por id permanentemente
router.delete('/:id', async (req, res) => {
    const database = mongodb.getDb();
    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const number_id = Number(req.params.id);
        const game_delete = await database.collection('videogames').findOne({ id: number_id });
        if (!game_delete) {
            return res.status(404).json({ message: 'Videojuego no encontrado' });
        }

        await database.collection('videogames').deleteOne({ id: number_id });

        res.status(200).json({ message: `Videojuego ${game_delete.name} eliminado correctamente` });
    } catch (e) {
        res.status(500).json({ message: 'Error al eliminar el videojuego', error: e.message });
    }
});


module.exports = router;
