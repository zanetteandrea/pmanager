const express = require('express');
const router = express.Router();
const Utente = require('./models/utente.js');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config()

router.post("/login", (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!validator.isEmail(email) || validator.isEmpty(password)) {
            res.status(401).send("All input is required")
        }

        Utente.findOne({ email }).then((utente) => {
            if (utente) {
                /*
                bcrypt.compare(password, utente.hash_pw).then(() => {
                    const token = jwt.sign(
                        { 
                            id: utente._id,
                            email: utente.email
                        },
                        process.env.SECRET_KEY,
                        {
                            expiresIn: "2h",
                        }
                    );
                    res.status(200).json({
                        nome: utente.nome,
                        token,
                        role: utente.__t
                    });
                })
                */
                const token = jwt.sign(
                    { 
                        id: utente._id,
                        email: utente.email
                    },
                    process.env.SECRET_KEY,
                    {
                        expiresIn: "2h",
                    }
                );
                res.status(200).json({
                    ruolo: utente.ruolo, 
                    token,
                });
            } else {
                res.status(401).send("Invalid Credentials");
            }
        })
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal error");
    }
})

module.exports = router