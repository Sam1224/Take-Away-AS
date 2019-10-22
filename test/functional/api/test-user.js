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
const User = require('../../../models/user')
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

describe('User', () => {
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
        collection = db.collection('user')
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
            await User.deleteMany({})
            let user = new User()
            user.username = "user1"
            user.password = "123456"
            user.phone = 1
            user.address = ['test address']
            user.pay = ['1']
            user.favorite = ['1234']
            await user.save()
            let user1 = new User()
            user1.username = "user2"
            user1.password = "123456"
            user1.phone = 2
            user.address = ['test address']
            user.pay = ['1']
            user.favorite = ['1234']
            await user1.save()
            user = await User.findOne({username: 'user1'})
            // setTimeout(() => {
            validID = user._id
            // }, 500)
        } catch (err) {
            console.log(err)
        }
    })

    describe('GET /user', () => {
        it('should GET all the users', () => {
            return request(server)
                .get("/user")
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .then((res) => {
                    expect(res.body.code).to.equal(0)
                    expect(res.body.data).to.be.a('array')
                    expect(res.body.data.length).to.equal(2)
                    let result = _.map(res.body.data, (user) => {
                        return {
                            username: user.username
                        }
                    })
                    expect(result).to.deep.include({
                        username: 'user1'
                    })
                    expect(result).to.deep.include({
                        username: 'user2'
                    })
                })
                .catch((err) => {
                    console.log(err)
                })
        })
    })

    describe('GET /user/:id', () => {
        describe('when the id is valid', () => {
            it('should return the matching user', () => {
                return request(server)
                    .get(`/user/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.data[0]).to.have.property("username", "user1")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when the id is invalid', () => {
            it('should return an empty array', () => {
                return request(server)
                    .get('/user/1')
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

    describe('POST /user', () => {
        describe('when the username is already in database', () => {
            it('should return a message to inform the duplication', () => {
                let user = {}
                user.username = "user1"
                user.password = "123"
                user.phone = 12
                return request(server)
                    .post("/user")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(user)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(2)
                        expect(res.body.message).equals("The username has been registered!")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when the username is unique', () => {
            it('should return a message of successfully add user', () => {
                let user = {}
                user.username = "user3"
                user.password = "123"
                user.phone = 12
                return request(server)
                    .post("/user")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .send(user)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(0)
                        expect(res.body.message).equals("Successfully Add User")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
            after(() => {
                return request(server)
                    .get(`/user`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(0)
                        expect(res.body.data.length).to.equal(3)
                        let result = _.map(res.body.data, (user) => {
                            return {
                                username: user.username
                            }
                        })
                        expect(result).to.deep.include({
                            username: 'user3'
                        })
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
    })

    describe('PUT /user', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.username = "test1"
                user.password = "test1"
                user.phone = "1212"
                return request(server)
                    .put(`/user`)
                    .send(user)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
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
                    let user = {}
                    user.token = "123"
                    user.username = "test1"
                    user.password = "test1"
                    user.phone = "1212"
                    return request(server)
                        .put(`/user`)
                        .send(user)
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
                describe('when the username is not registered', () => {
                    it('should return a message the username is not registered', () => {
                        let user = {}
                        user.token = token
                        user.username = "ss"
                        user.password = "test1"
                        user.phone = "1212"
                        return request(server)
                            .put(`/user`)
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(3)
                                expect(res.body.message).equals("The username is not registered")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the username is registered', () => {
                    it('should return a message of successfully update user', () => {
                        let user = {}
                        user.token = token
                        user.username = "user1"
                        user.password = "test1"
                        user.phone = "1212"
                        return request(server)
                            .put(`/user`)
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Update User")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    after(() => {
                        return request(server)
                            .get('/user')
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                let result = _.map(res.body.data, (user) => {
                                    if (user.username === 'user1') {
                                        return {
                                            username: user.username,
                                            phone: user.phone
                                        }
                                    }
                                })
                                expect(result[0].phone).equals(1212)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('DELETE /user/:id', () => {
        describe('when the id is valid', () => {
            it('should return a message of successfully delete user', () => {
                return request(server)
                    .delete(`/user/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(0)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
            after(() => {
                return request(server)
                    .get("/user")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.code).to.equal(0)
                        expect(res.body.data).to.be.a('array')
                        expect(res.body.data.length).to.equal(1)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        })
        describe('when the id is invalid', () => {
            it('should return an error', () => {
                return request(server)
                    .delete(`/user/123`)
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

    describe('POST /user/address', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.username = "test1"
                user.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                return request(server)
                    .post(`/user/address`)
                    .send(user)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
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
                    let user = {}
                    user.token = "123"
                    user.username = "test1"
                    user.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                    return request(server)
                        .post('/user/address')
                        .send(user)
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
                describe('when the username is not registered', () => {
                    it('should return a message the username is not registered', () => {
                        let user = {}
                        user.token = token
                        user.username = "ss"
                        user.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                        return request(server)
                            .post('/user/address')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(3)
                                expect(res.body.message).equals("The username is not registered")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the username is registered', () => {
                    it('should return a message of successfully add address', () => {
                        let user = {}
                        user.token = token
                        user.username = "user1"
                        user.address = "APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND"
                        return request(server)
                            .post('/user/address')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Add Address")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    after(() => {
                        return request(server)
                            .get('/user')
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                let result = _.map(res.body.data, (user) => {
                                    return {
                                        username: user.username,
                                        address: user.address
                                    }
                                })
                                if (result[0].username === 'user1') {
                                    expect(result[0].address[1]).equals("APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND")
                                } else if (result[1].username === 'user1') {
                                    expect(result[1].address[1]).equals("APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND")
                                }
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('DELETE /user/address', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.username = "test1"
                user.address = 'test address'
                return request(server)
                    .delete(`/user/address`)
                    .send(user)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
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
                    let user = {}
                    user.token = "123"
                    user.username = "test1"
                    user.address = 'test address'
                    return request(server)
                        .delete('/user/address')
                        .send(user)
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
                describe('when the username is not registered', () => {
                    it('should return a message the username is not registered', () => {
                        let user = {}
                        user.token = token
                        user.username = "ss"
                        user.address = 'test address'
                        return request(server)
                            .delete('/user/address')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(3)
                                expect(res.body.message).equals("The username is not registered")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the username is registered', () => {
                    it('should return a message of successfully delete address', () => {
                        let user = {}
                        user.token = token
                        user.username = "user1"
                        user.address = 'test address'
                        return request(server)
                            .delete('/user/address')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Delete Address")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    after(() => {
                        return request(server)
                            .get('/user')
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                let result = _.map(res.body.data, (user) => {
                                    if (user.username === 'user1') {
                                        return {
                                            username: user.username,
                                            address: user.address
                                        }
                                    }
                                })
                                expect(result[0].address.length).to.equal(0)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('POST /user/pay', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.username = "user1"
                user.pay = 6228480395827429378
                return request(server)
                    .post('/user/pay')
                    .send(user)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
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
                    let user = {}
                    user.token = "123"
                    user.username = "user1"
                    user.pay = 6228480395827429378
                    return request(server)
                        .post('/user/pay')
                        .send(user)
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
                describe('when the username is not registered', () => {
                    it('should return a message the username is not registered', () => {
                        let user = {}
                        user.token = token
                        user.username = "ss"
                        user.pay = 6228480395827429378
                        return request(server)
                            .post('/user/pay')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(3)
                                expect(res.body.message).equals("The username is not registered")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the username is registered', () => {
                    it('should return a message of successfully add pay', () => {
                        let user = {}
                        user.token = token
                        user.username = "user1"
                        user.pay = 6228480395827429378
                        return request(server)
                            .post('/user/pay')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Add Payment")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    after(() => {
                        return request(server)
                            .get('/user')
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                let result = _.map(res.body.data, (user) => {
                                    if (user.username === 'user1') {
                                        return {
                                            username: user.username,
                                            pay: user.pay
                                        }
                                    }
                                })
                                expect(result[0].pay.length).to.equal(2)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('DELETE /user/pay', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.username = "user1"
                user.pay = '1'
                return request(server)
                    .delete('/user/pay')
                    .send(user)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
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
                    let user = {}
                    user.token = "123"
                    user.username = "user1"
                    user.pay = '1'
                    return request(server)
                        .delete('/user/pay')
                        .send(user)
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
                describe('when the username is not registered', () => {
                    it('should return a message the username is not registered', () => {
                        let user = {}
                        user.token = token
                        user.username = "ss"
                        user.pay = '1'
                        return request(server)
                            .delete('/user/pay')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(3)
                                expect(res.body.message).equals("The username is not registered")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
                describe('when the username is registered', () => {
                    it('should return a message of successfully add pay', () => {
                        let user = {}
                        user.token = token
                        user.username = "user1"
                        user.pay = '1'
                        return request(server)
                            .delete('/user/pay')
                            .send(user)
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                expect(res.body.message).equals("Successfully Delete Payment")
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    after(() => {
                        return request(server)
                            .get('/user')
                            .set("Accept", "application/json")
                            .expect("Content-Type", /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.code).to.equal(0)
                                let result = _.map(res.body.data, (user) => {
                                    if (user.username === 'user1') {
                                        return {
                                            username: user.username,
                                            pay: user.pay
                                        }
                                    }
                                })
                                expect(result[0].pay.length).to.equal(0)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                })
            })
        })
    })

    describe('POST /user/favorite', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.username = "user1"
                user.favorite = '5dac7c136c707500171b0724'
                return request(server)
                    .post('/user/favorite')
                    .send(user)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
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
                    let user = {}
                    user.token = "123"
                    user.username = "user1"
                    user.favorite = '5dac7c136c707500171b0724'
                    return request(server)
                        .post('/user/favorite')
                        .send(user)
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
        })
    })
})
