const express = require('express')
const router = express.Router()
const Prodotto = require('./models/Prodotto') // get our mongoose model
const ruoli = require("./models/Ruoli")
const multer = require('multer')
var validator = require('validator')
const Rivenditore = require('./models/Rivenditore')

/**
 * @swagger
 * /prodotti:
 *   get:
 *     summary: Ritorna tutti i prodotti presenti nel sistema, se la richiesta è effettuata dall'AMM, o quelli visibili dal rivenditore che effettua la richiesta in formato json 
 *     responses:
 *       200:
 *         description: Prodotti ricevuti
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                description: ingredienti del prodotto
 *                example: {"_id": "6284eb9ac1e5c03bd845a60a", "nome": "pane2", "ingredienti": [{"nome": "farina","quantita": 300,"udm": "gr","_id": "6284eb9ac1e5c03bd845a60b"}], "prezzo": 1.3, "foto": "/images/mantovana.jpg"} 
 *       400:
 *         description: Ruolo non valido
 *       401:
 *         description: Accesso non autorizzato
 *       404:
 *         description: Prodotto o rivenditore non trovato nel database
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
 *
 * /prodotti/:id:
 *   post:
 *     summary: Salva la foto di un prodotto 
 *     paths: 
 *       /prodotti/{id}
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'id del prodotto della foto
 *         required: true
 *     schema: 
 *       type: string
 *     responses:
 *       200:
 *         description: Foto memorizzata con successo
 *       404:
 *         description: Prodotto non trovato
 *       500:
 *         description: Upload foto fallito
 * 
 * 
 * /prodotti/id:
 *   delete:
 *     summary: Elimina un prodotto
 *     paths: 
 *       /prodotti/{id}
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'id del prodotto da eliminare
 *         required: true
 *     schema: 
 *       type: string
 *     responses:
 *       204:
 *         description: Prodotto rimosso dal sistema
 *       400:
 *         description: Id del prodotto inserito non valido
 *       404:
 *         description: Prodotto non trovato
*/


//funzione per controllare la validità dei dati ricevuti
function check_dati(req){
    var ris = {
        valid: Boolean,
        data: String
    }
    //controllo il nome
    if (req.body.nome === undefined || validator.isEmpty(req.body.nome) || req.body.nome === null) {
        console.log('Nome del prodotto non valido')
        ris.data = "nome"
        ris.valid = false;
    }
    //controllo gli ingredienti
    if (req.body.ingredienti === undefined || !Array.isArray(req.body.ingredienti) || req.body.ingredienti === null) {
        console.log('Ingredienti del prodotto non validi')
        ris.data = "ingredienti"
        ris.valid = false;
    }
    //controllo il prezzo
    if (req.body.prezzo === undefined || isNaN(req.body.prezzo) || req.body.prezzo === null) {
        console.log('Prezzo del prodotto non valido')
        ris.data = "prezzo"
        ris.valid = false;
    }
    return ris;
}


//funzione per verificare che non si aggiungano prodotti con lo stesso nome
function check_duplicate(req, nomi){
    let ris = false
    //normalizzo tutti i nomi dei prodotti presenti nel sistema
    for(var i=0;i<nomi.length;i++){
        nomi[i] = nomi[i].split(" ").join("")
        nomi[i] = nomi[i].toLowerCase()
    }
    //normalizzo il nome ricevuto nel body della richiesta
    var nuovo = req.body.nome.split(" ").join("")
    nuovo = nuovo.toLowerCase()
    //verifico l'univocità del nome
    nomi.forEach((nome) => {
        if(nuovo == nome){
            ris = true;  
        }
    })
    return ris;
}


//dico dove salvare le immagini e con quale nome
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/')
    },
    filename: (req, file, cb) => {
        cb(null, req.params.id+'.png')
    }
})

const upload = multer({ storage: storage })


//API che ritorna tutti i prodotti presenti nel sistema in formato json
router.get('', (req, res) => {
    //controllo che il ruolo passato nella richiesta sia valido, in caso negativo restituisco il codice 400
    if (req.auth.ruolo === undefined || req.auth.ruolo === null || validator.isEmpty(req.auth.ruolo)) {
        console.log('Ruolo utente non valido')
        res.status(400).send('Ruolo utente non valido')
        return
    }
    //controllo se è stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //richiesta al db
        Prodotto.find().then((prod) => {
            console.log("Prodotti ricevuti")
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
                        console.log('Prodotti non trovati')
                        res.status(404).send('Prodotti non trovati')
                        return
                    })

            })
            .catch((err) => {
                //se non lo trovo, restituisco il codice 404
                console.log("Rivenditore non trovato: " + err)
                res.status(404).send("Rivenditore non trovato: " + err)
            })

    } else { //se non è stato l'AMM e nemmeno un rivenditore a fare la richiesta, l'accesso non è autorizzato
        res.status(401).send("Unauthorized access")
    }
})


