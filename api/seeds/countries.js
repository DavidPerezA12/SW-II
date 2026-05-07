const mongodb = require('../db/conn');
const wikidata = require('../services/wikidata');
const fs = require("fs");

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

const seedCountries = async () => {

    let totalCountries = [];

    // Si ya existe el dataset
    if (fs.existsSync("./datasets/countries.json")) {

        console.log("Usando countries.json existente");

        const data = fs.readFileSync("./datasets/countries.json");

        totalCountries = JSON.parse(data);

    } else {

        await mongodb.connectToDatabase();

        const db = mongodb.getDb();

        // TODOS los juegos
        const games = await db
            .collection("videogames")
            .find(
                {},
                {
                    projection: {
                        id: 1,
                        name: 1
                    }
                }
            )
            .toArray();

        console.log(`Total games: ${games.length}`);

        const batchSize = 2;

        for (let i = 0; i < games.length; i += batchSize) {

            const batch = games.slice(i, i + batchSize);

            const results = await Promise.allSettled(

                batch.map(async (game) => {

                    const countries =
                        await wikidata.getCountries(game.name);

                    return countries.map(c => ({
                        gameId: game.id,
                        gameName: game.name,
                        developer: c.developer,
                        country: c.country
                    }));
                })
            );

            results.forEach(result => {

                if (result.status === "fulfilled") {

                    totalCountries.push(...result.value);

                } else {

                    console.log(
                        "Error:",
                        result.reason.message
                    );
                }
            });

            // Mostrar progreso cada 10 juegos
            if (
                (i + batchSize) % 10 === 0 ||
                i + batchSize >= games.length
            ) {

                console.log(
                    `Procesados ${Math.min(i + batchSize, games.length)} / ${games.length}`
                );
            }

            // Evitar 429 y 504
            await sleep(2000);
        }

        fs.writeFileSync(
            "./datasets/countries.json",
            JSON.stringify(totalCountries, null, 2)
        );

        console.log("countries.json generado correctamente");
    }

    await mongodb.connectToDatabase();

    const db = mongodb.getDb();

    await db.collection("countries").deleteMany({});

    if (totalCountries.length > 0) {

        await db
            .collection("countries")
            .insertMany(totalCountries);
    }

    console.log("Datos de countries cargados en MongoDB");

    process.exit();
};

seedCountries();