var env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, dgram = require('dgram')
	, debug = require('debug')("app:server")
	, moment = require('moment')
	, bodyParser = require('body-parser')
	, PeopleTracker = require('./peopleTracker.js')
	, notificationQueue = [];


var request = require('request');

var EventEmitter = require('events').EventEmitter
const path = require('path');

var notificationEventEmitter = new EventEmitter()
notificationEventEmitter.setMaxListeners(100);

var internalEventEmitter = new EventEmitter()
internalEventEmitter.setMaxListeners(100);
internalEventEmitter.on("heaterUpdated", function(data) {
	// When a heater changes, emit a changeEvent so the interfaces are updated
	changeEventEmitter.emit("message", data);
});

var LightProgram = require("./lightProgram.js")
/** Prepare the light setup */
LightManager = require("./lightManager.js");
lightManager = new LightManager();	// With a LightManager, add lights

var peopleTracker = new PeopleTracker(lightManager, internalEventEmitter)

/** Prepare heaters */
HeaterManager = require('./heaterManager.js');
heaterManager = new HeaterManager(internalEventEmitter);

ActionScheduler = require('./actionScheduler.js');
actionScheduler = new ActionScheduler(peopleTracker, lightManager, heaterManager, internalEventEmitter );


lightManager.addLight("kitchenCountertop", "Kitchen Countertop", /*ReceiverId */ 0, /* GroupId */ 4, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("officeLamp", "Office Lamp", /*ReceiverId */ 0,  /* GroupId */ 1, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("kitchenLamp", "Kitchen Lamp", /*ReceiverId */ 0, /* GroupId */ 2, /* hasRgb */ true, /* hasDimmer */ true);
lightManager.addLight("officeBoards", "Office Boards", /*ReceiverId */ 0, /* GroupId */ 3, /* hasRgb */ true, /* hasDimmer */ true);

normalOptions = new LightProgram("Normal", "normal");

normalNight = new LightProgram("Night", "normal-night");
normalNight.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 0  });
normalNight.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 0 });
normalNight.addStatus({lightName: 'officeBoards', onOff : false });
normalNight.addStatus({lightName: 'officeLamp', onOff : false });

normalLow = new LightProgram("Low", "normal-low");
normalLow.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 30  });
normalLow.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 40 });
normalLow.addStatus({lightName: 'officeBoards', onOff : false });
normalLow.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 40  });


normalMed = new LightProgram("Med", "normal-med");
normalMed.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 70  });
normalMed.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 70 });
normalMed.addStatus({lightName: 'officeBoards', onOff : false });
normalMed.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 70  });

normalHigh = new LightProgram("High", "normal-high");
normalHigh.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 100  });
normalHigh.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 100 });
normalHigh.addStatus({lightName: 'officeBoards', onOff : false });
normalHigh.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 100  });
normalOptions.addChildProgram(normalNight);
normalOptions.addChildProgram(normalLow);
normalOptions.addChildProgram(normalMed);
normalOptions.addChildProgram(normalHigh);
lightManager.addProgramInstance(normalOptions);


delete normalOptions;


allRed = new LightProgram("All Red", "all red");
["officeLamp","kitchenLamp", "officeBoards"].forEach(function(lightName){
	allRed.addStatus({lightName: lightName, onOff : true, color: "red" , brightness: 100});	
})
lightManager.addProgramInstance(allRed);

romantic = new LightProgram("Romantic", "romantic");
romantic.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", brightness: 20 });
romantic.addStatus({lightName: 'kitchenCountertop', onOff : false });
romantic.addStatus({lightName: 'officeBoards', onOff : false });
romantic.addStatus({lightName: 'officeLamp', onOff : true, color: "white", brightness: 20 });
lightManager.addProgramInstance(romantic)


/** Prepare heaters */

notificationEventEmitter.on('heaters', function(data){
	
	type = "normal";
	switch(data.type){
		case 'heaters:heater:wentDown': type = 'danger'; message = data.ref + " heater went down"; break;
		case 'heaters:heater:cameBack': type = 'success'; message = data.ref + " heater came back"; break;
		default: return;
	}

	var toSend = { date : new Date(), type: type, title:"Heaters", text: message }
	notificationQueue.unshift(toSend);
})

notificationEventEmitter.on('strips', function(data){
	
	type = "normal";
	switch(data.type){
		case 'strips:strip:notReachable': type = 'danger'; message = data.ref + " strip went down"; break;
		case 'strips:strip:cameBack': type = 'success'; message = data.ref + " strip came back"; break;
		default: return;
	}

	var toSend = { date : new Date(), type: type, title:"Light Strips", text: message }
	notificationQueue.unshift(toSend);
})

