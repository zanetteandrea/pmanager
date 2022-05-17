const express = require('express');
const app = express();

const prodotti = require('./prodotti.js');

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/prodotti', prodotti);

module.exports = app;