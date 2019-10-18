/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
var mongoose = require('mongoose')
var Order = require('../models/order')
var router = express.Router()

// Constant
const ERR_OK = 0
const ERR_NOK = -1

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

    Order.find((err, orders) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, data: orders}, null, 5))
        }
    })
}

/**
 * GET
 * findAllByUser - get one user's all orders
 * @param req
 * @param res
 */
router.findAllByUser = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    Order.find({"user": req.params.id}, (err, orders) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, data: orders}, null, 5))
        }
    })
}

/**
 * GET
 * findAllBySeller - get one seller's all orders
 * @param req
 * @param res
 */
router.findAllBySeller = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    Order.find({"seller": req.params.id}, (err, orders) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, data: orders}, null, 5))
        }
    })
}

/**
 * GET
 * findOne - get one specific order
 * @param req
 * @param res
 */
router.findOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    Order.find({"_id": req.params.id}, (err, order) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, data: order}, null, 5))
        }
    })
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

module.exports = router
