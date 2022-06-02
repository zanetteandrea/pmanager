var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// set up a mongoose model
module.exports = mongoose.model('Ordine', new Schema({
    dataCreazione: Number,
    dataConsegna: Number,
    rivenditore: {
        id: String,
        nome: String,
        email: String,
        telefono: String,
        indirizzo: String
    },
    prodotti: [{
        id: String,
        nome: String,
        prezzo: Number,
        quantita: Number
    }]
}));