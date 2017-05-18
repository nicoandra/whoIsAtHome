"use strict"

const env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, debug = require('debug')("app:server")
	, debugEvents = require('debug')('app:events')
	, moment = require('moment')
	, PeopleTracker = require('./components/peopleTracker.js')
	, DevicePresence = require('./components/devicePresence.js')



var EventEmitter = require('events').EventEmitter
const path = require('path');


var internalEventEmitter = new EventEmitter()
internalEventEmitter.setMaxListeners(100);


var LightProgram = require("./lightProgram.js")
/** Prepare the light setup */
const LightManager = require("./components/lightManager.js");
var lightManager = new LightManager(cfg);	// With a LightManager, add lights

var peopleTracker = new PeopleTracker(cfg)

/** Prepare heaters */
var HeaterManager = require('./components/heaterManager.js');
var heaterManager = new HeaterManager(cfg, internalEventEmitter);

var ActionScheduler = require('./components/actionScheduler.js');
var actionScheduler = new ActionScheduler(cfg, peopleTracker, lightManager, heaterManager);


const devices = require("./devices/devices");



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
heaterManager.addHeatersFromObject(devices.heaters);
lightManager.addHeaterLight("dev", "Dev", heaterManager.getHeaterByName("dev"));



var LocalWeather = require('./components/localWeather.js');
var localWeather = new LocalWeather(cfg);


/** HTTP SERVER **/
var app = require('./includes/express.js')(cfg);


lightManager.addLightsFromObject(devices.lights);

app.addComponent('heaterManager', heaterManager.start(app));
app.addComponent('localWeather', localWeather.start(app));
app.internalEventEmitter.on("personMovementDetected", actionScheduler.personMovementHasBeenDetected.bind(actionScheduler));
app.addComponent('lightManager', lightManager.start(app));


app.addComponent('peopleTracker', peopleTracker.start(app));
app.addComponent('actionScheduler', actionScheduler.start(app));

var presencePhone = new DevicePresence({ name : "Nic phone", address : "192.168.1.141"});
app.internalEventEmitter.on("presenceMessage", function(data){

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
presencePhone.start(app);
/*

app.internalEventEmitter.on("heaterUpdated", function(data) {
	// When a heater changes, emit a changeEvent so the interfaces are updated
	debugEvents("heaterUpdated", data);
	changeEventEmitter.emit("message", data);
});

app.internalEventEmitter.on("lightsSwitchProgramRequested", function(data) {
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

});

*/

app.internalEventEmitter.on("personMovementDetected", function(data){
	var homeStatus = peopleTracker.getHomeStatus();
	if(homeStatus.home.isAlone){
		actionScheduler.personMovementHasBeenDetected(data);
		app.notify("movement", data);
	}
})

app.internalEventEmitter.on("movementDetected", function(data){
	var homeStatus = peopleTracker.getHomeStatus();

	if(homeStatus.home.isAlone){
		if(presencePhone.isPresent()){
			peopleTracker.setAsAtHome("nico");
			changeEventEmitter.emit("message", data);
		}		
	}
})

/*
app.get("/angular/lights/getInterfaceOptions", function(req, res){
	var lights = lightManager.getInterfaceOptions();
	var people = peopleTracker.getHomeStatus();
	var heaters = heaterManager.getHomeStatus();
	res.send({'lights' : lights.lights , 'people' : people, 'programs' : lights.programs});
})
*/

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



app.post('/app/components/lightManager/runProgram', function(req, res){

	var lightManager = app.getComponent('lightManager');

	changeEventEmitter.emit("majorChange", req.body)
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

	[100, 250, 500].forEach(function(delay){
		setTimeout(function() {
			changeEventEmitter.emit("majorChange", req.body)
		}, delay);
	})


	res.send(
		lightManager.getStatus()
	);

});



app.get("/app/sock", function(req,res){

	var sendResponseOnChange = function(){
		try {
			res.send(app.getStatus())
			res.end();
		} catch(exception){
			console.log(exception);
		}
	}

	// var responseTimeout = setTimeout(sendResponseOnChange, 50 * 1000);
	changeEventEmitter.on('majorChange', function(data){
		// clearTimeout(responseTimeout);
		sendResponseOnChange();
		changeEventEmitter.removeListener("majorChange", sendResponseOnChange);
	})
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
	toSend = toSend.concat(app.notificationEventEmitter.getNotificationsToSend());
	res.send(toSend)
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
	changeEventEmitter.emit("majorChange", req.body)
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsComingBack", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsComingBack("nico", 20);
	changeEventEmitter.emit("majorChange", req.body)
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsSleeping", function(req,res){
	peopleTracker.setAsSleeping("nico");
	changeEventEmitter.emit("majorChange", req.body)
	res.send(peopleTracker.getHomeStatus());
})



/** END OF HTTP SERVER **/
