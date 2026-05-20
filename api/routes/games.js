// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
const xml2js = require("xml2js");
//const rawg  = require(`../services/rawg`);

const removeMongoId = ({ _id, ...document }) => document;

const isPlainObject = (value) => {
    return value !== null && typeof value === "object" && !Array.isArray(value);
};

const isPositiveInteger = (value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
};

const isValidNumber = (value) => {
    return !Number.isNaN(Number(value));
};

const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};

const isNonEmptyStringArray = (value) => {
    return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
};

const isNumberInRange = (value, min, max) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max;
};

const isNonNegativeInteger = (value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue >= 0;
};

const escapeRegex = (value) => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const allowedSortFields = [
    "id",
    "name",
    "released",
    "rating",
    "metacritic",
    "playtime"
];

const allowedGameFields = [
    "id",
    "name",
    "slug",
    "released",
    "background_image",
    "rating",
    "metacritic",
    "playtime",
    "platforms",
    "genres",
    "stores",
    "esrb_rating",
    "developers"
];

const findGameDependencies = async (database, gameId) => {
    const [reviews, countries, developers] = await Promise.all([
        database.collection("reviews").countDocuments({ gameId }),
        database.collection("countries").countDocuments({ gameId }),
        database.collection("developers").countDocuments({ "games.id": gameId })
    ]);

    return {
        reviews,
        countries,
        developers
    };
};

