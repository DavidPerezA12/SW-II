const mongodb = require('../db/conn');
const rawg = require('../services/rawg');
const fs = require("fs");

const seedDevelopers = async () => {
    await mongodb.connectToDatabase();
    const db = mongodb.getDb();

    let totalDevelopers = [];

    // Si el dataset ya existe usa los games del JSON
    if (fs.existsSync("./datasets/developers.json")) {

        const data = fs.readFileSync("./datasets/developers.json");
        totalDevelopers = JSON.parse(data);
    
    // Si el dataset no existe: pasa los games de RAWG al JSON
    } else {

        const developers = await rawg.getDevelopers();
        totalDevelopers = totalDevelopers.concat(developers);

        fs.writeFileSync(
            "./datasets/developers.json",
            JSON.stringify(totalDevelopers, null)
        );

    }

    //  JSON -> MongoDB
    await db.collection("developers").deleteMany({});
    await db.collection("developers").insertMany(totalDevelopers);

    console.log("Datos de developers cargados en MongoDB");

    process.exit();
};

seedDevelopers();