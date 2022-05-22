const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/Rivenditore'); // get our mongoose model
//const Utente = require('./models/utente'); // get our mongoose model
const validator = require('validator');
//const register = require('./auth')
const auth = require('./auth');
const ruoli = require('./models/ruoli');
const Ordine = require('./models/Ordine');
const Prodotto = require('./models/Prodotto');
const res = require('express/lib/response');
const { get } = require('express/lib/response');
const { parse } = require('dotenv');
/**
 * @swagger
 * /Ordine:
 *   get:
 *     summary: Ritorna tutti gli Ordini presenti nel sistema in formato json se AMM altrimenti solo i propri Ordini
 *     responses:
 *       200:
 *        description: Ordini
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               description: generalità del rivenditore
 *               example: [{"_id": "6284eb9ac1e5c03bd845a60a", "dataCreazione": "18781478917419", "dataConsegna": "198934791734197", "idRivenditore": "nwc78adcbjkas3b324","modificabile": true, "prodotti": [{"id": "abdui89d8asb4b","prezzo": 5, "quantita": 3}]}]        
 * 
 *   post:
 *     summary: Crea un nuovo Ordine
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
 *         description: Tentativo di creazione non autorizzato
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
 *       404:
 *         description: Ordine non trovato
 * /Ordine/:id:
 *   delete:
 *      summary: Eliminazione Ordine
 *      paths:
 *         /rivenditore/{id}
 *      parameters:
 *       - in: path
 *         name: id
 *         description: id dell'ordine da eliminare
 *      schema:
 *         type: String
 *      responses:
 *         204:
 *           description: Ordine rimosso dal sistema
 *         400:
 *           description: Errore durante la rimozione
 *         401:
 *           description: Rimozione non autorizzata
 *         404:
 *           description: Ordine non presente
*/

let exit = false

function check_delivery(dataConsegna) {
    const today = new Date();
    const todayMilliseconds = today.getTime();
    if(dataConsegna-todayMilliseconds <= 86400000){
        if(today.getHours() >= 20 && today.getMinutes() >= 1) {
            return false
        } else return true
    } else return true
}


router.post('', async (req, res) => {
    
    exit = false
    const today = new Date();
    const todayMilliseconds = today.getTime();

    if(req.auth.ruolo == ruoli.RIVENDITORE) {

        const {dataConsegna, prodotti} = req.body

        //Deve essere inserito almeno un prodotto per ordine
        if(!prodotti.length){
            res.status(400).send("nessun prodotto selezionato per l'ordine")
            return;
        }

        //Check se un prodotto o una data è stato inserita più volte
        let temp = []
        prodotti.forEach( (p) => {
            temp.push(p.id)
        })
        let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
        if(findDuplicates(temp).length >= 1) {
            res.status(400).send(`prodotto: [${findDuplicates(temp)}] inserito più volte`)
            return;
        }
        if(findDuplicates(dataConsegna).length >= 1) {
            res.status(400).send(`data: [${new Date(Number(findDuplicates(dataConsegna))).toDateString()}] inserita più volte`)
            return;
        }

        
        let tempord = await Ordine.find( {idRivenditore: req.auth.id })
        //check se non sono presenti ordini con la stessa data
        //ciclo ogni data inserita nell'ordine
        dataConsegna.forEach((data) => {
            if(!exit) {
                //ciclo tutti gli ordini per cercare se uno ha la stessa data di consegna di una insertita nell'ordine
                tempord.forEach((o)=>{
                    if(!exit) {
                        if( new Date(Number(o.dataConsegna)).toDateString() == new Date(Number(data)).toDateString() ){
                            exit = true  
                        }
                    }
                })
            }
        })
        if(exit) {
            res.status(400).send("presente un ordine con stessa data")
            return;
        }

        //Un ordine per il giorno successivo non può essere creato oltre le ore 20:00 
        //caso di ordine ricorrente, check su tutte le date inserite
            dataConsegna.forEach((data) => {
                if(!exit) {
                    //se la data di consegna è entro le 24h
                    if(data-todayMilliseconds <= 86400000) {
                        //scarto le date precedenti al giorno corrente
                        if(data-todayMilliseconds < -222222220) {
                            res.status(400).send(`data: [${new Date(Number(data)).toDateString()}] non valida `)
                            exit = true
                        //il limite per l'inserimento di un ordine per il giorno successivo è entro le ore 20:01
                        } else if(today.getHours() >= 20 && today.getMinutes() >= 1) {
                            res.status(400).send(`fuori orario limite, [${new Date(Number(data)).toLocaleString()}] oltre [${today.toLocaleDateString()}, 20:00] `)
                            exit = true
                        }
                        
                    }
               }
            })

        const listaIdProd = []
        prodottiOrdinabili = []

        //Check se i prodotti ordinati sono presenti a catalogo del rivenditore
        if (!exit) {
            Rivenditore.findById(req.auth.id)
            .then((riv) => {
                const catalogoRiv = riv.catalogo
                catalogoRiv.forEach(c => {
                    listaIdProd.push(c.id)
                })
                
                // Recupero dei prezzi personalizzati per il rivenditore
                prodotti.forEach(prod => {
                    if(!exit) {
                        if(listaIdProd.includes(prod.id)) {
                            prodottiOrdinabili.push({
                                id: prod.id,
                                prezzo: catalogoRiv.find(p => p.id === prod.id).prezzo,
                                quantita: prod.quantita
                            })
                        } else {
                            res.status(403).send(`prodotto: [${prod.id}] non ordinabile`)
                            exit = true
                        }
                    }

                });
                // Creazione ordine singolo o multiplo in base a quante date il rivenditore ha selezionato
                if (!exit) {
                    dataConsegna.forEach ( data => {
                        let ordine = new Ordine({
                            dataCreazione: todayMilliseconds,
                            dataConsegna: parseInt(data),
                            idRivenditore : req.auth.id,
                            prodotti: prodottiOrdinabili
                        });
                        
                        ordine.save()
                            .then(()=>{})
                            .catch(()=>{
                                res.status(400).send("errore durante la creazione dell'ordine")
                                return;
                            })
                    })
                    res.status(201).send("ordine creato con successo")
                }
            })
            .catch(() => {
                res.status(404).send('rivenditore non trovato')

            })
        }
    } else {
        res.status(401).send('operazione non autorizzata')
    }

})

