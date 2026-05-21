// Dependencias
require("dotenv").config();
const createError = require('http-errors'); // Módulo para errores HTTP
const express = require("express"); // Framework web para Node.js
const path = require('path'); // Módulo para rutas
const cookieParser = require('cookie-parser'); // Middleware para parsear cookies
const logger = require('morgan'); // Middleware para solicitudes HTTP
const cors = require('cors'); // Middleware para habilitar CORS
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
const openApiDocument = YAML.load(openApiPath);

let app = express();

// views engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Middleware para parsear URL-encoded
app.use(cookieParser());
app.use(logger('dev'));


// Rutas
app.get('/openapi.yaml', (req, res) => {
  res.type('application/yaml').sendFile(openApiPath);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

const index = require('./routes/index');
app.use('/', index);

const games = require('./routes/games');
app.use('/games', games);

const developers = require('./routes/developers');
app.use('/developers', developers);

const reviews = require('./routes/reviews');
app.use('/reviews', reviews);

const countries = require('./routes/countries');
app.use('/countries', countries);

// Error 404 y reenvia al controlador de errores
app.use(function(req, res, next) {
  next(createError(404));
});

//  Controlador de errores
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  const body = {
    message: status === 404 ? "Recurso no encontrado" : err.message
  };

  if (req.app.get('env') === 'development') {
    body.error = err;
  }

  res.status(status).json(body);
});

module.exports = app;
