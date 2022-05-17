const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/rivenditore'); // get our mongoose model
//const Utente = require('./models/utente'); // get our mongoose model
const validator = require('validator');
/**
 * @swagger
 * /rivenditore:
 *   post:
 *     summary: Crea un nuovo rivenditore
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                       description: Il nome del rivenditore
 *                       example: Poli
*/

function check_fields(riv) {
    let checks = {
        valid: Boolean,
        data: String
    }
    checks.valid = true

    // CHECK FIELD NAME
    if(!validator.isAlpha(riv.nome)){
        checks.data = "nome"
        checks.valid = false
    }
    // CHECK FIELD EMAIL
    if(!validator.isEmail(riv.email)) {
        checks.data = "email"
        checks.valid = false
    }
    // CHECK FIELD TELEFONO
    if(!validator.isInt(riv.telefono)) {
        checks.data = "telefono"
        checks.valid = false
    }

    let [via, civico, cap, citta] = riv.indirizzo.split('-')

    // CHECK ALL PARTS OF ADDRESS
    let via_fields = via.split(" ")
    via_fields.forEach( x => { 
        if(!validator.isAlpha(x)){ 
            checks.data = "indirizzo"
            checks.valid = false
        } 
    })

    // CHECK FIELD CAP
    if(!validator.isInt(cap)){
        checks.data = "cap"
        checks.valid = false
    }   
    
    // CHECK FIELD CIVIC
    if(!validator.isInt(civico)) {
        checks.data = "civico"
        checks.valid = false
    }

    // CHECK FIELD CITY
    if(!validator.isAlpha(citta)){
        checks.data = "citta"
        checks.valid = false
    }
    return checks

}


router.post('', (req, res) => {

    const {nome, email, telefono, password, first_access, indirizzo, catalogo} = req.body

	let rivenditore = new Rivenditore({
        nome,
        email,
        telefono,
        password,
        first_access: true,
        indirizzo,
        catalogo
    });
    
    let check = check_fields(rivenditore) 
    if(!check.valid) {
        res.status(400).send(`Campo [${check.data}] non valido`);
    } else {
        rivenditore = rivenditore.save().then(()=>{
            console.log('utente salvato con successo');
            res.status(201).send();
        })
        if(!rivenditore) {
            res.status(400).send();
        }
    }

});

module.exports = router;