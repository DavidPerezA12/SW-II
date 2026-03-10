require('dotenv').config(); // Cargar variables de entorno desde el archivo .env
const { MongoClient } = require("mongodb"); // Importar el módulo cliente de MongoDB

const client = new MongoClient(process.env.MONGODB_URI); // Instancia del cliente de MongoDB
let dbConnection;

// Función para conectar a la base de datos
connectToDatabase = async () => {
    try {
        await client.connect();
        dbConnection = client.db();
        console.log("Succesfully connected to database");
    } catch (e){
        console.error(e);
        process.exit();
    }
};

// Función para obtener la conexión a la base de datos
getDb = () => {
    return dbConnection;
}

module.exports = {
    connectToDatabase,
    dbConnection
};