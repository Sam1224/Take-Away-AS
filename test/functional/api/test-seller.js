/**
 * @Author: Sam
 * @Date: 2019/10/21
 * @Version: 1.0
 **/
/*eslint no-undef: "off" */
const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const jwt = require('jsonwebtoken')

const config = require('../../../config')

// mongod-memory-server
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Seller = require('../../../models/seller')
const {MongoClient} = require('mongodb')

const _ = require('lodash')
let server
let mongod
let db, validID
// eslint-disable-next-line no-unused-vars
let url, connection, collection

// jwt parameters
let username = 'admin'
let token
let superSecret = config.superSecret

// let expireToken = jwt.sign({username: username}, superSecret, {
//     // 1 s
//     expiresIn: 1
// })

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
    url = await mongod.getConnectionString()
    connection = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    db = connection.db(await mongod.getDbName())
    collection = db.collection('seller')
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
        'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
      ]
      seller.infos = [
        'Invoice supported, please fill in the invoice title when ordered',
        'Class: Other cuisine, porridge store',
        '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
        'Opening hours: 10:00-20:30'
      ]
      seller.ratings = [{
        'username': 'admin',
        'deliveryTime': 30,
        'score': 5,
        'rateType': 0,
        'text': 'Porridge is very good, I often eat this one and will often order them, strongly recommended.',
        'avatar': 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png',
        'recommend': ['Pumpkin Porridge']
      }]
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
        'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
      ]
      seller1.infos = [
        'Opening hours: 10:00-20:30'
      ]
      await seller1.save()
      seller = await Seller.findOne({name: 'test1'})
      // setTimeout(() => {
      validID = seller._id
      // }, 500)
    } catch (err) {
      console.log(err)
    }
  })

  describe('GET /seller', () => {
    it('should GET all the sellers', () => {
      // setTimeout(() => {
      return request(server)
        .get('/seller')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
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
        .catch((err) => {
          console.log(err)
        })
      // }, 1000)
    })
  })

  describe('GET /seller/:id', () => {
    describe('when the id is valid', () => {
      it('should return the matching seller', () => {
        // setTimeout(() => {
        return request(server)
          .get(`/seller/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res.body.data[0]).to.have.property('name', 'test1')
          })
          .catch((err) => {
            console.log(err)
          })
        // }, 1000)
      })
    })
    describe('when the id is invalid', () => {
      it('should return an empty array', () => {
        // setTimeout(() => {
        return request(server)
          .get('/seller/1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(-1)
          })
          .catch((err) => {
            console.log(err)
          })
        // },1000)
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
          'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
        ]
        seller.infos = [
          'Invoice supported, please fill in the invoice title when ordered',
          'Class: Other cuisine, porridge store',
          '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
          'Opening hours: 10:00-20:30'
        ]
        // setTimeout(() => {
        return request(server)
          .post('/seller')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(seller)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
          })
          .catch((err) => {
            console.log(err)
          })
        // }, 1000)
      })
    })
    describe('when there is a jwt token', () => {
      // describe('when the token is expired', () => {
      //     it('should return an expired error', () => {
      //         let seller = new Seller()
      //         seller.token = expireToken
      //         seller.name = 'test3'
      //         seller.description = 'Fengniao Delivery'
      //         seller.deliveryTime = 40
      //         seller.bulletin = 'Test 1'
      //         seller.supports = [{
      //             'type': 1,
      //             'description': 'VC orange juice 80% discount'
      //         }]
      //         seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
      //         seller.pics = [
      //             "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
      //         ]
      //         seller.infos = [
      //             "Invoice supported, please fill in the invoice title when ordered",
      //             "Class: Other cuisine, porridge store",
      //             "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
      //             "Opening hours: 10:00-20:30"
      //         ]
      //         setTimeout(() => {
      //             return request(server)
      //                 .post("/seller")
      //                 .send(seller)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.code).to.equal(-1)
      //                     expect(res.body.error.name).equals("TokenExpiredError")
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      //     after(() => {
      //         return request(server)
      //             .get("/seller")
      //             .set("Accept", "application/json")
      //             .expect("Content-Type", /json/)
      //             .expect(200)
      //             .then((res) => {
      //                 expect(res.body.data.length).to.equal(2)
      //             })
      //             .catch((err) => {
      //                 console.log(err)
      //             })
      //     })
      // })
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
            'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
          ]
          seller.infos = [
            'Invoice supported, please fill in the invoice title when ordered',
            'Class: Other cuisine, porridge store',
            '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
            'Opening hours: 10:00-20:30'
          ]
          // setTimeout(() => {
          return request(server)
            .post('/seller')
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(-1)
              expect(res.body.error.name).equals('JsonWebTokenError')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        // after(() => {
        //     return request(server)
        //         .get("/seller")
        //         .set("Accept", "application/json")
        //         .expect("Content-Type", /json/)
        //         .expect(200)
        //         .then((res) => {
        //             expect(res.body.data.length).to.equal(2)
        //         })
        //         .catch((err) => {
        //             console.log(err)
        //         })
        // })
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
            'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
          ]
          seller.infos = [
            'Invoice supported, please fill in the invoice title when ordered',
            'Class: Other cuisine, porridge store',
            '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
            'Opening hours: 10:00-20:30'
          ]
          // setTimeout(() => {
          return request(server)
            .post('/seller')
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              console.log(res.body.message)
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Add Seller')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        after(() => {
          // setTimeout(() => {
          return request(server)
            .get('/seller')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
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
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
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
          'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
        ]
        seller.infos = [
          'Invoice supported, please fill in the invoice title when ordered',
          'Class: Other cuisine, porridge store',
          '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
          'Opening hours: 10:00-20:30'
        ]
        setTimeout(() => {
          return request(server)
            .put(`/seller/${validID}`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(1)
              expect(res.body.message).equals('Not Login Yet, Please Login')
            })
            .catch((err) => {
              console.log(err)
            })
        }, 1000)
      })
    })
    describe('when there is a jwt token', () => {
      // describe('when the token is expired', () => {
      //     it('should return an expired error', () => {
      //         let seller = new Seller()
      //         token = jwt.sign({username: username}, superSecret, {
      //             // 1 s
      //             expiresIn: 1
      //         })
      //         seller.token = token
      //         seller.name = 'test1'
      //         seller.description = 'Meituan Delivery'
      //         seller.deliveryTime = 40
      //         seller.bulletin = 'Test 1'
      //         seller.supports = [{
      //             'type': 1,
      //             'description': 'VC orange juice 80% discount'
      //         }]
      //         seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
      //         seller.pics = [
      //             "http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180"
      //         ]
      //         seller.infos = [
      //             "Invoice supported, please fill in the invoice title when ordered",
      //             "Class: Other cuisine, porridge store",
      //             "1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing",
      //             "Opening hours: 10:00-20:30"
      //         ]
      //         setTimeout(() => {
      //             return request(server)
      //                 .put(`/seller/${validID}`)
      //                 .send(seller)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.code).to.equal(-1)
      //                     expect(res.body.error.name).equals("TokenExpiredError")
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      //     after(() => {
      //         return request(server)
      //             .get("/seller")
      //             .set("Accept", "application/json")
      //             .expect("Content-Type", /json/)
      //             .expect(200)
      //             .then((res) => {
      //                 expect(res.body.data.length).to.equal(2)
      //             })
      //             .catch((err) => {
      //                 console.log(err)
      //             })
      //     })
      // })
      describe('when the token is invalid', () => {
        it('should return an invalid error', () => {
          let seller = {}
          seller.token = 't23123fhsja'
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
            'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
          ]
          seller.infos = [
            'Invoice supported, please fill in the invoice title when ordered',
            'Class: Other cuisine, porridge store',
            '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
            'Opening hours: 10:00-20:30'
          ]
          setTimeout(() => {
            return request(server)
              .put(`/seller/${validID}`)
              .send(seller)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .then((res) => {
                expect(res.body.code).to.equal(-1)
                expect(res.body.error.name).equals('JsonWebTokenError')
              })
              .catch((err) => {
                console.log(err)
              })
          }, 1000)
        })
        // after(() => {
        //     return request(server)
        //         .get("/seller")
        //         .set("Accept", "application/json")
        //         .expect("Content-Type", /json/)
        //         .expect(200)
        //         .then((res) => {
        //             expect(res.body.data.length).to.equal(2)
        //         })
        //         .catch((err) => {
        //             console.log(err)
        //         })
        // })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully update seller', () => {
          let seller = {}
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
            'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
          ]
          seller.infos = [
            'Invoice supported, please fill in the invoice title when ordered',
            'Class: Other cuisine, porridge store',
            '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
            'Opening hours: 10:00-20:30'
          ]
          // setTimeout(() => {
          return request(server)
            .put(`/seller/${validID}`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Update Seller')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        after(() => {
          // setTimeout(() => {
          return request(server)
            .get('/seller')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.data.length).to.equal(2)
              let result = _.map(res.body.data, (seller) => {
                return {
                  name: seller.name,
                  description: seller.description
                }
              })
              expect(result).to.deep.include({
                name: 'test1',
                description: 'Meituan Delivery'
              })
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
      })
    })
  })

  describe('DELETE /seller/:id', () => {
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        let seller = {}
        setTimeout(() => {
          return request(server)
            .delete(`/seller/${validID}`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(1)
              expect(res.body.message).equals('Not Login Yet, Please Login')
            })
            .catch((err) => {
              console.log(err)
            })
        }, 1000)
      })
    })
    describe('when there is a jwt token', () => {
      // describe('when the token is expired', () => {
      //     it('should return an expired error', () => {
      //         let seller = new Seller()
      //         token = jwt.sign({username: username}, superSecret, {
      //             // 1 s
      //             expiresIn: 1
      //         })
      //         seller.token = token
      //         setTimeout(() => {
      //             return request(server)
      //                 .delete(`/seller/${validID}`)
      //                 .send(seller)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.code).to.equal(-1)
      //                     expect(res.body.error.name).equals("TokenExpiredError")
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      //     after(() => {
      //         setTimeout(() => {
      //             return request(server)
      //                 .get("/seller")
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.data.length).to.equal(2)
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      // })
      describe('when the token is invalid', () => {
        it('should return an invalid error', () => {
          let seller = {}
          seller.token = 't23123fhsja'
          setTimeout(() => {
            return request(server)
              .delete(`/seller/${validID}`)
              .send(seller)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .then((res) => {
                expect(res.body.code).to.equal(-1)
                expect(res.body.error.name).equals('JsonWebTokenError')
              })
              .catch((err) => {
                console.log(err)
              })
          }, 1000)
        })
        // after(() => {
        //     return request(server)
        //         .get("/seller")
        //         .set("Accept", "application/json")
        //         .expect("Content-Type", /json/)
        //         .expect(200)
        //         .then((res) => {
        //             expect(res.body.data.length).to.equal(2)
        //         })
        //         .catch((err) => {
        //             console.log(err)
        //         })
        // })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully delete seller', () => {
          let seller = {}
          seller.token = token
          // setTimeout(() => {
          return request(server)
            .delete(`/seller/${validID}`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Delete Seller')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        after(() => {
          // setTimeout(() => {
          return request(server)
            .get('/seller')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.data.length).to.equal(1)
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
      })
    })
  })

  describe('PUT /seller/:id/goods', () => {
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        let seller = {}
        seller.goods = [{
          'name': 'Hot Sales',
          'types': -1,
          'foods': [
            {
              'name': 'Egg & Pork Congee',
              'price': 10,
              'oldPrice': '',
              'description': 'Salty porridge',
              'info': 'A bowl of preserved egg thin meat porridge, always I go to the porridge shop when the selection of fragrant soft, full belly warm heart, preserved egg Q bomb and thin meat slippery with porridge fragrant overflow at full mouth, let a person drink such a bowl of porridge also feel satisfied.',
              'icon': 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
              'image': 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750'
            }
          ]
        }]
        setTimeout(() => {
          return request(server)
            .put(`/seller/${validID}/goods`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(1)
              expect(res.body.message).equals('Not Login Yet, Please Login')
            })
            .catch((err) => {
              console.log(err)
            })
        }, 1000)
      })
    })
    describe('when there is a jwt token', () => {
      // describe('when the token is expired', () => {
      //     it('should return an expired error', () => {
      //         let seller = new Seller()
      //         token = jwt.sign({username: username}, superSecret, {
      //             // 1 s
      //             expiresIn: 1
      //         })
      //         seller.token = token
      //         seller.goods = [{
      //             "name": "Hot Sales",
      //             "types": -1,
      //             "foods": [
      //                 {
      //                     "name": "Egg & Pork Congee",
      //                     "price": 10,
      //                     "oldPrice": "",
      //                     "description": "Salty porridge",
      //                     "info": "A bowl of preserved egg thin meat porridge, always I go to the porridge shop when the selection of fragrant soft, full belly warm heart, preserved egg Q bomb and thin meat slippery with porridge fragrant overflow at full mouth, let a person drink such a bowl of porridge also feel satisfied.",
      //                     "icon": "http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114",
      //                     "image": "http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750"
      //                 }
      //             ]
      //         }]
      //         setTimeout(() => {
      //             return request(server)
      //                 .put(`/seller/${validID}/goods`)
      //                 .send(seller)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.code).to.equal(-1)
      //                     expect(res.body.error.name).equals("TokenExpiredError")
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      //     after(() => {
      //         // setTimeout(() => {
      //             return request(server)
      //                 .get("/seller")
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.data.length).to.equal(2)
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         // }, 1000)
      //     })
      // })
      describe('when the token is invalid', () => {
        it('should return an invalid error', () => {
          let seller = {}
          seller.token = '123fjdsaf'
          seller.goods = [{
            'name': 'Hot Sales',
            'types': -1,
            'foods': [
              {
                'name': 'Egg & Pork Congee',
                'price': 10,
                'oldPrice': '',
                'description': 'Salty porridge',
                'info': 'A bowl of preserved egg thin meat porridge, always I go to the porridge shop when the selection of fragrant soft, full belly warm heart, preserved egg Q bomb and thin meat slippery with porridge fragrant overflow at full mouth, let a person drink such a bowl of porridge also feel satisfied.',
                'icon': 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
                'image': 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750'
              }
            ]
          }]
          // setTimeout(() => {
          return request(server)
            .put(`/seller/${validID}/goods`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .then((res) => {
              expect(res.body.code).to.equal(-1)
              expect(res.body.error.name).equals('JsonWebTokenError')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        // after(() => {
        //     // setTimeout(() => {
        //         return request(server)
        //             .get("/seller")
        //             .set("Accept", "application/json")
        //             .expect("Content-Type", /json/)
        //             .expect(200)
        //             .then((res) => {
        //                 expect(res.body.data.length).to.equal(2)
        //             })
        //             .catch((err) => {
        //                 console.log(err)
        //             })
        //     // }, 1000)
        // })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully update goods of seller', () => {
          let seller = {}
          seller.token = token
          seller.goods = [{
            'name': 'Hot Sales',
            'types': -1,
            'foods': [
              {
                'name': 'Egg & Pork Congee',
                'price': 10,
                'oldPrice': '',
                'description': 'Salty porridge',
                'info': 'A bowl of preserved egg thin meat porridge, always I go to the porridge shop when the selection of fragrant soft, full belly warm heart, preserved egg Q bomb and thin meat slippery with porridge fragrant overflow at full mouth, let a person drink such a bowl of porridge also feel satisfied.',
                'icon': 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
                'image': 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750'
              }
            ]
          }]
          // setTimeout(() => {
          return request(server)
            .put(`/seller/${validID}/goods`)
            .send(seller)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Update Goods')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        after(() => {
          // setTimeout(() => {
          return request(server)
            .get(`/seller/${validID}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.data.length).to.equal(1)
              expect(res.body.data[0].goods.length).to.equal(1)
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
      })
    })
  })

  describe('POST /seller/:id/ratings', () => {
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        let rating = {}
        rating.username = 'admin'
        rating.deliveryTime = 30
        rating.score = 5
        rating.rateType = 0
        rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
        rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
        rating.recommend = ['Pumpkin Porridge']
        setTimeout(() => {
          return request(server)
            .post(`/seller/${validID}/ratings`)
            .send(rating)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(1)
              expect(res.body.message).equals('Not Login Yet, Please Login')
            })
            .catch((err) => {
              console.log(err)
            })
        }, 1000)
      })
    })
    describe('when there is a jwt token', () => {
      // describe('when the token is expired', () => {
      //     it('should return an expired error', () => {
      //         let rating = {}
      //         token = jwt.sign({username: username}, superSecret, {
      //             // 1 s
      //             expiresIn: 1
      //         })
      //         rating.token = token
      //         rating.username = 'admin'
      //         rating.deliveryTime = 30
      //         rating.score = 5
      //         rating.rateType = 0
      //         rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
      //         rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
      //         rating.recommend = ["Pumpkin Porridge"]
      //         setTimeout(() => {
      //             return request(server)
      //                 .post(`/seller/${validID}/ratings`)
      //                 .send(rating)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.code).to.equal(-1)
      //                     expect(res.body.error.name).equals("TokenExpiredError")
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      //     after(() => {
      //         setTimeout(() => {
      //             return request(server)
      //                 .get(`/seller/${validID}`)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.data.ratings.length).to.equal(1)
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      // })
      describe('when the token is invalid', () => {
        it('should return an invalid error', () => {
          let rating = {}
          rating.token = '123fjdsaf'
          rating.username = 'admin'
          rating.deliveryTime = 30
          rating.score = 5
          rating.rateType = 0
          rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
          rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
          rating.recommend = ['Pumpkin Porridge']
          // setTimeout(() => {
          return request(server)
            .post(`/seller/${validID}/ratings`)
            .send(rating)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .then((res) => {
              expect(res.body.code).to.equal(-1)
              expect(res.body.error.name).equals('JsonWebTokenError')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        // after(() => {
        //     // setTimeout(() => {
        //         return request(server)
        //             .get(`/seller/${validID}`)
        //             .set("Accept", "application/json")
        //             .expect("Content-Type", /json/)
        //             .expect(200)
        //             .then((res) => {
        //                 expect(res.body.data.ratings.length).to.equal(1)
        //             })
        //             .catch((err) => {
        //                 console.log(err)
        //             })
        //     // }, 1000)
        // })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully add rating of seller', () => {
          let rating = {}
          rating.token = token
          rating.username = 'admin'
          rating.deliveryTime = 30
          rating.score = 5
          rating.rateType = 0
          rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
          rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
          rating.recommend = ['Pumpkin Porridge']
          // setTimeout(() => {
          return request(server)
            .post(`/seller/${validID}/ratings`)
            .send(rating)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Add Rating')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        after(() => {
          // setTimeout(() => {
          return request(server)
            .get(`/seller/${validID}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.data.length).to.equal(1)
              expect(res.body.data[0].ratings.length).to.equal(2)
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
      })
    })
  })

  describe('DELETE /seller/:id/ratings', () => {
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        let rating = {}
        rating.username = 'admin'
        rating.deliveryTime = 30
        rating.score = 5
        rating.rateType = 0
        rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
        rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
        rating.recommend = ['Pumpkin Porridge']
        setTimeout(() => {
          return request(server)
            .delete(`/seller/${validID}/ratings`)
            .send(rating)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(1)
              expect(res.body.message).equals('Not Login Yet, Please Login')
            })
            .catch((err) => {
              console.log(err)
            })
        }, 1000)
      })
    })
    describe('when there is a jwt token', () => {
      // describe('when the token is expired', () => {
      //     it('should return an expired error', () => {
      //         let rating = {}
      //         token = jwt.sign({username: username}, superSecret, {
      //             // 1 s
      //             expiresIn: 1
      //         })
      //         rating.token = token
      //         rating.username = 'admin'
      //         rating.deliveryTime = 30
      //         rating.score = 5
      //         rating.rateType = 0
      //         rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
      //         rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
      //         rating.recommend = ["Pumpkin Porridge"]
      //         setTimeout(() => {
      //             return request(server)
      //                 .delete(`/seller/${validID}/ratings`)
      //                 .send(rating)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.code).to.equal(-1)
      //                     expect(res.body.error.name).equals("TokenExpiredError")
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      //     after(() => {
      //         setTimeout(() => {
      //             return request(server)
      //                 .get(`/seller/${validID}`)
      //                 .set("Accept", "application/json")
      //                 .expect("Content-Type", /json/)
      //                 .expect(200)
      //                 .then((res) => {
      //                     expect(res.body.data.ratings.length).to.equal(1)
      //                 })
      //                 .catch((err) => {
      //                     console.log(err)
      //                 })
      //         }, 1000)
      //     })
      // })
      describe('when the token is invalid', () => {
        it('should return an invalid error', () => {
          let rating = {}
          rating.token = '123fjdsaf'
          rating.username = 'admin'
          rating.deliveryTime = 30
          rating.score = 5
          rating.rateType = 0
          rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
          rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
          rating.recommend = ['Pumpkin Porridge']
          // setTimeout(() => {
          return request(server)
            .delete(`/seller/${validID}/ratings`)
            .send(rating)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(-1)
              expect(res.body.error.name).equals('JsonWebTokenError')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        // after(() => {
        //     // setTimeout(() => {
        //         return request(server)
        //             .get(`/seller/${validID}`)
        //             .set("Accept", "application/json")
        //             .expect("Content-Type", /json/)
        //             .expect(200)
        //             .then((res) => {
        //                 expect(res.body.data.ratings.length).to.equal(1)
        //             })
        //             .catch((err) => {
        //                 console.log(err)
        //             })
        //     // }, 1000)
        // })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully add rating of seller', () => {
          let rating = {}
          rating.token = token
          rating.username = 'admin'
          rating.deliveryTime = 30
          rating.score = 5
          rating.rateType = 0
          rating.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
          rating.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
          rating.recommend = ['Pumpkin Porridge']
          // setTimeout(() => {
          return request(server)
            .delete(`/seller/${validID}/ratings`)
            .send(rating)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Delete Rating')
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
        after(() => {
          // setTimeout(() => {
          return request(server)
            .get(`/seller/${validID}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.data.length).to.equal(1)
              let result = _.map(res.body.data, (seller) => {
                return {
                  ratings: seller.ratings
                }
              })
              expect(result[0].ratings.length).to.equal(0)
            })
            .catch((err) => {
              console.log(err)
            })
          // }, 1000)
        })
      })
    })
  })

  describe('POST /seller/search', () => {
    describe('when the keyword is not empty', () => {
      it('should GET all the satisfying sellers', () => {
        const keyword = {
          'keyword': 'test'
        }
        // setTimeout(() => {
        return request(server)
          .post('/seller/search')
          .set('Accept', 'application/json')
          .send(keyword)
          .expect('Content-Type', /json/)
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
          .catch((err) => {
            console.log(err)
          })
        // }, 1000)
      })
    })
    describe('when the keyword is empty', () => {
      it('should GET all the sellers', () => {
        const keyword = {
          'keyword': ''
        }
        // setTimeout(() => {
        return request(server)
          .post('/seller/search')
          .set('Accept', 'application/json')
          .send(keyword)
          .expect('Content-Type', /json/)
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
          .catch((err) => {
            console.log(err)
          })
        // }, 1000)
      })
    })
  })

  describe('GET /seller/sellcount/:num/:seq', function () {
    this.timeout(20000)
    beforeEach(async() => {
      try {
        // reset the db
        await Seller.deleteMany({})

        let rankRates = [80, 95, 79.9, 100, 96]
        let sellCounts = [12, 7, 24, 3, 55]
        for (let i = 0; i < 5; i++) {
          let seller = new Seller()
          seller.token = token
          seller.name = `Test${i + 1}`
          seller.description = 'Fengniao Delivery'
          seller.deliveryTime = 40
          seller.bulletin = `Test ${i + 1}`
          seller.rankRate = rankRates[i]
          seller.sellCount = sellCounts[i]
          seller.supports = [{
            'type': 1,
            'description': 'VC orange juice 80% discount'
          }]
          seller.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
          seller.pics = [
            'http://fuss10.elemecdn.com/8/71/c5cf5715740998d5040dda6e66abfjpeg.jpeg?imageView2/1/w/180/h/180'
          ]
          seller.infos = [
            'Invoice supported, please fill in the invoice title when ordered',
            'Class: Other cuisine, porridge store',
            '1340, Unit 102, Block B, bottom business, longguan real estate building, Western Huilongguan Street, Changping, Beijing',
            'Opening hours: 10:00-20:30'
          ]
          seller.ratings = [{
            'username': 'admin',
            'deliveryTime': 30,
            'score': 5,
            'rateType': 0,
            'text': 'Porridge is very good, I often eat this one and will often order them, strongly recommended.',
            'avatar': 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png',
            'recommend': ['Pumpkin Porridge']
          }]
          await seller.save()
        }
      } catch (err) {
        console.log(err)
      }
    })
    describe('when num is a valid integer', () => {
      describe('when seq is -1', () => {
        it('should return a list descending by sellCount', () => {
          return request(server)
              .get('/seller/sellcount/3/-1')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .then((res) => {
                expect(res.body.code).to.equal(0)
                expect(res.body.data).to.be.a('array')
                expect(res.body.data.length).to.equal(3)
                expect(res.body.num).to.equal(3)
                let seller1 = _.nth(res.body.data, 0)
                let seller2 = _.nth(res.body.data, 1)
                let seller3 = _.nth(res.body.data, 2)
                expect(seller1.name).equals('Test5')
                expect(seller1.sellCount).to.equal(55)
                expect(seller2.name).equals('Test3')
                expect(seller2.sellCount).to.equal(24)
                expect(seller3.name).equals('Test1')
                expect(seller3.sellCount).to.equal(12)
              })
              .catch((err) => {
                console.log(err)
              })
        })
      })
      describe('when seq is 1', () => {
        it('should return a list ascending by sellCount', () => {
          return request(server)
              .get('/seller/sellcount/3/1')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .then((res) => {
                expect(res.body.code).to.equal(0)
                expect(res.body.data).to.be.a('array')
                expect(res.body.data.length).to.equal(3)
                expect(res.body.num).to.equal(3)
                let seller1 = _.nth(res.body.data, 0)
                let seller2 = _.nth(res.body.data, 1)
                let seller3 = _.nth(res.body.data, 2)
                expect(seller1.name).equals('Test4')
                expect(seller1.sellCount).to.equal(3)
                expect(seller2.name).equals('Test2')
                expect(seller2.sellCount).to.equal(7)
                expect(seller3.name).equals('Test1')
                expect(seller3.sellCount).to.equal(12)
              })
              .catch((err) => {
                console.log(err)
              })
        })
      })
      describe('when seq is either -1 or 1', () => {
        it('should return a list descending by sellCount', () => {
          return request(server)
              .get('/seller/sellcount/3/-1')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .then((res) => {
                expect(res.body.code).to.equal(0)
                expect(res.body.data).to.be.a('array')
                expect(res.body.data.length).to.equal(3)
                expect(res.body.num).to.equal(3)
                let seller1 = _.nth(res.body.data, 0)
                let seller2 = _.nth(res.body.data, 1)
                let seller3 = _.nth(res.body.data, 2)
                expect(seller1.name).equals('Test5')
                expect(seller1.sellCount).to.equal(55)
                expect(seller2.name).equals('Test3')
                expect(seller2.sellCount).to.equal(24)
                expect(seller3.name).equals('Test1')
                expect(seller3.sellCount).to.equal(12)
              })
              .catch((err) => {
                console.log(err)
              })
        })
      })
    })
    describe('when num is a valid float number', () => {
      it('should be treated as the largest integer less than the num', () => {
        return request(server)
            .get('/seller/sellcount/2.5/-1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.data).to.be.a('array')
              expect(res.body.data.length).to.equal(2)
              expect(res.body.num).to.equal(2)
              let seller1 = _.nth(res.body.data, 0)
              let seller2 = _.nth(res.body.data, 1)
              expect(seller1.name).equals('Test5')
              expect(seller1.sellCount).to.equal(55)
              expect(seller2.name).equals('Test3')
              expect(seller2.sellCount).to.equal(24)
            })
            .catch((err) => {
              console.log(err)
            })
      })
    })
    describe('when num is larger than the num of all sellers', () => {
      it('should return all sellers', () => {
        return request(server)
            .get('/seller/sellcount/10/-1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.data).to.be.a('array')
              expect(res.body.data.length).to.equal(5)
              expect(res.body.num).to.equal(5)
              let seller1 = _.nth(res.body.data, 0)
              let seller2 = _.nth(res.body.data, 1)
              let seller3 = _.nth(res.body.data, 2)
              let seller4 = _.nth(res.body.data, 3)
              let seller5 = _.nth(res.body.data, 4)
              expect(seller1.name).equals('Test5')
              expect(seller1.sellCount).to.equal(55)
              expect(seller2.name).equals('Test3')
              expect(seller2.sellCount).to.equal(24)
              expect(seller3.name).equals('Test1')
              expect(seller3.sellCount).to.equal(12)
              expect(seller4.name).equals('Test2')
              expect(seller4.sellCount).to.equal(7)
              expect(seller5.name).equals('Test4')
              expect(seller5.sellCount).to.equal(3)
            })
            .catch((err) => {
              console.log(err)
            })
      })
    })
    describe('when num is a negative integer', () => {
      it('should return be treated as its absolute value', () => {
        return request(server)
            .get('/seller/sellcount/-2/-1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.data).to.be.a('array')
              expect(res.body.data.length).to.equal(2)
              expect(res.body.num).to.equal(2)
              let seller1 = _.nth(res.body.data, 0)
              let seller2 = _.nth(res.body.data, 1)
              expect(seller1.name).equals('Test5')
              expect(seller1.sellCount).to.equal(55)
              expect(seller2.name).equals('Test3')
              expect(seller2.sellCount).to.equal(24)
            })
            .catch((err) => {
              console.log(err)
            })
      })
    })
  })
})
