const app = require('../app')
const request = require('supertest')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')

describe("Test modulo dipendente", () => {

    let routeDip = '/api/v1/dipendente'

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

    beforeAll((done) => {
        mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => done())
    })

    afterAll((done) => {
        mongoose.connection.close()
        done()
    })

    test("GET/ Lista dipendenti", (done) => {
        request(app)
            .get(routeDip)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Creazione dipendente con ruolo non valido", (done) => {
        let dip = {
            nome: "Mario Rossi",
            email: "mario.rossi@email.com",
            telefono: "123456789",
            orario: [],
            ruolo: "ruoloerrato"
        }
        request(app)
            .post(routeDip)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .send(dip)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Creazione dipendente con orario non valido", (done) => {
        let dip = {
            nome: "Mario Rossi",
            email: "mario.rossi@email.com",
            telefono: "123456789",
            orario: 1234,
            ruolo: "spedizioniere"
        }
        request(app)
            .post(routeDip)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .send(dip)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("DELETE/ Eliminazione dipendente con id invalido", (done) => {
        request(app)
            .delete(routeDip)
            .set('x-access-token', tokenAMM)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("PATCH/ Modifica dipendente con id invalido", (done) => {
        let dip = {
            _id: "", 
            nome: "Mario Rossi",
            email: "mario.rossi@email.com",
            telefono: "123456789",
            orario: 1234,
            ruolo: "spedizioniere"
        }
        request(app)
            .patch(routeDip)
            .set('x-access-token', tokenAMM)
            .send(dip)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

})