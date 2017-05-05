var env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, dgram = require('dgram')
	, debug = require('debug')("app:server")
	, debugEvents = require('debug')('app:events')
	, moment = require('moment')
	, bodyParser = require('body-parser')
	, PeopleTracker = require('./peopleTracker.js')
	, DevicePresence = require('./devicePresence.js')
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
	homeStatus = peopleTracker.getHomeStatus();
	if(homeStatus.home.isAlone){
		actionScheduler.personMovementHasBeenDetected(data);
		notificationEventEmitter.emit("movement", data);
	}
})

internalEventEmitter.on("movementDetected", function(data){
	homeStatus = peopleTracker.getHomeStatus();

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
LightManager = require("./lightManager.js");
lightManager = new LightManager();	// With a LightManager, add lights

var peopleTracker = new PeopleTracker(lightManager, internalEventEmitter)

/** Prepare heaters */
HeaterManager = require('./heaterManager.js');
heaterManager = new HeaterManager(internalEventEmitter);

ActionScheduler = require('./actionScheduler.js');
var actionScheduler = new ActionScheduler(peopleTracker, lightManager, heaterManager, internalEventEmitter );


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

notificationEventEmitter.on('movement', function(data){
	type = "normal";
	var toSend = { date : new Date(), type: "alert", title:"Movement detected", text: "Movement detected in " + data.name }
	notificationQueue.unshift(toSend);
})

/**/
// this.addHeater = function(name, descriptiveName, id, ip, port, options){
heaterManager.addHeater('dev', 'Dev', 1, '192.168.1.113', 8888, { eventEmitter : internalEventEmitter });
heaterManager.addHeater('living', 'Living', 1, '192.168.1.130', 8888, { eventEmitter : internalEventEmitter });

heaterManager.addHeater('livingDual', 'Living Dual', 1, '192.168.1.128', 8888, { eventEmitter : internalEventEmitter });
heaterManager.addHeater('officeDual', 'Office Dual', 2, '192.168.1.128', 8888, { eventEmitter : internalEventEmitter });


lightManager.addHeaterLight("dev", "Dev", heaterManager.getHeaterByName("dev"));


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

	notificationQueue.forEach(function(a){
		toSend.push(a);
	})

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
	response = heaterManager.getStatus();
	res.send(response);
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

httpServer.listen({ port : cfg.httpPort, host : cfg.httpHost } , function(){
	console.log('http interface listening on port '+port);	
});



/** END OF HTTP SERVER **/


// return ;

/*
let smtpConfig = {
	host: 'smtp.gmail.com',
	port: 587,
	secure: false, // upgrade later with STARTTLS
	auth: {
		user: 'user@gmail.com',
		pass: 'pass'
	}
};

var message = {
	from: 'sender@server.com',
	to: 'receiver@sender.com',
	subject: 'Message title',
	text: 'Plaintext version of the message',
	html: '<p>HTML version of the message</p>'
};


var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transporter = nodemailer.createTransport(smtpTransport(cfg.email.smtp));
var message = {
	from: {name: 'HomeOwn', address: 'proliant@nmac.com.ar'},
	to: 'nico@nmac.com.ar',
	subject: 'toda adentro',
	text: ' text message',
	html: '<b>html</b> message'
};

transporter.sendMail(message, function(err, info){
	console.log('send', err, info);
})
*/