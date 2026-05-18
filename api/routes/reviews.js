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

router.patch("/:id", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const reviewId = Number(req.params.id);

        // Buscar review actual
        const existingReview = await database
            .collection("reviews")
            .findOne({ id: reviewId });

        if (!existingReview) {

            return res.status(404).json({
                message: `Review with id ${reviewId} not found`
            });
        }

        const updates = req.body;

        // No permitir modificar createdAt
        if (updates.createdAt) {

            return res.status(400).json({
                message: "createdAt cannot be modified"
            });
        }

        // Validar rating
        if (
            updates.rating !== undefined &&
            (updates.rating < 1 || updates.rating > 5)
        ) {

            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }

        // Validar ID duplicado
        if (
            updates.id !== undefined &&
            Number(updates.id) !== reviewId
        ) {

            const duplicatedId = await database
                .collection("reviews")
                .findOne({ id: Number(updates.id) });

            if (duplicatedId) {

                return res.status(409).json({
                    message: `Review with id ${updates.id} already exists`
                });
            }
        }

        // Convertir números si vienen
        if (updates.id !== undefined) {
            updates.id = Number(updates.id);
        }

        if (updates.gameId !== undefined) {
            updates.gameId = Number(updates.gameId);
        }

        if (updates.rating !== undefined) {
            updates.rating = Number(updates.rating);
        }

        // Actualizar solo los campos enviados
        await database
            .collection("reviews")
            .updateOne(
                { id: reviewId },
                { $set: updates }
            );

        // Obtener review actualizada
        const updatedReview = await database
            .collection("reviews")
            .findOne({ id: updates.id || reviewId });

        return res.status(200).json({
            message: "Review updated successfully",
            review: updatedReview
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error updating review",
            error: e.message
        });
    }
});

router.delete("/:id", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const reviewId = Number(req.params.id);

        // Verificar si existe
        const existingReview = await database
            .collection("reviews")
            .findOne({ id: reviewId });

        if (!existingReview) {

            return res.status(404).json({
                message: `Review with id ${reviewId} not found`
            });
        }

        // Eliminar review
        await database
            .collection("reviews")
            .deleteOne({ id: reviewId });

        return res.status(200).json({
            message: `Review ${reviewId} deleted successfully`
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error deleting review",
            error: e.message
        });
    }
});



module.exports = router;