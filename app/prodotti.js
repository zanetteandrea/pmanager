const express = require('express');
const router = express.Router();
const Prodotto = require('./models/prodotto'); // get our mongoose model
/**
 * @swagger
 * /prodotti:
 *   post:
 *     summary: Crea un nuovo prodotto
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                       description: Il nome del prodotto
 *                       example: Mantovana
*/

router.post('', (req, res) => {

    const {nome, ingredienti, prezzo, foto} = req.body

	let prodotto = new Prodotto({
        nome,
        ingredienti,
        prezzo,
        foto
    });

	prodotto = prodotto.save().then(()=>{
        console.log('Prodotto salvato con successo');
    })

    res.status(201).send();
});

module.exports = router;