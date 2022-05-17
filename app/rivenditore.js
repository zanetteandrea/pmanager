const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/rivenditore'); // get our mongoose model
//const Utente = require('./models/utente'); // get our mongoose model
const validator = require('validator');
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

function check_fields(riv) {
    return validator.isEmail(riv.email)
}


router.post('', (req, res) => {

    const {nome, email, telefono, password, first_access, indirizzo, catalogo} = req.body

	let rivenditore = new Rivenditore({
        nome,
        email,
        telefono,
        password,
        first_access: true,
        indirizzo,
        catalogo
    });
    
    if(!check_fields(rivenditore)) {
        res.status(400).send("invalid email");
    } else {
        rivenditore = rivenditore.save().then(()=>{
            console.log('utente salvato con successo');
            res.status(201).send();
        })
        if(!rivenditore) {
            res.status(400).send();
        }
    }

    
});

module.exports = router;