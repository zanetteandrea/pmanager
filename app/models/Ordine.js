var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// set up a mongoose model
module.exports = mongoose.model('Ordine', new Schema({
    dataCreazione: Number,
    dataConsegna: Number,
    idRivenditore: String,
    prodotti: [{
        id: String,
        prezzo: Number,
        quantita: Number
    }]
}));