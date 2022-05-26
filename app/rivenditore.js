const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/rivenditore') // get our mongoose model
const Utente = require('./models/utente')
const validator = require('validator');
const auth = require('./auth');
const ruoli = require('./models/ruoli');
/**
 * @swagger
 * /Rivenditore:
 *   get:
 *     summary: Ritorna tutti i rivenditori presenti nel sistema in formato json
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               description: generalità del rivenditore
 *               example: {"_id": "6284eb9ac1e5c03bd845a60a", "nome": "Poli", "email": "poli@supermercato.it", "telefono": "3475264874", "indirizzo": "via san giuseppe 35 38088 spiazzo", "catalogo": [{"id": "mantovana","prezzo": 5}]}
 *     responses:
 *       200:
 *         description: OK  
 *       401:
 *         description: Non autorizzato         
 * 
 *   post:
 *     summary: Crea un nuovo Rivenditore
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
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
 *               indirizzo:
 *                 type: string
 *                 description: indirizzo del Rivenditore.
 *                 example: via san giuseppe 35 38088 spiazzo
 *               catalogo:
 *                 type: Object
 *                 description: catalogo di prodotti ordinabili dal Rivenditore.
 *                 example: [{"id": "62875f0ea3b2841c579af936","prezzo": 5}]
 *     responses:
 *       201:
 *         description: Rivenditore creato con successo
 *       400:
 *         description: Dati del Rivenditore inseriti non validi o Rivenditore già presente
 *       401:
 *         description: Non autorizzato
 *  
 *   patch:
 *     summary: Modifica un Rivenditore
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
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
 *               email:
 *                 type: string
 *                 description: email del Rivenditore.
 *                 example: poli@supermercato.it
 *               telefono:
 *                 type: string
 *                 description: telefono del Rivenditore.
 *                 example: 3475264874
 *               indirizzo:
 *                 type: string
 *                 description: indirizzo del Rivenditore.
 *                 example: via san giuseppe 35 38088 spiazzo
 *               catalogo:
 *                 type: Object
 *                 description: catalogo di prodotti ordinabili dal Rivenditore.
 *                 example: [{"id": "62875f0ea3b2841c579af936","prezzo": 5}]
 *     responses:
 *       200:
 *         description: Rivenditore modificato con successo
 *       400:
 *         description: Dati inseriti non validi
 *       401:
 *           description: Non autorizzato
 *       404:
 *         description: Rivenditore non trovato
 * /Rivenditore/:id:
 *   delete:
 *      summary: Eliminazione Rivenditore
 *      paths:
 *         /rivenditore/{id}
 *      parameters:
 *       - in: path
 *         name: id
 *         description: id del Rivenditore da eliminare
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *      schema:
 *         type: String
 *      responses:
 *         204:
 *           description: Rivenditore rimosso dal sistema
 *         400:
 *           description: Errore durante la rimozione
 *         401:
 *           description: Non autorizzato
 *         404:
 *           description: Rivenditore non presente
*/

function check_fields(riv) {
    let checks = {
        valid: Boolean,
        data: String
    }
    checks.valid = true

    // CHECK FIELD NAME
    if (riv.nome.length <= 2) {
        checks.data = "nome"
        checks.valid = false
    }
    // CHECK FIELD EMAIL
    if (!validator.isEmail(riv.email)) {
        checks.data = "email"
        checks.valid = false
    }
    // CHECK FIELD TELEFONO
    if (validator.isEmpty(riv.telefono)) {
        checks.data = "telefono"
        checks.valid = false
    }

    let [via, civico, cap, citta] = riv.indirizzo.split('-')

    // CHECK ALL PARTS OF ADDRESS
    let via_fields = via.split(" ")
    via_fields.forEach(x => {
        if (!validator.isAlpha(x)) {
            checks.data = "indirizzo"
            checks.valid = false
        }
    })

    // CHECK FIELD CAP
    if (!validator.isPostalCode(cap, 'IT')) {
        checks.data = "cap"
        checks.valid = false
    }

    // CHECK FIELD CIVIC
    if (!validator.isInt(civico)) {
        checks.data = "civico"
        checks.valid = false
    }

    // CHECK FIELD CITY
    if (validator.isEmpty(citta)) {
        checks.data = "citta"
        checks.valid = false
    }
    return checks

}

// Check if email is already in the system
function check_duplicate(riv) {
    return Utente.find({ email: riv.email }).then((riv) => {
        if (!riv.length) {
            return false
        } else {
            return true
        }
    })
}

// ADD GET RIVENDITORI
router.get('', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        Rivenditore.find().select("-hash_pw -first_access")
            .then((riv) => {
                return res.status(200).send(riv)
            })
    } else {
        return res.status(401).send('Non Autorizzato');
    }
})

// ADD NEW RIVENDITORE
router.post('', (req, res) => {

    if (req.auth.ruolo == ruoli.AMM) {
        const { nome, email, telefono, indirizzo, catalogo } = req.body

        let rivenditore = new Rivenditore({
            nome,
            email,
            telefono,
            indirizzo,
            catalogo,
            ruolo: ruoli.RIVENDITORE
        });

        check_duplicate(rivenditore)
                .then((duplicate) => {
                if (duplicate) {
                    res.status(400).send('Email già presente nel sistema');
                    return;
                }
                let check = check_fields(rivenditore)
                if (!check.valid) {
                    res.status(400).send(`Campo [${check.data}] non valido`);
                } else {
                    auth.register(rivenditore)
                        .then((riv) => {
                            res.status(201).send(riv);
                        })
                        .catch(() => {
                            res.status(400).send('Errore durante il salvataggio');
                        })

                }

            })
    } else {
        res.status(401).send('Non Autorizzato');
    }

});

// DELETE RIVENDITORE
router.delete('/:id', async (req, res) => {

    const _id = req.params.id
    if (req.auth.ruolo == ruoli.AMM) {
        let rivenditore = await Rivenditore.findById(_id).exec();
        if (!rivenditore) {
            res.status(404).send("Rivenditore Non Presente");
            return;
        }
        try {
            await rivenditore.deleteOne()
            res.status(204).send("Rivendenditore rimosso");
        } catch {
            res.status(400).send("Errore durante la rimozione");
        }
    } else {
        res.status(401).send("Non autorizzato");
    }
});


//UPDATE DATA RIVENDITORE
router.patch('', (req, res) => {

    const { _id, nome, email, telefono, indirizzo, catalogo } = req.body

    if (req.auth.ruolo == ruoli.AMM) {
        let rivenditore = new Rivenditore({
            nome,
            email,
            telefono,
            indirizzo,
            catalogo
        });

        let check = check_fields(rivenditore)
        if (!check.valid) {
            res.status(400).send(`Campo [${check.data}] non valido`);
        } else {
            Rivenditore.findOneAndUpdate({
                "_id": _id
            }, {
                $set: { "nome": rivenditore.nome, "email": rivenditore.email, "telefono": rivenditore.telefono, "indirizzo": rivenditore.indirizzo, "catalogo": rivenditore.catalogo }
            })
                .then(() => {
                    res.status(200).send('Rivenditore modificato con successo')
                }).catch(() => {
                    res.status(404).send('Rivenditore non trovato')
                    return;
                })
        }
    } else {
        res.status(401).send("Non autorizzato");
    }

});

module.exports = router;