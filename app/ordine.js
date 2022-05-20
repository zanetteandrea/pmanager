const express = require('express');
const router = express.Router();
const Rivenditore = require('./models/Rivenditore'); // get our mongoose model
//const Utente = require('./models/utente'); // get our mongoose model
const validator = require('validator');
//const register = require('./auth')
const auth = require('./auth');
const ruoli = require('./models/ruoli');
const ruoli = require('./models/Ordine');
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
 *         description: Dati dell'Ordine inseriti non validi o ordine già presente
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
 *         404:
 *           description: Ordine non presente
*/

module.exports = router;