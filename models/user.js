/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const user = Schema({
        username: {type: String, required: true},
        password: {type: String, required: true},
        phone: {type: Number, required: true},
        address: [{type: String}],
        pay: [{type: Number}],
        favorite: [{type: String}]
    },
    {collection: 'user'})

module.exports = mongoose.model('User', user)
