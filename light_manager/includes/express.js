const path = require('path'),
	bodyParser = require('body-parser')

module.exports = function(cfg) {
	var express = require('express'),
		app = express(),
		port = cfg.httpPort;
	app.set('view engine', 'ejs');
	app.set('views', __dirname + '/../views')

	var cookieParser = require('cookie-parser');
	app.use(cookieParser());

	var httpServer = require('http').Server(app);

	app.use('/static', express.static(path.join(__dirname, '..', 'webroot')));
	app.use('/bower_components', express.static(path.join(__dirname, '..', 'bower_components')));
	app.use('/static/angular-ui-switch', express.static(path.join(__dirname, '..', 'bower_components', 'angular-ui-switch')));
	app.use('/bower_components/bootstrap', express.static(path.join(__dirname, '..', 'bower_components', 'bootstrap', 'dist')));
	app.use('/bower_components/jquery', express.static(path.join(__dirname, '..', 'bower_components', 'jQuery', 'dist')));
	app.use('/fonts/', express.static(path.join(__dirname, '..', 'webroot', 'fonts')));

	app.use(bodyParser.json());       // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		extended: true
	}))

	httpServer.listen({ port : cfg.httpPort, host : cfg.httpHost } , function(){
		console.log('HTTP interface listening on port '+port);
	});

	/* Basic Routes */
	app.get("/switchInterface", function(req, res){
		var theme = "darkly";
		if(req.query.theme){
			theme = req.query.theme.toLowerCase().trim();
		}
		switch(theme){
			case 'darkly':
			case 'light':
			case 'reddish':
			case 'cyborg':
				res.cookie("theme", theme);
				break;
			default:
				res.cookie("theme", 'light');
		}
		res.send("OK");
	})

	return app;
}


