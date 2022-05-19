const express = require('express');
const app = express();
const auth = require("./auth.js");
const cors = require("cors")

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use(auth.router)

module.exports = app;