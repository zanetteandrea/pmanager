var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const utente = require('./Utente');

// set up a mongoose model
let riv = new Schema({
    indirizzo: String,
    catalogo: [{
        id: String,
        prezzo: Number
    }]
});


// Rivenditore Inherits From Utente
let Rivenditore = utente.discriminator('Rivenditore', riv);
module.exports = Rivenditore;