router.get('', (req, res) => {

    let arrOrd = []
    exit = false

    // se ruolo RIVENDITORE recupero tutti gli ordini da lui inseriti a sistemi
    if(req.auth.ruolo == ruoli.RIVENDITORE) {

        Ordine.find({ idRivenditore: req.auth.id })
        
            .then((ord)=> {
                ord.forEach( (o)=> {

                    let temp = {}
                    temp.dataCreazione = o.dataCreazione
                    temp.dataConsegna = o.dataConsegna
                    temp.idRivenditore = o.idRivenditore
                    temp.modificabile = check_delivery(o.dataConsegna)
                    temp.prodotti = o.prodotti
                    arrOrd.push(temp)

                })
                res.status(200).json(arrOrd)
            })
            .catch(()=>{
                res.status(404).send('non sono presenti ordini')
            })

    // se ruolo AMM recupero tutti gli ordini presenti a sistemi
    } else if (req.auth.ruolo == ruoli.AMM) {
        Ordine.find({ })
        
            .then((ord)=> {
                ord.forEach( (o)=> {

                    let temp = {}
                    temp.dataCreazione = o.dataCreazione
                    temp.dataConsegna = o.dataConsegna
                    temp.idRivenditore = o.idRivenditore
                    temp.modificabile = check_delivery(o.dataConsegna)
                    temp.prodotti = o.prodotti
                    arrOrd.push(temp)

                })
                res.status(200).json(arrOrd)
            })
            .catch(()=>{
                res.status(404).send('non sono presenti ordini')
            })
    }
})


router.patch('', async (req, res) => {

    const {idOrdine, dataConsegna, prodotti} = req.body
    const listaIdProd = []
    prodottiOrdinabili = []
    const today = new Date();
    exit = false

    if(req.auth.ruolo == ruoli.RIVENDITORE) {

        let ordine = await Ordine.findById(idOrdine).exec()

        //check se l'ordine esiste
        if(!ordine) {
            res.status(404).send(`Ordine: ${idOrdine} non trovato`)
            return;
        }
        //check se la data di consegna dell'ordine già inserito è nel limite temporale consentito per la modifica
        if(!check_delivery(ordine.dataConsegna)) {
            res.status(401).send("ordine non modificabile perchè quello già presente è fuori limite di tempo per la modifica")
            return;
        } 
        //check se la nuova data di consegna dell'ordine è nel limite temporale consentito
        if(!check_delivery(dataConsegna)) {
            res.status(400).send(`ordine non modificabile perchè la nuova data è fuori dal limite consentito [${new Date(Number(dataConsegna)).toLocaleString()}] oltre [${today.toLocaleDateString()}, 20:00] `)
            return;
        } 
        //check se si sta cercando di modificare l'ordine appartenente ad un altro rivenditore
        if(ordine.idRivenditore != req.auth.id) {
            res.status(400).send("ordine non modificabile perchè appartenente ad un altro rivenditore")
            return;
        }
        //check se è stato inserito almeno un prodotto per l'ordine
        if(!prodotti.length){
            res.status(400).send("nessun prodotto selezionato per l'ordine")
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
                    prodotti.forEach(prod => {
                        if(!exit) {
                            if(listaIdProd.includes(prod.id)) {
                                prodottiOrdinabili.push({
                                    id: prod.id,
                                    prezzo: catalogoRiv.find(p => p.id === prod.id).prezzo,
                                    quantita: prod.quantita
                                })
                            } else {
                                res.status(403).send(`prodotto con id: ${prod.id} non ordinabile`)
                                exit = true
                            }
                        }
                    });

                    //aggiornamento dati ordine
                    if(!exit) {
                        Ordine.findOneAndUpdate({
                                "_id" : idOrdine
                            },{
                                $set: {"dataCreazione": ordine.dataCreazione, "dataConsegna": dataConsegna, "idRivenditore": ordine.idRivenditore, "prodotti": prodottiOrdinabili}
                            })
                            .then(() => {
                                res.status(200).send('Ordine modificato con successo') 
                            }).catch(() => {
                                res.status(400).send('Errore durante la modifica')
                                return;
                            })
                    }
                })
                .catch(() => {
                    res.status(404).send('rivenditore non trovato')

                })
    }
});

