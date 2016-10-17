var dgram = require('dgram');
var debug = require('debug');
var bodyParser = require('body-parser'); 	// To parse POST requests

var CityPlotter = require(__dirname + '/plot.js');
var cityPlotter = new CityPlotter();

var moment = require('moment');

var env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js');

var request = require('request');

var isNicoAtHome = false;

var delayBetweenCommands = 80;

var colorCodes = {
	violet : [0x40, 0x00],
	royalBlue : [0x40, 0x10],
	blue : [0x40, 0x10],
	lightBlue : [0x40, 0x20],
	aqua : [0x40, 0x30],
	royalMint : [0x40, 0x40],
	seafoamGreen : [0x40, 0x50],
	green : [0x40, 0x60],
	limeGreen : [0x40, 0x70],
	yellow : [0x40, 0x80],
	yellowOrange : [0x40, 0x90],
	orange : [0x40, 0xa0],
	red : [0x40, 0xb0],
	pink : [0x40, 0xc0],
	fusia : [0x40, 0xd0],
	lilac : [0x40, 0xe0],
	lavendar : [0x40, 0xf0]
};

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
    kitchen : {name : 'Kitchen', power: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/kitchen' },
    living : {name: 'Living', power: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/living' },
}


LightManager = require("./lightManager.js");
lightManager = new LightManager();

lightManager.addLight("officeLamp", "Office Lamp", 0, 1);
lightManager.addLight("kitchenLamp", "Kitchen Lamp", 0, 2);
lightManager.addLight("officeBoards", "Office Boards", 0, 3);
lightManager.addLight("kitchenCountertop", "Kitchen Countertop", 0, 4);

lightManager.addProgram("kitchen countertop on", "kitchen countertop on", "kitchenCountertop", {onOff : true } );
lightManager.addProgram("kitchen countertop off", "kitchen countertop off", "kitchenCountertop", {onOff : false} );

lightManager.runProgram("kitchen countertop on");

// console.log(lightManager.getStatus());




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


app.use('/static', express.static(__dirname + '/webroot'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

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
	res.render('index', { title : "The First Rendered Page", body : "Great <b>HTML</b> body", lights : lights })
})

app.get("/angular/getLightStatus", function(req, res){
	res.send(lightManager.getStatus())
})


app.post("/angular/runProgram", function(req, res){
	console.log(req.body);
	lightManager.setStatus(req.body)
	res.send(lightManager.getStatus())
})

app.use('/', function(req, res, next){
	// isNicoAtHome

	console.log(req.ip);

	switch(req.ip){
		case '192.168.1.1':
		case '::ffff:192.168.1.1':
		case '192.168.1.111':
		case '::ffff:192.168.1.111':
		case '192.168.1.112':
		case '::ffff:192.168.1.112':
		case '192.168.1.141':
		case '::ffff:192.168.1.141':
		// case '127.0.0.1': 
			isNicoAtHome = true; break;
		default: isNicoAtHome = false; break;	
	}

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


