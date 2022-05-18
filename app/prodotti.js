const express = require('express');
const router = express.Router();
const Prodotto = require('./models/prodotto'); // get our mongoose model
var validator = require('validator');
/**
 * @swagger
 * /prodotti:
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
 *         description: Dati inseriti non validi
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
 *       404:
 *         description: Prodotto non trovato
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
 *         description: Prodotto non trovato
*/

router.post('', (req, res) => {

    const { nome, ingredienti, prezzo, foto } = req.body
    if(validator.isEmpty(nome)){
        console.log('Nome del prodotto non valido');
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

router.delete('', async (req, res) => {
    const id = req.body.id
    if(validator.isEmpty(id)){
        console.log('Id del prodotto non valido');
        res.status(400).send();
        return;
    }
    let prodotto = await Prodotto.findById(id).exec()
    if (!prodotto) {
        res.status(404).send()
        console.log("Prodotto non trovato")
        return;
    }
    prodotto.deleteOne().then(() => {
        console.log('Prodotto eliminato con successo');
    }).catch(() => {
        console.log('Prodotto non trovato');
        res.status(404).send()
        return;
    })

    res.status(204).send()
});

router.patch('', async (req, res) => {
    const { id, nome, ingredienti, prezzo, foto } = req.body
    if(validator.isEmpty(nome)){
        console.log('Nome del prodotto non valido');
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
    }).then(() => {
        console.log('Prodotto modificato con successo');
    }).catch(() => {
        console.log('Prodotto non trovato');
        res.status(404).send()
        return;
    })

    res.status(200).send()
});

module.exports = router;