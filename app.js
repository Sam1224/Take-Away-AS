var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var stylus = require('stylus')
var mongoose = require('mongoose')
var multer = require('multer')

var indexRouter = require('./routes/index')
var sellerRouter = require('./routes/seller')
var userRouter = require('./routes/user')
var orderRouter = require('./routes/order')
var oauthRouter = require('./routes/oauth')
var fileRouter = require('./routes/file')

// reverse proxy
var proxy = require('http-proxy-middleware')
var axios = require('axios')

var app = express()

// upload files
const upload = multer({dest: 'uploads/'})
app.use(upload.single('file'))

var cors = require('cors')
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(stylus.middleware(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)

/**
 * Self-defined routers
 */
// File
app.post('/upload', fileRouter.upload)
app.get('/uploads/:filename', fileRouter.getImage)

// Oauth
app.get('/loginGithub', oauthRouter.getGithubToken)
app.get('/loginGitlab', oauthRouter.getGitlabToken)
app.get('/loginGitee', oauthRouter.getGiteeToken)
app.get('/loginBitbucket', oauthRouter.getBitbucketToken)
app.get('/loginWeibo', oauthRouter.getWeiboToken)

// Seller
app.get('/seller', sellerRouter.findAll)
app.get('/seller/:id', sellerRouter.findOne)
app.post('/seller', sellerRouter.addSeller)
app.put('/seller/:id', sellerRouter.updateSeller)
app.delete('/seller/:id', sellerRouter.deleteSeller)
app.put('/seller/:id/goods', sellerRouter.updateGoods)
app.post('/seller/:id/ratings', sellerRouter.addRating)
app.delete('/seller/:id/ratings', sellerRouter.deleteRating)
app.post('/seller/search', sellerRouter.fuzzySearch)
app.get('/seller/sellcount/:num/:seq', sellerRouter.getTopSellersBySellCount)
app.get('/seller/rankrate/:num/:seq', sellerRouter.getTopSellersByRankRate)

// User
app.get('/user', userRouter.findAll)
app.get('/user/:id', userRouter.findOne)
app.post('/user', userRouter.addUser)
app.put('/user', userRouter.updateUser)
app.delete('/user/address', userRouter.deleteAddress)
app.delete('/user/pay', userRouter.deletePay)
app.delete('/user/favorite', userRouter.deleteFavorite)
app.delete('/user/:id', userRouter.deleteUser)
app.post('/user/address', userRouter.addAddress)
app.post('/user/pay', userRouter.addPay)
app.post('/user/favorite', userRouter.addFavorite)
app.post('/login', userRouter.login)
app.get('/token/:username', userRouter.getToken)

// Order
app.get('/order', orderRouter.findAll)
app.get('/order/:id', orderRouter.findOne)
app.post('/order', orderRouter.addOrder)
app.put('/order/:id', orderRouter.updateOrder)
app.delete('/order/:id', orderRouter.deleteOrder)
app.put('/order/:id/comment', orderRouter.commentOrder)
app.get('/order/user/:id', orderRouter.findAllByUser)
app.get('/order/seller/:id', orderRouter.findAllBySeller)
app.get('/order/topfood/:user/:seller/:num', orderRouter.getTopFood)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// Connect to MongoDB
// const url = 'mongodb://localhost:27017/takeawayapp'
const url = 'mongodb://sam:yyq19981212@ds137488.mlab.com:37488/heroku_62d2k1tf'
mongoose.connect(url)

var db = mongoose.connection

db.on('error', (err) => {
  console.log('connection error', err)
})
db.once('open', function () {
  console.log('connected to database')
})

module.exports = app
