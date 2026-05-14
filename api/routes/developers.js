// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require('../db/conn');

// Obtener todos los desarrolladores
router.get('/', async (req, res) => {
    try {
        const database = mongodb.getDb();

        const { search, limit, page, sort, gameId } = req.query;

        const filter = {};

        // ?search=cd-projekt
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } }
            ];
        }

        // ?gameId=3498
        if (gameId) {

            const gameIdNumber = Number(gameId);

            filter["games.id"] = gameIdNumber;
        }

        const limitNumber = limit ? parseInt(limit) : 1000;
        const pageOption = page ? Number(page) : 1;

        let sortOption = {};

        if (sort) {
            if (sort.startsWith("-")) {
                sortOption = { [sort.slice(1)]: -1 };
            } else {
                sortOption = { [sort]: 1 };
            }
        }

        const developers = await database.collection('developers')
            .find(filter)
            .sort(sortOption)
            .skip((pageOption - 1) * limitNumber)
            .limit(limitNumber)
            .toArray();

        return res.status(200).json({
            developers_length: developers.length,
            developers
        });

    } catch (e) {
        return res.status(500).json({
            message: "Error fetching developers",
            error: e.message
        });
    }
});

// Obtener el desarrollador por ID de RAWG
router.get('/:id', async (req, res) => {
    try {
        const database = mongodb.getDb();

        const developerId = Number(req.params.id);

        const developer = await database
            .collection('developers')
            .findOne({ id: developerId });

        if (!developer) {
            return res.status(404).json({
                message: `Developer ${developerId} not found`
            });
        }

        return res.status(200).json(developer);

    } catch (e) {
        return res.status(500).json({
            message: "Error fetching developer",
            error: e.message
        });
    }
});

module.exports = router;