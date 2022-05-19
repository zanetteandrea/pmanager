const express = require('express')
const app = express()

const prodotti = require('./prodotti.js')

const auth = require("./auth.js")
/**
 * Configure Express.js parsing middleware
 */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(auth.router)

app.use('/images', express.static('app/images'))

app.use('/api/v1/prodotti', prodotti)


module.exports = app;