router.delete('/:id', async (req, res) => {
   
    const today = new Date();
    const id = req.params.id
    if(req.auth.ruolo == ruoli.AMM || req.auth.ruolo == ruoli.RIVENDITORE) {
        let ordine = await Ordine.findById(id).exec();

        if(ordine.idRivenditore != req.auth.id && req.auth.ruolo == ruoli.RIVENDITORE ){
            res.status(401).send("Eliminazione non autorizzata");
            return;
        }
        if(!ordine) {
            res.status(404).send("Ordine Non Presente");
            return;
        }
        //check se la data di consegna non è oltre il limite per la cancellazione dell'ordine
        if(!check_delivery(ordine.dataConsegna)) {
            res.status(400).send(`ordine non cancellabile superato il limite di orario: data consegna: [${new Date(Number(ordine.dataConsegna)).toLocaleString()}] limite per modifica: [${today.toLocaleDateString()}, 20:00] `)
            return;
        } 
        try{
           // await ordine.deleteOne()
            res.status(200).send('Ordine Cancellato');
        } catch {
            res.status(400).send("Errore durante la rimozione");
        }
    }
});


router.get('/spedizioni', async (req, res) => {
    let produzioneGiornaliera = []
    let ordiniGiornalieri = []
    
    let idRiv;
    exit = false
    const today = new Date();
    const todayDate = today.toDateString();

    //recupero tutti gli ordini da spedire per la giornata corrente
    try {
        if(req.auth.ruolo == ruoli.RIVENDITORE) {

            let ordini = await Ordine.find({})
            ordini.forEach( (ord) => {
                if(new Date(Number(ord.dataConsegna)).toDateString() == todayDate ) {
                    ordiniGiornalieri.push(ord)
                }
            })
            for (let i=0; i<ordiniGiornalieri.length; i++) {

                let riv = await Rivenditore.findById(ordiniGiornalieri[i].idRivenditore)
                let temp = {}
                let p;
                temp.id = ordiniGiornalieri[i].id
                temp.nome = riv.nome
                temp.email = riv.email
                temp.telefono = riv.telefono
                temp.prodotti = []
                for(let j = 0; j<ordiniGiornalieri[i].prodotti.length; j++) {
                    let tmpProd = {}
                    p = await Prodotto.findById(ordiniGiornalieri[i].prodotti[j].id)
                    tmpProd.nome = p.nome
                    tmpProd.quantita = ordiniGiornalieri[i].prodotti[j].quantita
                    temp.prodotti.push(tmpProd)
                }
                produzioneGiornaliera.push(temp)

            }
            res.status(200).json(produzioneGiornaliera)
        }
    } catch {
        res.status(400).send("errore durante il recupero degli ordini")
    }

});

router.get('/produzione', async (req, res) => {
    let produzioneGiornaliera = []
    let ordiniGiornalieri = []
    let prodGiornaliera = []
    
    let idRiv;
    exit = false
    const today = new Date();
    const todayDate = today.toDateString();

    try {
        if(req.auth.ruolo == ruoli.RIVENDITORE) {

            let ordini = await Ordine.find({})
            ordini.forEach( (ord) => {
                if(new Date(Number(ord.dataConsegna)).toDateString() == todayDate ) {
                    ordiniGiornalieri.push(ord)
                }
            })
            for (let i=0; i<ordiniGiornalieri.length; i++) {
                for(let j = 0; j<ordiniGiornalieri[i].prodotti.length; j++) {
                    let tmpProd = {}
                    p = await Prodotto.findById(ordiniGiornalieri[i].prodotti[j].id)

                    if (!prodGiornaliera.find((obj) => { return p.nome == obj.nome})) {
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

            for (let i=0; i<prodGiornaliera.length; i++) {
                for(let j = 0; j<prodGiornaliera[i].ingredienti.length; j++) {
                    prodGiornaliera[i].ingredienti[j].quantita = prodGiornaliera[i].ingredienti[j].quantita * prodGiornaliera[i].quantita
                }
            }
            res.status(200).json(prodGiornaliera)
        }
    } catch {
        res.status(400).send("errore durante il recupero della produzione")
    }

});



module.exports = router;
