const express = require('express');
const app = express();
const auth = require("./auth.js");
const cors = require("cors")


const dipendente = require('./dipendente.js')

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use(auth.router)
app.use('/api/v1/dipendente', dipendente);



module.exports = app;