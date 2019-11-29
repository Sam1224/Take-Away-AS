/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
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

/**
 * GET
 * findAll - get all documents stored in the database
 * @param req
 * @param res
 */
router.findAll = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  Seller.find((err, sellers) => {
    if (err) {
      res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
    }
    else {
      res.send(JSON.stringify({code: ERR_OK, data: sellers}, null, 5))
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

  Seller.find({'_id': req.params.id}, (err, seller) => {
    if (err) {
      res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
    } else {
      res.send(JSON.stringify({code: ERR_OK, data: seller}, null, 5))
    }
  })
}

/**
 * POST
 * addSeller - create a new seller and save it to the database
 * @param req
 * @param res
 */
router.addSeller = (req, res) => {
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

        var seller = new Seller()

        seller.name = req.body.name
        seller.description = req.body.description
        seller.deliveryTime = req.body.deliveryTime
        seller.bulletin = req.body.bulletin
        seller.supports = req.body.supports
        seller.avatar = req.body.avatar
        seller.pics = req.body.pics
        seller.infos = req.body.infos
        // At first, seller should not have goods and ratings
        seller.goods = []
        seller.ratings = []

        seller.save((err) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Add Seller'}, null, 5))
          }
        })
      }
    })
  }
}

/**
 * PUT
 * updateSeller - update the info of a specific document through ':id'
 * @param req - should contain parameter: id
 * @param res
 */
router.updateSeller = (req, res) => {
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

        Seller.findById(req.params.id, (err, seller) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            seller.name = req.body.name ? req.body.name : seller.name
            seller.description = req.body.description ? req.body.description : seller.description
            seller.deliveryTime = req.body.deliveryTime ? req.body.deliveryTime : seller.deliveryTime
            seller.bulletin = req.body.bulletin ? req.body.bulletin : seller.bulletin
            seller.supports = req.body.supports ? req.body.supports : seller.supports
            seller.avatar = req.body.avatar ? req.body.avatar : seller.avatar
            seller.pics = req.body.pics ? req.body.pics : seller.pics
            seller.infos = req.body.infos ? req.body.infos : seller.infos
            seller.save((err) => {
              if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
              } else {
                res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Update Seller'}, null, 5))
              }
            })
          }
        })
      }
    })
  }
}

/**
 * DELETE
 * deleteSeller - delete one document from database through ':id'
 * @param req - should contain parameter: id
 * @param res
 */
router.deleteSeller = (req, res) => {
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
        Seller.findByIdAndRemove(req.params.id, (err, seller) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Delete Seller'}, null, 5))
          }
        })
      }
    })
  }
}

/**
 * PUT
 * updateGoods - update the information of goods
 * @param req
 * @param res
 */
router.updateGoods = (req, res) => {
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

        Seller.findById(req.params.id, (err, seller) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            seller.goods = req.body.goods ? req.body.goods : seller.goods
            seller.save((err) => {
              if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
              } else {
                res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Update Goods'}, null, 5))
              }
            })
          }
        })
      }
    })
  }
}

/**
 * POST
 * addRating - add a new rating
 * @param req
 * @param res
 */
