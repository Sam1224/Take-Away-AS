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
            await user.save()
            let user1 = new User()
            user1.username = "user2"
            user1.password = "123456"
            user1.phone = 2
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
})
