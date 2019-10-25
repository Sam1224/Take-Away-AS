/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const order = Schema({
  user: {type: String, required: true},
  seller: {type: String, required: true},
  phone: {type: Number, required: true},
  address: {type: String, required: true},
  note: {type: String, default: ''},
  totalPrice: Number,
  status: {type: Number, default: 0},
  foods: [{
    name: String,
    price: Number,
    quantity: Number
  }]
},
{collection: 'order'})

module.exports = mongoose.model('Order', order)
