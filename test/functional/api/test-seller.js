/**
 * @Author: Sam
 * @Date: 2019/10/21
 * @Version: 1.0
 **/
const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const jwt = require('jsonwebtoken')

const config = require('../../../config')

// mongod-memory-server
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Seller = require('../../../models/seller')
const mongoose = require('mongoose')

const _ = require('lodash')
let server
let mongod
let db, validID

// jwt parameters
let username = "admin"
let token
let superSecret = config.superSecret

describe('Seller', () => {
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
        await mongod.getConnectionString()

        mongoose.connect('mongodb://localhost:27017/takeawayapp', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        server = require('../../../bin/www')
        db = mongoose.connection

        token = jwt.sign({username: username}, superSecret, {
            // 1 hour
            expiresIn: 3600
        })
    })

    after(async () => {
        await db.dropDatabase
    })

    beforeEach(async () => {
        await Seller.deleteMany({})
        let seller = new Seller()
        seller.token = token
        seller.name = 'test1'
        seller.description = 'Fengniao Delivery'
        seller.deliveryTime = 40
        seller.bulletin = 'Test 1'
        seller.supports = [{
            'type': 1,
            'description': 'VC orange juice 80% discount'
        }]
        seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
        seller.pics = [
            "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
        ]
        seller.infos = [
            "Invoice supported, please fill in the invoice title when ordered",
            "Class: Other cuisine, porridge store",
            "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
            "Opening hours: 10:00-20:30"
        ]
        await seller.save()
        let seller1 = new Seller()
        seller1.token = token
        seller1.name = 'test2'
        seller1.description = 'Meituan Delivery'
        seller1.deliveryTime = 38
        seller1.bulletin = 'Test 2'
        seller1.supports = []
        seller1.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
        seller1.pics = [
            "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
        ]
        seller1.infos = [
            "Opening hours: 10:00-20:30"
        ]
        await seller1.save()
        seller = await Seller.findOne({name: 'test1'})
        setTimeout(() => {
            validID = seller._id
        }, 500)
    })

    describe('GET /seller', () => {
        it('should GET all the sellers', () => {
            setTimeout(() => {
                return request(server)
                    .get("/seller")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(0)
                        expect(res.body.data).to.be.a('array')
                        expect(res.body.data.length).to.equal(2)
                        let result = _.map(res.body.data, (seller) => {
                            return {
                                name: seller.name
                            }
                        })
                        expect(result).to.deep.include({
                            name: 'test1'
                        })
                        expect(result).to.deep.include({
                            name: 'test2'
                        })
                    })
            }, 1000)
        })
    })

    describe('GET /seller/:id', () => {
        describe('when the id is valid', () => {
            it('should return the matching seller', () => {
                setTimeout(() => {
                    return request(server)
                        .get(`/seller/${validID}`)
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.data[0]).to.have.property("name", "test1")
                        })
                }, 1000)
            })
        })
        describe('when the id is invalid', () => {
            it('should return an empty array', () => {
                setTimeout(() => {
                    return request(server)
                        .get('/seller/1')
                        .set("Accept", "application/json")
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(-1)
                        })
                },1000)
            })
        })
    })

    describe('POST /seller', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let seller = {}
                seller.name = 'test3'
                seller.description = 'Fengniao Delivery'
                seller.deliveryTime = 40
                seller.bulletin = 'Test 1'
                seller.supports = [{
                    'type': 1,
                    'description': 'VC orange juice 80% discount'
                }]
                seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
                seller.pics = [
                    "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
                ]
                seller.infos = [
                    "Invoice supported, please fill in the invoice title when ordered",
                    "Class: Other cuisine, porridge store",
                    "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
                    "Opening hours: 10:00-20:30"
                ]
                setTimeout(() => {
                    return request(server)
                        .post("/seller")
                        .send(seller)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(1)
                            expect(res.body.message).equals("Not Login Yet, Please Login")
                        })
                }, 1000)
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is expired', () => {
                it('should return an expired error', () => {
                    let seller = new Seller()
                    token = jwt.sign({username: username}, superSecret, {
                        // 1 s
                        expiresIn: 1
                    })
                    seller.token = token
                    seller.name = 'test3'
                    seller.description = 'Fengniao Delivery'
                    seller.deliveryTime = 40
                    seller.bulletin = 'Test 1'
                    seller.supports = [{
                        'type': 1,
                        'description': 'VC orange juice 80% discount'
                    }]
                    seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
                    seller.pics = [
                        "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
                    ]
                    seller.infos = [
                        "Invoice supported, please fill in the invoice title when ordered",
                        "Class: Other cuisine, porridge store",
                        "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
                        "Opening hours: 10:00-20:30"
                    ]
                    setTimeout(() => {
                        return request(server)
                            .post("/seller")
                            .send(seller)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(-1)
                                expect(res.body.error.name).equals("TokenExpiredError")
                            })
                    }, 1000)
                })
                after(() => {
                    return request(server)
                        .get("/seller")
                        .expect(200)
                        .then((res) => {
                            expect(res.body.data.length).to.equal(2)
                        })
                })
            })
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let seller = {}
                    seller.token = 'test'
                    seller.name = 'test1'
                    seller.description = 'Fengniao Delivery'
                    seller.deliveryTime = 40
                    seller.bulletin = 'Test 1'
                    seller.supports = [{
                        'type': 1,
                        'description': 'VC orange juice 80% discount'
                    }]
                    seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
                    seller.pics = [
                        "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
                    ]
                    seller.infos = [
                        "Invoice supported, please fill in the invoice title when ordered",
                        "Class: Other cuisine, porridge store",
                        "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
                        "Opening hours: 10:00-20:30"
                    ]
                    setTimeout(() => {
                        return request(server)
                            .post("/seller")
                            .send(seller)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(-1)
                                expect(res.body.error.name).equals("JsonWebTokenError")
                            })
                    }, 1000)
                })
                after(() => {
                    return request(server)
                        .get("/seller")
                        .expect(200)
                        .then((res) => {
                            expect(res.body.data.length).to.equal(2)
                        })
                })
            })
            describe('when the token is valid', () => {
                it('should return a message of successfully add seller', () => {
                    let seller = {}
                    seller.token = token
                    seller.name = 'test3'
                    seller.description = 'Fengniao Delivery'
                    seller.deliveryTime = 40
                    seller.bulletin = 'Test 1'
                    seller.supports = [{
                        'type': 1,
                        'description': 'VC orange juice 80% discount'
                    }]
                    seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
                    seller.pics = [
                        "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
                    ]
                    seller.infos = [
                        "Invoice supported, please fill in the invoice title when ordered",
                        "Class: Other cuisine, porridge store",
                        "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
                        "Opening hours: 10:00-20:30"
                    ]
                    setTimeout(() => {
                        return request(server)
                            .post("/seller")
                            .send(seller)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Add Seller")
                            })
                    }, 1000)
                })
                after(() => {
                    setTimeout(() => {
                        return request(server)
                            .get("/seller")
                            .expect(200)
                            .then((res) => {
                                expect(res.body.data.length).to.equal(3)
                                let result = _.map(res.body.data, (seller) => {
                                    return {
                                        name: seller.name
                                    }
                                })
                                expect(result).to.deep.include({
                                    name: 'test3'
                                })
                            })
                    }, 1000)
                })
            })
        })
    })

    describe('PUT /seller/:id', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token', () => {
                let seller = {}
                seller.name = 'test1'
                seller.description = 'Meituan Delivery'
                seller.deliveryTime = 40
                seller.bulletin = 'Test 1'
                seller.supports = [{
                    'type': 1,
                    'description': 'VC orange juice 80% discount'
                }]
                seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
                seller.pics = [
                    "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
                ]
                seller.infos = [
                    "Invoice supported, please fill in the invoice title when ordered",
                    "Class: Other cuisine, porridge store",
                    "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
                    "Opening hours: 10:00-20:30"
                ]
                setTimeout(() => {
                    return request(server)
                        .put(`/seller/${validID}`)
                        .send(seller)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.code).to.equal(1)
                            expect(res.body.message).equals("Not Login Yet, Please Login")
                        })
                }, 1000)
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is expired', () => {
                it('should return an expired error', () => {
                    let seller = new Seller()
                    token = jwt.sign({username: username}, superSecret, {
                        // 1 s
                        expiresIn: 1
                    })
                    seller.token = token
                    seller.name = 'test1'
                    seller.description = 'Meituan Delivery'
                    seller.deliveryTime = 40
                    seller.bulletin = 'Test 1'
                    seller.supports = [{
                        'type': 1,
                        'description': 'VC orange juice 80% discount'
                    }]
                    seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
                    seller.pics = [
                        "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
                    ]
                    seller.infos = [
                        "Invoice supported, please fill in the invoice title when ordered",
                        "Class: Other cuisine, porridge store",
                        "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
                        "Opening hours: 10:00-20:30"
                    ]
                    setTimeout(() => {
                        return request(server)
                            .post(`/seller/${validID}`)
                            .send(seller)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(-1)
                                expect(res.body.error.name).equals("TokenExpiredError")
                            })
                    }, 1000)
                })
                after(() => {
                    return request(server)
                        .get("/seller")
                        .expect(200)
                        .then((res) => {
                            expect(res.body.data.length).to.equal(2)
                        })
                })
            })
        })
    })
})
