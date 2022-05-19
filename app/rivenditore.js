const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/rivenditore'); // get our mongoose model
//const Utente = require('./models/utente'); // get our mongoose model
const validator = require('validator');
/**
 * @swagger
 * /Rivenditore:
 *   get:
 *     summary: Ritorna tutti i rivenditori presenti nel sistema in formato json
 *     responses:
 *       200:
 *         description: Rivenditori ricevuti
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                description: generalità del rivenditore
 *                example: {"_id": "6284eb9ac1e5c03bd845a60a", "nome": "Poli", "email": "poli@supermercato.it", "telefono": "3475264874", "indirizzo": "via san giuseppe 35 38088 spiazzo", "catalogo": [{"id": "mantovana","prezzo": 5}]} 
 * 
 *   post:
 *     summary: Crea un nuovo Rivenditore
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome del Rivenditore.
 *                 example: Poli
 *               email:
 *                 type: string
 *                 description: email del Rivenditore.
 *                 example: poli@supermercato.it
 *               telefono:
 *                 type: string
 *                 description: telefono del Rivenditore.
 *                 example: 3475264874
 *               password:
 *                 type: string
 *                 description: password del Rivenditore.
 *                 example: ahd87fh92bsd
 *               first_Access:
 *                 type: Boolean
 *                 description: primo accesso del Rivenditore.
 *                 example: true
 *               indirizzo:
 *                 type: string
 *                 description: indirizzo del Rivenditore.
 *                 example: via san giuseppe 35 38088 spiazzo
 *               catalogo:
 *                 type: Object
 *                 description: catalogo di prodotti ordinabili dal Rivenditore.
 *                 example: mantovana, prezzo 5
 *     responses:
 *       201:
 *         description: Rivenditore creato con successo
 *       400:
 *         description: Dati del Rivenditore inseriti non validi
 * 
 *   delete:
 *     summary: Elimina un Rivenditore
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: object
 *                 description: id del Rivenditore
 *                 example: 6284a31ef6e9638dcb7985e1
 *     responses:
 *       204:
 *         description: Rivenditore rimosso dal sistema
 *       400:
 *         description: Id del Rivenditore inserito non valido
 *       404:
 *         description: Rivenditore non trovato
 * 
 *   patch:
 *     summary: Modifica un Rivenditore
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: object
 *                 description: id del Rivenditore
 *                 example: 6284a31ef6e9638dcb7985e1
 *               nome:
 *                 type: string
 *                 description: nome del Rivenditore
 *                 example: Poli
 *               ingredienti:
 *                 type: array
 *                 description: ingredienti del Rivenditore
 *                 example: {nome: acqua, quantita: 1, udm: L}
 *               prezzo:
 *                 type: float
 *                 description: prezzo del prodotto
 *                 example: 1.5
 *               foto:
 *                 type: string
 *                 description: path della foto del prodotto
 *                 example: /images/mantovana.jpeg
 *     responses:
 *       200:
 *         description: Rivenditore modificato con successo
 *       400:
 *         description: Dati inseriti non validi
 *       404:
 *         description: Rivenditore non trovato
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

// Check if email is already in the system
function check_duplicate(riv) {

    return Rivenditore.find({ email: riv.email}).then((riv)=>{
        if (!riv.length) {
            return false
         } else {
            return true
         }
    })
}

// ADD NEW RIVENDITORE
router.post('', (req, res) => {

    const {nome, email, telefono, indirizzo, catalogo} = req.body

	let rivenditore = new Rivenditore({
        nome,
        email,
        telefono,
        indirizzo,
        catalogo,
        ruolo: "rivenditore"
    });
    
    check_duplicate(rivenditore).then((duplicate)=>{
        if(duplicate){
            console.log("Rivenditore già presente")
            res.status(400).send();
            return;
        }
        let check = check_fields(rivenditore) 
        if(!check.valid) {
            res.status(400).send(`Campo [${check.data}] non valido`);
        } else {
            rivenditore = rivenditore.save().then(()=>{
                console.log('rivenditore salvato con successo');
                res.status(201).send();
            })
            if(!rivenditore) {
                res.status(400).send();
            }
        }

    })
    

});

// DELETE RIVENDITORE
router.delete('', async (req, res) => {

    const _id = req.body
    let rivenditore = await Rivenditore.findById(_id).exec();
    if(!rivenditore) {
        res.status(404).send();
        console.log("Rivenditore Non Presente")
        return;
    }
    try{
        await rivenditore.deleteOne()
        console.log("rivendenditore rimosso")
        res.status(204).send();
    } catch {
        console.log("Errore durante la rimozione")
        res.status(400).send();
    }
});


//UPDATE DATA RIVENDITORE
router.patch('', (req, res) => {

    const {_id, nome, email, telefono, password, first_access, indirizzo, catalogo} = req.body

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
        Rivenditore.findOneAndUpdate({
            "_id" : _id
        },{
            $set: {"nome" : rivenditore.nome, "email": rivenditore.email, "telefono": rivenditore.telefono, "password": rivenditore.password, "first_access": rivenditore.first_access, "indirizzo": rivenditore.indirizzo, "catalogo": rivenditore.catalogo}
        })
        .then(() => {
            console.log('Rivenditore modificato con successo');
            res.status(200).send() 
        }).catch(() => {
            console.log('Rivenditore non trovato');
            res.status(404).send()
            return;
        })

        
    } 

});

module.exports = router;