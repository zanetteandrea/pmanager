const express = require('express')
const router = express.Router()
const Prodotto = require('./models/prodotto') // get our mongoose model
const ruoli = require("./models/ruoli")
const multer = require('multer')
var validator = require('validator')

/**
 * @swagger
 * /prodotti:
 *   get:
 *     summary: Ritorna tutti i prodotti presenti nel sistema in formato json
 *     responses:
 *       200:
 *         description: Prodotti ricevuti
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                description: ingredienti del prodotto
 *                example: {"_id": "6284eb9ac1e5c03bd845a60a", "nome": "pane2", "ingredienti": [{"nome": "farina","quantita": 300,"udm": "gr","_id": "6284eb9ac1e5c03bd845a60b"}], "prezzo": 1.3, "foto": "/images/mantovana.jpg"} 
 * 
 *   post:
 *     summary: Crea un nuovo prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               "nome":
 *                 type: string
 *                 description: Nome del prodotto.
 *                 example: "Mantovana"
 *               "ingredienti":
 *                 type: array
 *                 description: Array degli ingredienti del prodotto.
 *                 example: [{"nome": "acqua", "quantita": 1, "udm": "L"}]
 *               "prezzo":
 *                 type: float
 *                 description: Prezzo del prodotto.
 *                 example: 1.3
 *               "foto":
 *                 type: object
 *                 description: Foto del prodotto
 *     responses:
 *       201:
 *         description: Prodotto creato con successo
 *       400:
 *         description: Dati del prodotto inseriti non validi
 * 
 *   delete:
 *     summary: Elimina un prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               "id":
 *                 type: object
 *                 description: id del prodotto
 *                 example: "6284a31ef6e9638dcb7985e1"
 *     responses:
 *       204:
 *         description: Prodotto rimosso dal sistema
 *       400:
 *         description: Id del prodotto inserito non valido
 *       404:
 *         description: Prodotto non trovato
 * 
 *   patch:
 *     summary: Modifica un prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               "id":
 *                 type: object
 *                 description: id del prodotto
 *                 example: "6284a31ef6e9638dcb7985e1"
 *               "nome":
 *                 type: string
 *                 description: nome del prodotto
 *                 example: "Mantovana"
 *               "ingredienti":
 *                 type: array
 *                 description: ingredienti del prodotto
 *                 example: {"nome": "acqua", "quantita": 1, "udm": "L"}
 *               "prezzo":
 *                 type: float
 *                 description: prezzo del prodotto
 *                 example: 1.5
 *               "foto":
 *                 type: object
 *                 description: Foto del prodotto
 *     responses:
 *       200:
 *         description: Prodotto modificato con successo
 *       400:
 *         description: Dati inseriti non validi
 *       404:
 *         description: Prodotto non trovato
*/

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage }).single('file')


//API che ritorna tutti i prodotti presenti nel sistema in formato json
router.get('', (req, res) => {
    //richiesta al db
    Prodotto.find().then((prod) => {
        console.log("Prodotti ricevuti")
        res.status(200).json(prod)
    })
})


//API che permette l'aggiunta di un nuovo prodotto nel sistema
router.post('', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dei dati, se i dati non sono validi restituisco il codice 400
        if (req.body.nome === undefined || validator.isEmpty(req.body.nome) || req.body.nome === null) {
            console.log('Nome del prodotto non valido')
            res.status(400).send('Nome del prodotto non valido')
            return
        }
        if (req.body.ingredienti === undefined || !Array.isArray(req.body.ingredienti) || req.body.ingredienti === null) {
            console.log('Ingredienti del prodotto non validi')
            res.status(400).send('Ingredienti del prodotto non validi')
            return
        }
        if (req.body.prezzo === undefined || isNaN(req.body.prezzo) || req.body.prezzo === null) {
            console.log('Prezzo del prodotto non valido')
            res.status(400).send('Prezzo del prodotto non valido')
            return
        }
        if (req.file === undefined || req.body.foto === null) {
            console.log('Foto del prodotto non valida')
            res.status(400).send('Foto del prodotto non valida')
            return
        }

        //se i dati passati nel body della richiesta sono validi li salvo in alcune variabili
        const { nome, ingredienti, prezzo } = req.body

        upload(req.body.foto, res, (err) => {
            if (err) {
                res.sendStatus(500);
            }
        })

        //creo l'oggetto prodotto
        let prodotto = new Prodotto({
            nome,
            ingredienti,
            prezzo,
            foto
        })

        //salvo il nuovo prodotto nel db
        prodotto = prodotto.save()
            .then(() => {
                //se il salvataggio è andato a buon fine restituisco il codice 201
                console.log('Prodotto salvato con successo')
                res.status(201).send('Prodotto salvato con successo')
            })
            .catch((err) => {
                //se il salvataggio non è andato a buon fine restituisco il codice 400
                console.log("Errore salvataggio nuovo prodotto: " + err)
                res.status(400).send("Errore salvataggio nuovo prodotto: " + err)
            })
    } else {
        res.status(401).send("Unauthorized access")
    }

})


