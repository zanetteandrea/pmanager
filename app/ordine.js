const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/rivenditore'); // get our mongoose model
const ruoli = require('./models/ruoli');
const Ordine = require('./models/Ordine');
const Prodotto = require('./models/prodotto');

/**
 * @swagger
 * /Ordine:
 *   get:
 *     summary: Ritorna tutti gli Ordini presenti nel sistema in formato json se AMM altrimenti solo i propri Ordini
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *     responses:
 *       200:
 *        description: Ordini
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               description: generalità del rivenditore
 *               example: [{"_id": "6284eb9ac1e5c03bd845a60a", "dataCreazione": "18781478917419", "dataConsegna": "198934791734197", "idRivenditore": "nwc78adcbjkas3b324","modificabile": true, "prodotti": [{"id": "abdui89d8asb4b","prezzo": 5, "quantita": 3}]}]        
 *       404:
 *        description: Non sono presenti ordini
 *       401:
 *        description: Non autorizzato
 *   post:
 *     summary: Crea un nuovo Ordine
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
 *               dataConsegna:
 *                 type: Object
 *                 description: date di consegna ordini.
 *                 example: ["192383897319","208345897319","238345897319"]
 *               prodotti:
 *                 type: Object
 *                 description: prodotti ordinati.
 *                 example: [{"id": "akjnsa78dabj344","quantita": 4}, { "id": "jansnd7asdbh4h","quantita": 3}]
 *     responses:
 *       201:
 *         description: Ordine creato con successo
 *       400:
 *         description: Dati dell'Ordine inseriti non validi o ordine già presente / Nessun prodotto selezionato per l'ordine / Presente un ordine con stessa data / Fuori orario limite
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Prodotto non ordinabile
 *       404:
 *         description: Rivenditore non trovato
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
 *                 description: id dell'Ordine
 *                 example: 6284a31ef6e9638dcb7985e1
 *               prodotti:
 *                 type: Object
 *                 description: catalogo di prodotti ordinabili dal Rivenditore.
 *                 example: [{"id": "akjnsa78dabj344","quantita": 4}, { "id": "jansnd7asdbh4h","quantita": 3}]
 *     responses:
 *       200:
 *         description: Ordine modificato con successo
 *       400:
 *         description: Dati inseriti non validi o fuori orario limite
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Ordine non modificabile perchè appartenente ad un altro rivenditore / Prodotto non ordinabile
 *       404:
 *         description: Ordine non trovato / Rivenditore non trovato
 * /Ordine/:id:
 *   delete:
 *      summary: Eliminazione Ordine
 *      paths:
 *         /rivenditore/{id}
 *      parameters:
 *       - in: path
 *         name: id
 *         description: id dell'ordine da eliminare
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *      schema:
 *         type: String
 *      responses:
 *         204:
 *           description: Ordine rimosso dal sistema
 *         400:
 *           description: Errore durante la rimozione / ordine non cancellabile perchè fuori orario limite
 *         401:
 *           description: Non autorizzato
 *         404:
 *           description: Ordine non presente
 * /Ordine/spedizione:
 *   get:
 *     summary: Ritorna i dati per la preparazione della spedizione degli ordini giornalieri
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *     responses:
 *       200:
 *        description: Dati Spedizione
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               description: dati e prodotti dei rivenditori 
 *               example: [{"nome": "Poli","email": "poli@info.it", "telefono": 345987382743, "Prodotti": [{"nome": "Tartaruga","quantita": 10}, {"nome": "Rosette","quantita": 5,}]},{"nome": "Coop","email": "coop@info.it", "telefono": 3338749813, "Prodotti": [{"nome": "Focacce","quantita": 7}, {"nome": "Rosette","quantita": 5,}]} ] 
 *       400:
 *         description: Errore durante il recupero dei dati di spedizione
 *       401:
 *        description: Non autorizzato
 * /Ordine/produzione:
 *   get:
 *     summary: Ritorna i dati per la produzione giornaliera
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: token per effettuare l'accesso controllato
 *     responses:
 *       200:
 *        description: Dati Produzione
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               description: ingredienti e prodotti 
 *               example: [{"nome": "Tartaruga","quantita": 5,  "Ingredienti": [{"nome": "Farina","quantita": 500, "udm" : Gr}, {"nome": "Acqua","quantita": 250, "udm" : ml}]}] 
 *       400:
 *         description: Errore durante il recupero dei dati di produzione   
 *       401:
 *        description: Non autorizzato    
*/

