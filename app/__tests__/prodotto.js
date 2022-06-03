const app = require('../app')
const request = require('supertest')
const jwt = require("jsonwebtoken")
const Prodotto = require('../models/prodotto')
const mongoose = require('mongoose')

describe("Test modulo prodotto", () => {

    let routeProd = '/api/v1/prodotti'

    let tokenAMM = jwt.sign(
        {
            id: process.env.ID_AMM,
            ruolo: "amm"
        },
        process.env.SECRET_KEY,
        {
            expiresIn: "7d",
        }
    )
    let tokenRiv = jwt.sign(
        {
            id: process.env.ID_RIV,
            ruolo: "rivenditore"
        },
        process.env.SECRET_KEY,
        {
            expiresIn: "7d",
        }
    )

    beforeAll((done) => {
        mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => done())
    })

    afterAll((done) => {
        mongoose.connection.close()
        done()
    })

    test("GET/ Lista prodotti AMM", (done) => {
        request(app)
            .get(routeProd)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("GET/ Lista prodotti rivenditore", (done) => {
        request(app)
            .get(routeProd)
            .set('x-access-token', tokenRiv)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })
    /*
    test("POST/ Creazione di un nuovo prodotto con dati validi", (done) => {
        let prod = {
            nome: "Prova test",
            ingredienti: [
                {
                    "nome": "farina",
                    "quantita": 100,
                    "udm": "gr"
                },
                {
                    "nome": "acqua",
                    "quantita": 250,
                    "udm": "ml"
                }
            ],
            prezzo: 2
        }
        request(app)
            .post(routeProd)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .send(prod)
            .expect(201)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })
    */
    test("POST/ Creazione di un nuovo prodotto con alcuni campi vuoti", (done) => {
        let prod = {
            nome: "Prova test 2",
            ingredienti: [
                {
                    "nome": "farina",
                    "quantita": 100,
                    "udm": "gr"
                },
                {
                    "nome": "acqua",
                    "quantita": 250,
                    "udm": "ml"
                }
            ]
        }
        request(app)
            .post(routeProd)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .send(prod)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Creazione di un nuovo prodotto con il nome di uno già presente", (done) => {
        let prod = {
            nome: "treccia",
            ingredienti: [
                {
                    "nome": "lievito",
                    "quantita": 2,
                    "udm": "gr"
                },
                {
                    "nome": "acqua",
                    "quantita": 250,
                    "udm": "ml"
                }
            ],
            prezzo: 2
        }
        request(app)
            .post(routeProd)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .send(prod)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("PATCH/ Modifica prodotto con id invalido", (done) => {
        let prod = {
            _id: "",
            nome: "prova",
            ingredienti: [
                {
                    "nome": "lievito",
                    "quantita": 2,
                    "udm": "gr"
                },
                {
                    "nome": "acqua",
                    "quantita": 250,
                    "udm": "ml"
                }
            ],
            prezzo: 2
        }
        request(app)
            .patch(routeProd)
            .set('x-access-token', tokenAMM)
            .send(prod)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("DELETE/ Eliminazione prodotto con id non valido", (done) => {
        request(app)
            .delete(routeProd + "/1234567890")
            .set('x-access-token', tokenAMM)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

})