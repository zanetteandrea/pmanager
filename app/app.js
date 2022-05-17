const express = require('express');
const app = express();

const rivenditore = require('./rivenditore.js')

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/rivenditore', rivenditore);

module.exports = app;