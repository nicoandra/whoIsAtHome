var Milight = require("milight");

function CommandLineInterpreter(){
	this.start = function(){
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



function LightPrograms(){
	this.milight = new Milight({
		host: '192.168.1.148',
		broadcast: true
	});

	this.runProgram = function(programName){
		if(programName == '1'){
			this.milight.zone([1,2,3,4]).rgb("#FF0000");
			this.milight.zone([1,2,3,4]).rgb("#00FF00");
			this.milight.zone([1,2,3,4]).rgb("#0000FF");

			// milight.zone([2,3]).white(50);
			console.log("PROGRAM 1");
		}

		if(programName == '2'){
			this.milight.zone(1).rgb("#00FF00");
			this.milight.zone([1,2,3,4]).white(0);
			this.milight.zone(2).rgb("#AAFFDD");
			console.log("PROGRAM 2");
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

	this.addMiLightInstance = function(instance){
		this.milightInstances.push(instance);
	}

	this.white = function(){
		this.milightInstances.forEeach(function(key){
			this.milightInstances[key].on();
		});
	}
}
module.exports = RoomLights;


// Build Office Room
var officeRoom = new RoomLights();
boardsMilight = new Milight({
	host: '192.168.1.148',
	broadcast: true
}).zone(3);

officeLampMilight  = new Milight({
	host: '192.168.1.148',
	broadcast: true
}).zone(1);

officeRoom.addMiLightInstance(boardsMilight);
officeRoom.addMiLightInstance(officeLampMilight);



// Build Kitchen Room
var kitchenRoom = new RoomLights();
kitchenMilight = new Milight({
	host: '192.168.1.148',
	broadcast: true
}).zone(2);


kitchenRoom.addMiLightInstance(kitchenMilight);

commandLineInterpreter = new CommandLineInterpreter();
commandLineInterpreter.start();