let exit = false

function check_delivery(dataConsegna) {
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    const diffInTime = new Date(Number(dataConsegna)).getTime() - tomorrow.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    const opt = { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' }
    if (diffInTime >= 0) {
        if (diffInTime >= oneDay) {
            // Ordine tra più di 1 giorno
            return true
        } else {
            // Ordine per domani - controllo se adesso sono oltre l'orario limite
            let res = new Date().toLocaleTimeString("it-IT", opt) < "20:00"
            return res
        }
    } else {
        // Ordine passato
        return false
    }
}

function calc_totale(prodotti) {
    let tot = 0
    prodotti.forEach((p) => {
        tot += p.prezzo * p.quantita
    })
    return tot.toFixed(2)
}


router.post('', async (req, res) => {

    exit = false

    if (req.auth.ruolo == ruoli.RIVENDITORE) {

        const { dataConsegna, prodotti } = req.body

        //Deve essere inserito almeno un prodotto per ordine
        if (!prodotti.length && Array.isArray(prodotti)) {
            res.status(400).send("Nessun prodotto selezionato")
            return;
        }

        //Check se un prodotto o una data è stato inserita più volte
        let temp = []
        prodotti.forEach((p) => {
            temp.push(p.id)
        })
        let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
        if (findDuplicates(temp).length >= 1) {
            res.status(400).send(`Prodotto: [${findDuplicates(temp)}] inserito più volte`)
            return;
        }
        if (findDuplicates(dataConsegna).length >= 1) {
            res.status(400).send(`Stessa data inserita più volte`)
            return;
        }


        let tempord = await Ordine.find({ "rivenditore.id": req.auth.id })
        //check se non sono presenti ordini con la stessa data
        //ciclo ogni data inserita nell'ordine
        dataConsegna.forEach((data) => {
            if (!exit) {
                //ciclo tutti gli ordini per cercare se uno ha la stessa data di consegna di una insertita nell'ordine
                let options = { year: 'numeric', month: 'numeric', day: 'numeric' }
                tempord.forEach((o) => {
                    if (!exit) {
                        if (new Date(Number(o.dataConsegna)).toLocaleDateString('it-IT', options) == new Date(Number(data)).toLocaleDateString('it-IT', options)) {
                            exit = true
                        }
                    }
                })
            }
        })
        if (exit) {
            res.status(400).send("Presente un ordine con stessa data")
            return;
        }

        //Un ordine per il giorno successivo non può essere creato oltre le ore 20:00 
        //caso di ordine ricorrente, check su tutte le date inserite
        dataConsegna.forEach((data) => {
            if (!exit) {
                if (!check_delivery(data)) {
                    let options = { year: 'numeric', month: 'long', day: 'numeric' }
                    res.status(400).send(`Data ${new Date(Number(data)).toLocaleDateString('it-IT', options)} non valida`)
                    exit = true
                }
            }
        })

        const listaIdProd = []

        //Check se i prodotti ordinati sono presenti a catalogo del rivenditore
        if (!exit) {
            Rivenditore.findById(req.auth.id)
                .then((riv) => {
                    const catalogoRiv = riv.catalogo
                    catalogoRiv.forEach(c => {
                        listaIdProd.push(c.id)
                    })

                    Promise.all(
                        prodotti.map(prod => {
                            return Prodotto.findById(prod.id).select("nome")
                                .then(({ nome }) => {
                                    return {
                                        id: prod.id,
                                        prezzo: catalogoRiv.find(p => p.id === prod.id).prezzo,
                                        quantita: prod.quantita,
                                        nome
                                    }
                                })
                        })
                    )
                        .then((prodottiOrdinabili) => {
                            // Creazione ordine singolo o multiplo in base a quante date il rivenditore ha selezionato
                            const now = new Date()
                            const nowMilliseconds = now.getTime()
                            Promise.all(
                                dataConsegna.map(data => {
                                    let ordine = new Ordine({
                                        dataCreazione: nowMilliseconds,
                                        dataConsegna: parseInt(data),
                                        rivenditore: {
                                            id: riv._id,
                                            nome: riv.nome,
                                            email: riv.email,
                                            telefono: riv.telefono,
                                            indirizzo: riv.indirizzo
                                        },
                                        prodotti: prodottiOrdinabili
                                    });

                                    return ordine.save()
                                        .then((ord) => ord)
                                        .catch(() => {
                                            res.status(400).send("Errore durante la creazione dell'ordine")
                                            return;
                                        })
                                })
                            ).then((ordini) => {
                                const arrOrd = []
                                ordini.forEach((ord) => {
                                    let obj = ord.toObject()
                                    delete obj.rivenditore
                                    obj.modificabile = check_delivery(ord.dataConsegna)
                                    obj.totale = calc_totale(ord.prodotti)
                                    arrOrd.push(obj)
                                })
                                res.status(200).json(arrOrd)
                            })
                        })
                        .catch((err) => {
                            res.status(403).send(err)
                            exit = true
                        })
                })
                .catch(() => {
                    res.status(404).send('Rivenditore non trovato')
                })
        }
    } else {
        res.status(401).send('Non autorizzato')
        return;
    }

})

router.get('', (req, res) => {

    const arrOrd = []
    exit = false

    // se ruolo RIVENDITORE recupero tutti gli ordini da lui inseriti a sistemi
    if (req.auth.ruolo == ruoli.RIVENDITORE) {

        Ordine.find({ "rivenditore.id": req.auth.id }).select("_id dataCreazione dataConsegna prodotti")
            .then((ordini) => {
                ordini.forEach((ord) => {
                    let obj = ord.toObject()
                    obj.modificabile = check_delivery(ord.dataConsegna)
                    obj.totale = calc_totale(ord.prodotti)
                    arrOrd.push(obj)
                })
                res.status(200).json(arrOrd)
                return
            })
            .catch(() => {
                res.status(404).send('Errore GET ordini')
                return
            })

        // se ruolo AMM recupero tutti gli ordini presenti a sistemi
    } else if (req.auth.ruolo == ruoli.AMM) {
        Ordine.find({}).select("_id dataCreazione dataConsegna prodotti rivenditore")
            .then((ordini) => {
                ordini.forEach((ord) => {
                    let obj = ord.toObject()
                    obj.totale = calc_totale(ord.prodotti)
                    arrOrd.push(obj)
                })
                res.status(200).json(arrOrd)
                return
            })
            .catch(() => {
                res.status(404).send('Errore GET ordini')
                return
            })
    } else {
        res.status(401).send("Non autorizzato")
        return;
    }
})


router.patch('', async (req, res) => {

    const { _id, prodotti } = req.body
    const listaIdProd = []
    exit = false

    if (req.auth.ruolo == ruoli.RIVENDITORE) {

        let ordine = await Ordine.findById(_id).exec()

        //check se l'ordine esiste
        if (!ordine) {
            res.status(404).send(`Ordine: ${_id} non trovato`)
            return;
        }
        //check se la data di consegna dell'ordine già inserito è nel limite temporale consentito per la modifica
        if (!check_delivery(ordine.dataConsegna)) {
            res.status(400).send("Ordine non modificabile dopo le ore 20:00 del giorno precedente alla consegna")
            return;
        }
        //check se si sta cercando di modificare l'ordine appartenente ad un altro rivenditore
        if (ordine.rivenditore.id != req.auth.id) {
            res.status(403).send("Ordine non modificabile perchè appartenente ad un altro utente")
            return;
        }
        //check se è stato inserito almeno un prodotto per l'ordine
        if (!prodotti.length && Array.isArray(prodotti)) {
            res.status(400).send("Nessun prodotto selezionato")
            return;
        }

        //Check se i prodotti ordinati sono presenti a catalogo del rivenditore
        Rivenditore.findById(req.auth.id)
            .then((riv) => {
                const catalogoRiv = riv.catalogo
                catalogoRiv.forEach(c => {
                    listaIdProd.push(c.id)
                })

                // Recupero dei prezzi personalizzati per il rivenditore
                Promise.all(
                    prodotti.map(prod => {
                        return Prodotto.findById(prod.id).select("nome")
                            .then(({ nome }) => {
                                // Mantengo fissi i prezzi dei prodotti già selezionati al momento della creazione dell'ordine
                                let index = ordine.prodotti.findIndex((p) => p.id === prod.id)
                                let prezzo
                                if (index >= 0) {
                                    prezzo = ordine.prodotti[index].prezzo
                                } else {
                                    prezzo = catalogoRiv.find(p => p.id === prod.id).prezzo
                                }
                                return {
                                    id: prod.id,
                                    prezzo,
                                    quantita: prod.quantita,
                                    nome
                                }
                            })
                    })
                )
                    .then((prodottiOrdinabili) => {
                        // Aggiornamento dati ordine
                        Ordine.findOneAndUpdate({
                            "_id": _id
                        }, {
                            $set: { "prodotti": prodottiOrdinabili }
                        },
                            { new: true })
                            .then((ord) => {
                                let obj = ord.toObject()
                                delete obj.rivenditore
                                obj.modificabile = check_delivery(ord.dataConsegna)
                                obj.totale = calc_totale(ord.prodotti)
                                res.status(200).send(obj)
                                return
                            }).catch(() => {
                                res.status(400).send('Errore durante la modifica')
                                return
                            })
                    })
                    .catch(() => {
                        res.status(400).send('Inserito prodotto non ordinabile')
                        return
                    })
            })
            .catch(() => {
                res.status(404).send('Rivenditore non trovato')
                return
            })
    } else {
        res.status(401).send("Non Autorizzato")
        return
    }
});

router.delete('/:id', async (req, res) => {

    const id = req.params.id
    if (req.auth.ruolo == ruoli.RIVENDITORE) {
        let ordine = await Ordine.findById(id).exec();

        if (!ordine) {
            res.status(404).send("Ordine non presente");
            return;
        }
        if (ordine.rivenditore.id != req.auth.id) {
            res.status(401).send("Ordine non cancellabile perchè appartenente ad un altro utente");
            return;
        }
        //check se la data di consegna non è oltre il limite per la cancellazione dell'ordine
        if (!check_delivery(ordine.dataConsegna)) {
            res.status(400).send("Ordine non cancellabile dopo le ore 20:00 del giorno precedente alla consegna")
            return;
        }
        try {
            await ordine.deleteOne()
            res.status(204).send();
        } catch {
            res.status(400).send("Errore durante la cancellazione");
        }
    } else {
        res.status(401).send("Non autorizzato")
        return;
    }
});


router.get('/spedizioni', async (req, res) => {
    let spedizioniGiornaliere = []
    let ordiniGiornalieri = []

    exit = false
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' }
    const todayDate = new Date().toLocaleDateString('it-IT', options)

    //recupero tutti gli ordini da spedire per la giornata corrente
    try {
        if (req.auth.ruolo == ruoli.SPEDIZIONIERE) {

            let ordini = await Ordine.find({})
            ordini.forEach((ord) => {
                if (new Date(Number(ord.dataConsegna)).toLocaleDateString('it-IT', options) == todayDate) {
                    ordiniGiornalieri.push(ord)
                }
            })
            for (let i = 0; i < ordiniGiornalieri.length; i++) {

                let riv = await Rivenditore.findById(ordiniGiornalieri[i].rivenditore.id)
                let temp = {}
                temp.id = ordiniGiornalieri[i].id
                temp.nome = riv.nome
                temp.email = riv.email
                temp.telefono = riv.telefono
                temp.indirizzo = riv.indirizzo
                temp.prodotti = []
                for (let j = 0; j < ordiniGiornalieri[i].prodotti.length; j++) {
                    let tmpProd = {}
                    tmpProd.nome = ordiniGiornalieri[i].prodotti[j].nome
                    tmpProd.quantita = ordiniGiornalieri[i].prodotti[j].quantita
                    temp.prodotti.push(tmpProd)
                }
                spedizioniGiornaliere.push(temp)

            }
            res.status(200).json(spedizioniGiornaliere)
        } else {
            res.status(401).send("Non autorizzato")
            return;
        }
    } catch {
        res.status(400).send("Errore durante generazione spedizioni")
    }

});

router.get('/produzione', async (req, res) => {
    let ordiniGiornalieri = []
    let prodGiornaliera = []

    exit = false
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' }
    const todayDate = new Date().toLocaleDateString('it-IT', options)

    try {
        if (req.auth.ruolo == ruoli.PANETTIERE) {

            let ordini = await Ordine.find({})
            ordini.forEach((ord) => {
                if (new Date(Number(ord.dataConsegna)).toLocaleDateString('it-IT', options) == todayDate) {
                    ordiniGiornalieri.push(ord)
                }
            })
            for (let i = 0; i < ordiniGiornalieri.length; i++) {
                for (let j = 0; j < ordiniGiornalieri[i].prodotti.length; j++) {
                    let tmpProd = {}
                    let p = await Prodotto.findById(ordiniGiornalieri[i].prodotti[j].id)

                    if (!prodGiornaliera.find((obj) => { return p.nome == obj.nome })) {
                        tmpProd.nome = p.nome
                        tmpProd.quantita = ordiniGiornalieri[i].prodotti[j].quantita
                        tmpProd.ingredienti = p.ingredienti
                        prodGiornaliera.push(tmpProd)
                    } else {
                        prodGiornaliera.find((obj) => {
                            if (p.nome === obj.nome) {
                                obj.quantita = obj.quantita + ordiniGiornalieri[i].prodotti[j].quantita
                                return true;
                            }
                        })
                    }
                }
            }

            for (let i = 0; i < prodGiornaliera.length; i++) {
                for (let j = 0; j < prodGiornaliera[i].ingredienti.length; j++) {
                    prodGiornaliera[i].ingredienti[j].quantita = prodGiornaliera[i].ingredienti[j].quantita * prodGiornaliera[i].quantita
                }
            }
            res.status(200).json(prodGiornaliera)
        } else {
            res.status(401).send("Non autorizzato")
            return;
        }
    } catch {
        res.status(400).send("Errore durante generazione produzione")
    }

});

router.get('/statistiche', (req, res) => {
    if (req.auth.ruolo == ruoli.AMM) {
        let tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        // Query prodotti più venduti
        let queryBestSeller = Ordine.aggregate([
            {
                '$match': {
                    'dataConsegna': {
                        '$lte': tomorrow.getTime()
                    }
                }
            },
            {
                '$unwind': {
                    'path': '$prodotti'
                }
            },
            {
                '$lookup': {
                    'from': Prodotto.collection.name,
                    'let': { 'id': { "$toObjectId": "$prodotti.id" } },
                    'pipeline': [{ '$match': { '$expr': { '$eq': ["$_id", "$$id"] } } }],
                    'as': 'prodData'
                }
            },
            {
                '$unwind': '$prodData'
            },
            {
                '$group': {
                    '_id': '$prodData.nome',
                    'totale': {
                        '$sum': '$prodotti.quantita'
                    }
                }
            },
            {
                '$sort': {
                    'totale': -1
                }
            },
            {
                '$limit': 6
            }
        ])
        // Query guadagni
        let queryRevenues = Ordine.aggregate([
            {
                '$match': {
                    'dataConsegna': {
                        '$lte': tomorrow.getTime()
                    }
                }
            },
            {
                '$unwind': {
                    'path': '$prodotti'
                }
            },
            {
                '$group': {
                    '_id': { '$toDate': '$dataConsegna' },
                    'totale': {
                        "$sum": {
                            "$multiply": ["$prodotti.prezzo", "$prodotti.quantita"]
                        }
                    }
                }
            },
            {
                '$sort': {
                    "_id": 1
                }
            },
            {
                '$limit': 6
            }
        ])
        // Query # ordini
        let queryNumOrders = Ordine.aggregate([
            {
                '$match': {
                    'dataConsegna': {
                        '$lte': tomorrow.getTime()
                    }
                }
            },
            {
                '$group': {
                    '_id': { '$toDate': '$dataConsegna' },
                    'totale': { "$sum": 1 }
                }
            },
            {
                '$sort': {
                    "_id": 1
                }
            },
            {
                '$limit': 6
            }
        ])
        Promise.all([queryBestSeller, queryNumOrders, queryRevenues])
            .then(([bestSeller, numOrders, revenues]) => {
                let stats = {
                    bestSeller,
                    numOrders,
                    revenues
                }
                return res.status(200).send(stats)
            })
            .catch((error) => {
                return res.status(401).send(error.message)
            })
    } else {
        return res.status(401).send("Accesso non autorizzato")
    }
})

module.exports = router;