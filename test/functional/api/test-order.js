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
})
