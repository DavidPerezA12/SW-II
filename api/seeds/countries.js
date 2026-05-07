const mongodb = require('../db/conn');
const rawg = require('../services/rawg');
const fs = require("fs");

const seedCountries = async () => {
    let totalCountries = [];
    // Si el dataset ya existe usa los games del JSON para cargarlos después en MongoDB
    if (fs.existsSync("./datasets/countries.json")) {
        const data = fs.readFileSync("./datasets/countries.json");
        totalCountries = JSON.parse(data);
    // Si el dataset no existe: pasa los games de RAWG al JSON para cargarlo después en MongoDB
    } else {
        const countries = await rawg.getCountries();
        totalCountries = totalCountries.concat(countries);
        fs.writeFileSync(
            "./datasets/countries.json",
            JSON.stringify(totalCountries, null)
        );
    }
    await mongodb.connectToDatabase();
    const db = mongodb.getDb();
    await db.collection("countries").deleteMany({});
    await db.collection("countries").insertMany(totalCountries);
    console.log("Datos de countries cargados en MongoDB");
    process.exit();
};

seedCountries();