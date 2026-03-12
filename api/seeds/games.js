const mongodb = require('../db/conn');
const rawg = require('../services/rawg');
const fs = require("fs");

const seedGames = async () => {
    await mongodb.connectToDatabase();
    const db = mongodb.getDb();

    let totalGames = [];

    // Si el dataset ya existe usa los games del JSON
    if (fs.existsSync("./datasets/videogames.json")) {

        const data = fs.readFileSync("./datasets/videogames.json");
        totalGames = JSON.parse(data);
    
    // Si el dataset no existe: pasa los games de RAWG al JSON
    } else {

        const games = await rawg.getGames();
        totalGames = totalGames.concat(games);

        fs.writeFileSync(
            "./datasets/videogames.json",
            JSON.stringify(totalGames, null, 2)
        );

        console.log("Dataset JSON creado");

    }

    //  JSON -> MongoDB
    await db.collection("videogames").deleteMany({});
    await db.collection("videogames").insertMany(totalGames);

    console.log("Datos cargados en MongoDB");

    process.exit();
};

seedGames();