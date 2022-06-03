const app = require('../app')
const request = require('supertest')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')

describe("Test modulo auth", () => {

    beforeAll((done) => {
        mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => done())
    })

    afterAll((done) => {
        mongoose.connection.close()
        done()
    })

    test('APP Verifica che app sia definita', () => {
        expect(app).toBeDefined();
    })

    test("REQ/ Richiesta generica senza token", (done) => {
        request(app)
            .get("/")
            .expect(403)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("REQ/ Richiesta generica con token invalido", (done) => {
        request(app)
            .get('/')
            .set('x-access-token', "invalid-token")
            .expect(401)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Login con credenziali non valide", (done) => {
        request(app)
            .post('/login')
            .send({
                email: "emailnonvalida@invalid.com",
                password: "password"
            })
            .expect(401)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

    test("POST/ Reset password con email non valida", (done) => {
        request(app)
            .post('/resetPassword')
            .send({
                email: "emailnonvalida@invalid.com"
            })
            .expect(401)
            .end((err, res) => {
                if (err) return done(err);
                return done();
            })
    })

})