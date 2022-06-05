const express = require('express')
const router = express.Router()
const Prodotto = require('./models/prodotto') // get our mongoose model
const ruoli = require("./models/ruoli")
const multer = require('multer')
var validator = require('validator')
const Rivenditore = require('./models/rivenditore')
const Ordine = require('./models/Ordine')
/**
 * @swagger
 * /prodotti:
 *   get:
 *     description: Nel caso in cui la richiesta avvenga da parte dell'AMM, questa API ritorna tutti i prodotti presenti nel sistema. Nel caso in cui il richiedente sia un rivenditore, ritorna tutti i prodotti da lui visibili. In tutti gli altri casi l'accesso a questa API non è autorizzato
 *     summary: Ritorna i prodotti in formato json 
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *     responses:
 *       200:
 *         description: Richiesta evasa con successo, ritorna i prodotti in formato json
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                description: Prodotti nel catalogo con gli ingredienti
 *                example: [{"_id": "6284eb9ac1e5c03bd845a60a", "nome": "pane2", "ingredienti": [{"nome": "farina","quantita": 300,"udm": "gr","_id": "6284eb9ac1e5c03bd845a60b"}], "prezzo": 1.3, "foto": "/images/mantovana.jpg"}] 
 *       401:
 *         description: Accesso non autorizzato
 *       404:
 *         description: Prodotti o rivenditore non presenti nel database
 * 
 *   post:
 *     description: API che permette l'aggiunta di un nuovo prodotto nel sistema. I dati di tale prodotto devono essere passati nel body della richiesta
 *     summary: Crea un nuovo prodotto
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
 *     responses:
 *       201:
 *         description: Prodotto creato con successo
 *       400:
 *         description: Dati del prodotto inseriti non validi
 *       401:
 *         description: Accesso non autorizzato
 * 
 *   patch:
 *     description: API che permette la modifica di un prodotto, il cui id deve essere passato attraverso l'url
 *     summary: Modifica un prodotto
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
 *               "_id":
 *                 type: string
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
 *     responses:
 *       200:
 *         description: Prodotto modificato con successo
 *       400:
 *         description: Dati inseriti non validi
 *       401:
 *         description: Accesso non autorizzato
 *       404:
 *         description: Prodotto non trovato
 *       409:
 *         description: Prodotto già presente con questo nome
 *
 * /prodotti/:id:
 *   post:
 *     description: Salva la foto del prodotto il cui id è passato come parametro nell'url
 *     summary: Salva la foto di un prodotto 
 *     paths: 
 *       /prodotti/{id}
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *       - in: path
 *         name: id
 *         description: L'id del prodotto della foto
 *         required: true
 *         example: "/62876144f494b63071fb3e3b"
 *     schema: 
 *       type: string
 *     requestBody:
 *       required: true
 *       content: 
 *         image/png:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Foto memorizzata con successo
 *       401:
 *         description: Accesso non autorizzato
 *       404:
 *         description: Prodotto non trovato
 *       500:
 *         description: Upload foto fallito
 * 
 * 
 *   delete:
 *     description: API che permette l'eliminazione di un prodotto, il cui id deve essere passato come parametro nell'url
 *     summary: Elimina un prodotto
 *     paths: 
 *       /prodotti/{id}
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *       - in: path
 *         name: id
 *         description: L'id del prodotto da eliminare
 *         required: true
 *         example: "/62876144f494b63071fb3e3b"
 *     schema: 
 *       type: string
 *     responses:
 *       204:
 *         description: Prodotto rimosso dal sistema
 *       400:
 *         description: Id del prodotto inserito non valido
 *       401:
 *         description: Accesso non autorizzato
 *       404:
 *         description: Prodotto non trovato
 *       500:
 *         description: Eliminazione non riuscita
*/


//funzione per controllare la validità dei dati ricevuti
function check_dati(req) {
    var ris = {
        valid: Boolean,
        data: String
    }
    //controllo il nome
    if (req.body.nome === undefined || validator.isEmpty(req.body.nome) || req.body.nome === null) {
        ris.data = "nome"
        ris.valid = false;
    }
    //controllo gli ingredienti
    if (req.body.ingredienti === undefined || !Array.isArray(req.body.ingredienti) || req.body.ingredienti === null) {
        ris.data = "ingredienti"
        ris.valid = false;
    }
    //controllo il prezzo
    if (req.body.prezzo === undefined || isNaN(req.body.prezzo) || req.body.prezzo === null) {
        ris.data = "prezzo"
        ris.valid = false;
    }
    return ris;
}


