const mongodb = require('../db/conn');
const wikidata = require('../services/wikidata');
const fs = require("fs");

const { Builder, Parser } = require("xml2js");

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

const seedCountries = async () => {

    let totalCountries = [];

    // Si ya existe el XML
    if (fs.existsSync("./datasets/countries.xml")) {

        console.log("Usando countries.xml existente");

        const xmlData = fs.readFileSync(
            "./datasets/countries.xml",
            "utf-8"
        );

        const parser = new Parser();

        const parsed = await parser.parseStringPromise(xmlData);

        totalCountries = parsed.countries.country;

    } else {

        await mongodb.connectToDatabase();

        const db = mongodb.getDb();

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

            if (
                (i + batchSize) % 10 === 0 ||
                i + batchSize >= games.length
            ) {

                console.log(
                    `Procesados ${Math.min(i + batchSize, games.length)} / ${games.length}`
                );
            }

            await sleep(2000);
        }

        // Convertir a XML
        const builder = new Builder();

        const xml = builder.buildObject({
            countries: {
                country: totalCountries
            }
        });

        // Guardar XML
        fs.writeFileSync(
            "./datasets/countries.xml",
            xml
        );

        console.log("countries.xml generado correctamente");
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