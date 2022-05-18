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
 *                 type: string
 *                 description: path della foto del prodotto
 *                 example: /images/mantovana.jpeg
 *     responses:
 *       200:
 *         description: Prodotto modificato con successo
 *       400:
 *         description: Dati inseriti non validi
 *       404:
 *         description: Prodotto non trovato
*/

router.get('', async(req, res) => {
    let prodotti = await Prodotto.find().exec()
    console.log("Prodotti ricevuti")
    res.status(200).json(prodotti);
});

router.post('', (req, res) => {

    const { nome, ingredienti, prezzo, foto } = req.body
    if(validator.isEmpty(nome)){
        console.log('Nome del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(!Array.isArray(ingredienti)){
        console.log('Ingredienti del prodotto non validi');
        res.status(400).send();
        return;
    }
    if(isNaN(prezzo)){
        console.log('Prezzo del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(validator.isEmpty(foto)){
        console.log('Path foto del prodotto non valida');
        res.status(400).send();
        return;
    }
    let prodotto = new Prodotto({
        nome,
        ingredienti,
        prezzo,
        foto
    });

    prodotto = prodotto.save().then(() => {
        console.log('Prodotto salvato con successo');
    })
    
    res.status(201).send();
});

router.delete('', (req, res) => {
    const id = req.body.id
    if(validator.isEmpty(id)){
        console.log('Id del prodotto non valido');
        res.status(400).send();
        return;
    }
    Prodotto.findById(id)
    .then((prodotto) => {
        prodotto.deleteOne().then(() => {
            console.log('Prodotto eliminato con successo');
        }).catch(() => {
            console.log('Prodotto non trovato');
            res.status(404).send()
            return;
        })
    }).catch(() => {
        res.status(404).send()
        console.log("Prodotto non trovato")
        return;
    })
    res.status(204).send()
});

router.patch('', (req, res) => {
    const { id, nome, ingredienti, prezzo, foto } = req.body
    if(validator.isEmpty(nome)){
        console.log('Nome del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(!Array.isArray(ingredienti)){
        console.log('Ingredienti del prodotto non validi');
        res.status(400).send();
        return;
    }
    if(isNaN(prezzo)){
        console.log('Prezzo del prodotto non valido');
        res.status(400).send();
        return;
    }
    if(validator.isEmpty(foto)){
        console.log('Path foto del prodotto non valida');
        res.status(400).send();
        return;
    }
    Prodotto.findOneAndUpdate({
        "_id" : id
    },{
        $set: {"nome" : nome, "ingredienti": ingredienti, "prezzo": prezzo, "foto": foto}
    })
    .then(() => {
        console.log('Prodotto modificato con successo');
    }).catch(() => {
        console.log('Prodotto non trovato');
        res.status(404).send()
        return;
    })

    res.status(200).send()
});

module.exports = router;