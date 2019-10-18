/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
var mongoose = require('mongoose')
var User = require('../models/user')
var router = express.Router()
var sha1 = require('sha1')

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
 * findAll - get all documents of users
 * @param req
 * @param res
 */
router.findAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    User.find((err, users) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, data: users}, null, 5))
        }
    })
}

/**
 * GET
 * findOne - get one document through '_id'
 * @param req - should contain parameter: id
 * @param res
 */
router.findOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    User.find({"_id": req.params.id}, (err, user) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, data: user}, null, 5))
        }
    })
}

/**
 * POST
 * addUser - create a new user
 * @param req
 * @param res
 */
router.addUser = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    var user = new User()
    user.username = req.body.username
    user.password = sha1(req.body.password)
    user.phone = req.body.phone
    user.address = []
    user.pay = []
    user.favorite = []

    user.save((err) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, message: "Successfully Add User"}, null, 5))
        }
    })
}

module.exports = router
