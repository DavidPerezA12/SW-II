// API DATOS --> MONGO
const mongodb = require('../db/conn');
const rawg = require('../services/rawg');
const fs = require("fs");

const seedGames = async () => {
    // Añade los Juegos a mongo
    // Conexión a Mongo
    await mongodb.connectToDatabase();
    const db = mongodb.getDb();

    // Todos los games
    let totalGames = [];

    // Hay varias páginas de juegos (Consultar Documentación API)
    const games = await rawg.getGames();
    totalGames = totalGames.concat(games);
    console.log("Total games:",totalGames.length); // Comprobar

    
    await db.collection("videogames").insertMany(totalGames); //ESTA LINEA NO AÑADE A MONGO
    console.log("RAWG TotalGames a Mongo");


    // ---------------
    // Añade los juegos a ../datasets/videogames.json
    fs.writeFileSync(
        "./datasets/videogames.json",
        JSON.stringify(totalGames, null, 2)
    );

    console.log("videogames.json creado");

    process.exit();
};

seedGames();