//funzione per verificare che non si aggiungano prodotti con lo stesso nome
function check_duplicate(req, nomi) {
    let ris = false
    //normalizzo tutti i nomi dei prodotti presenti nel sistema
    for (var i = 0; i < nomi.length; i++) {
        nomi[i] = nomi[i].split(" ").join("")
        nomi[i] = nomi[i].toLowerCase()
    }
    //normalizzo il nome ricevuto nel body della richiesta
    var nuovo = req.body.nome.split(" ").join("")
    nuovo = nuovo.toLowerCase()
    //verifico l'univocità del nome
    nomi.forEach((nome) => {
        if (nuovo == nome) {
            ris = true;
        }
    })
    return ris;
}


//dico dove salvare le immagini e con quale nome
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/images/')
    },
    filename: (req, file, cb) => {
        cb(null, req.params.id + '.png')
    }
})

const upload = multer({ storage: storage })


//API che ritorna tutti i prodotti presenti nel sistema in formato json
router.get('', (req, res) => {
    //controllo che il ruolo passato nella richiesta sia valido, in caso negativo restituisco il codice 401
    if (req.auth.ruolo === undefined || req.auth.ruolo === null || validator.isEmpty(req.auth.ruolo)) {
        res.status(401).send('Ruolo utente non valido')
        return
    }
    //controllo se è stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //richiesta al db
        Prodotto.find().then((prod) => {
            res.status(200).json(prod)
        })
    } else if (req.auth.ruolo == ruoli.RIVENDITORE) { //controllo se è stato un rivenditore a fare la richiesta
        //cerco il rivenditore nel sistema
        Rivenditore.findById(req.auth.id)
            .then((rivenditore) => {
                //se lo trovo, cerco tutti i prodotti visibili da quel rivenditore nel db e gli restituisco con i prezzi personalizzati
                let ids = rivenditore.catalogo.map(elem => elem.id)
                Prodotto.find({ _id: { $in: ids } })
                    .then((listaProdotti) => {
                        listaProdotti.forEach((prod) => {
                            let index = rivenditore.catalogo.findIndex((p) => p.id == prod._id)
                            prod.prezzo = rivenditore.catalogo[index].prezzo
                        })
                        res.status(200).json(listaProdotti)
                    })
                    //se non li trovo, vuol dire che i prodotti non sono presenti nel sistema => restituisco il codice 404
                    .catch((err) => {
                        res.status(404).send('Prodotti non trovati')
                        return
                    })

            })
            .catch((err) => {
                //se non lo trovo, restituisco il codice 404
                res.status(404).send("Rivenditore non trovato: " + err)
            })

    } else { //se non è stato l'AMM e nemmeno un rivenditore a fare la richiesta, l'accesso non è autorizzato
        res.status(401).send("Unauthorized access")
    }
})


//API che permette l'aggiunta di un nuovo prodotto nel sistema
router.post('', async (req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dei dati, se i dati non sono validi restituisco il codice 400
        var ris = check_dati(req)
        if (!ris.valid) {
            res.status(400).send('Campo ' + ris.data + ' non valido')
            return
        }

        //richiedo tutti i prodotti presenti nel database e mappo i nomi in un nuovo array che passo alla funzione check_duplicate
        let prod = await Prodotto.find().exec()
        let nomi = prod.map(elem => elem.nome)
        if (check_duplicate(req, nomi)) {
            res.status(400).send('Esiste già un prodotto con questo nome')
            return
        }

        //se i dati passati nel body della richiesta sono validi li salvo in alcune variabili
        const { nome, ingredienti, prezzo } = req.body

        //creo l'oggetto prodotto
        let prodotto = new Prodotto({
            nome,
            ingredienti,
            prezzo,
            foto: ""
        })

        //salvo il nuovo prodotto nel db
        prodotto = prodotto.save()
            .then((prod) => {
                //se il salvataggio è andato a buon fine restituisco il codice 201
                res.status(201).send(prod)
            })
            .catch((err) => {
                //se il salvataggio non è andato a buon fine restituisco il codice 400
                res.status(400).send("Errore salvataggio nuovo prodotto: " + err)
            })
    } else {
        //se la richiesta viene da utente che non è l'AMM, restituisco il codice 401
        res.status(401).send("Accesso non autorizzato")
    }

})


