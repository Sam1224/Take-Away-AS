/**
 * @Author: Sam
 * @Date: 2019/10/22
 * @Version: 1.0
 **/
const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const jwt = require('jsonwebtoken')

const config = require('../../../config')

// mongod-memory-server
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Order = require('../../../models/order')
const {MongoClient} = require('mongodb')

const _ = require('lodash')
let server
let mongod
let db, validID
let url, connection, collection

// jwt parameters
let username = "admin"
let token
let superSecret = config.superSecret

describe('Order', () => {
    before(async () => {
        mongod = new MongoMemoryServer({
            instance: {
                port: 27017,
                dbPath: './test/database',
                dbName: 'takeawayapp'
            }
        })
        // Async Trick - this ensures the database is created before
        // we try to connect to it or start the server
        url = await mongod.getConnectionString()
        connection = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        db = connection.db(await mongod.getDbName())
        collection = db.collection('order')
        server = require('../../../bin/www')

        token = jwt.sign({username: username}, superSecret, {
            // 1 hour
            expiresIn: 3600
        })
    })

    after(async () => {
        try {
            await connection.close()
            await mongod.stop()
            await server.close()
        } catch (err) {
            console.log(err)
        }
    })

    beforeEach(async () => {
        try {
            await Order.deleteMany({})
            let order = new Order()
            order.token = token
            order.user = "user1"
            order.seller = "seller1"
            order.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
            order.phone = 353894889596
            order.note = "Not spicy!"
            order.foods = [
                {
                    "name": "Egg & Pork Congee",
                    "price": 10,
                    "quantity": 2
                }
            ]
            await order.save()
            let order1 = new Order()
            order1.token = token
            order1.user = "user2"
            order1.seller = "seller2"
            order1.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
            order1.phone = 353894889596
            order1.note = "Not spicy!"
            order1.foods = [
                {
                    "name": "Rice Cake Stir-Fried with Crabs",
                    "price": 14,
                    "quantity": 1
                }
            ]
            await order1.save()
            let order2 = new Order()
            order2.token = token
            order2.user = "user2"
            order2.seller = "seller1"
            order2.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
            order2.phone = 353894889596
            order2.note = "Not spicy!"
            order2.foods = [
                {
                    "name": "Rice Cake Stir-Fried with Crabs",
                    "price": 14,
                    "quantity": 1
                }
            ]
            await order2.save()
            order = await Order.findOne({user: 'user1'})
            validID = order._id
        } catch (err) {
            console.log(err)
        }
    })

    describe('GET /order', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let order = {}
                return request(server)
                    .get("/order")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(order)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(1)
                        expect(res.body.message).equals("Not Login Yet, Please Login")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let order = {}
                    order.token = "123"
                    return request(server)
                        .get('/order')
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                            expect(res.body.error.name).equals("JsonWebTokenError")
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                it('should return all orders ', () => {
                    let order = {}
                    order.token = token
                    return request(server)
                        .get('/order')
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(0)
                            expect(res.body.data.length).to.equal(3)
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
        })
    })

    describe('GET /order/user/:id', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let order = {}
                return request(server)
                    .get('/order/user/user2')
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(order)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(1)
                        expect(res.body.message).equals("Not Login Yet, Please Login")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let order = {}
                    order.token = "123"
                    return request(server)
                        .get('/order/user/user2')
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                            expect(res.body.error.name).equals("JsonWebTokenError")
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                describe('when the user id is valid', () => {
                    it('should return all orders of a user', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get('/order/user/user2')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.data.length).to.equal(2)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the user id is invalid', () => {
                    it('should return an empty array', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get('/order/user/a')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.data.length).to.equal(0)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('GET /order/seller/:id', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let order = {}
                return request(server)
                    .get('/order/seller/seller1')
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(order)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(1)
                        expect(res.body.message).equals("Not Login Yet, Please Login")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let order = {}
                    order.token = "123"
                    return request(server)
                        .get('/order/seller/seller1')
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                            expect(res.body.error.name).equals("JsonWebTokenError")
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                describe('when the seller id is valid', () => {
                    it('should return all orders of a seller', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get('/order/seller/seller1')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.data.length).to.equal(2)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the seller id is invalid', () => {
                    it('should return an empty array', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get('/order/seller/a')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.data.length).to.equal(0)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('GET /order/:id', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let order = {}
                return request(server)
                    .get(`/order/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(order)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(1)
                        expect(res.body.message).equals("Not Login Yet, Please Login")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let order = {}
                    order.token = "123"
                    return request(server)
                        .get(`/order/${validID}`)
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                            expect(res.body.error.name).equals("JsonWebTokenError")
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                describe('when the id is valid', () => {
                    it('should return an order', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get(`/order/${validID}`)
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.data.length).to.equal(1)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the id is invalid', () => {
                    it('should return an error', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get('/order/a')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(-1)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('POST /order', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let order = {}
                order.user = "user3"
                order.seller = "seller3"
                order.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                order.phone = 353894889596
                order.note = "Not spicy!"
                order.foods = [
                    {
                        "name": "Egg & Pork Congee",
                        "price": 10,
                        "quantity": 2
                    },
                    {
                        "name": "Rice Cake Stir-Fried with Crabs",
                        "price": 14,
                        "quantity": 1
                    }
                ]
                return request(server)
                    .post('/order')
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(order)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(1)
                        expect(res.body.message).equals("Not Login Yet, Please Login")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let order = {}
                    order.token = "123"
                    order.user = "user3"
                    order.seller = "seller3"
                    order.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                    order.phone = 353894889596
                    order.note = "Not spicy!"
                    order.foods = [
                        {
                            "name": "Egg & Pork Congee",
                            "price": 10,
                            "quantity": 2
                        },
                        {
                            "name": "Rice Cake Stir-Fried with Crabs",
                            "price": 14,
                            "quantity": 1
                        }
                    ]
                    return request(server)
                        .post('/order')
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                            expect(res.body.error.name).equals("JsonWebTokenError")
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                it('should return a message of successfully add order', () => {
                        let order = {}
                        order.token = token
                        order.user = "user3"
                        order.seller = "seller3"
                        order.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                        order.phone = 353894889596
                        order.note = "Not spicy!"
                        order.foods = [
                            {
                                "name": "Egg & Pork Congee",
                                "price": 10,
                                "quantity": 2
                            },
                            {
                                "name": "Rice Cake Stir-Fried with Crabs",
                                "price": 14,
                                "quantity": 1
                            }
                        ]
                        return request(server)
                            .post('/order')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Add Order")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                after(() => {
                    let order = {}
                    order.token = token
                    return request(server)
                        .get('/order/user/user3')
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(0)
                            expect(res.body.data.length).to.equal(1)
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
        })
    })

    describe('DELETE /order/:id', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let order = {}
                return request(server)
                    .delete(`/order/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(order)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(1)
                        expect(res.body.message).equals("Not Login Yet, Please Login")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let order = {}
                    order.token = "123"
                    return request(server)
                        .delete(`/order/${validID}`)
                        .send(order)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                            expect(res.body.error.name).equals("JsonWebTokenError")
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                describe('when the id is valid', () => {
                    it('should return a message of successfully add order', () => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .delete(`/order/${validID}`)
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Delete Order")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    after(() => {
                        let order = {}
                        order.token = token
                        return request(server)
                            .get('/order')
                            .send(order)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.data.length).to.equal(2)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })
})
