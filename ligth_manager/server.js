var Milight = require("milight");

var milight = new Milight({
	host: 'ct5130.myfoscam.org',
	broadcast: true
});

var led = require('limitless-gem/index.js');
 // require('LimitlessGEM');
var limitless = led.createSocket({ host: 'ct5130.myfoscam.org' });

var CityPlotter = require('../plot/plot.js');
cityPlotter = new CityPlotter();


var express = require('express'),
app = express(),
port = process.env.PORT || 3999;




var colorCodes = {
	violet : [0x40, 0x00],
	royalBlue : [0x40, 0x10],
	blue : [0x40, 0x10],
	babyBlue : [0x40, 0x20],
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

	this.getZonesByProgramName = function(programName){
		
		if(programName.match('^all lights off')){
			return {lights : [1,2,3,4] , heaters : [], commandsToSend : [led.RGBW.ALL_OFF] , parseComplete : true}; 
		}

		if(programName.match('^all lights on')){
			return {lights : [1,2,3,4] , heaters : [], commandsToSend : [led.RGBW.ALL_ON] , parseComplete : true}; 
		}

		if(programName.match('^all lights white')){
			return {lights : [1,2,3,4] , heaters : [], commandsToSend : [led.RGBW.ALL_SET_TO_WHITE] , parseComplete : true}; 
		}

		exp = programName.match('^all lights (.*)');
		if(exp){
			console.log(exp[1]);
			if(exp[1] == 'disco'){
				return {lights : [1,2,3,4] , heaters : [], commandsToSend : [
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP2_ON, led.RGBW.DISCO_MODE, 
					led.RGBW.GROUP3_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP4_ON, led.RGBW.DISCO_MODE ] , parseComplete : true}; 	
			}

			if(exp[1] == 'disco faster'){
				return {lights : [1,2,3,4] , heaters : [], commandsToSend : [
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP2_ON, led.RGBW.DISCO_MODE, 
					led.RGBW.GROUP3_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP4_ON, led.RGBW.DISCO_MODE ] , parseComplete : true}; 	
			}

			if(exp[1] == 'disco slower'){
				return {lights : [1,2,3,4] , heaters : [], commandsToSend : [
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP1_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP2_ON, led.RGBW.DISCO_MODE, 
					led.RGBW.GROUP3_ON, led.RGBW.DISCO_MODE,
					led.RGBW.GROUP4_ON, led.RGBW.DISCO_MODE ] , parseComplete : true}; 	
			}
		}


		if(programName.match('^all rooms (.*)')){
			return {lights : [] , heaters : [1,2,3] , partToStrip : 'all rooms' , parseComplete : false}; 
		}

		if(programName.match('^office (.*)')){

			exp = programName.match('^office all (.*)');
			if(exp){
				if(exp[1] == 'on'){
					return {lights : [1,3] , heaters : [3] ,commandsToSend : [
					led.RGBW.GROUP1_ON, led.RGBW.GROUP2_ON ] , parseComplete : true};
				}

				if(exp[1] == 'off'){
					return {lights : [1,3] , heaters : [3] ,commandsToSend : [
					led.RGBW.GROUP1_OFF, led.RGBW.GROUP2_OFF ] , parseComplete : true};
				}


				if(exp[1] == 'white'){
					return {
						lights : [1,3] , 
						heaters : [3] ,
						commandsToSend : [led.RGBW.GROUP1_SET_TO_WHITE, led.RGBW.GROUP3_SET_TO_WHITE] , 
						parseComplete : true
					};
				}


			}

			if(programName.match('^office lamp (.*)')){
				return {lights : [1] , heaters : [], partToStrip : 'office lamp' , parseComplete : false };
			} 

			if(programName.match('^office boards (.*)')){
				return {lights : [3] , heaters : [], partToStrip : 'office boards' , parseComplete : false };
			} 
			if(programName.match('^office light (.*)')){
				return {lights : [1] , heaters : [], partToStrip : 'office light' , parseComplete : false };
			}

			expr = programName.match('^office ([0-9]+(\.5)?) degrees');
			if(expr){
				return {lights : [] , heaters : [3] , temperature: expr[1] , parseComplete : true};
			}
		}

		if(programName.match('^kitchen (.*)')){

			if(programName.match('^kitchen all (.*)')){
				return {lights : [2,4] , heaters : [], partToStrip : 'kitchen all' , parseComplete : false };
			}

			if(programName.match('^kitchen lamp (.*)')){
				return {lights : [2] , heaters : [], partToStrip : 'kitchen lamp' , parseComplete : false };
			} 

			if(programName.match('^kitchen countertop (.*)')){
				return {lights : [4] , heaters : [], partToStrip : 'kitchen countertop'  , parseComplete : false};
			} 
			if(programName.match('^kitchen light (.*)')){
				return {lights : [2] , heaters : [], partToStrip : 'kitchen light' , parseComplete : false };
			}

			expr = programName.match('^kitchen ([0-9]+(\.5)?) degrees');
			if(expr){
				return {lights : [] , heaters : [1] , temperature: expr[1] , parseComplete : true};
			} 			
		}

		if(programName.match('^living (.*)')){

			if(programName.match('^living all (.*)')){
				return {lights : [1,3] , heaters : [3] , partToStrip : 'living all' , parseComplete : false};
			}

			if(programName.match('^living lamp (.*)')){
				return {lights : [1] , heaters : [], partToStrip : 'living lamp' , parseComplete : false };
			} 

			if(programName.match('^living light (.*)')){
				return {lights : [1] , heaters : [], partToStrip : 'living light' , parseComplete : false};
			}

			expr = programName.match('^living ([0-9]+(\.5)?) degrees');
			if(expr){
				return {lights : [] , heaters : [2] , temperature: expr[1], parseComplete : true};
			}
		}

		return {};
	}

	this.getActionByProgramName = function(programName, affectedZones){
		toParse = programName;
		if(affectedZones.hasOwnProperty('partToStrip')){
			toParse = programName.replace(affectedZones.partToStrip, '').trim();
		}

		affectedZones.toParse = toParse;

		if(	toParse === 'off' || 
			toParse === 'on' || 
			toParse === 'white' || 
			toParse == 'disco' || 
			toParse == 'disco faster' || 
			toParse == 'disco slower'){

			affectedZones.methodToRunOnZones = toParse;
			affectedZones.parseComplete = true;
			return affectedZones;
		}

		exp = toParse.match('([0-9]{2,3}) percent');
		if(exp){
			affectedZones.methodToRunOnZones = 'brightness';
			affectedZones.parametersForMethod = exp[1];
			affectedZones.parseComplete = true;
			return affectedZones;
		}

		// Still need to parse: #color
		Object.keys(colorCodes).forEach(function(a,b){

			affectedZones.methodToRunOnZones = '_send';
			affectedZones.parametersForMethod = [0x40, 0x20];
			affectedZones.parseComplete = true;
			return affectedZones.methodToRunOnZones;

			exp = toParse.match('^('+a+')$');
			if(exp){
				console.log('Match!', a, colorCodes[a]);
				affectedZones.methodToRunOnZones = '_send';
				affectedZones.parametersForMethod = colorCodes[a];
				affectedZones.parseComplete = true;
			}
		})

		return affectedZones;
	}

	this.runProgram = function(programName){
		affectedZones = this.getZonesByProgramName(programName);
		if(!affectedZones.parseComplete){
			affectedZones = this.getActionByProgramName(programName, affectedZones);
		}


		if(affectedZones.parseComplete){

			console.log('*********',affectedZones,'*********');
			if(affectedZones.hasOwnProperty('parametersForMethod')){
				console.log(milight.zone(affectedZones.lights));
			} else {
				affectedZones.commandsToSend.forEach(function(command, index){
					setTimeout(function () {
       					limitless.send(command);
   					}, index * 100);
				});
				
			}
		}

		/*
			all [on / white / color / off / disco]
			all [number] degrees

			office [all|lamp|boards|light] [on|white|#color|off|disco|#number brightess]
			office [#number] degrees
			
			kitchen [all|lamp|countertop|light] [on|white|#color|off|disco|#number brightess]
			kitchen [#number] degrees

			front door [on / white / color / off / disco]
			back door [on / white / color / off / disco]

			corridor [on|white|#color|off|disco|#number brightess]

			living [all|lamp|light] [on|white|#color|off|disco|#number brightess]
			living [#number] degrees
		*/
	}
}

module.exports = LightPrograms;


/** Command HTTP API **/
function receiveCommands(req, res){
	commandString = req.query.command;

	var programs = new LightPrograms();
	programs.runProgram(commandString);
	res.send("Command received.");
}

app.get('/commands/', receiveCommands);
app.get('/getStatus/lights/', getLightStatus);
app.get('/getStatus/heaters/', getHeaterStatus);
app.get('/', renderIndexPage);

app.listen(port);