//API per l'upload della foto del prodotto
router.post("/:id", upload.single('image'), (req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        try {
            //cerco nel db il prodotto il cui id è passato come parametro nel url, se lo trovo modifico il valore del campo 'foto' con il percorso relativo di dove è salvata l'immagine nel server
            Prodotto.findOneAndUpdate({
                "_id": req.params.id
            }, {
                $set: { "foto": "images/" + req.params.id + ".png" }
            })
                .then(() => {
                    //se il documento nel db viene aggiornato con succcesso, ritorno il codice 200
                    res.status(200).send('Immagine salvata con successo')
                })
                .catch(() => {
                    //se non viene trovato un prodotto con quel id, restituisco il codice 404
                    res.status(404).send('Prodotto non trovato')
                })
        } catch (err) {
            //se non riesco a trovare il prodotto, ritorno il codice 500
            return res.status(500).send("Errore salvataggio foto");
        }
    } else {
        res.status(401).send('Accesso non autorizzato')
        return
    }
})


//API per l'eliminazione di un prodotto nel sistema
router.delete('/:id', (req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dell'id, se non è valido ritorno il codice 400
        if (req.params.id === undefined || req.params.id === null || validator.isEmpty(req.params.id)) {
            res.status(400).send('Id del prodotto non valido')
            return
        }

        //se l'id passato nel body della richiesta è valido, lo salvo in una variabile
        const id = req.params.id

        //cerco quel prodotto nel db
        Prodotto.findById(id)
            .then((prodotto) => {
                //se lo trovo, lo elimino
                prodotto.deleteOne()
                    .then(() => {
                        // Elimino il prodotto da tutti gli ordini futuri
                        let today = new Date()
                        today.setHours(0, 0, 0, 0)
                        Ordine.updateMany({ "dataConsegna": { "$gte": today.getTime() } }, { "$pull": { "prodotti": { "id": id } } })
                            .then(() => {
                                // Elimino il prodotto da tutti i cataloghi dei rivenditori
                                Rivenditore.updateMany({}, { "$pull": { "catalogo": { "id": id } } })
                                    .then(() => {
                                        //se l'eliminazione va a buon fine, restituisco il codice 204
                                        res.status(204).send('Eliminazione riuscita')
                                        return
                                    })
                                    .catch((err) => {
                                        //se l'eliminazione non va a buon fine, restituisco il codice 500
                                        res.status(500).send('Eliminazione prodotto dai cataloghi personalizzati non riuscita: ' + err)
                                        return
                                    })
                            })
                            .catch((err) => {
                                //se l'eliminazione non va a buon fine, restituisco il codice 500
                                res.status(500).send('Eliminazione prodotto dagli ordini futuri non riuscita: ' + err)
                                return
                            })
                    })
                    .catch((err) => {
                        //se l'eliminazione non va a buon fine, restituisco il codice 500
                        res.status(500).send('Eliminazione prodotto non riuscita: ' + err)
                        return
                    })
            })
            .catch((err) => {
                //se non lo trovo, restituisco il codice 404
                res.status(404).send("Prodotto non trovato: " + err)
                return
            })
    } else {
        res.status(401).send('Accesso non autorizzato')
        return
    }
})


//API per modificare un prodotto presente nel catalogo
router.patch('', async (req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dei dati, se non sono validi restituisco il codice 400
        var ris = check_dati(req)
        if (!ris.valid) {
            res.status(400).send('Campo ' + ris.data + ' non valido')
            return
        }
        if (req.body._id === undefined || validator.isEmpty(req.body._id) || req.body._id === null) {
            res.status(400).send('Campo _id non valido')
            return
        }

        //richiedo tutti i prodotti presenti nel database e mappo tutti i nomi tranne quello del prodotto di cui si vuole fare la modifica
        //in un nuovo array che passo alla funzione check_duplicate, se esiste già un prodotto con quel nome, restituisco il codice 409
        let prod = await Prodotto.find().exec()
        let nomi = [], index = 0;
        prod.forEach((elem) => {
            if (elem._id != req.body._id) {
                nomi[index] = elem.nome
                index++
            }
        })
        if (check_duplicate(req, nomi)) {
            res.status(409).send('Esiste già un prodotto con questo nome')
            return
        }

        //se i dati passati nel body della richiesta sono validi li salvo in alcune variabili
        const { _id, nome, ingredienti, prezzo } = req.body

        //cerco il prodotto nel db attraverso l'id e quando lo trovo, aggiorno i dati
        Prodotto.findOneAndUpdate({
            "_id": _id
        }, {
            $set: { "nome": nome, "ingredienti": ingredienti, "prezzo": prezzo }
        })
            .then(() => {
                //se va a buon fine, restituisco il codice 200
                res.status(200).send('Prodotto modificato con successo')
                return
            })
            .catch((err) => {
                //se non va a buon fine, restituisco il codice 404
                res.status(404).send('Prodotto non trovato: ' + err)
                return
            })
    } else {
        res.status(401).send('Accesso non autorizzato')
        return
    }
})


module.exports = router