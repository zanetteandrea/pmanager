const express = require('express');
const router = express.Router();
const Utente = require('./models/Utente');
const Dipendente = require('./models/Dipendente'); // get our mongoose model

const validator = require('validator');

const auth = require('./auth');
const ruoli = require('./models/Ruoli');
/**
 * @swagger
 * /Dipendente:
 *   get:
 *     summary: Ritorna tutti i dipendenti presenti nel sistema in formato json
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               description: generalità del dipendente
 *               example: {"_id": "6284eb9ac1e5c03bd845a60a", "nome": "Giovanni", "email": "giovanni@mail.it", "telefono": "3475254874", "ruolo": "panettiere", "orario": [{"giorno": 3,"oraIniziale": 5200, "oraFinale": 6000}]}
 *     responses:
 *       200:
 *         description: OK           
 * 
 *   post:
 *     summary: Crea un nuovo Dipendente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome del Dipendente.
 *                 example: Giovanni
 *               email:
 *                 type: string
 *                 description: email del Dipendente.
 *                 example: giovanni@mail.it
 *               telefono:
 *                 type: string
 *                 description: telefono del Dipendente.
 *                 example: 3475254874
 *               ruolo:
 *                 type: string
 *                 description: ruolo del Dipendente.
 *                 example: panettiere
 *               orario:
 *                 type: Object
 *                 description: orari lavorativi del Dipendente.
 *                 example: [{"giorno": 3,"oraIniziale": 5200, "oraFInale": 6000}]
 *     responses:
 *       201:
 *         description: Dipendente creato con successo
 *       400:
 *         description: Dati del Dipendente inseriti non validi o Dipendente già presente
 * 
 *   delete:
 *     summary: Elimina un Dipendente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: object
 *                 description: id del Dipendente
 *                 example: 6284a31ef6e9638dcb7985e1
 *     responses:
 *       204:
 *         description: Dipendente rimosso dal sistema
 *       400:
 *         description: Id del Dipendente inserito non valido
 *       404:
 *         description: Dipendente non trovato
 * 
 *   patch:
 *     summary: Modifica un Dipendente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: object
 *                 description: id del Dipendente
 *                 example: 6284a31ef6e9638dcb7985e1
 *               nome:
 *                 type: string
 *                 description: nome del Dipendente
 *                 example: Giovanni
 *               email:
 *                 type: string
 *                 description: email del Dipendente.
 *                 example: giovanni@mail.it
 *               telefono:
 *                 type: string
 *                 description: telefono del Dipendente.
 *                 example: 3475254874
 *               ruolo:
 *                 type: string
 *                 description: ruolo del Dipendente.
 *                 example: panettiere
 *               orario:
 *                 type: Object
 *                 description: orari lavorativi del Dipendente.
 *                 example: [{"giorno": 3,"oraIniziale": 5200, "oraFInale": 6000}]
 *     responses:
 *       200:
 *         description: Dipendente modificato con successo
 *       400:
 *         description: Dati inseriti non validi
 *       404:
 *         description: Dipendente non trovato
*/

function check_fields(dip) {
    let checks = {
        valid: Boolean,
        data: String
    }
    checks.valid = true
    // CHECK ROLE
    if (dip.ruolo != ruoli.PANETTIERE && dip.ruolo != ruoli.SPEDIZIONIERE) {
        checks.data = "ruolo"
        checks.valid = false
    }
    // CHECK FIELD NAME
    if (dip.nome.length <= 2) {
        checks.data = "nome"
        checks.valid = false
    }
    // CHECK FIELD EMAIL
    if (!validator.isEmail(dip.email)) {
        checks.data = "email"
        checks.valid = false
    }
    // CHECK FIELD TELEFONO
    if (validator.isEmpty(dip.telefono)) {
        checks.data = "telefono"
        checks.valid = false
    }
    // CHECK ORARIO



    return checks

}

// Check if email is already in the system
function check_duplicate(dip) {

    return Utente.find({ email: dip.email }).then((dip) => {
        if (!dip.length) {
            return false
        } else {
            return true
        }
    })
}
// ADD GET DIPENDENTI
router.get('', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        Dipendente.find().select("_id ruolo nome email telefono orario")
            .then((prod) => {
                return res.status(200).json(prod)
            })
    } else {
        return res.status(401).send('Accesso non autorizzato');
    }
})
// ADD NEW DIPENDENTE
router.post('', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        const { nome, email, telefono, orario, ruolo } = req.body

        let dipendente = new Dipendente({
            nome,
            email,
            telefono,
            orario,
            ruolo
        });

        check_duplicate(dipendente).then((duplicate) => {
            if (duplicate) {
                res.status(400).send("Dipendente gia presente");
                return;
            }
            let check = check_fields(dipendente)
            if (!check.valid) {
                res.status(400).send(`Campo [${check.data}] non valido`);
            } else {
                auth.register(dipendente)
                    .then((dip) => {
                        res.status(201).send(dip);
                    })
                    .catch((err) => {
                        res.status(400).send(err);
                    })
            }
        })
    } else {
        return res.status(401).send('Accesso non autorizzato');
    }
});

// DELETE DIPENDENTE
router.delete('/:id', async (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        const _id = req.params.id
        let dipendente = await Dipendente.findById(_id).exec();
        if (!dipendente) {
            res.status(404).send();
            console.log("Dipendente Non Presente")
            return;
        }
        try {
            await dipendente.deleteOne()
            res.status(200).send("Dipendente rimosso");
        } catch {
            res.status(400).send("Errore durante la rimozione");
        }
    } else {
        return res.status(401).send('Accesso non autorizzato');
    }
});


//UPDATE DATA RIVENDITORE
router.patch('', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        const { _id, nome, email, telefono, ruolo, orario } = req.body

        let dipendente = new Dipendente({
            nome,
            email,
            telefono,
            ruolo,
            orario

        });
        let check = check_fields(dipendente)
        if (!check.valid) {
            res.status(400).send(`Campo [${check.data}] non valido`);
        } else {
            Dipendente.findOneAndUpdate({
                "_id": _id
            }, {
                $set: { "nome": dipendente.nome, "email": dipendente.email, "telefono": dipendente.telefono, "ruolo": dipendente.ruolo, "orario": dipendente.orario }
            })
                .then(() => {
                    res.status(200).send("Dipendente modificato con successo")
                    return;
                }).catch(() => {
                    res.status(404).send('Dipendente non trovato')
                    return;
                })
        }
    } else {
        return res.status(401).send('Accesso non autorizzato');
    }
});


module.exports = router;
