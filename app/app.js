const express = require('express');
const app = express();
const auth = require("./auth.js");

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(auth);
module.exports = app;