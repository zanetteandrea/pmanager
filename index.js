const app = require('./app/app.js');
const mongoose = require('mongoose');
swaggerJsdoc = require("swagger-jsdoc");
swaggerUi = require("swagger-ui-express");
require('dotenv').config()

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
                url: "http://localhost:" + process.env.PORT || 8080,
            },
        ],
    },
    apis: ["app/*.js"],
};

const specs = swaggerJsdoc(options);
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs)
);


const port = process.env.PORT || 8080;

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {

        console.log("Connected to Database");

        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });

    });