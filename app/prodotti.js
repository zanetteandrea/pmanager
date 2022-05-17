const express = require('express');
const router = express.Router();
const Prodotto = require('./models/prodotto'); // get our mongoose model

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