/**/
// this.addHeater = function(name, descriptiveName, id, ip, port, options){
heaterManager.addHeater('living', 'Living', 1, '192.168.1.113', 8888, { eventEmitter : notificationEventEmitter });

/** HTTP SERVER **/
var express = require('express'),
app = express(),
port = cfg.httpPort;
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views')

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var httpServer = require('http').Server(app);


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
	lights = lightManager.getInterfaceOptions();
	people = peopleTracker.getHomeStatus();

	res.send({'lights' : lights.lights , 'people' : people, 'programs' : lights.programs});
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

var changeEventEmitter = new EventEmitter()
changeEventEmitter.setMaxListeners(100)
app.get("/angular/socketSimulator", function(req,res){

	changeEventEmitter.on('message', function(data){
		// console.log(req.ip, "Data which triggered the event", data)
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

	var toSend = [
		{ date : new Date(), type: type, title:"Uptime", text: "Uptime is " + moment.duration(uptime, 'minutes').humanize()}
	];

	console.log(toSend);

	notificationQueue.forEach(function(a){ toSend.unshift(a); })

	res.send(toSend)
})


app.post("/angular/heathers/set", function(req,res){
	console.log("HEATHER CHANGE", req.body)
	heaterManager.setMultipleStatus(req.body, function(){
		heaterManager.getStatus(function(err, response){
			console.log("Sending response", response)
			res.send(response);
		});
	})
})


app.get("/angular/heaters/getStatus", function(req, res){
	response = heaterManager.getStatus();
	res.send(response);
})


app.post("/angular/runProgram", function(req, res){
	// console.log(req.body);

	console.log(req.body);


	if(req.body.programKey){
		try {
			lightManager.runProgram(req.body.programKey);
			console.log("Change has been done");
		} catch(exception){
			console.log(exception)
		}
	} else if(typeof req.body.lightName == "string") {
		lightManager.setStatus(req.body, function () {
			// Emit message only after the change has been applied
			console.log("Change has been done");
		});
	} else {
		lightManager.setMultipleStatus(req.body.lightName, req.body, function () {
			// Emit message only after the change has been applied
			console.log("Change has been done");
		});
	}

	[1, 500, 1000].forEach(function(delay){
		setTimeout(function() {
			changeEventEmitter.emit("message", req.body)
		}, delay);
	})

	res.send(
		lightManager.getStatus()
	);
})

app.get("/lights/allOff", function(req,res){
	lightManager.allLightsOff();
})

app.post("/lights/iterateBetweenChildPrograms", function(req,res){
	programKey = req.body.programKey;
	lightManager.iterateBetweenChildPrograms(programKey);

	[1, 500, 1000].forEach(function(delay){
		setTimeout(function() {
			messageBus.emit("message", req.body)
		}, delay);
	})	
	res.send("ITERATION");
})

app.get("/cameras/getList", function(req, res){
	res.send([
		{ displayName: "Door", cameraName : 2 },
		{ displayName: "Kitchen", cameraName : 7 },
	])
})



app.get('/jquery-1.8.3.min.js', function(req, res){
	res.sendFile("/home/nico/code/whoIsAtHome/light_manager/bower_components/jquery/dist/jquery.js");
})

app.get("/cameras/watch/:cameraName", function(req, res){
	res.send("Not implemented yet");
	return ;

	cameraConfig = require("./config/restricted/cameras.js"),
	cameraName = parseInt(req.params.cameraName);
	availableMonitors = [2,3,6,7]

	if(availableMonitors.indexOf(cameraName) != -1){

		res.writeHead(200, { 
			"Cache-control": "no-cache", 
			"Content-Type":"multipart/x-mixed-replace;boundary=ZoneMinderFrame"
		});

		try {
			res.send("Not Implemented");
			request.get("http://"+cameraConfig.host+"/cgi-bin/nph-zms?mode=jpeg&scale=100&maxfps=10&monitor="+cameraName+"&connkey=574247&rand=1477156808").pipe(res)
			return ;
		} catch(excp){
			console.log("Cameras::ExceptionCaught", excp)
		}

	}
	res.send(cameraName + "Invalid camera");
	return;

})


app.post("/people/setAsAway", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsAway("nico");
	res.send(peopleTracker.getHomeStatus());
})


app.post("/people/setAsAtHome", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsAtHome("nico");
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsComingBack", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsComingBack("nico", 20);
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsSleeping", function(req,res){
	peopleTracker.setAsSleeping("nico");
	res.send(peopleTracker.getHomeStatus());
})



app.use('/', function(req, res, next){
	res.redirect("/angular");
});

httpServer.listen({ port : cfg.httpPort, host : cfg.httpHost } , function(){
	console.log('http interface listening on port '+port);	
});

/** END OF HTTP SERVER **/



