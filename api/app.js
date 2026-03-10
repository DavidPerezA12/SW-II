// Dependencias
const express = require("express");
const createError = require('http-errors');


const app = express();


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