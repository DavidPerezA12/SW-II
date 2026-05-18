const express = require("express");
const router = express.Router();

const mongodb = require("../db/conn");


// GET /reviews
// Obtener todas las reviews
router.get("/", async (req, res) => {

    const database = mongodb.getDb();

    try {

        // Query params
        const { id, rating, limit, page } = req.query;

        // Filtro dinámico
        const filter = {};

        if (id) {
            filter.id = parseInt(id);
        }

        if (rating) {
            filter.rating = parseInt(rating);
        }

        // Paginación
        const limitNumber = parseInt(limit);
        const pageNumber = parseInt(page);
        const skip = (pageNumber - 1) * limitNumber;

        // Query MongoDB
        const reviews = await database
            .collection("reviews")
            .find(filter)
            .skip(skip)
            .limit(limitNumber)
            .toArray();

        // Total de documentos para ese filtro
        const total = await database
            .collection("reviews")
            .countDocuments(filter);

        return res.status(200).json({
            total,
            reviews_length: reviews.length,
            reviews
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error fetching reviews",
            error: e.message
        });
    }
});


// GET /reviews/:gameId
// Obtener una review específica
router.get("/:gameId", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const gameId = Number(req.params.gameId);

        const reviews = await database
            .collection("reviews")
            .find({ gameId: gameId })
            .toArray();

        if (reviews.length === 0) {

            return res.status(404).json({
                message: `No reviews found for game ${gameId}`
            });
        }

        return res.status(200).json({
            reviews_length: reviews.length,
            reviews
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error fetching reviews",
            error: e.message
        });
    }
});

router.post("/", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const {
            id,
            gameId,
            gameName,
            user,
            rating,
            comment
        } = req.body;

        // Validar campos obligatorios
        if (
            id === undefined ||
            gameId === undefined ||
            !gameName ||
            rating === undefined ||
            !comment
        ) {

            return res.status(400).json({
                message: "Required fields: id, gameId, gameName, rating, comment"
            });
        }

        // Comprobar si el ID ya existe
        const existingReview = await database
            .collection("reviews")
            .findOne({ id: Number(id) });

        if (existingReview) {

            return res.status(409).json({
                message: `Review with id ${id} already exists`
            });
        }

        // Crear objeto review
        const newReview = {
            id: Number(id),
            gameId: Number(gameId),
            gameName,
            user: user || "anonymous",
            rating: Number(rating),
            comment,
            createdAt: new Date()
        };

        // Insertar en MongoDB
        const result = await database
            .collection("reviews")
            .insertOne(newReview);

        return res.status(201).json({
            message: "Review created successfully",
            insertedId: result.insertedId,
            review: newReview
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error creating review",
            error: e.message
        });
    }
});



module.exports = router;