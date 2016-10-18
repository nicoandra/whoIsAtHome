var env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, dgram = require('dgram')
	, debug = require('debug')
	, moment = require('moment')
	, bodyParser = require('body-parser'); 	// To parse POST requests;

var EventEmitter = require('events').EventEmitter

const path = require('path');

/** Prepare the light setup */
LightManager = require("./lightManager.js");
lightManager = new LightManager();	// With a LightManager, add lights
lightManager.addLight("officeLamp", "Office Lamp", /*ReceiverId */ 0,  /* GroupId */ 1, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("kitchenLamp", "Kitchen Lamp", /*ReceiverId */ 0, /* GroupId */ 2, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("officeBoards", "Office Boards", /*ReceiverId */ 0, /* GroupId */ 3, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("kitchenCountertop", "Kitchen Countertop", /*ReceiverId */ 0, /* GroupId */ 4, /* hasRgb */ true, /* hasDimmer */ true);

// With a lightManager, add programs
lightManager.addProgram("All white", "all white", ["kitchenCountertop","officeLamp","kitchenLamp"], {onOff : true, color: "white" } );
lightManager.addProgram("All Blue", "all blue", ["kitchenCountertop","officeLamp","kitchenLamp", "officeBoards"], {onOff : true, color: "blue" } );
lightManager.addProgram("All Red", "all red", ["kitchenCountertop","officeLamp","kitchenLamp", "officeBoards"], {onOff : true, color: "red" } );
lightManager.addProgram("BubbleGum", "bubblegum", [
	{lightName: 'kitchenLamp', onOff : true, color: "pink" },
	{lightName: 'kitchenCountertop', onOff : false },
	{lightName: 'officeBoards', onOff : true, color: "pink" },
	{lightName: 'officeLamp', onOff : true, color: "blue" }
]);

/** Prepare heaters */
HeaterManager = require('./heaterManager.js');
heaterManager = new HeaterManager();
heaterManager.addHeater('Kitchen', 'kitchen', '192.168.1.125');
heaterManager.addHeater('Living', 'living', '192.168.1.125');

CommandLineInterpreter = require("./cliInterpreter.js")
var cliInterpreter = new CommandLineInterpreter();
cliInterpreter.start();


LightPrograms = require("./lightPrograms.js")


/** HTTP SERVER **/
var express = require('express'),
app = express(),
port = cfg.httpPort;
app.set('view engine', 'ejs');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);

io.sockets.on('connection', function(socket){
	console.log("[Socket] on");

	socket.on('sendCommand', function (commands) {

		var programs = new LightPrograms();

		console.log("[Socket] Received ", commands);

		commands.forEach(function(programName){
			console.log("[rec socket] ", programName);
			programs.runProgram(programName);
		});

		sendResponse();

	});

});

sendResponse = function(){
	var programs = new LightPrograms();
	io.emit('statusUpdate', {
		lights : programs.getLightsStatus(), 
		system : {
			queueSize : [receiver1.getQueueSize()],
			delayBetweenCommands : delayBetweenCommands,
			memory : process.memoryUsage(),
			uptime : { 'human' : moment.duration(process.uptime(), 'seconds').humanize(), 'seconds' : process.uptime()  }
		},
//		heaters : heaterStatus,
	});
}


function buildResponseObject(){
	var programs = new LightPrograms();
	return {
		lights : programs.getLightsStatus(),
		system : {
		queueSize : [receiver1.getQueueSize()],
			delayBetweenCommands : delayBetweenCommands,
			memory : process.memoryUsage(),
			uptime : { 'human' : moment.duration(process.uptime(), 'seconds').humanize(), 'seconds' : process.uptime()  }
		},
	};
}


app.use('/static', express.static(path.join(__dirname, 'webroot')));
app.use('/bower_components', express.static(path.join(__dirname,'bower_components')));
app.use('/static/angular-ui-switch', express.static(path.join(__dirname, 'bower_components', 'angular-ui-switch' )));
app.use('/bower_components/bootstrap', express.static(path.join(__dirname, 'bower_components', 'bootstrap', 'dist')));
app.use('/bower_components/jquery', express.static(path.join(__dirname, 'bower_components', 'jQuery', 'dist')));
app.use('/fonts/', express.static(path.join(__dirname, 'webroot', 'fonts')));

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
}));

app.get('/commands/', function(req, res){
	new HttpResponses().receiveCommands(req, res);
});

app.get('/plot/', function(req, res){
	cityPlotter.servePlot(req, res);
});

app.get('/plot/json', function(req, res){
	cityPlotter.json(req, res);
});

app.get("/heaters", function(req, res){

})

app.get("/angular", function(req,res){
	themes = [ "Light", "Darkly" , "Cyborg" , "Reddish" ];
	theme = req.cookies.theme ? req.cookies.theme : 'light';
	theme = theme.toLowerCase().trim();
	res.render('index', { title : "HomeOwn", lights : lightManager.getStatus(), 'theme' : theme , 'themes' : themes})
})


app.get("/angular/lights/getInterfaceOptions", function(req, res){
	res.send(lightManager.getInterfaceOptions())
})

app.get("/angular/lights/getStatus", function(req, res){
	res.send(lightManager.getStatus())
})

app.get("/angular/lights/getAvailablePrograms", function(req, res){

	availablePrograms = lightManager.getAvailablePrograms();
	response = [];

	Object.keys(availablePrograms).forEach(function(key, value){
		value = availablePrograms[key];
		value.key = key;
		response.push(value)
	})
	res.send(response);

})

var messageBus = new EventEmitter()
messageBus.setMaxListeners(100)
app.get("/angular/socketSimulator", function(req,res){

	messageBus.on('message', function(data){
		console.log(req.ip, "Data which triggered the event", data)
		try {
			res.send(true)
		} catch(exception){}
	})
})

app.get("/switchInterface", function(req, res){

	if(!req.query.theme){
		theme = "darkly";
	} else {
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


app.get("/angular/system/getNotifications", function(req,res){
	uptime = moment.duration(process.uptime(), 'seconds').asMinutes();
	type = "success";
	if(uptime < 10){
		type = "danger";
	}

	toSend = [
		{ date : new Date(), type: type, title:"Uptime", text: "Uptime is " + moment.duration(uptime, 'minutes').humanize()}
	];

	res.send(toSend)
})


app.get("/angular/heaters/getStatus", function(req, res){
	response =  heaterManager.getStatus();
	res.send(response)
})


app.post("/angular/runProgram", function(req, res){
	console.log(req.body);
	if(req.body.programKey){
		try {
			lightManager.runProgram(req.body.programKey);
			console.log("Change has been done");
			messageBus.emit('message', req.body);
		} catch(exception){
			console.log(exception)
		}
	} else if(typeof req.body.lightName == "string") {
		lightManager.setStatus(req.body, function () {
			// Emit message only after the change has been applied
			console.log("Change has been done");
			messageBus.emit('message', req.body);
		});
	} else {
		lightManager.setMultipleStatus(req.body.lightName, req.body, function () {
			// Emit message only after the change has been applied
			console.log("Change has been done");
			messageBus.emit('message', req.body);
		});
	}

	setTimeout(function() {
		messageBus.emit("message", req.body)
	}, 500);

	res.send(
		lightManager.getStatus()
	);
})

app.use('/', function(req, res, next){
	res.redirect("/angular");
});

httpServer.listen(port, function(){
	console.log('http interface listening on port '+port);	
});


/** END OF HTTP SERVER **/


