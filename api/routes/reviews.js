const express = require("express");
const router = express.Router();

const mongodb = require("../db/conn");

const removeMongoId = ({ _id, ...document }) => document;

const isPlainObject = (value) => {
    return value !== null && typeof value === "object" && !Array.isArray(value);
};

const isPositiveInteger = (value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
};

const isValidRating = (value) => {
    const numberValue = Number(value);
    return !Number.isNaN(numberValue) && numberValue >= 1 && numberValue <= 5;
};

const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};

const findGameForReview = async (database, gameId, gameName) => {
    const game = await database
        .collection("videogames")
        .findOne({ id: Number(gameId) });

    if (!game) {
        return {
            error: {
                status: 404,
                body: { message: `El videojuego ${gameId} no se encuentra en la base de datos` }
            }
        };
    }

    if (gameName !== undefined && gameName !== game.name) {
        return {
            error: {
                status: 400,
                body: { message: "gameName no coincide con el videojuego indicado por gameId" }
            }
        };
    }

    return { game };
};

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
            if (!isPositiveInteger(id)) {
                return res.status(400).json({ message: "El id debe ser un número positivo" });
            }

            filter.id = parseInt(id);
        }

        if (rating) {
            if (!isValidRating(rating)) {
                return res.status(400).json({ message: "rating debe ser un número entre 1 y 5" });
            }

            filter.rating = parseInt(rating);
        }

        // Paginación
        if (limit && !isPositiveInteger(limit)) {
            return res.status(400).json({ message: "limit debe ser un número positivo" });
        }

        if (page && !isPositiveInteger(page)) {
            return res.status(400).json({ message: "page debe ser un número positivo" });
        }

        const limitNumber = limit ? parseInt(limit) : 1000;
        const pageNumber = page ? parseInt(page) : 1;
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
            reviews: reviews.map(removeMongoId)
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error al obtener las reviews",
            error: e.message
        });
    }
});


// GET /reviews/game/:gameId
// Obtener las reviews asociadas a un videojuego
router.get("/game/:gameId", async (req, res) => {

    const database = mongodb.getDb();

    try {

        if (!isPositiveInteger(req.params.gameId)) {
            return res.status(400).json({ message: "gameId debe ser un número positivo" });
        }

        const gameId = Number(req.params.gameId);

        const reviews = await database
            .collection("reviews")
            .find({ gameId: gameId })
            .toArray();

        if (reviews.length === 0) {

            return res.status(404).json({
                message: `No se han encontrado reviews para el videojuego ${gameId}`
            });
        }

        return res.status(200).json({
            reviews_length: reviews.length,
            reviews: reviews.map(removeMongoId)
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error al obtener las reviews",
            error: e.message
        });
    }
});

