const express = require('express');
const app = express();
const cors = require("cors")
const auth = require("./auth.js");
const prodotti = require("./prodotti.js")

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use(auth.router)

app.use('/images', express.static('app/images'))

app.use('/api/v1/prodotti', prodotti)


module.exports = app;