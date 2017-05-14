const path = require('path'),
	bodyParser = require('body-parser');


module.exports = function(cfg) {

	if(typeof cfg == "undefined"){
		return this.app.initTime;
	}

	var express = require('express'),
		app = express(),
		port = cfg.httpPort;
	app.set('view engine', 'ejs');
	app.set('views', __dirname + '/../views')
	app.components = {};

	app.internalEventEmitter = new require(path.join(__dirname, '..', 'components','core','internalEventEmitter.js'));

	app.internalEventEmitter.emit("loaded");
	
	app.notificationEventEmitter = new require(path.join(__dirname, '..', 'components','core','notificationEventEmitter.js'));

	var cookieParser = require('cookie-parser');

	app.initTime = new Date();
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

	app.addComponent = function(alias, component){
		app.components[alias] = component;
		app.components[alias].alias = alias;
		app.components[alias].app = app;
	}

	app.getComponent = function(alias){
		return app.components[alias];
	}

	app.notify = function(eventName, data){
		console.log("NOTIFY", eventName, data);
		// console.log(app.notificationEventEmitter);
		app.notificationEventEmitter.emit(eventName, data);
	}

	/* Basic Routes */
	var root = function(req,res, next){
		var themes = [ "Light", "Darkly" , "Cyborg" , "Reddish" ];
		var theme = (req.cookies.theme ? req.cookies.theme : 'light').toLowerCase().trim();
		res.render('index', { title : "HomeOwn", 'theme' : theme , 'themes' : themes})
	}

	// app.use('/', root);
	app.get("/", root);

/*
	app.get("/", function(req,res){
		var themes = [ "Light", "Darkly" , "Cyborg" , "Reddish" ];
		var theme = (req.cookies.theme ? req.cookies.theme : 'light').toLowerCase().trim();
		res.render('index', { title : "HomeOwn", 'theme' : theme , 'themes' : themes})
	})
	*/

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


	app.get("/app/getInterfaceOptions", function(req, res){
		res.send(app.getStatus());
	})


	app.getStatus = function(){
		var result = {};
		Object.keys(app.components).forEach(function(alias){
			var component = app.getComponent(alias)
			try {
				result[alias] = component.getStatus();
			} catch(ex){
				console.log("Failed for", alias, Object.keys(app.components).toString(), ex);
			}
		});

		return result;
	}


	app.get("/angular/heaters/getStatus", function(req, res){
		res.send(app.getComponent('heaterManager').getStatus());
	})

	app.post("/angular/heathers/set", function(req,res){
		app.getComponent('heaterManager').setMultipleStatus(req.body, function(){
			app.getComponent('heaterManager').getStatus(function(err, response){
				res.send(response);
			});
		})
	})

	this.app = app;
	return this.app;
}


