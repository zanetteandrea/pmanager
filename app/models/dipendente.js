var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const utente = require('./Utente');

// set up a mongoose model
let dip = new Schema({
    orario: [{
        giorno: Number,
        oraIniziale: Number,
        oraFinale: Number
    }]
});

let Dipendente = utente.discriminator('Dipendente', dip);
module.exports = Dipendente;