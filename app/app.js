const express = require('express');
const app = express();


const dipendente = require('./dipendente.js')

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/dipendente', dipendente);
module.exports = app;