/**
 * @Author: Sam
 * @Date: 2019/10/22
 * @Version: 1.0
 **/
/*eslint no-undef: "off" */
const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const jwt = require('jsonwebtoken')
const nock = require('nock')

const config = require('../../../config')

// mongod-memory-server
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Order = require('../../../models/order')
const Seller = require('../../../models/seller')
const {MongoClient} = require('mongodb')

// eslint-disable-next-line no-unused-vars
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

let sellerID

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
      order.user = 'user1'
      order.seller = 'seller1'
      order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
      order.phone = 353894889596
      order.note = 'Not spicy!'
      order.foods = [
        {
          'name': 'Egg & Pork Congee',
          'price': 10,
          'quantity': 2
        }
      ]
      await order.save()
      let order1 = new Order()
      order1.token = token
      order1.user = 'user2'
      order1.seller = 'seller2'
      order1.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
      order1.phone = 353894889596
      order1.note = 'Not spicy!'
      order1.foods = [
        {
          'name': 'Rice Cake Stir-Fried with Crabs',
          'price': 14,
          'quantity': 1
        }
      ]
      await order1.save()
      let order2 = new Order()
      order2.token = token
      order2.user = 'user2'
      order2.seller = 'seller1'
      order2.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
      order2.phone = 353894889596
      order2.note = 'Not spicy!'
      order2.foods = [
        {
          'name': 'Rice Cake Stir-Fried with Crabs',
          'price': 14,
          'quantity': 1
        }
      ]
      await order2.save()
      order = await Order.findOne({user: 'user1'})
      validID = order._id

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
      seller = await Seller.findOne({name: 'test1'})
      sellerID = seller._id
    } catch (err) {
      console.log(err)
    }
  })

  describe('GET /order', () => {
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        let order = {}
        return request(server)
          .get('/order')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          return request(server)
            .get('/order')
            .send(order)
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
        })
      })
      describe('when the token is valid', () => {
        it('should return all orders ', () => {
          let order = {}
          order.token = token
          return request(server)
            .get('/order')
            .send(order)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
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
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          return request(server)
            .get('/order/user/user2')
            .send(order)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          return request(server)
            .get('/order/seller/seller1')
            .send(order)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          return request(server)
            .get(`/order/${validID}`)
            .send(order)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
        order.user = 'user3'
        order.seller = 'seller3'
        order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
        order.phone = 353894889596
        order.note = 'Not spicy!'
        order.foods = [
          {
            'name': 'Egg & Pork Congee',
            'price': 10,
            'quantity': 2
          },
          {
            'name': 'Rice Cake Stir-Fried with Crabs',
            'price': 14,
            'quantity': 1
          }
        ]
        return request(server)
          .post('/order')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          order.user = 'user3'
          order.seller = 'seller3'
          order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
          order.phone = 353894889596
          order.note = 'Not spicy!'
          order.foods = [
            {
              'name': 'Egg & Pork Congee',
              'price': 10,
              'quantity': 2
            },
            {
              'name': 'Rice Cake Stir-Fried with Crabs',
              'price': 14,
              'quantity': 1
            }
          ]
          return request(server)
            .post('/order')
            .send(order)
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
        })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully add order', () => {
          let order = {}
          order.token = token
          order.user = 'user3'
          order.seller = 'seller3'
          order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
          order.phone = 353894889596
          order.note = 'Not spicy!'
          order.foods = [
            {
              'name': 'Egg & Pork Congee',
              'price': 10,
              'quantity': 2
            },
            {
              'name': 'Rice Cake Stir-Fried with Crabs',
              'price': 14,
              'quantity': 1
            }
          ]
          return request(server)
            .post('/order')
            .send(order)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Add Order')
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
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
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
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          return request(server)
            .delete(`/order/${validID}`)
            .send(order)
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .then((res) => {
                expect(res.body.code).to.equal(0)
                expect(res.body.message).equals('Successfully Delete Order')
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
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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
        describe('when the id is invalid', () => {
          it('should return an error', () => {
            let order = {}
            order.token = token
            return request(server)
              .delete('/order/123')
              .send(order)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
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

  describe('PUT /order/:id', () => {
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        let order = {}
        order.seller = '5dac7c136c707500171b0724'
        order.username = 'admin'
        order.deliveryTime = 30
        order.score = 5
        order.rateType = 0
        order.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
        order.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
        order.recommend = ['Pumpkin Porridge']
        return request(server)
          .put(`/order/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send(order)
          .expect(200)
          .then((res) => {
            expect(res.body.code).to.equal(1)
            expect(res.body.message).equals('Not Login Yet, Please Login')
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
          order.token = '123'
          order.seller = '5dac7c136c707500171b0724'
          order.username = 'admin'
          order.deliveryTime = 30
          order.score = 5
          order.rateType = 0
          order.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
          order.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
          order.recommend = ['Pumpkin Porridge']
          return request(server)
            .put(`/order/${validID}`)
            .send(order)
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
        })
      })
      describe('when the token is valid', () => {
        it('should return a message of successfully update order', () => {
          let order = {}
          order.token = token
          order.seller = sellerID
          order.username = 'admin'
          order.deliveryTime = 30
          order.score = 5
          order.rateType = 0
          order.text = 'Porridge is very good, I often eat this one and will often order them, strongly recommended.'
          order.avatar = 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png'
          order.recommend = ['Pumpkin Porridge']
          return request(server)
            .put(`/order/${validID}`)
            .send(order)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.message).equals('Successfully Update Order')
            })
            .catch((err) => {
              console.log(err)
            })
        })
        after(() => {
          return request(server)
            .get(`/seller/${sellerID}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
              expect(res.body.code).to.equal(0)
              expect(res.body.data[0].ratings.length).to.equal(2)
            })
            .catch((err) => {
              console.log(err)
            })
        })
      })
    })
  })

  describe('GET /order/topfood/:user/:seller/:num', function () {
    this.timeout(20000)
    beforeEach(async () => {
      try {
        // reset the db
        await Order.deleteMany({})

        for (let i = 0; i < 7; i++) {
          let order = new Order()
          order.token = token
          order.user = 'user1'
          order.seller = 'seller1'
          order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
          order.phone = 353894889596
          order.note = 'Not spicy!'
          order.foods = [
            {
              'name': 'Egg & Pork Congee',
              'price': 10,
              'quantity': 2
            }
          ]
          await order.save()
        }
        for (let i = 0; i < 3; i++) {
          let order = new Order()
          order.token = token
          order.user = 'user1'
          order.seller = 'seller1'
          order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
          order.phone = 353894889596
          order.note = 'Not spicy!'
          order.foods = [
            {
              'name': 'Rice Cake Stir-Fried with Crabs',
              'price': 14,
              'quantity': 1
            }
          ]
          await order.save()
        }
        for (let i = 0; i < 1; i++) {
          let order = new Order()
          order.token = token
          order.user = 'user1'
          order.seller = 'seller1'
          order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
          order.phone = 353894889596
          order.note = 'Not spicy!'
          order.foods = [
            {
              'name': 'Egg',
              'price': 2,
              'quantity': 5
            }
          ]
          await order.save()
        }
        for (let i = 0; i < 2; i++) {
          let order = new Order()
          order.token = token
          order.user = 'user1'
          order.seller = 'seller1'
          order.address = 'APARTMENT 19, BLOCK 2, RIVERWALK, INNER RING ROAD, WATERFORD, IRELAND'
          order.phone = 353894889596
          order.note = 'Not spicy!'
          order.foods = [
            {
              'name': 'Beef Pie',
              'price': 15,
              'quantity': 2
            }
          ]
          await order.save()
        }
      } catch (err) {
        console.log(err)
      }
    })
    describe('when there is no jwt token', () => {
      it('should require to login if it does not have a jwt token', () => {
        return request(server)
            .get('/order/topfood/user1/seller1/3')
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
      })
    })
    describe('when there is a jwt token', () => {
      describe('when the token is invalid', () => {
        it('should return an invalid error', () => {
          let order = {}
          order.token = '123'
          return request(server)
              .get('/order/topfood/user1/seller1/3')
              .send(order)
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
        })
      })
      describe('when the token is valid', () => {
        describe('when the user id is invalid', () => {
          it('should return a message there are no related orders', () => {
            let order = {}
            order.token = token
            return request(server)
                .get('/order/topfood/u/seller1/3')
                .send(order)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                  expect(res.body.code).to.equal(5)
                  expect(res.body.message).equals('There are no related orders')
                })
                .catch((err) => {
                  console.log(err)
                })
          })
        })
        describe('when the user id is valid', () => {
          describe('when the seller id is invalid', () => {
            it('should return a message there are no related orders', () => {
              let order = {}
              order.token = token
              return request(server)
                  .get('/order/topfood/user1/s/3')
                  .send(order)
                  .set('Accept', 'application/json')
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .then((res) => {
                    expect(res.body.code).to.equal(5)
                    expect(res.body.message).equals('There are no related orders')
                  })
                  .catch((err) => {
                    console.log(err)
                  })
            })
          })
          describe('when the seller id is valid', () => {
            describe('when the num is a valid integer', () => {
              it('should return return an array of the top n foods with the most buying times', () => {
                let order = {}
                order.token = token
                return request(server)
                    .get('/order/topfood/user1/seller1/3')
                    .send(order)
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                      expect(res.body.code).to.equal(0)
                      expect(res.body.data.length).to.equal(3)
                      expect(res.body.data).to.deep.include({
                        "Egg & Pork Congee": 7
                      })
                      expect(res.body.data).to.deep.include({
                        "Rice Cake Stir-Fried with Crabs": 3
                      })
                      expect(res.body.data).to.deep.include({
                        "Beef Pie": 2
                      })
                    })
                    .catch((err) => {
                      console.log(err)
                    })
              })
            })
            describe('when the num is invalid', () => {
              describe('when the num is 0', () => {
                it('should be treated as 3 by default', () => {
                  let order = {}
                  order.token = token
                  return request(server)
                      .get('/order/topfood/user1/seller1/0')
                      .send(order)
                      .set('Accept', 'application/json')
                      .expect('Content-Type', /json/)
                      .expect(200)
                      .then((res) => {
                        expect(res.body.code).to.equal(0)
                        expect(res.body.data.length).to.equal(3)
                        expect(res.body.data).to.deep.include({
                          "Egg & Pork Congee": 7
                        })
                        expect(res.body.data).to.deep.include({
                          "Rice Cake Stir-Fried with Crabs": 3
                        })
                        expect(res.body.data).to.deep.include({
                          "Beef Pie": 2
                        })
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
    })
  })
})
