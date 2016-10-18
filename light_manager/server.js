var env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js');


var EventEmitter = require('events').EventEmitter

var dgram = require('dgram');
var debug = require('debug');
const path = require('path');

var CityPlotter = require(__dirname + '/plot.js');
var cityPlotter = new CityPlotter();

var moment = require('moment');

var bodyParser = require('body-parser'); 	// To parse POST requests
var request = require('request');

var isNicoAtHome = false;

var delayBetweenCommands = 80;



ReceiverSocket = require("./receiverSocket.js")
var receiver1 = new ReceiverSocket(cfg.milight[0]);

LightSocket = require("./lightSocket.js");
Light = require("./light.js");
var lights = {
    officeLamp : new Light('officeLamp', new LightSocket('officeLampObject', 1, receiver1)),
	kitchenLamp : new Light('kitchenLamp', new LightSocket('officeLampObject', 2, receiver1)),
	officeBoards : new Light('officeBoards', new LightSocket('boards', 3, receiver1)),
	kitchenCountertop : new Light('KitchenCountertop', new LightSocket('officeLampObject', 4, receiver1)),
};

var heaterStatus = {
    kitchen : {name : 'Kitchen', power: 70, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/kitchen' },
    living : {name: 'Living', power: 50, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/living' },
}


LightManager = require("./lightManager.js");
lightManager = new LightManager();

lightManager.addLight("officeLamp", "Office Lamp", /*ReceiverId */ 0,  /* GroupId */ 1, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("kitchenLamp", "Kitchen Lamp", /*ReceiverId */ 0, /* GroupId */ 2, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("officeBoards", "Office Boards", /*ReceiverId */ 0, /* GroupId */ 3, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("kitchenCountertop", "Kitchen Countertop", /*ReceiverId */ 0, /* GroupId */ 4, /* hasRgb */ true, /* hasDimmer */ true);

lightManager.addProgram("All white", "all white", ["kitchenCountertop","officeLamp","kitchenLamp"], {onOff : true, color: "white" } );
lightManager.addProgram("All Blue", "all blue", ["kitchenCountertop","officeLamp","kitchenLamp", "officeBoards"], {onOff : true, color: "blue" } );
lightManager.addProgram("All Red", "all red", ["kitchenCountertop","officeLamp","kitchenLamp", "officeBoards"], {onOff : true, color: "red" } );
lightManager.addProgram("BubbleGum", "bubblegum", [
	{lightName: 'kitchenLamp', onOff : true, color: "pink" },
	{lightName: 'kitchenCountertop', onOff : false },
	{lightName: 'officeBoards', onOff : true, color: "pink" },
	{lightName: 'officeLamp', onOff : true, color: "blue" }
]);

function Heater(name, ip){
	this.name = name;
	this.ip = ip;
	this.currentTemperature = 999;
	this.humidity = 999;
	this.desiredTemp = 14;
	this.power = 0;
	this.uptime = 0;

	this.buildUrl = function(method){
		return "http://" + this.ip + '/' + method +'/' + this.name;
	}

	this.setTemperature = function(desiredTemperature, callback){

		self.desiredTemperature = desiredTemperature;

		options = {
			url: this.buildUrl('set'),
			qs : {temperature : desiredTemperature }
		}

		self = this;
		request(options, function(error, response, body){
			if(!error && response.statusCode == 200){
				var info = JSON.parse(body);
				callback(false, info);
			} else {
				callback(error, false)
			}
		});
	}

	this.pollData = function(callback){
		if(!self){
			self = this;
		}

		options = {
			url: self.buildUrl('get')
		}

		request(options, function(error, response, body){
			if(!error && response.statusCode == 200){
				var info = JSON.parse(body);
				callback(false, info);
				self.currentTemperature = parseFloat(info.currentTemperature);
				self.humidity = parseFloat(info.humidity);
				self.uptime = parseFloat(info.uptime);
			} else {
				callback(error, false)
			}
		}.bind(self));
	}


	this.getTemperature = function(){
		return this.currentTemperature;
	}

	this.getHumidity = function(){
		return this.humidity;
	}

	//  Go!!
	setInterval(this.pollData.bind({self : this}), 300);	// Poll temperature every 5 minutes
	this.pollData.bind({self : this})
}

function pollHeaterStatus(){
	Object.keys(heaterStatus).forEach(function(key){
		url = heaterStatus[key].url;
		request(url, function(error, response, body){
			if(!error && response.statusCode == 200){
				var info = JSON.parse(body);
				currTemp = parseFloat(info.currentTemperature);
				cityPlotter.addValue(heaterStatus[key].name, currTemp);
				heaterStatus[key].desiredTemperature = info.desiredTemperature;
				heaterStatus[key].currentTemperature = info.currentTemperature;
				heaterStatus[key].power = info.power;
			}
		});
	});
}

function appendCurrentTempToTrend(){
	Object.keys(heaterStatus).forEach(function(key){
		cityPlotter.addValue(heaterStatus[key].name, heaterStatus[key].currentTemperature);
	});
}

pollHeaterStatus();
appendCurrentTempToTrend();

function setHeaterTemperature(heaterName, desiredTemperature){
	if(!heaterStatus[heaterName]){
		return ;
	}

	url = heaterStatus[heaterName].url;
	url = url.replace('/get/', '/set/') + "?temperature=" + desiredTemperature;

	request(url, function(error, response, body){
		if(!error && response.statusCode == 200){
			var info = JSON.parse(body);
			currTemp = parseFloat(info.currentTemperature);

		}
	});
}

setInterval(pollHeaterStatus, 60000); // Poll heater status every minute for the trend
setInterval(appendCurrentTempToTrend, 60000); // Append temperatures every minute for the trend




LightStatus = require("./lightStatus.js")
newWhiteStatus = new LightStatus();
newWhiteStatus.color = "white";
console.log(newWhiteStatus.getObject());


CommandLineInterpreter = require("./cliInterpreter.js")
var cliInterpreter = new CommandLineInterpreter();
cliInterpreter.start();


LightPrograms = require("./lightPrograms.js")
/** HTTP SERVER **/

/** Command HTTP API **/

function HttpResponses() {
    this.receiveCommands = function(req, res) {
        commandString = req.query.command;

        var programs = new LightPrograms();

        console.log("http", req.ip, commandString);
        response = programs.runProgram(commandString);


        if(!response){
			memoryUsage = process.memoryUsage();

            response = { 
            	lights : programs.getLightsStatus(), 
            	system : {
            		queueSize : [receiver1.getQueueSize()],
            		delayBetweenCommands : delayBetweenCommands,
            		memory : memoryUsage,
                    socketInfo : { host : cfg.httpHost , port : cfg.httpPort },
                    uptime : { 'human' : moment.duration(process.uptime(), 'seconds').humanize(), 'seconds' : process.uptime()  }

            	},
            	heaters : heaterStatus,
            	peopleAtHome: peopleStatusTracker
            };
        }
        res.send(JSON.stringify(response));
    }


    this.getLightStatus = function(req, res) {
        res.send(JSON.stringify(lightStatus));
    }

    this.getHeaterStatus = function(req, res) {
        res.send(JSON.stringify(heaterStatus));
    }

    this.renderIndexPage = function (req, res) {
    	res.sendFile(__dirname + '/webroot/index-2.html');
    }
    }
module.exports = HttpResponses;



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
	res.render('index', { title : "HomeOwn", lights : lights, 'theme' : theme , 'themes' : themes})
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
	res.send(heaterStatus)
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
	new HttpResponses().renderIndexPage(req, res);
});

app.post('/heater/', function(req, res){
	var room = req.query.room;
	var temperature = req.query.temperature;
});

httpServer.listen(port, function(){
	console.log('http interface listening on port '+port);	
});


/** END OF HTTP SERVER **/


