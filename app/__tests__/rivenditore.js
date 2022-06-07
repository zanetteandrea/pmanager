const app = require('../app')
const request = require('supertest')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')

describe("Test modulo rivenditore", () => {

    let routeRiv = '/api/v1/rivenditore'

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

    test("GET/ Lista rivenditori", (done) => {
        request(app)
            .get(routeRiv)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })
    
    test("POST/ Creazione rivenditore con email invalida", (done) => {
        let riv = {
            nome: "Mario Rossi",
            email: "emailacaso",
            telefono: "123456789",
            indirizzo: "via-lungadige-civico-40-citta-Trento",
            catalogo: [
                {
                    "id": "123456789987654321",
                    "prezzo": 1.2
                }
            ]
        }
        request(app)
            .post(routeRiv)
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .send(riv)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("DELETE/ Eliminazione rivenditore con id invalido", (done) => {
        request(app)
            .delete(routeRiv+"/6288f6e05aecaa8135400276")
            .set('x-access-token', tokenAMM)
            .set('Accept', 'application/json')
            .expect(404)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

})