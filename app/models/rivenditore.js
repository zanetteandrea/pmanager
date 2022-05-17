var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const utente = require('./utente');

// set up a mongoose model
let riv = new Schema({
    indirizzo: String,
    catalogo: [{
        id: String,
        prezzo: Number
    }]
});

let Rivenditore = utente.discriminator('Rivenditore', riv);
module.exports = Rivenditore;