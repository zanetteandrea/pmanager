var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Prodotto', new Schema({
	nome: String,
    ingredienti: [{
        nome: String,
        quantita: Number,
        udm: String
    }],
    prezzo: Number,
    foto: String

}));