router.post("/", async (req, res) => {

    const database = mongodb.getDb();

    try {

        const body = req.body;

        if (!isPlainObject(body)) {
            return res.status(400).json({ message: "El cuerpo de la petición debe ser un objeto JSON" });
        }

        const {
            id,
            gameId,
            gameName,
            user,
            rating,
            comment
        } = body;

        // Validar campos obligatorios
        if (
            id === undefined ||
            gameId === undefined ||
            !gameName ||
            rating === undefined ||
            !comment
        ) {

            return res.status(400).json({
                message: "Campos obligatorios: id, gameId, gameName, rating, comment"
            });
        }

        if (!isPositiveInteger(id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        if (!isPositiveInteger(gameId)) {
            return res.status(400).json({ message: "gameId debe ser un número positivo" });
        }

        if (!isValidRating(rating)) {
            return res.status(400).json({ message: "rating debe ser un número entre 1 y 5" });
        }

        if (!isNonEmptyString(gameName)) {
            return res.status(400).json({ message: "gameName debe ser un texto no vacío" });
        }

        if (!isNonEmptyString(comment)) {
            return res.status(400).json({ message: "comment debe ser un texto no vacío" });
        }

        if (user !== undefined && !isNonEmptyString(user)) {
            return res.status(400).json({ message: "user debe ser un texto no vacío" });
        }

        const { game, error } = await findGameForReview(database, gameId, gameName);
        if (error) {
            return res.status(error.status).json(error.body);
        }

        // Comprobar si el ID ya existe
        const existingReview = await database
            .collection("reviews")
            .findOne({ id: Number(id) });

        if (existingReview) {

            return res.status(409).json({
                message: `Ya existe una review con id ${id}`
            });
        }

        // Crear objeto review
        const newReview = {
            id: Number(id),
            gameId: game.id,
            gameName: game.name,
            user: user || "anonymous",
            rating: Number(rating),
            comment,
            createdAt: new Date()
        };

        // Insertar en MongoDB
        await database
            .collection("reviews")
            .insertOne(newReview);

        return res.status(201).json({
            message: "Review creada correctamente",
            id: newReview.id,
            review: removeMongoId(newReview)
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error al crear la review",
            error: e.message
        });
    }
});

router.patch("/:id", async (req, res) => {

    const database = mongodb.getDb();

    try {

        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const reviewId = Number(req.params.id);

        // Buscar review actual
        const existingReview = await database
            .collection("reviews")
            .findOne({ id: reviewId });

        if (!existingReview) {

            return res.status(404).json({
                message: `No se ha encontrado la review con id ${reviewId}`
            });
        }

        const updates = req.body;

        if (!isPlainObject(updates)) {
            return res.status(400).json({ message: "El cuerpo de la petición debe ser un objeto JSON" });
        }

        // No permitir modificar createdAt
        if (updates.createdAt) {

            return res.status(400).json({
                message: "createdAt no se puede modificar"
            });
        }

        const allowedFields = ["gameId", "gameName", "user", "rating", "comment"];
        const invalidFields = Object.keys(updates).filter(field => {
            return !allowedFields.includes(field);
        });

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos no se pueden actualizar",
                invalidFields
            });
        }

        // Validar rating
        if (updates.rating !== undefined && !isValidRating(updates.rating)) {

            return res.status(400).json({
                message: "rating debe estar entre 1 y 5"
            });
        }

        if (updates.gameId !== undefined) {
            if (!isPositiveInteger(updates.gameId)) {
                return res.status(400).json({ message: "gameId debe ser un número positivo" });
            }

            updates.gameId = Number(updates.gameId);
        }

        if (updates.rating !== undefined) {
            updates.rating = Number(updates.rating);
        }

        if (updates.gameName !== undefined && !isNonEmptyString(updates.gameName)) {
            return res.status(400).json({ message: "gameName debe ser un texto no vacío" });
        }

        if (updates.comment !== undefined && !isNonEmptyString(updates.comment)) {
            return res.status(400).json({ message: "comment debe ser un texto no vacío" });
        }

        if (updates.user !== undefined && !isNonEmptyString(updates.user)) {
            return res.status(400).json({ message: "user debe ser un texto no vacío" });
        }

        if (updates.gameId !== undefined || updates.gameName !== undefined) {
            const targetGameId = updates.gameId !== undefined ? updates.gameId : existingReview.gameId;
            const targetGameName = updates.gameName !== undefined ? updates.gameName : existingReview.gameName;
            const { game, error } = await findGameForReview(database, targetGameId, targetGameName);

            if (error) {
                return res.status(error.status).json(error.body);
            }

            updates.gameId = game.id;
            updates.gameName = game.name;
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
            .findOne({ id: reviewId });

        return res.status(200).json({
            message: "Review actualizada correctamente",
            review: removeMongoId(updatedReview)
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error al actualizar la review",
            error: e.message
        });
    }
});

router.delete("/:id", async (req, res) => {

    const database = mongodb.getDb();

    try {

        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const reviewId = Number(req.params.id);

        // Verificar si existe
        const existingReview = await database
            .collection("reviews")
            .findOne({ id: reviewId });

        if (!existingReview) {

            return res.status(404).json({
                message: `No se ha encontrado la review con id ${reviewId}`
            });
        }

        // Eliminar review
        await database
            .collection("reviews")
            .deleteOne({ id: reviewId });

        return res.status(200).json({
            message: `Review ${reviewId} eliminada correctamente`
        });

    } catch (e) {

        return res.status(500).json({
            message: "Error al eliminar la review",
            error: e.message
        });
    }
});



module.exports = router;
