const express = require('express');
const router = express.Router();
const Prodotto = require('./models/prodotto'); // get our mongoose model
var validator = require('validator');
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
 *                example: {"_id": "6284eb9ac1e5c03bd845a60a", "nome": "pane2", "ingredienti": [{"nome": "farina","quantita": 300,"udm": "gr","_id": "6284eb9ac1e5c03bd845a60b"}]} 
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
 *               nome:
 *                 type: string
 *                 description: Nome del prodotto.
 *                 example: Mantovana
 *               ingredienti:
 *                 type: array
 *                 description: Array degli ingredienti del prodotto.
 *                 example: [{nome: acqua, quantita: 1, udm: L}]
 *               prezzo:
 *                 type: float
 *                 description: Prezzo del prodotto.
 *                 example: 1.3
 *               foto:
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
 *               id:
 *                 type: object
 *                 description: id del prodotto
 *                 example: 6284a31ef6e9638dcb7985e1
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
 *               id:
 *                 type: object
 *                 description: id del prodotto
 *                 example: 6284a31ef6e9638dcb7985e1
 *               nome:
 *                 type: string
 *                 description: nome del prodotto
 *                 example: Mantovana
 *               ingredienti:
 *                 type: array
 *                 description: ingredienti del prodotto
 *                 example: {nome: acqua, quantita: 1, udm: L}
 *               prezzo:
 *                 type: float
 *                 description: prezzo del prodotto
 *                 example: 1.5
 *               foto:
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

//API che ritorna tutti i prodotti presenti nel sistema in formato json
router.get('', (req, res) => {
    //richiesta al db
    Prodotto.find().then((prod) => {
        console.log("Prodotti ricevuti")
        res.status(200).json(prod);
    })
});

//API che permette l'aggiunta di un nuovo prodotto nel sistema
router.post('', (req, res) => {
    //salvo i dati passati nel body della richiesta in alcune variabili
    const { nome, ingredienti, prezzo, foto } = req.body
    //controllo la validità dei dati, se i dati non sono validi restituisco il codice 400
    if(validator.isEmpty(nome) || nome === null){
        console.log('Nome del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(!Array.isArray(ingredienti) || ingredienti === null){
        console.log('Ingredienti del prodotto non validi');
        res.status(400).send();
        return;
    }
    if(isNaN(prezzo) || prezzo === null){
        console.log('Prezzo del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(validator.isEmpty(foto) || foto === null){
        console.log('Path foto del prodotto non valida');
        res.status(400).send();
        return;
    }

    //creo l'oggetto prodotto
    let prodotto = new Prodotto({
        nome,
        ingredienti,
        prezzo,
        foto
    });

    //salvo il nuovo prodotto nel db
    prodotto = prodotto.save()
    .then(() => {
        //se il salvataggio è andato a buon fine restituisco il codice 201
        console.log('Prodotto salvato con successo');
        res.status(201).send();
    }).catch((err) =>{
        //se il salvataggio non è andato a buon fine restituisco il codice 400
        console.log("Errore salvataggio nuovo prodotto: " + err)
        res.status(400).send();
    })
    
});

//API per l'eliminazione di un prodotto nel sistema
router.delete('', (req, res) => {
    //salvo l'id passato nel body della richiesta in una variabile
    const id = req.body.id

    //controllo la validità dell'id, se invalido ritorno il codice 400
    if(validator.isEmpty(id)){
        console.log('Id del prodotto non valido');
        res.status(400).send();
        return;
    }

    //cerco quel prodotto nel db
    Prodotto.findById(id)
    .then((prodotto) => {
        //se lo trovo, lo elimino
        prodotto.deleteOne()
        .then(() => {
            //se l'eliminazione va a buon fine, restituisco il codice 204
            console.log('Prodotto eliminato con successo');
            res.status(204).send()
        }).catch((err) => {
            //se l'eliminazione non va a buon fine, restituisco il codice 404
            console.log('Eliminazione non riuscita: ' + err);
            res.status(404).send()
        })
    }).catch((err) => {
        //se non lo trovo, restituisco il codice 404
        console.log("Prodotto non trovato: " + err)
        res.status(404).send()
    })
});

//API per modificare un prodotto presente nel catalogo
router.patch('', (req, res) => {
    //salvo i dati passati nel body della richiesta in alcune variabili
    const { id, nome, ingredienti, prezzo, foto } = req.body

    //controllo la validità dei dati, se non sono validi restituisco il codice 400
    if(validator.isEmpty(nome) || nome === null){
        console.log('Nome del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(!Array.isArray(ingredienti) || ingredienti === null){
        console.log('Ingredienti del prodotto non validi');
        res.status(400).send();
        return;
    }
    if(isNaN(prezzo) || ingredienti === null){
        console.log('Prezzo del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(validator.isEmpty(foto) || foto === null){
        console.log('Path foto del prodotto non valida');
        res.status(400).send();
        return;
    }

    //cerco il prodotto nel db attraverso l'id e quando lo trovo, aggiorno i dati
    Prodotto.findOneAndUpdate({
        "_id" : id
    },{
        $set: {"nome" : nome, "ingredienti": ingredienti, "prezzo": prezzo, "foto": foto}
    })
    .then(() => {
        //se va a buon fine, restituisco il codice 200
        console.log('Prodotto modificato con successo');
        res.status(200).send()
    }).catch((err) => {
        //se non va a buon fine, restituisco il codice 404
        console.log('Prodotto non trovato: ' + err);
        res.status(404).send()
    })
});

module.exports = router;