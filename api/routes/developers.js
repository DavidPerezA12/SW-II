// MongoDB --> Web Backend
const express = require('express');
const router = express.Router();
const mongodb = require('../db/conn');

const removeMongoId = ({ _id, ...document }) => document;

const isPositiveInteger = (value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
};

const isNonEmptyArray = (value) => {
    return Array.isArray(value) && value.length > 0;
};

const allowedDeveloperFields = [
    "name",
    "slug",
    "games_count",
    "image_background",
    "games"
];

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
            if (!isPositiveInteger(gameId)) {
                return res.status(400).json({ message: "gameId debe ser un número positivo" });
            }

            const gameIdNumber = Number(gameId);

            filter["games.id"] = gameIdNumber;
        }

        if (limit && !isPositiveInteger(limit)) {
            return res.status(400).json({ message: "limit debe ser un número positivo" });
        }

        if (page && !isPositiveInteger(page)) {
            return res.status(400).json({ message: "page debe ser un número positivo" });
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
            developers: developers.map(removeMongoId)
        });

    } catch (e) {
        return res.status(500).json({
            message: "Error al obtener los desarrolladores",
            error: e.message
        });
    }
});

// Obtener el desarrollador por ID de RAWG
router.get('/:id', async (req, res) => {
    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const database = mongodb.getDb();

        const developerId = Number(req.params.id);

        const developer = await database
            .collection('developers')
            .findOne({ id: developerId });

        if (!developer) {
            return res.status(404).json({
                message: `Desarrollador ${developerId} no encontrado`
            });
        }

        return res.status(200).json(removeMongoId(developer));

    } catch (e) {
        return res.status(500).json({
            message: "Error al obtener el desarrollador",
            error: e.message
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const database = mongodb.getDb();
        const newDeveloper = req.body;

        const allowedCreateFields = ["id", ...allowedDeveloperFields];
        const invalidFields = Object.keys(newDeveloper).filter(field => {
            return !allowedCreateFields.includes(field);
        });

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos no se pueden crear",
                invalidFields
            });
        }

        const requiredFields = ["id", "name", "slug", "games"];
        const missingFields = requiredFields.filter(field => {
            return !newDeveloper[field];
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Faltan campos obligatorios",
                missingFields
            });
        }

        if (!isPositiveInteger(newDeveloper.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        if (!isNonEmptyArray(newDeveloper.games)) {
            return res.status(400).json({ message: "games debe ser un array no vacío" });
        }

        if (
            newDeveloper.games_count !== undefined &&
            (
                !Number.isInteger(Number(newDeveloper.games_count)) ||
                Number(newDeveloper.games_count) < 0
            )
        ) {
            return res.status(400).json({ message: "games_count debe ser un número entero igual o mayor que 0" });
        }

        const existingDeveloper = await database
            .collection('developers')
            .findOne({ id: Number(newDeveloper.id) });

        if (existingDeveloper) {
            return res.status(409).json({
                message: `Ya existe un desarrollador con id ${newDeveloper.id}`
            });
        }

        const developerToInsert = {
            ...newDeveloper,
            id: Number(newDeveloper.id),
            games_count: newDeveloper.games_count !== undefined
                ? Number(newDeveloper.games_count)
                : newDeveloper.games.length
        };

        const result = await database
            .collection('developers')
            .insertOne(developerToInsert);

        return res.status(201).json({
            message: "Desarrollador creado correctamente",
            insertedId: result.insertedId,
            developer: removeMongoId(developerToInsert)
        });

    } catch (e) {
        return res.status(500).json({
            message: "Error creating developer",
            error: e.message
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const database = mongodb.getDb();
        const developerId = Number(req.params.id);
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No se han enviado campos para actualizar" });
        }

        const invalidFields = Object.keys(updates).filter(field => {
            return !allowedDeveloperFields.includes(field);
        });

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: "Algunos campos no se pueden actualizar",
                invalidFields
            });
        }

        if (updates.games !== undefined && !isNonEmptyArray(updates.games)) {
            return res.status(400).json({ message: "games debe ser un array no vacío" });
        }

        if (
            updates.games_count !== undefined &&
            (
                !Number.isInteger(Number(updates.games_count)) ||
                Number(updates.games_count) < 0
            )
        ) {
            return res.status(400).json({ message: "games_count debe ser un número entero igual o mayor que 0" });
        }

        if (updates.games_count !== undefined) {
            updates.games_count = Number(updates.games_count);
        }

        const existingDeveloper = await database
            .collection('developers')
            .findOne({ id: developerId });

        if (!existingDeveloper) {
            return res.status(404).json({
                message: `Desarrollador ${developerId} no encontrado`
            });
        }

        await database
            .collection('developers')
            .updateOne(
                { id: developerId },
                { $set: updates }
            );

        const updatedDeveloper = await database
            .collection('developers')
            .findOne({ id: developerId });

        return res.status(200).json({
            message: "Desarrollador actualizado correctamente",
            developer: removeMongoId(updatedDeveloper)
        });

    } catch (e) {
        return res.status(500).json({
            message: "Error al actualizar el desarrollador",
            error: e.message
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        if (!isPositiveInteger(req.params.id)) {
            return res.status(400).json({ message: "El id debe ser un número positivo" });
        }

        const database = mongodb.getDb();
        const developerId = Number(req.params.id);

        const existingDeveloper = await database
            .collection('developers')
            .findOne({ id: developerId });

        if (!existingDeveloper) {
            return res.status(404).json({
                message: `Desarrollador ${developerId} no encontrado`
            });
        }

        await database
            .collection('developers')
            .deleteOne({ id: developerId });

        return res.status(200).json({
            message: `Desarrollador ${existingDeveloper.name} eliminado correctamente`
        });

    } catch (e) {
        return res.status(500).json({
            message: "Error al eliminar el desarrollador",
            error: e.message
        });
    }
});

module.exports = router;
