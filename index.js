const app = require('./app/app.js');
const mongoose = require('mongoose');
require('dotenv').config()

const port = process.env.PORT || 8080;

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {

        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });

    });