router.addRating = (req, res) => {
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

        Seller.findById(req.params.id, (err, seller) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            let rating = {}
            rating.username = req.body.username
            // 13bits => 10bits
            rating.rateTime = new Date().getTime()
            rating.deliveryTime = req.body.deliveryTime
            rating.score = req.body.score
            rating.rateType = req.body.rateType
            rating.text = req.body.text
            rating.avatar = req.body.avatar
            rating.recommend = req.body.recommend
            Seller.update({_id: seller._id}, {$addToSet: {ratings: rating}}, (err) => {
              if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
              } else {
                // should also update rankRate, serviceScore and score
                let ratings = seller.ratings
                let len = ratings.length
                let rankRate = 0
                let serviceScore = 0
                if (len > 0) {
                  ratings.forEach((rating) => {
                    if (parseInt(rating.rateType) === 0) {
                      rankRate += 1
                    }
                    serviceScore += parseFloat(rating.score)
                  })
                  rankRate = ((rankRate / len) * 100).toFixed(1)
                  serviceScore = (serviceScore / len).toFixed(1)
                }
                seller.serviceScore = serviceScore
                seller.rankRate = rankRate
                seller.score = ((parseFloat(serviceScore)+ parseFloat(seller.foodScore)) / 2).toFixed(1)
                seller.save((err) => {
                  if (err) {
                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                  } else {
                    res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Add Rating'}, null, 5))
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
 * DELETE
 * deleteRating - delete one rating
 * @param req
 * @param res
 */
router.deleteRating = (req, res) => {
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

        Seller.findById(req.params.id, (err, seller) => {
          if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
          } else {
            let rating = {}
            rating.username = req.body.username
            rating.deliveryTime = req.body.deliveryTime
            rating.score = req.body.score
            rating.rateType = req.body.rateType
            rating.text = req.body.text
            rating.avatar = req.body.avatar
            rating.recommend = req.body.recommend
            Seller.update({_id: seller._id}, {$pull: {ratings: rating}}, (err) => {
              if (err) {
                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
              } else {
                // should also update rankRate, serviceScore and score
                let ratings = seller.ratings
                let len = ratings.length
                let rankRate = 0
                let serviceScore = 0
                if (len > 0) {
                  ratings.forEach((rating) => {
                    if (parseInt(rating.rateType) === 0) {
                      rankRate += 1
                    }
                    serviceScore += parseFloat(rating.score)
                  })
                  rankRate = ((rankRate / len) * 100).toFixed(1)
                  serviceScore = (serviceScore / len).toFixed(1)
                }
                seller.serviceScore = serviceScore
                seller.rankRate = rankRate
                seller.score = ((parseFloat(serviceScore)+ parseFloat(seller.foodScore)) / 2).toFixed(1)
                seller.save((err) => {
                  if (err) {
                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                  } else {
                    res.send(JSON.stringify({code: ERR_OK, message: 'Successfully Delete Rating'}, null, 5))
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
 * POST
 * fuzzySearch
 * @param req
 * @param res
 */
router.fuzzySearch = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  // eslint-disable-next-line no-useless-escape
  var reg = `([\s\S]*?${req.body.keyword}[\s\S]*?)`
  reg = new RegExp(reg, 'gi')
  Seller.find({
    $or: [
      {name: {$regex: reg}},
      {description: {$regex: reg}},
      {bulletin: {$regex: reg}},
      {'supports.description': {$regex: reg}},
      {infos: {$regex: reg}},
      {'goods.name': {$regex: reg}},
      {'goods.foods.name': {$regex: reg}},
      {'goods.foods.description': {$regex: reg}},
      {'goods.foods.info': {$regex: reg}}
    ]
  }, (err, sellers) => {
    if (err) {
      res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
    } else {
      res.send(JSON.stringify({code: ERR_OK, data: sellers}, null, 5))
    }
  })
}

/**
 * GET
 * getTopSellersBySellCount - get top n sellers whose sell counts are the highest, n is 3 by default.
 * @param req
 * @param res
 */
router.getTopSellersBySellCount = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  let num = req.params.num && req.params.num !== '0' ? Number(req.params.num) : 3
  let seq = req.params.seq === '1' ? 1 : -1
  Seller.find({}).sort({'sellCount': seq}).limit(num).exec((err, sellers) => {
    if (err) {
      res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
    } else {
      res.send(JSON.stringify({code: ERR_OK, num: sellers.length, data: sellers}, null, 5))
    }
  })
}

/**
 * GET
 * getTopSellersByRankRate - get top n sellers whose rank rates are the highest, n is 3 by default.
 * @param req
 * @param res
 */
router.getTopSellersByRankRate = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  let num = req.params.num && req.params.num !== '0' ? Number(req.params.num) : 3
  let seq = req.params.seq === '1' ? 1 : -1
  Seller.find({}).sort({'rankRate': seq}).limit(num).exec((err, sellers) => {
    if (err) {
      res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
    } else {
      res.send(JSON.stringify({code: ERR_OK, num: sellers.length, data: sellers}, null, 5))
    }
  })
}

module.exports = router
