// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require(`../db/conn`);
//const rawg  = require(`../services/rawg`);

router.get('/', async (req,res) => {
    try {
        const database = mongodb.getDb();

        console.log(database);
        
        const developers = await database
            .collection("developers")
            .find({})
            .toArray();
        
        res.status(200).json({
            developers_length: developers.length,
            developer: developers
        });
    } catch (e) {
    }
});

router.get('/:slug', async (req,res) => {
    try {
        const database = mongodb.getDb();
        const developer = await database.collection('developers').findOne({slug: req.params.slug});
        res.status(200).json({
            developer: developer
        });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching developer', error: e });
    }
});

module.exports = router;