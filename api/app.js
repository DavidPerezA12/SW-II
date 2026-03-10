// Dependencias
require("dotenv").config();
const createError = require('http-errors'); // Módulo para errores HTTP
const express = require("express"); // Framework web para Node.js
const path = require('path'); // Módulo para rutas
const cookieParser = require('cookie-parser'); // Middleware para parsear cookies
const logger = require('morgan'); // Middleware para solicitudes HTTP

let app = express();

// views engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Middleware para parsear URL-encoded
app.use(cookieParser());
app.use(logger('dev'));

const index = require('./routes/index');
app.use('/', index);

const games = require('./routes/games');
app.use('/games', games);


// Error 404 y reenvia al controlador de errores
app.use(function(req, res, next) {
  next(createError(404));
});

//  Controlador de errores
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;