/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
var mongoose = require('mongoose')
var Order = require('../models/order')
var Seller = require('../models/seller')
var router = express.Router()
var sha1 = require('sha1')
var jwt = require('jsonwebtoken')
var config = require('../config')

// Constant
const superSecret = config.superSecret
const ERR_OK = 0
const ERR_NOK = -1
const USER_NAT = 1
const USER_DUP = 2
const USER_NXT = 3
const USER_WPW = 4

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/takeawayapp', {useNewUrlParser: true, useUnifiedTopology: true})

var db = mongoose.connection

db.on('error', (err) => {
    console.log('connection error', err)
})
db.once('open', function () {
    console.log('connected to database')
})

/**
 * GET
 * findAll - get all orders
 * @param req
 * @param res
 */
router.findAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    // jwt
    let token = req.body.token
    if (!token) {
        res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
    } else {
        jwt.verify(token, config.superSecret, (err, decoded) => {
            if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
            } else {
                req.decoded = decoded

                Order.find((err, orders) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        res.send(JSON.stringify({code: ERR_OK, data: orders}, null, 5))
                    }
                })
            }
        })
    }
}

/**
 * GET
 * findAllByUser - get one user's all orders
 * @param req
 * @param res
 */
router.findAllByUser = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    // jwt
    let token = req.body.token
    if (!token) {
        res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
    } else {
        jwt.verify(token, config.superSecret, (err, decoded) => {
            if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
            } else {
                req.decoded = decoded

                Order.find({"user": req.params.id}, (err, orders) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        res.send(JSON.stringify({code: ERR_OK, data: orders}, null, 5))
                    }
                })
            }
        })
    }
}

/**
 * GET
 * findAllBySeller - get one seller's all orders
 * @param req
 * @param res
 */
router.findAllBySeller = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    // jwt
    let token = req.body.token
    if (!token) {
        res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
    } else {
        jwt.verify(token, config.superSecret, (err, decoded) => {
            if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
            } else {
                req.decoded = decoded

                Order.find({"seller": req.params.id}, (err, orders) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        res.send(JSON.stringify({code: ERR_OK, data: orders}, null, 5))
                    }
                })
            }
        })
    }
}

/**
 * GET
 * findOne - get one specific order
 * @param req
 * @param res
 */
router.findOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    // jwt
    let token = req.body.token
    if (!token) {
        res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
    } else {
        jwt.verify(token, config.superSecret, (err, decoded) => {
            if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
            } else {
                req.decoded = decoded

                Order.find({"_id": req.params.id}, (err, order) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        res.send(JSON.stringify({code: ERR_OK, data: order}, null, 5))
                    }
                })
            }
        })
    }
}

/**
 * POST
 * addOrder - add one specific order
 * @param req
 * @param res
 */
router.addOrder = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    var order = new Order()
    order.user = req.body.user
    order.seller = req.body.seller
    order.phone = req.body.phone
    order.address = req.body.address
    order.note = req.body.note
    // 0 - to be commented, 1 - commented
    order.status = 0
    order.foods = req.body.foods
    let totalPrice = 0
    order.foods.forEach((food) => {
        totalPrice += food.price * food.quantity
    })
    order.totalPrice = totalPrice

    order.save((err) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, message: "Successfully Add Order"}, null, 5))
        }
    })
}

/**
 * DELETE
 * deleteOrder - delete an order
 * @param req
 * @param res
 */
router.deleteOrder = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    Order.findByIdAndRemove(req.params.id, (err, order) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, message: "Successfully Delete Order"}, null, 5))
        }
    })
}

/**
 *
 * @param req
 * @param res
 */
router.commentOrder = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    Order.findById(req.params.id, (err, order) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            // add a rating to seller
            let rating = {}
            let seller = req.body.seller
            rating.username = req.body.username
            rating.rateTime = new Date().getTime()
            rating.deliveryTime = req.body.deliveryTime
            rating.score = req.body.score
            rating.rateType = req.body.rateType
            rating.text = req.body.text
            rating.avatar = req.body.avatar
            rating.recommend = req.body.recommend
            Seller.update({_id: seller}, {$addToSet: {ratings: rating}}, (err) => {
                if (err) {
                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                } else {
                    res.send(JSON.stringify({code: ERR_OK, message: "Successfully Add Rating"}, null, 5))
                }
            })

            order.status = 1
            order.save((err) => {
                if (err) {
                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                } else {
                    res.send(JSON.stringify({code: ERR_OK, message: "Successfully Update Order"}, null, 5))
                }
            })
        }
    })
}

module.exports = router
