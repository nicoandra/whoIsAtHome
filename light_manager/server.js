"use strict"

const env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, debug = require('debug')("app:server")
	, debugEvents = require('debug')('app:events')
	, moment = require('moment')
	, PeopleTracker = require('./peopleTracker.js')
	, DevicePresence = require('./devicePresence.js')



var EventEmitter = require('events').EventEmitter
const path = require('path');

var notificationEventEmitter = require("./components/notificationEventEmitter.js");

var internalEventEmitter = new EventEmitter()
internalEventEmitter.setMaxListeners(100);
internalEventEmitter.on("heaterUpdated", function(data) {
	// When a heater changes, emit a changeEvent so the interfaces are updated
	debugEvents("heaterUpdated", data);
	changeEventEmitter.emit("message", data);
});

internalEventEmitter.on("lightsSwitchProgramRequested", function(data) {
	if(data.program === "switch"){
		lightManager.iterateBetweenChildPrograms("13aa6f8804c24f132573b221c93f0e87");
		debugEvents("lightsSwitchProgramRequested", data);
		return;
	}

	if(data.program === "off"){
		lightManager.allLightsOff();
		debugEvents("lightsSwitchProgramRequested", data);
		return;
	}

	changeEventEmitter.emit("message", data);
});



internalEventEmitter.on("personMovementDetected", function(data){
	var homeStatus = peopleTracker.getHomeStatus();
	if(homeStatus.home.isAlone){
		actionScheduler.personMovementHasBeenDetected(data);
		notificationEventEmitter.emit("movement", data);
	}
})

internalEventEmitter.on("movementDetected", function(data){
	var homeStatus = peopleTracker.getHomeStatus();

	if(homeStatus.home.isAlone){
		if(presencePhone.isPresent()){
			peopleTracker.setAsAtHome("nico");
			changeEventEmitter.emit("message", data);
		}		
	}
})

var presencePhone = new DevicePresence({ name : "Nic phone", address : "192.168.1.141", eventEmitter : internalEventEmitter});
internalEventEmitter.on("presenceMessage", function(data){

	try {
		if(data.event === 'back'){
			peopleTracker.setAsAtHome("nico");
			changeEventEmitter.emit("message", data);
			return ;
		}

		if(data.event === 'left'){
			peopleTracker.setAsAway("nico");
			changeEventEmitter.emit("message", data);
			return ;
		}
	} catch(excp){
		debug(excp);
	}
})
presencePhone.begin();


var LightProgram = require("./lightProgram.js")
/** Prepare the light setup */
const LightManager = require("./components/lightManager.js");
var lightManager = new LightManager(cfg);	// With a LightManager, add lights

var peopleTracker = new PeopleTracker(lightManager, internalEventEmitter)

/** Prepare heaters */
var HeaterManager = require('./components/heaterManager.js');
var heaterManager = new HeaterManager(cfg, internalEventEmitter);

var ActionScheduler = require('./components/actionScheduler.js');
var actionScheduler = new ActionScheduler(cfg, peopleTracker, lightManager, heaterManager, internalEventEmitter );


const devices = require("./devices/devices");
lightManager.addLightsFromObject(devices.lights);


var normalOptions = new LightProgram("Normal", "normal");

var normalNight = new LightProgram("Night", "normal-night");
normalNight.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 0  });
normalNight.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 0 });
normalNight.addStatus({lightName: 'officeBoards', onOff : false });
normalNight.addStatus({lightName: 'officeLamp', onOff : false });

var normalLow = new LightProgram("Low", "normal-low");
normalLow.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 30  });
normalLow.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 40 });
normalLow.addStatus({lightName: 'officeBoards', onOff : false });
normalLow.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 40  });


var normalMed = new LightProgram("Med", "normal-med");
normalMed.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 70  });
normalMed.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 70 });
normalMed.addStatus({lightName: 'officeBoards', onOff : false });
normalMed.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 70  });

var normalHigh = new LightProgram("High", "normal-high");
normalHigh.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 100  });
normalHigh.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 100 });
normalHigh.addStatus({lightName: 'officeBoards', onOff : false });
normalHigh.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 100  });
normalOptions.addChildProgram(normalNight);
normalOptions.addChildProgram(normalLow);
normalOptions.addChildProgram(normalMed);
normalOptions.addChildProgram(normalHigh);
lightManager.addProgramInstance(normalOptions);

