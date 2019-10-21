/**
 * @Author: Sam
 * @Date: 2019/10/21
 * @Version: 1.0
 **/
const chai = require('chai')
const expect = chai.expect
const request = require('supertest')

// mongod-memory-server
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Seller = require('../../../models/seller')
const mongoose = require('mongoose')

const _ = require('lodash')
let server
let mongod
let db, validID

describe('Seller', () => {
    before(async () => {
        try {
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
        } catch (err) {
            console.log(err)
        }
    })

    after(async () => {
        try {
            await db.dropDatabase
        } catch (err) {
            console.log(err)
        }
    })
})