//API che permette l'aggiunta di un nuovo prodotto nel sistema
router.post('', async(req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dei dati, se i dati non sono validi restituisco il codice 400
        var ris = check_dati(req)
        if(!ris.valid){
            res.status(400).send('Campo ' + ris.data + ' non valido')
            return
        }

        //richiedo tutti i prodotti presenti nel database e mappo i nomi in un nuovo array che passo alla funzione check_duplicate
        let prod = await Prodotto.find().exec()
        let nomi = prod.map(elem => elem.nome)
        if(check_duplicate(req,nomi)){
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
                console.log("Errore salvataggio nuovo prodotto: " + err)
                res.status(400).send("Errore salvataggio nuovo prodotto: " + err)
            })
    } else {
        //se la richiesta viene da utente che non è l'AMM, restituisco il codice 401
        res.status(401).send("Unauthorized access")
    }

})


//API per l'upload della foto del prodotto
router.post("/:id", upload.single('image'), (req, res) => {
    try {
        //cerco nel db il prodotto il cui id è passato come parametro nel url, se lo trovo modifico il valore del campo 'foto' con il percorso relativo di dove è salvata l'immagine nel server
        Prodotto.findOneAndUpdate({
            "_id": req.params.id
        }, {
            $set: { "foto": "images/" + req.params.id + ".png" }
        })
            .then(() => {
                res.status(200).send('Immagine salvata con successo')
            })
            .catch(() => {
                res.status(404).send('Prodotto non trovato')
            })
    } catch (err) {
        //se non riesco a trovare il prodotto, ritorno il codice 404
        return res.status(500).send("Errore salvataggio foto");
    }
})


//API per l'eliminazione di un prodotto nel sistema
router.delete('/:id', (req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dell'id, se non è valido ritorno il codice 400
        if (req.params.id === undefined || req.params.id === null || validator.isEmpty(req.params.id)) {
            console.log('Id del prodotto non valido')
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
                        //se l'eliminazione va a buon fine, restituisco il codice 204
                        console.log('Prodotto eliminato con successo')
                        res.status(204).send('Prodotto eliminato con successo')
                        return
                    })
                    .catch((err) => {
                        //se l'eliminazione non va a buon fine, restituisco il codice 404
                        console.log('Eliminazione non riuscita: ' + err)
                        res.status(404).send('Eliminazione non riuscita: ' + err)
                        return
                    })
            })
            .catch((err) => {
                //se non lo trovo, restituisco il codice 404
                console.log("Prodotto non trovato: " + err)
                res.status(404).send("Prodotto non trovato: " + err)
                return
            })
    }
})


//API per modificare un prodotto presente nel catalogo
router.patch('', async(req, res) => {
    //controllo che sia stato l'AMM a fare la richiesta
    if (req.auth.ruolo == ruoli.AMM) {
        //controllo la validità dei dati, se non sono validi restituisco il codice 400
        var ris = check_dati(req)
        if(!ris.valid){
            res.status(400).send('Campo ' + ris.data + ' non valido')
            return
        }

        //richiedo tutti i prodotti presenti nel database e mappo tutti i nomi tranne quello del prodotto di cui si vuole fare la modifica
        //in un nuovo array che passo alla funzione check_duplicate
        let prod = await Prodotto.find().exec()
        let nomi = [], index = 0;
        prod.forEach((elem)=>{
            if(elem._id != req.body._id){
                nomi[index] = elem.nome
                index++
            }
        })
        if(check_duplicate(req, nomi)){
            res.status(400).send('Esiste già un prodotto con questo nome')
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
                console.log('Prodotto modificato con successo')
                res.status(200).send('Prodotto modificato con successo')
                return
            })
            .catch((err) => {
                //se non va a buon fine, restituisco il codice 404
                console.log('Prodotto non trovato: ' + err)
                res.status(404).send('Prodotto non trovato: ' + err)
                return
            })
    }
})


module.exports = router