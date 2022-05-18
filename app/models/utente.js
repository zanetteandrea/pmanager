var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// set up a mongoose model
module.exports = mongoose.model('Utente', new Schema({
	
    nome: String,
    email: String,
    telefono: String,
    hash_pw: String,
    first_access: Boolean,
    ruolo: String

}));