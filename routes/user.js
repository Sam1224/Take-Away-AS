/**
 * @Author: Sam
 * @Date: 2019/10/18
 * @Version: 1.0
 **/
var express = require('express')
var User = require('../models/user')
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

    // avoid duplication
    User.findOne({username: req.body.username}, (err, user) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            if (user) {
                res.send(JSON.stringify({code: USER_DUP, message: 'The username has been registered!'}, null, 5))
            } else {
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
        }
    })
}

/**
 * PUT
 * updateUser - update the information of a user
 * @param req
 * @param res
 */
router.updateUser = (req, res) => {
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

                User.find({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        if (user.length === 0) {
                            res.send(JSON.stringify({code: USER_NXT, message: 'The username is not registered'}, null, 5))
                        } else {
                            user = user[0]
                            user.password = req.body.password ? sha1(req.body.password) : user.password
                            user.phone = req.body.phone ? req.body.phone : user.phone
                            user.save((err) => {
                                if (err) {
                                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                                } else {
                                    res.send(JSON.stringify({code: ERR_OK, message: "Successfully Update User"}, null, 5))
                                }
                            })
                        }
                    }
                })
            }
        })
    }
}

/**
 * DELETE
 * deleteUser - delete a specific user
 * @param req
 * @param res
 */
router.deleteUser = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    User.findByIdAndRemove(req.params.id, (err, user) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            res.send(JSON.stringify({code: ERR_OK, message: "Successfully Delete User"}, null, 5))
        }
    })
}

/**
 * POST
 * addAddress - add a new address
 * @param req
 * @param res
 */
router.addAddress = (req, res) => {
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

                User.find({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        if (user.length === 0) {
                            res.send(JSON.stringify({code: USER_NXT, message: 'The username is not registered'}, null, 5))
                        } else {
                            user = user[0]
                            let address = req.body.address
                            User.update({_id: user._id}, {$addToSet: {address: address}}, (err) => {
                                if (err) {
                                    res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                                } else {
                                    res.send(JSON.stringify({code: ERR_OK, message: "Successfully Add Address"}, null, 5))
                                }
                            })
                        }
                    }
                })
            }
        })
    }
}

/**
 * DELETE
 * deleteAddress - delete an address
 * @param req
 * @param res
 */
router.deleteAddress = (req, res) => {
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

                User.findOne({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        let address = req.body.address
                        User.update({_id: user._id}, {$pull: {address: address}}, (err) => {
                            if (err) {
                                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                            } else {
                                res.send(JSON.stringify({code: ERR_OK, message: "Successfully Delete Address"}, null, 5))
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
 * addPay - add a payment way
 * @param req
 * @param res
 */
router.addPay = (req, res) => {
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

                User.findOne({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        let pay = req.body.pay
                        User.update({_id: user._id}, {$addToSet: {pay: pay}}, (err) => {
                            if (err) {
                                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                            } else {
                                res.send(JSON.stringify({code: ERR_OK, message: "Successfully Add Payment"}, null, 5))
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
 * deletePay - delete a payment type
 * @param req
 * @param res
 */
router.deletePay = (req, res) => {
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

                User.findOne({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        let pay = req.body.pay
                        User.update({_id: user._id}, {$pull: {pay: pay}}, (err) => {
                            if (err) {
                                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                            } else {
                                res.send(JSON.stringify({code: ERR_OK, message: "Successfully Delete Payment"}, null, 5))
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
 * addFavorite - Add a shop to be a favorite
 * @param req
 * @param res
 */
router.addFavorite = (req, res) => {
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

                User.findOne({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        let favorite = req.body.favorite
                        User.update({_id: user._id}, {$addToSet: {favorite: favorite}}, (err) => {
                            if (err) {
                                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                            } else {
                                res.send(JSON.stringify({code: ERR_OK, message: "Successfully Add Favorite"}, null, 5))
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
 * deleteFavorite - delete a shop from the favorite list
 * @param req
 * @param res
 */
router.deleteFavorite = (req, res) => {
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

                User.findOne({username: req.body.username}, (err, user) => {
                    if (err) {
                        res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                    } else {
                        let favorite = req.body.favorite
                        User.update({_id: user._id}, {$pull: {favorite: favorite}}, (err) => {
                            if (err) {
                                res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
                            } else {
                                res.send(JSON.stringify({code: ERR_OK, message: "Successfully Delete Favorite"}, null, 5))
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
 * login - login and generate a token
 * @param req
 * @param res
 */
router.login = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    User.findOne({username: req.body.username}, (err, user) => {
        if (err) {
            res.send(JSON.stringify({code: ERR_NOK, error: err}, null, 5))
        } else {
            if (!user) {
                res.send(JSON.stringify({code: USER_NXT, message: 'The username is not registered'}, null, 5))
            } else {
                if (user.password !== sha1(req.body.password)) {
                    res.send(JSON.stringify({code: USER_WPW, message: 'The password is wrong'}, null, 5))
                } else {
                    let token = jwt.sign({username: user.username}, superSecret, {
                        // 1 hour
                        expiresIn: 3600
                    })
                    res.send(JSON.stringify({code: ERR_OK, token: token, message: 'Successfully login, use your token'}, null, 5))
                }
            }
        }
    })
}

module.exports = router
