/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const seller = new Schema({
        name: String,
        description: String,
        deliveryTime: {type: Number, default: 40},
        score: {type: Number, default: 0},
        serviceScore: {type: Number, default: 0},
        foodScore: {type: Number, default: 0},
        rankRate: {type: Number, default: 0},
        minPrice: {type: Number, default: 0},
        deliveryPrice: {type: Number, default: 0},
        ratingCount: {type: Number, default: 0},
        sellCount: {type: Number, default: 0},
        bulletin: String,
        supports: [{
            types: Number,
            description: String
        }],
        avatar: String,
        pics: [{type: String}],
        infos: [{type: String}],
        ratings: [{
            username: String,
            rateTime: Number,
            deliveryTime: Number,
            score: Number,
            rateType: Number,
            text: String,
            avatar: String,
            recommend: [String]
        }],
        goods: [{
            name: String,
            types: String,
            foods: [{
                name: String,
                price: String,
                oldPrice: {type: Number, default: ""},
                description: {type: String, default: ""},
                sellCount: {type: Number, default: 0},
                rating: {type: Number, default: 0},
                info: {type: String, default: ""},
                ratings: [{
                    username: String,
                    rateTime: Number,
                    rateType: Number,
                    text: {type: String, default: ""},
                    avatar: {type: String, default: ""}
                }]
            }]
        }]

    },
    {collection: 'seller'})

module.exports = mongoose.model('Seller', seller)

