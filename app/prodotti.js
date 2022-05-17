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
 *         description: Created
 *       400:
 *         description: Dati inseriti non validi
 * /prodotti/{id}:
 *   parameters:
 *      in: path
 *      description: id del prodotto da eliminare
 *      name: id
 *      required: true
 *      schema:
 *          type: integer
 *   delete:
 *     summary: Elimina un prodotto
 *     responses:
 *       204:
 *         description: Prodotto eliminato
 *       404:
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

router.delete('/:id', async (req, res) => {
    let prodotto = await Prodotto.findById(req.params.id).exec()
    console.log('Prodotto trovato');
    if (!prodotto) {
        res.status(404).send()
        console.log("Prodotto non trovato")
        return;
    }
    await prodotto.deleteOne()

    console.log("Prodotto rimosso")
    res.status(204).send()
});

module.exports = router;