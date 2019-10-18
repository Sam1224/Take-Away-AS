/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
var mongoose = require('mongoose')
var Seller = require('../models/seller')
var router = express.Router()

// Constant
const ERR_OK = 0
const ERR_NOK = -1

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/takeawayapp', {useNewUrlParser: true, useUnifiedTopology: true})

var db = mongoose.connection;

db.on('error', (err) => {
    console.log('connection error', err);
})
db.once('open', function () {
    console.log('connected to database');
})

/**
 * GET
 * findAll - get all documents stored in the database
 * @param req
 * @param res
 */
router.findAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    Seller.find(function (err, sellers) {
        if (err)
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        else {
            res.send(JSON.stringify({code: ERR_OK, data: sellers}, null, 5))
        }
    })
}

module.exports = router
