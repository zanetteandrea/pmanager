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
*/

router.post('', (req, res) => {

    const { nome, ingredienti, prezzo, foto } = req.body

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

module.exports = router;