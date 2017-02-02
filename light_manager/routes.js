var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var debug = require("debug")("express:config")
var accesLog = require("debug")("express:accessLog")



module.exports = function () {

	var app = express();

// Logging
	app.use(logger);
	app.use(function (error, req, res, next) {
		if (error instanceof SyntaxError) {
			res.json({success: false, message: 'data error', body: 'invalid request format'});
		} else {
			next();
		}
	});

// State
	app.use(cookieParser());
	app.use(bodyParser());
	app.use(session({secret: '25eaf497f8dd'})); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	require(path.resolve('config/passport.js'))(passport);

// Routing
	app.use('/public', express.static('public'));
	app.use('/lib', express.static('public/lib'));


}