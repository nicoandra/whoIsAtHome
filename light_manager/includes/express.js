const path = require('path'),
	bodyParser = require('body-parser');
debug = require('debug')("includes:express")

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
	let root = function(req,res, next){
		var themes = [ "Light", "Darkly" , "Cyborg" , "Reddish" ];
		var theme = (req.cookies.theme ? req.cookies.theme : 'light').toLowerCase().trim();
		res.render('index', { title : cfg.type + "> HomeOwn", 'theme' : theme , 'themes' : themes })
	}

	app.get("/", root);

	app.post("/lights/persistScene", function(req,res, next){
		try {
			debug("DisplayName:", req.body.sceneDisplayName)
			debug("SceneAlias:", req.body.sceneId)
			app.getComponent('lightManager').addScene(req.body.sceneId, req.body.sceneDisplayName);
			return res.send({status: "OK"})

		} catch(excep){
			return res.send({status: "KO", reason: excep.toString()})
		}
	})

	app.post("/lights/deleteScene", function(req,res, next){
		debug("DisplayName:", req.body.sceneId)
		app.getComponent('lightManager').deleteScene(req.body.sceneId, function(){
			res.send({status: "OK"})
		});

	})

	app.post("/lights/useScene", function(req,res, next){
		debug("DisplayName:", req.body.sceneId)
		app.getComponent('lightManager').loadScene(req.body.sceneId);
		res.send({status: "OK"})
	})

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
		let heaterManager = app.getComponent('heaterManager');

		heaterManager.setMultipleStatus(req.body, function(){
			heaterManager.getStatus(function(err, response){
				res.send(app.getStatus());
			});
		})

		app.internalEventEmitter.emit("majorChange", req.body);
	})

	this.app = app;

	return this.app;
}
