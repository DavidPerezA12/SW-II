const mongodb = require('../db/conn');
const rawg = require('../services/rawg');

const seedGames = async () => {

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
    console.log("Seed: RAWG TotalGames");

    process.exit();
};

seedGames();