var allRed = new LightProgram("All Red", "all red");
["officeLamp","kitchenLamp", "officeBoards"].forEach(function(lightName){
	allRed.addStatus({lightName: lightName, onOff : true, color: "red" , brightness: 100});	
})
lightManager.addProgramInstance(allRed);

var romantic = new LightProgram("Romantic", "romantic");
romantic.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", brightness: 20 });
romantic.addStatus({lightName: 'kitchenCountertop', onOff : false });
romantic.addStatus({lightName: 'officeBoards', onOff : false });
romantic.addStatus({lightName: 'officeLamp', onOff : true, color: "white", brightness: 20 });
lightManager.addProgramInstance(romantic);


/** Prepare heaters */


/**/
// this.addHeater = function(name, descriptiveName, id, ip, port, options){
heaterManager.addHeater('dev', 'Dev', 1, '192.168.1.113', 8888, { eventEmitter : internalEventEmitter });
heaterManager.addHeater('living', 'Living', 1, '192.168.1.130', 8888, { eventEmitter : internalEventEmitter });

heaterManager.addHeater('livingDual', 'Living Dual', 1, '192.168.1.128', 8888, { eventEmitter : internalEventEmitter });
heaterManager.addHeater('officeDual', 'Office Dual', 2, '192.168.1.128', 8888, { eventEmitter : internalEventEmitter });

lightManager.addHeaterLight("dev", "Dev", heaterManager.getHeaterByName("dev"));


/** HTTP SERVER **/
var app = require('./express.js')(cfg)

console.log(typeof app);

app.get('/commands/', function(req, res){
	new HttpResponses().receiveCommands(req, res);
});

app.get("/angular", function(req,res){
	var themes = [ "Light", "Darkly" , "Cyborg" , "Reddish" ];
	var theme = (req.cookies.theme ? req.cookies.theme : 'light').toLowerCase().trim();
	res.render('index', { title : "HomeOwn", lights : lightManager.getStatus(), 'theme' : theme , 'themes' : themes})
})


app.get("/angular/lights/getInterfaceOptions", function(req, res){
	var lights = lightManager.getInterfaceOptions();
	var people = peopleTracker.getHomeStatus();
	res.send({'lights' : lights.lights , 'people' : people, 'programs' : lights.programs});
})

app.get("/angular/lights/getStatus", function(req, res){
	res.send(lightManager.getStatus())
})

app.get("/angular/lights/getAvailablePrograms", function(req, res){

	var availablePrograms = lightManager.getAvailablePrograms();
	var response = [];

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
		try {
			res.send(true)
		} catch(exception){}
	})
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

app.get("/angular/system/getNotifications", function(req,res){
	var uptime = moment.duration(process.uptime(), 'seconds').asMinutes();
	var type = "success";
	if(uptime < 10){
		type = "danger";
	}

	var toSend = [
		{ date : new Date(), type: type, title:"Uptime", text: "Uptime is " + moment.duration(uptime, 'minutes').humanize()}
	];
	toSend = toSend.concat(notificationEventEmitter.getNotificationsToSend());
	res.send(toSend)
})


app.post("/angular/heathers/set", function(req,res){
	heaterManager.setMultipleStatus(req.body, function(){
		heaterManager.getStatus(function(err, response){
			res.send(response);
		});
	})
})

app.get("/angular/heaters/getStatus", function(req, res){
	res.send(heaterManager.getStatus());
})

app.post("/angular/runProgram", function(req, res){
	if(req.body.programKey){
		try {
			lightManager.runProgram(req.body.programKey);
		} catch(exception){
			console.log(exception)
		}
	} else if(typeof req.body.lightName == "string") {
		lightManager.setStatus(req.body, function () {
			// Emit message only after the change has been applied
		});
	} else {
		lightManager.setMultipleStatus(req.body.lightName, req.body, function () {
			// Emit message only after the change has been applied
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
	var programKey = req.body.programKey;
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
})


app.post("/people/setAsAway", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsAway("nico");
	res.send(peopleTracker.getHomeStatus());
})


app.post("/people/setAsAtHome", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsAtHome("nico");
	changeEventEmitter.emit("message", req.body)
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsComingBack", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsComingBack("nico", 20);
	changeEventEmitter.emit("message", req.body)
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsSleeping", function(req,res){
	peopleTracker.setAsSleeping("nico");
	changeEventEmitter.emit("message", req.body)
	res.send(peopleTracker.getHomeStatus());
})



app.use('/', function(req, res, next){
	res.redirect("/angular");
});


/** END OF HTTP SERVER **/