const hasGameDependencies = (dependencies) => {
    return Object.values(dependencies).some(count => count > 0);
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
            const safeSearch = escapeRegex(search);

            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { slug: { $regex: safeSearch, $options: "i" } }
            ];
        }

        //?platform=pc
        if (platform) {
            filter.platforms = { $regex: new RegExp(`^${escapeRegex(platform)}$`, "i") };
        }

        //?genre=shooter
        if (genre) {
            filter.genres = { $regex: new RegExp(`^${escapeRegex(genre)}$`, "i") };
        }

        //?store=steam
        if (store) {
            filter.stores = { $regex: new RegExp(`^${escapeRegex(store)}$`, "i") };
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
            const sortField = sort.startsWith("-") ? sort.slice(1) : sort;

            if (!allowedSortFields.includes(sortField)) {
                return res.status(400).json({
                    message: "Campo de ordenación no permitido",
                    allowedSortFields
                });
            }

            if(sort.startsWith("-")){
                sortOption = {[sortField] : -1};
            }else{
                sortOption = {[sortField] : 1};
            }
        }
        const gamesCollection = database.collection("videogames");
        const total = await gamesCollection.countDocuments(filter);

        const games = await gamesCollection
            .find(filter)
            .skip((pageOption - 1) * limitNumber)
            .limit(limitNumber)
            .sort(sortOption)
            .toArray();
        
        const gamesWithoutId = games.map(removeMongoId);
        
        res.status(200).json({
            total,
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

        if (!isPlainObject(newGame)) {
            return res.status(400).json({ message: "El cuerpo de la petición debe ser un objeto JSON" });
        }

        const invalidFields = Object.keys(newGame).filter(field => {
            return !allowedGameFields.includes(field);
        });

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos no se pueden crear",
                invalidFields
            });
        }

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

        const stringFields = ["name", "slug", "released", "background_image", "esrb_rating"];
        const invalidStringFields = stringFields.filter(field => {
            return newGame[field] !== undefined && newGame[field] !== null && !isNonEmptyString(newGame[field]);
        });

        if (invalidStringFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos de texto no son válidos",
                invalidFields: invalidStringFields
            });
        }

        const arrayFields = ["platforms", "genres", "stores", "developers"];
        const invalidArrayFields = arrayFields.filter(field => {
            return newGame[field] !== undefined && !isNonEmptyStringArray(newGame[field]);
        });

        if (invalidArrayFields.length > 0) {
            return res.status(400).json({
                message: "platforms, genres, stores y developers deben ser arrays no vacíos de texto",
                invalidFields: invalidArrayFields
            });
        }

        if (newGame.rating !== undefined && !isNumberInRange(newGame.rating, 0, 5)) {
            return res.status(400).json({ message: "rating debe ser un número entre 0 y 5" });
        }

        if (newGame.metacritic !== undefined && !isNumberInRange(newGame.metacritic, 0, 100)) {
            return res.status(400).json({ message: "metacritic debe ser un número entre 0 y 100" });
        }

        if (newGame.playtime !== undefined && !isNonNegativeInteger(newGame.playtime)) {
            return res.status(400).json({ message: "playtime debe ser un número entero igual o mayor que 0" });
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

        const gameToInsert = {
            ...newGame,
            id: Number(newGame.id)
        };

        if (gameToInsert.rating !== undefined) gameToInsert.rating = Number(gameToInsert.rating);
        if (gameToInsert.metacritic !== undefined) gameToInsert.metacritic = Number(gameToInsert.metacritic);
        if (gameToInsert.playtime !== undefined) gameToInsert.playtime = Number(gameToInsert.playtime);

        await database
            .collection("videogames")
            .insertOne(gameToInsert);

        return res.status(201).json({
            message: "Videojuego creado correctamente",
            id: gameToInsert.id,
            game: removeMongoId(gameToInsert)
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

        if (!isPlainObject(newData)) {
            return res.status(400).json({ message: "El cuerpo de la petición debe ser un objeto JSON" });
        }

        const allowedFields = allowedGameFields.filter(field => field !== "id");
        const invalidFields = Object.keys(newData).filter(field => {
            return !allowedFields.includes(field);
        });

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos no se pueden actualizar",
                invalidFields
            });
        }

        if (Object.keys(newData).length === 0) {
            return res.status(400).json({ message: "No se han enviado campos para actualizar" });
        }

        const stringFields = ["name", "slug", "released", "background_image", "esrb_rating"];
        const invalidStringFields = stringFields.filter(field => {
            return newData[field] !== undefined && newData[field] !== null && !isNonEmptyString(newData[field]);
        });

        if (invalidStringFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos de texto no son válidos",
                invalidFields: invalidStringFields
            });
        }

        const arrayFields = ["platforms", "genres", "stores", "developers"];
        const invalidArrayFields = arrayFields.filter(field => {
            return newData[field] !== undefined && !isNonEmptyStringArray(newData[field]);
        });

        if (invalidArrayFields.length > 0) {
            return res.status(400).json({
                message: "platforms, genres, stores y developers deben ser arrays no vacíos de texto",
                invalidFields: invalidArrayFields
            });
        }

        if (newData.rating !== undefined && !isNumberInRange(newData.rating, 0, 5)) {
            return res.status(400).json({ message: "rating debe ser un número entre 0 y 5" });
        }

        if (newData.metacritic !== undefined && !isNumberInRange(newData.metacritic, 0, 100)) {
            return res.status(400).json({ message: "metacritic debe ser un número entre 0 y 100" });
        }

        if (newData.playtime !== undefined && !isNonNegativeInteger(newData.playtime)) {
            return res.status(400).json({ message: "playtime debe ser un número entero igual o mayor que 0" });
        }

        if (newData.rating !== undefined) newData.rating = Number(newData.rating);
        if (newData.metacritic !== undefined) newData.metacritic = Number(newData.metacritic);
        if (newData.playtime !== undefined) newData.playtime = Number(newData.playtime);

        const game_exist = await database
            .collection("videogames")
            .findOne({ id: number_id });

        if (!game_exist) {
            return res.status(404).json({
                message: "Videojuego no encontrado"
            });
        }

        if (newData.name !== undefined && newData.name !== game_exist.name) {
            const dependencies = await findGameDependencies(database, number_id);

            if (hasGameDependencies(dependencies)) {
                return res.status(409).json({
                    message: "No se puede cambiar el nombre de un videojuego con recursos relacionados",
                    dependencies
                });
            }
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

        const dependencies = await findGameDependencies(database, number_id);

        if (hasGameDependencies(dependencies)) {
            return res.status(409).json({
                message: 'No se puede eliminar un videojuego con recursos relacionados',
                dependencies
            });
        }

        await database.collection('videogames').deleteOne({ id: number_id });

        res.status(200).json({ message: `Videojuego ${game_delete.name} eliminado correctamente` });
    } catch (e) {
        res.status(500).json({ message: 'Error al eliminar el videojuego', error: e.message });
    }
});


module.exports = router;
