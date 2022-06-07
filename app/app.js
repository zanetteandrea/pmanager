const express = require('express');
const app = express();
const cors = require("cors")
const auth = require("./auth.js");
const prodotti = require("./prodotti.js")
const rivenditore = require("./rivenditore.js")
const dipendente=require("./dipendente.js")
const ordine=require("./ordine.js")
swaggerJsdoc = require("swagger-jsdoc");
swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PManager API",
            version: "1.0.0",
            description:
                "Operazioni CRUD del sistema PManager",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Andrea Zanette, David Petrovic, Giovanni De Carlo, Marco Bonafini",
                url: "https://github.com/zanetteandrea/pmanager",
            },
        },
        servers: [
            {
                url: "http://pmanagerbackend.herokuapp.com",
            },
        ],
    },
    apis: ["app/*.js"],
}

const specs = swaggerJsdoc(options)
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }))

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs)
)
app.use(auth.router);
app.use('/api/v1/rivenditore', rivenditore);
app.use('/api/v1/prodotti', prodotti)
app.use('/api/v1/dipendente', dipendente);
app.use('/api/v1/ordini', ordine);
app.use('/images', express.static('/images'))


module.exports = app;