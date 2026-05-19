const express = require('express');
const router = express.Router();
const mongodb = require('../db/conn');
const xml2js = require("xml2js");

router.get('/', async (req, res) => {

    const database = mongodb.getDb();

    try {

        const { country, developer, gameName } = req.query;

        // Filtro dinámico
        const filter = {};

        // Buscar por país
        if (country) {

            filter.country = {
                $regex: country,
                $options: "i"
            };
        }

        // Buscar por desarrollador
        if (developer) {

            filter.developer = {
                $regex: developer,
                $options: "i"
            };
        }

        // Buscar por nombre del juego
        if (gameName) {

            filter.gameName = {
                $regex: gameName,
                $options: "i"
            };
        }

        let countries = await database
            .collection('countries')
            .find(filter)
            .toArray();

        if (countries.length === 0) {

            return res.status(404).json({
                message: 'No country information found'
            });
        }

        // Eliminar _id
        countries = countries.map(country => {

            const { _id, ...rest } = country;

            return rest;
        });

        // JSON -> XML
        const builder = new xml2js.Builder();

        const xml = builder.buildObject({
            countries: {
                country: countries
            }
        });

        res.set('Content-Type', 'application/xml');

        return res.status(200).send(xml);

    } catch (e) {

        return res.status(500).json({
            message: 'Error fetching country information',
            error: e.message
        });
    }
});

module.exports = router;