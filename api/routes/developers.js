// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
//const rawg  = require(`../services/rawg`);

// Obtener todos los desarrolladores
router.get('/', async (req,res) => {
    try {
        const database = mongodb.getDb();

        const {search, limit, page, sort, gameID } = req.query;

        const filter = {};
        
        //?search=cd-projekt
        if (search){
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } }
            ];
        }

        //?limit=10
        let limitNumber;
        if(limit){
            limitNumber = parseInt(limit);
        } else {
            limitNumber = 1000;
        }

        //?page=2&&limit=10
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

        const developers = await database.collection('developers')
            .find(filter)
            .sort(sortOption)
            .skip((pageOption - 1) * limitNumber)
            .limit(limitNumber)
            .toArray();
        
        //?gameID=3498
        if(gameID){
            // gameID es string
            const number_gameID = Number(gameID);

            const filteredDevelopers = developers.filter(developer =>
                developer.games && developer.games.some(game => game.id === number_gameID)
            );

            const videogame_name = filteredDevelopers
                .flatMap(dev => dev.games)
                .find(game => game.id === number_gameID);
        
            res.status(200).json({
                videogame: {name: videogame_name.name, slug: videogame_name.slug},
                developers_length: filteredDevelopers.length,
                developer: filteredDevelopers
            });
        }
        
        res.status(200).json({
            developers_length: developers.length,
            developer: developers
        });
    } catch (e) {
    }
});

// Obtener el desarrollador por nombre (Solo 1)
router.get('/:slug', async (req,res) => {
    try {
        const database = mongodb.getDb();

        const developer = await database.collection('developers').findOne({slug: req.params.slug});
        const { _id, ...developerInfo } = developer;
        console.log(developerInfo.games.map(game =>game.id ))
        res.status(200).json({
            developer: developerInfo,
            games: developerInfo.games
        });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching developer', error: e });
    }
});

module.exports = router;