//API per l'eliminazione di un prodotto nel sistema
router.delete('/:id', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {

        //salvo id in una variabile
        const id = req.params.id

        //controllo la validità dell'id, se non è valido ritorno il codice 400
        if (validator.isEmpty(id) || id === null || id === undefined) {
            console.log('Id del prodotto non valido')
            res.status(400).send('Id del prodotto non valido')
            return
        }

        //cerco quel prodotto nel db
        Prodotto.findById(id)
            .then((prodotto) => {
                //se lo trovo, lo elimino
                prodotto.deleteOne()
                    .then(() => {
                        //se l'eliminazione va a buon fine, restituisco il codice 204
                        console.log('Prodotto eliminato con successo')
                        res.status(204).send('Prodotto eliminato con successo')
                    })
                    .catch((err) => {
                        //se l'eliminazione non va a buon fine, restituisco il codice 404
                        console.log('Eliminazione non riuscita: ' + err)
                        res.status(404).send('Eliminazione non riuscita: ' + err)
                    })
            })
            .catch((err) => {
                //se non lo trovo, restituisco il codice 404
                console.log("Prodotto non trovato: " + err)
                res.status(404).send("Prodotto non trovato: " + err)
            })
    }
})


//API per modificare un prodotto presente nel catalogo
router.patch('', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dei dati, se non sono validi restituisco il codice 400
        if (req.body.nome === undefined || validator.isEmpty(req.body.nome) || req.body.nome === null) {
            console.log('Nome del prodotto non valido')
            res.status(400).send('Nome del prodotto non valido')
            return
        }
        if (req.body.ingredienti === undefined || !Array.isArray(req.body.ingredienti) || req.body.ingredienti === null) {
            console.log('Ingredienti del prodotto non validi')
            res.status(400).send('Ingredienti del prodotto non validi')
            return
        }
        if (req.body.prezzo === undefined || isNaN(req.body.prezzo) || req.body.prezzo === null) {
            console.log('Prezzo del prodotto non valido')
            res.status(400).send('Prezzo del prodotto non valido')
            return
        }
        if (req.body.foto === undefined || validator.isEmpty(req.body.foto) || req.body.foto === null) {
            console.log('Foto del prodotto non valida')
            res.status(400).send('Foto del prodotto non valida')
            return
        }

        //se i dati passati nel body della richiesta sono validi li salvo in alcune variabili
        const { id, nome, ingredienti, prezzo, foto } = req.body

        //cerco il prodotto nel db attraverso l'id e quando lo trovo, aggiorno i dati
        Prodotto.findOneAndUpdate({
            "_id": id
        }, {
            $set: { "nome": nome, "ingredienti": ingredienti, "prezzo": prezzo, "foto": foto }
        })
            .then(() => {
                //se va a buon fine, restituisco il codice 200
                console.log('Prodotto modificato con successo')
                res.status(200).send('Prodotto modificato con successo')
            })
            .catch((err) => {
                //se non va a buon fine, restituisco il codice 404
                console.log('Prodotto non trovato: ' + err)
                res.status(404).send('Prodotto non trovato: ' + err)
            })
    }
})

module.exports = router