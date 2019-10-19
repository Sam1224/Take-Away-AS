var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var stylus = require('stylus');

var indexRouter = require('./routes/index')
var sellerRouter = require('./routes/seller')
var userRouter = require('./routes/user')
var orderRouter = require('./routes/order')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

/**
 * Self-defined routers
 */
// Seller
app.get('/seller', sellerRouter.findAll)
app.get('/seller/:id', sellerRouter.findOne)
app.post('/seller', sellerRouter.addSeller)
app.put('/seller/:id', sellerRouter.updateSeller)
app.delete('/seller/:id', sellerRouter.deleteSeller)
app.put('/seller/:id/goods', sellerRouter.updateGoods)
app.post('/seller/:id/ratings', sellerRouter.addRating)
app.delete('/seller/:id/ratings', sellerRouter.deleteRating)

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

// Order
app.get('/order', orderRouter.findAll)
app.get('/order/:id', orderRouter.findOne)
app.post('/order', orderRouter.addOrder)
app.delete('/order/:id', orderRouter.deleteOrder)
app.put('/order/:id', orderRouter.commentOrder)
app.get('/order/user/:id', orderRouter.findAllByUser)
app.get('/order/seller/:id', orderRouter.findAllBySeller)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
