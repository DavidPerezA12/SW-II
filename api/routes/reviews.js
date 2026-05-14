const express = require("express");
const router = express.Router();

const mongodb = require("../db/conn");


// GET /reviews
// Obtener todas las reviews
router.get("/", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const reviews = await database
            .collection("reviews")
            .find({})
            .toArray();

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


// GET /reviews/:gameId
// Obtener una review específica
router.get("/:gameId", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const reviewId = Number(req.params.gameId);

        const review = await database
            .collection("reviews")
            .findOne({ gameId: reviewId });

        if (!review) {

            return res.status(404).json({
                message: `Review ${reviewId} not found`
            });
        }

        return res.status(200).json(review);

    } catch (e) {

        return res.status(500).json({
            message: "Error fetching review",
            error: e.message
        });
    }
});

module.exports = router;