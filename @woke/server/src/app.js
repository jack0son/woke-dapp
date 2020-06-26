var express = require('express')
var path = require('path')
var logger = require('morgan')
var cors = require('cors')

var AuthRouter = require('./routes/authentication');
var UserRouter = require('./routes/user');

const fundingSystem = require('@woke/funder')();
fundingSystem.start().catch(console.log);

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors())

app.get('/', function (req, res, next) {
  res.status(200).send('The server is up! Please hit one of the API endpoints to use the server')
})

const routerContext = { fundingSystem };

// Routes
app.use('/authentication', AuthRouter(routerContext));
app.use('/user', UserRouter(routerContext))

// Error handler
app.use(function (err, req, res, next) {
  // Only provide error in dev mode
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  console.error(err)
  res.status(err.status || 500).send()
})

module.exports = app
