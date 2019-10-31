/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
var Order = require('../models/order')
var Seller = require('../models/seller')
var router = express.Router()
var jwt = require('jsonwebtoken')
var config = require('../config')

// Constant
const superSecret = config.superSecret
const ERR_OK = 0
const ERR_NOK = -1
const USER_NAT = 1
// eslint-disable-next-line no-unused-vars
const USER_DUP = 2
// eslint-disable-next-line no-unused-vars
const USER_NXT = 3
// eslint-disable-next-line no-unused-vars
const USER_WPW = 4
const ORDER_NONE = 5

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
    jwt.verify(token, superSecret, (err, decoded) => {
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
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

        Order.find({'user': req.params.id}, (err, orders) => {
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
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

        Order.find({'seller': req.params.id}, (err, orders) => {
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
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

        Order.find({'_id': req.params.id}, (err, order) => {
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

  // jwt
  let token = req.body.token
  if (!token) {
    res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
  } else {
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

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
            res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Add Order'}, null, 5))
          }
        })
      }
    })
  }
}

/**
 * DELETE
 * deleteOrder - delete an order
 * @param req
 * @param res
 */
router.deleteOrder = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  // jwt
  let token = req.body.token
  if (!token) {
    res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
  } else {
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

        // eslint-disable-next-line no-unused-vars
        Order.findByIdAndRemove(req.params.id, (err, order) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Delete Order'}, null, 5))
          }
        })
      }
    })
  }
}

/**
 * PUT
 * commentOrder
 * @param req
 * @param res
 */
router.commentOrder = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  // jwt
  let token = req.body.token
  if (!token) {
    res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
  } else {
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

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
                order.status = 1
                order.save((err) => {
                  if (err) {
                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                  } else {
                    res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Update Order'}, null, 5))
                  }
                })
              }
            })
          }
        })
      }
    })
  }
}

/**
 * GET
 * getTopFood - get a user's n top food from one/all seller(s)
 * @param req
 * @param res
 */
router.getTopFood = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  // jwt
  let token = req.body.token
  if (!token) {
    res.send(JSON.stringify({code: USER_NAT, message: 'Not Login Yet, Please Login'}, null, 5))
  } else {
    jwt.verify(token, superSecret, (err, decoded) => {
      if (err) {
        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
      } else {
        req.decoded = decoded

        let user = req.params.user
        let seller = req.params.seller
        let num = req.params.num && req.params.num !== '0' ? Number(req.params.num) : 3
        let query
        if (seller) {
          query = {user: user, seller: seller}
        } else {
          query = {user: user}
        }
        Order.find(query, (err, orders) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            if (orders.length === 0) {
              res.send(JSON.stringify({code: ORDER_NONE, message: 'There are no related orders'}, null, 5))
            } else {
              let foodMap = {}
              orders.forEach((order) => {
                let foods = order.foods
                foods.forEach((food) => {
                  let name = food.name
                  if (foodMap.hasOwnProperty(name)) {
                    foodMap[name] ++
                  } else {
                    foodMap[name] = 1
                  }
                })
              })
              // sort
              const keys = Object.keys(foodMap)
              keys.sort((a, b) => {
                return foodMap[b] - foodMap[a]
              })
              let length = keys.length
              let ret = []
              keys.forEach((key) => {
                let obj = {}
                obj[key] = foodMap[key]
                ret.push(obj)
              })
              if (num < length) {
                ret = ret.slice(0, num)
              }
              res.send(JSON.stringify({code: ERR_OK, data: ret}, null, 5))
            }
          }
        })
      }
    })
  }
}

module.exports = router
