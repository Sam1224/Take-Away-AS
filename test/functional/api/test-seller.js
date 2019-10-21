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
        seller = new Seller()
        seller.token = token
        seller.name = 'test2'
        seller.description = 'Meituan Delivery'
        seller.deliveryTime = 38
        seller.bulletin = 'Test 2'
        seller.supports = []
        seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
        seller.pics = [
            "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
        ]
        seller.infos = [
            "Opening hours: 10:00-20:30"
        ]
        await seller.save()
        seller = await Seller.findOne({name: 'test1'})
        validID = seller._id
    })

    describe('GET /seller', () => {
        it('should GET all the sellers', () => {
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
        })
    })
})
