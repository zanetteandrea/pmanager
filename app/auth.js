const express = require('express');
const router = express.Router();
const Utente = require('./models/utente.js');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
require('dotenv').config()

// Pull out OAuth2 from googleapis
const OAuth2 = google.auth.OAuth2

const createTransporter = async () => {
    const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Failed to create access token :( " + err);
            }
            resolve(token);
        });
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.SENDER_EMAIL,
            accessToken,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        },
    });

    return transporter;
};

const sendCredentials = (nome, email, password) => {
    return new Promise((resolve, reject) => {
        // Mail options
        let mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Le tue nuove credenziali",
            text: "Ciao " + nome + ", accedi alla tua console PManager con le credenziali " + password
        };

        createTransporter()
            .then((emailTransporter) => {
                emailTransporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error)
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            })
            .catch((error) => {
                console.log(error)
                reject(error)
            })
    })
}

const register = (utente) => {
    return new Promise((resolve, reject) => {
        let password = Math.random().toString(36).slice(-8)
        console.log("Password generata: ", password)
        sendCredentials(utente.nome, utente.email, password)
            .then(() => {
                utente.hash_pw = bcrypt.hashSync(password)
                utente.first_access = true
                utente.save()
                    .then(() => {
                        resolve()
                    })
                    .catch(() => {
                        console.log("Errore salvataggio")
                        reject()
                    })
            })
            .catch(() => {
                reject()
            })
    })
}

router.post("/login", (req, res) => {
    try {

        const { email, password } = req.body

        if (!validator.isEmail(req.body.email) || validator.isEmpty(req.body.password)) {
            return res.status(401).send("Inserire dati validi")
        }
        
        Utente.findOne({ email }).then((utente) => {
            if (utente) {
                bcrypt.compare(password, utente.hash_pw)
                    .then((isEqual) => {
                        if (isEqual) {
                            const token = jwt.sign(
                                {
                                    id: utente._id,
                                    ruolo: utente.ruolo
                                },
                                process.env.SECRET_KEY,
                                {
                                    expiresIn: "7d",
                                }
                            )
                            return res.status(200).json({
                                nome: utente.nome,
                                token,
                                role: utente.ruolo
                            })
                        } else {
                            return res.status(401).send("Password errata");
                        }
                    })
            } else {
                return res.status(401).send("Email non valida");
            }
        })
    } catch (err) {
        return res.status(401).send("Inserire tutti i campi")
    }
})

router.get("/api-docs", (req, res, next) => {
    next()
})

router.all("/*", (req, res, next) => {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // if there is no token
    if (!token) {
        return res.status(403).send("No token provided")
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized access" });
        }
        req.auth = {
            id: decoded.id,
            ruolo: decoded.ruolo
        }
        next();
    });
})

module.exports = {
    router: router,
    register: register
}
