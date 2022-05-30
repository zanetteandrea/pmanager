const express = require('express');
const router = express.Router();
const Utente = require('./models/utente.js');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const ruoli = require('./models/ruoli.js');
require('dotenv').config()
const hbs = require("nodemailer-express-handlebars");

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
                reject("Invio email credenziali fallito");
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

const sendCredentials = (nome, email, password, template) => {
    return new Promise((resolve, reject) => {
        createTransporter()
            .then((emailTransporter) => {

                const options = {
                    viewEngine: {
                        extname: ".handlebars",
                        layoutsDir: "./app/hbs",
                        defaultLayout: template,
                    },
                    viewPath: "./app/hbs",
                    extname: ".handlebars",
                }

                emailTransporter.use("compile", hbs(options))

                const mailOptions = {
                    from: process.env.SENDER_EMAIL,
                    to: email,
                    subject: "Le tue nuove credenziali PManager",
                    template,
                    context: {
                        nome,
                        password
                    },
                }

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
        sendCredentials(utente.nome, utente.email, password, "register")
            .then(() => {
                utente.hash_pw = bcrypt.hashSync(password)
                utente.first_access = true
                utente.save()
                    .then((user) => {
                        let obj = user.toObject()
                        delete obj.hash_pw
                        delete obj.first_access
                        resolve(obj)
                    })
                    .catch(() => {
                        reject()
                    })
            })
            .catch(() => {
                reject("Errore nella spedizione delle credenziali")
            })
    })
}

const checkOrario = (orario) => {
    let now = new Date()
    return orario.some((turno) => {
        if (turno.giorno === now.getDay()) {
            let inizio = new Date(turno.oraIniziale).toLocaleTimeString('it-IT', {timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit'})
            let fine = new Date(turno.oraFinale).toLocaleTimeString('it-IT', {timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit'})
            let oraNow = now.toLocaleTimeString('it-IT', {timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit'})
            if (inizio < oraNow && oraNow < fine) {
                return true
            }
        }
        return false
    })
}

router.post("/login", (req, res) => {
    try {

        const { email, password } = req.body

        if (!validator.isEmail(req.body.email) || validator.isEmpty(req.body.password)) {
            return res.status(401).send("Inserire dati validi")
        }

        Utente.findOne({ email })
            .then((utente) => {
                if (utente) {
                    bcrypt.compare(password, utente.hash_pw)
                        .then((isEqual) => {
                            if (isEqual) {
                                if (utente.ruolo == ruoli.SPEDIZIONIERE || utente.ruolo == ruoli.PANETTIERE) {
                                    if (!checkOrario(utente._doc.orario)) {
                                        return res.status(401).send("Tentativo di accesso fuori orario lavorativo")
                                    }
                                }
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
                                    role: utente.ruolo,
                                    first_access: utente.first_access
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

router.post("/resetPassword", (req, res) => {
    try {

        const { email } = req.body

        if (validator.isEmpty(email) || !validator.isEmail(email)) {
            return res.status(401).send("Email non valida")
        }

        Utente.findOne({ email })
            .then((utente) => {
                if (utente) {
                    let password = Math.random().toString(36).slice(-8)
                    hash_pw = bcrypt.hashSync(password)
                    sendCredentials(utente.nome, email, password, "reset")
                        .then(() => {
                            Utente.updateOne({ email }, {hash_pw, first_access: true})
                                .then(() => {
                                    return res.status(201).send("Operazione riuscita")
                                })
                                .catch(() => {
                                    return res.status(401).send("Errore nel salvataggio")
                                })
                        })
                        .catch(() => {
                            return res.status(401).send("Errore nell'invio delle credenziali")
                        })
                } else {
                    return res.status(401).send("Email non valida")
                }
            })
            
    } catch (err) {
        return res.status(401).send("Email non valida")
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

router.post("/cambioPassword", (req, res) => {
    try {

        const { password } = req.body

        if (validator.isEmpty(password)) {
            return res.status(401).send("Password non valida")
        }

        hash_pw = bcrypt.hashSync(password)

        Utente.findOneAndUpdate({ _id: req.auth.id }, { hash_pw, first_access: false })
            .then((utente) => {
                if (utente) {
                    return res.status(200).send("Operazione confermata")
                } else {
                    return res.status(401).send("Errore salvataggio")
                }
            })
    } catch (err) {
        return res.status(401).send("Password non valida")
    }
})

module.exports = {
    router: router,
    register: register
}
