const createError = require('http-errors');
const express = require('express');
const expressSession = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const cors = require('cors');
const passport = require('passport');
const flash = require('connect-flash');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({limit: '50mb', extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(
    {
        origin: ["http://localhost:3000"],
        credentials: true
    }
));

app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true,
    cookie: {

        //maxAge: 1000 * 60 * 180 // 쿠키 유효기간 1시간
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const router = express.Router();
app.use('/', router);

const configPassport = require('./config/passport');
configPassport(app, passport);


//routers
const keyRouter = require('./routes/key');
const nmtRouter = require('./routes/nmt');
const saleRouter = require('./routes/sale');
const tempRouter = require('./routes/temp');
const tradeRouter = require('./routes/trade');
const userRouter = require('./routes/users');
const verificationRouter = require('./routes/verification');

keyRouter(router);
nmtRouter(router);
saleRouter(router);
tempRouter(router);
tradeRouter(router);
userRouter(router, passport);
verificationRouter(router);


// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
  next(createError(404));
});
*/

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    console.log(err);
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
