var Milight = require("milight");

require('plot.plot.js');
cityPlotter = new cityPlotter();

var express = require('express'),
app = express(),
port = process.env.PORT || 3999;


function CommandLineInterpreter(){
	this.start = function(){
		console.log('Command Line Interpreter: up and running!');
		var stdin = process.openStdin();
		var programs = new LightPrograms();

		stdin.addListener("data", function(d) {
			programName = d.toString().trim();
			// note:  d is an object, and when converted to a string it will
			// end with a linefeed.  so we (rather crudely) account for that  
			// with toString() and then substring() 
			console.log("you entered: [" + programName + "]");
			programs.runProgram(programName);
		});
	}
}
module.exports = CommandLineInterpreter;

var lightStatus = {
	boards : { color: 'FFFFFF' , brightness : 100 , status : 1 },
	officeLamp : { color: 'FFFFFF' , brightness : 100 , status : 1 },
	officeLight : { color: 'FFFFFF' , brightness : 100 , status : 1 },

	kitchenLight : { color: 'FFFFFF' , brightness : 100 , status : 1 },
	kitchenLamp : { color: 'FFFFFF' , brightness : 100 , status : 1 },
	counterTop : { color: 'FFFFFF' , brightness : 100 , status : 1 },
};

var heaterStatus = {
	office : { status: 0, currentTemperature : 10, desiredTemperature : 10},
	kitchen : { status: 0, currentTemperature : 10, desiredTemperature : 10},
	living : { status: 0, currentTemperature : 10, desiredTemperature : 10},
	bedroom : { status: 0, currentTemperature : 10, desiredTemperature : 10},
	guestroom : { status: 0, currentTemperature : 10, desiredTemperature : 10},
}


function LightPrograms(){
	this.milight = new Milight({
		host: '192.168.1.148',
		broadcast: true
	});

	this.runProgram = function(programName){

		/*
			office [all] [on / white / color / off / disco]
			office lamp [on / white / color / off / disco]
			office boards [on / white / color / off / disco]
			office light [on / white / color / off / disco]
			office [number] degrees

			
			kitchen [all] [on / white / color / off / disco]
			kitchen lamp [on / white / color / off / disco]
			kitchen countertop [on / white / color / off / disco]
			kitchen [number] degrees

			front door [on / white / color / off / disco]
			back door [on / white / color / off / disco]

			corridor [on / white / color / off / disco]

			living [all] [on / white / color / off / disco]
			living light [on / white / color / off / disco]
			living lamp [on / white / color / off / disco]

		*/

		if(programName == '1'){
			console.log("START 1");

			officeRoom.white();
			kitchenRoom.white();
			console.log("END 1");

			// milight.zone([2,3]).white(50);
		}

		if(programName == '2'){
			console.log("START 2");

			officeRoom.off();
			kitchenRoom.off();


			console.log("END 2");
		}


		if(programName == 'nightMode'){
			this.milight.zone([1,2,3,4]).nightMode();
		}
	}
}

module.exports = LightPrograms;


function RoomLights(){
	this.name = '';
	this.milightInstances = [];
	this.milightZones = [];
	this.program = '';
	this.color = '';
	this.brightness = 100;

	this.addMiLightInstance = function(instance){
		this.milightInstances.push(instance);
	}

	this.addMiLightZone = function(zone){
		this.milightZones.push(zone);
	}



	this.white = function(){
		boardsMilight = new Milight({
			host: '192.168.1.148',
			broadcast: true
		}).zone(this.milightZones).white();

		/*
		this.milightInstances.forEach(function(instance){
			instance.white(function(){return true;});
		});*/
	}

	this.off = function(rgbColor){

		boardsMilight = new Milight({
			host: '192.168.1.148',
			broadcast: true
		}).zone(this.milightZones).off();

	}

}
module.exports = RoomLights;


// Build Office Room
var officeRoom = new RoomLights();

officeRoom.addMiLightZone(1);
officeRoom.addMiLightZone(3);



// Build Kitchen Room
var kitchenRoom = new RoomLights();
kitchenRoom.addMiLightZone(2);

commandLineInterpreter = new CommandLineInterpreter();
commandLineInterpreter.start();



function receiveCommands(req, res){
	commandString = req.query.command;
	console.log(req.query);

	var programs = new LightPrograms();
	programs.runProgram(commandString);
	res.send();
}



app.get('/', receiveCommands);
app.listen(port);