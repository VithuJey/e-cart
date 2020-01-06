var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var flash = require('express-flash');
var dotenv = require('dotenv');

var bodyParser = require('body-parser');

var app = express();
var http=require('http').createServer(app);

var io=require('socket.io')(http);

var indexRouter = require('./routes/index');
var productsRouter = require('./routes/products');
var cartRouter = require('./routes/cart');
var usersRouter = require('./routes/users');

cartRouter.setIo(io);


//Environment Variable
dotenv.config({ path: '.env' });
//Sessions Setup
var secret = process.env.SECRET;
app.use(session({
    secret:secret,
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 1209600000 }
}));

//Flash Messages
app.use(flash());

//Global Setup
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.danger = req.flash('danger');
    res.locals.info = req.flash('info');
    res.locals.user = req.session.user;
    res.locals.cart = req.session.cart;
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended: false}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/cart/show', cartRouter);


var port = process.env.PORT || 3000;
http.listen(port,()=>console.log(`Connected to http://localhost:${3000}/ `));
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
