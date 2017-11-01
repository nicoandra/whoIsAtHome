"use strict"

const env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, debug = require('debug')("app:server")
	, debugEvents = require('debug')('app:events')
	, moment = require('moment')
	, PeopleTracker = require('./components/peopleTracker.js')
	, DevicePresence = require('./components/devicePresence.js')
	, path = require('path');



let EventEmitter = require('events').EventEmitter;



let internalEventEmitter = new EventEmitter()
internalEventEmitter.setMaxListeners(100);


let LightProgram = require("./lightProgram.js")
/** Prepare the light setup */
const LightManager = require("./components/lightManager.js");
let lightManager = new LightManager(cfg);	// With a LightManager, add lights

let peopleTracker = new PeopleTracker(cfg)

/** Prepare heaters */
const HeaterManager = require('./components/heaterManager.js');
let heaterManager = new HeaterManager(cfg, internalEventEmitter);

const ActionScheduler = require('./components/actionScheduler.js');
let actionScheduler = new ActionScheduler(cfg, peopleTracker, lightManager, heaterManager);


const devices = require("./devices/devices");



let normalOptions = new LightProgram("Normal", "normal");

let normalNight = new LightProgram("Night", "normal-night");
normalNight.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 0  });
normalNight.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 0 });
normalNight.addStatus({lightName: 'officeBoards', onOff : false });
normalNight.addStatus({lightName: 'officeLamp', onOff : false });

let normalLow = new LightProgram("Low", "normal-low");
normalLow.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 30  });
normalLow.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 40 });
normalLow.addStatus({lightName: 'officeBoards', onOff : false });
normalLow.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 40  });


let normalMed = new LightProgram("Med", "normal-med");
normalMed.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 70  });
normalMed.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 70 });
normalMed.addStatus({lightName: 'officeBoards', onOff : false });
normalMed.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 70  });

let normalHigh = new LightProgram("High", "normal-high");
normalHigh.addStatus({lightName: 'kitchenCountertop', onOff : true, "brightness": 100  });
normalHigh.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 100 });
normalHigh.addStatus({lightName: 'officeBoards', onOff : false });
normalHigh.addStatus({lightName: 'officeLamp', onOff : true, color: "white", "brightness": 100  });
normalOptions.addChildProgram(normalNight);
normalOptions.addChildProgram(normalLow);
normalOptions.addChildProgram(normalMed);
normalOptions.addChildProgram(normalHigh);
lightManager.addProgramInstance(normalOptions);

let allRed = new LightProgram("All Red", "all red");
["officeLamp","kitchenLamp", "officeBoards"].forEach(function(lightName){
	allRed.addStatus({lightName: lightName, onOff : true, color: "red" , brightness: 100});
})
lightManager.addProgramInstance(allRed);

let romantic = new LightProgram("Romantic", "romantic");
romantic.addStatus({lightName: 'kitchenLamp', onOff : true, color: "white", brightness: 20 });
romantic.addStatus({lightName: 'kitchenCountertop', onOff : false });
romantic.addStatus({lightName: 'officeBoards', onOff : false });
romantic.addStatus({lightName: 'officeLamp', onOff : true, color: "white", brightness: 20 });
lightManager.addProgramInstance(romantic);


/** Prepare heaters */
heaterManager.addHeatersFromObject(devices.heaters);
lightManager.addHeaterLight("dev", "Dev", heaterManager.getHeaterByName("dev"));
lightManager.addLightsFromObject(devices.lights);




const LocalWeather = require('./components/localWeather.js');
let localWeather = new LocalWeather(cfg);


/** HTTP SERVER **/
let app = require('./includes/express.js')(cfg);



app.addComponent('heaterManager', heaterManager.start(app));
app.addComponent('localWeather', localWeather.start(app));
app.internalEventEmitter.on("personMovementDetected", actionScheduler.personMovementHasBeenDetected.bind(actionScheduler));
app.addComponent('lightManager', lightManager.start(app));
app.addComponent('peopleTracker', peopleTracker.start(app));
app.addComponent('actionScheduler', actionScheduler.start(app));


app.internalEventEmitter.on("personMovementDetected", function(data){
	let homeStatus = peopleTracker.getHomeStatus();
	if(homeStatus.home.isAlone){
		actionScheduler.personMovementHasBeenDetected(data);
		app.notify("movement", data);
	}
})

app.internalEventEmitter.on("movementDetected", function(data){
	let homeStatus = peopleTracker.getHomeStatus();

	if(homeStatus.home.isAlone){
		if(presencePhone.isPresent()){
			peopleTracker.setAsAtHome(data.ownerName);
			// changeEventEmitter.emit("message", data);
		}
	}
})

app.get("/angular/lights/getStatus", function(req, res){
	res.send(lightManager.getStatus())
})

app.get("/angular/lights/getAvailablePrograms", function(req, res){

	let availablePrograms = lightManager.getAvailablePrograms();
	let response = [];

	Object.keys(availablePrograms).forEach(function(key, value){
		value = availablePrograms[key];
		value.key = key;
		response.push(value)
	})
	res.send(response);

})


app.post('/app/components/lightManager/runProgram', function(req, res){

	let lightManager = app.getComponent('lightManager');

	app.internalEventEmitter.emit("majorChange", req.body);

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

	res.send(app.getStatus());

});



app.get("/app/sock", function(req,res){

	let sendResponseOnChange = function(){
		try {
			res.send(app.getStatus())
			res.end();
		} catch(exception){
			console.log(exception);
		}
	}

	let processEvent = function(data){
		// clearTimeout(responseTimeout);
		sendResponseOnChange();
		app.internalEventEmitter.removeListener("majorChange", processEvent);
	}

	app.internalEventEmitter.on('majorChange', processEvent)
})


app.get("/angular/system/getNotifications", function(req,res){
	let uptime = moment.duration(process.uptime(), 'seconds').asMinutes();
	let type = "success";
	if(uptime < 10){
		type = "danger";
	}

	let toSend = [
		{ date : new Date(), type: type, title:"Uptime", text: "Uptime is " + moment.duration(uptime, 'minutes').humanize()}
	];
	toSend = toSend.concat(app.notificationEventEmitter.getNotificationsToSend());
	res.send(toSend)
})


app.get("/lights/allOff", function(req,res){
	lightManager.allLightsOff();
})

app.post("/lights/iterateBetweenChildPrograms", function(req,res){
	let programKey = req.body.programKey;
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
	app.internalEventEmitter.emit("presenceMessage", {event : 'resetValuesToFakePresence', device : "Nic phone"} );
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsComingBack", function(req,res){
	debug("Requested", req.url)
	peopleTracker.setAsComingBack("nico", 20);
	app.internalEventEmitter.emit("majorChange", req.body)
	res.send(peopleTracker.getHomeStatus());
})

app.post("/people/setAsSleeping", function(req,res){
	peopleTracker.setAsSleeping("nico");
	app.internalEventEmitter.emit("majorChange", req.body)
	res.send(peopleTracker.getHomeStatus());
})



/** END OF HTTP SERVER **/
