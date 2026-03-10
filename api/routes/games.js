const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');

// Obtener todos los juegos
router.get('/', async (req, res) => {
    try {
        const dbConnect = dbo.getDb();
        const games = await dbConnect.collection('games').find({}).toArray();
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching games', error: err });
    }
});

module.exports = router;