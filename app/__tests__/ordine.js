const app = require('../app')
const request = require('supertest')
const jwt = require("jsonwebtoken")
const Ordine = require('../models/Ordine')
const mongoose = require('mongoose')

describe("Test modulo ordini", () => {

    let routeOrd = '/api/v1/ordini'

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

    test("GET/ Lista ordini AMM", (done) => {
        request(app)
            .get(routeOrd)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("GET/ Lista ordini rivenditore", (done) => {
        request(app)
            .get(routeOrd)
            .set('x-access-token', tokenRiv)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Creazione di 2 ordini con la stessa data di consegna", (done) => {
        let date = new Date()
        date.setDate(date.getDate() + 2)
        let ord = {
            dataConsegna: [date.getTime(), date.getTime()],
            prodotti: [
                {
                    id: "6288f6e05aecaa8135400276",
                    quantita: 3
                }
            ]
        }
        request(app)
            .post(routeOrd)
            .set('x-access-token', tokenRiv)
            .set('Accept', 'application/json')
            .send(ord)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Creazione di un ordine con prodotti duplicati", (done) => {
        let date = new Date()
        date.setDate(date.getDate() + 2)
        let ord = {
            dataConsegna: [date.getTime()],
            prodotti: [
                {
                    id: "6288f6e05aecaa8135400276",
                    quantita: 3
                },
                {
                    id: "6288f6e05aecaa8135400276",
                    quantita: 1
                }
            ]
        }
        request(app)
            .post(routeOrd)
            .set('x-access-token', tokenRiv)
            .set('Accept', 'application/json')
            .send(ord)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("PATCH/ Modifica di un ordine con id invalido", (done) => {
        let ord = {
            _id: "6288f6e05aecaa8135400276",
            prodotti: [
                {
                    id: "6288f6e05aecaa8135400276",
                    quantita: 3
                },
                {
                    id: "6288f6e05aecaa8135400276",
                    quantita: 1
                }
            ]
        }
        request(app)
            .patch(routeOrd)
            .set('x-access-token', tokenRiv)
            .send(ord)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("DELETE/ Eliminazione di un ordine con id invalido", (done) => {
        request(app)
            .delete(routeOrd + "/6288f6e05aecaa8135400276")
            .set('x-access-token', tokenRiv)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

})