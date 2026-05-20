require('dotenv').config(); // Cargar variables de entorno desde el archivo .env
const { MongoClient } = require("mongodb"); // Importar el módulo cliente de MongoDB

const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sw2-videogames"
); // Instancia del cliente de MongoDB
let dbConnection;

// Función para conectar a la base de datos
const connectToDatabase = async () => {
    try {
        await client.connect();
        dbConnection = client.db();
        console.log("Successfully connected to database");
    } catch (e){
        console.error(e);
        process.exit();
    }
};

// Función para obtener la conexión a la base de datos
const getDb = () => {
    return dbConnection;
};

const __setDbForTests = (db) => {
    dbConnection = db;
};

module.exports = {
    connectToDatabase,
    getDb,
    __setDbForTests
};
