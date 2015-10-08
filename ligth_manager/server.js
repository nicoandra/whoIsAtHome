// "use strict";

var Milight = require("milight");

var milight = new Milight({
	host: 'ct5130.myfoscam.org',
	broadcast: true
});

var led = require('limitless-gem/index.js');
 // require('LimitlessGEM');
// var limitless = led.createSocket({ host: 'ct5130.myfoscam.org' });

var CityPlotter = require('../plot/plot.js');
var cityPlotter = new CityPlotter();


var express = require('express'),
app = express(),
port = process.env.PORT || 3999;


var delayBetweenCommands = 200;

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

socket1 = new LightSocket('officeBoards', 3, 'ct5130.myfoscam.org', 8899);
var lights = {
    boards : { color: 'FFFFFF' , brightness : 100 , status : 1, socket : socket1},
    officeLamp : { color: 'FFFFFF' , brightness : 100 , status : 1, socket : socket1 },
    officeLight : { color: 'FFFFFF' , brightness : 100 , status : 1, socket: socket1 },

    kitchenLight : { color: 'FFFFFF' , brightness : 100 , status : 1, socket : socket1 },
    kitchenLamp : { color: 'FFFFFF' , brightness : 100 , status : 1, socket : socket1 },
    counterTop : { color: 'FFFFFF' , brightness : 100 , status : 1, socket : socket1 },
};

var heaterStatus = {
    office : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    kitchen : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    living : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    bedroom : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    guestroom : { status: 0, currentTemperature : 10, desiredTemperature : 10},
}


function CommandLineInterpreter(){
	this.start = function(){
		console.log('Command Line Interpreter: up and running!');
		var stdin = process.openStdin();
		var programs = new LightPrograms();

		stdin.addListener("data", function(d) {
			var programName = d.toString().trim();
			// note:  d is an object, and when converted to a string it will
			// end with a linefeed.  so we (rather crudely) account for that  
			// with toString() and then substring()
			console.log("running program ", programName);
			programs.runProgram(programName);
		});
	}
}
module.exports = CommandLineInterpreter;

var cliInterpreter = new CommandLineInterpreter();
cliInterpreter.start();


function LightSocket(name, group, socket){
    this.name = name;
    this.group = group;
    this.socket = socket;
    this.limitlessLedInstance = led.createSocket({ host: 'ct5130.myfoscam.org' , port: this.port});

    this.commandOn = led.RGBW['GROUP'+group+'_ON'];
    this.commandOff = led.RGBW['GROUP'+group+'_OFF'];
    this.commandWhite = led.RGBW['GROUP'+group+'_SET_TO_WHITE'];
    this.commandDisco = led.RGBW.DISCO_MODE;
    this.commandDiscoFaster = led.RGBW.DISCO_FASTER;
    this.commandDiscoSlower = led.RGBW.DISCO_SLOWER;

    this.on = function(cb){
        this.limitlessLedInstance.queueStuff(this.commandOn);
    }

    this.off = function(cb){
        this.limitlessLedInstance.queueStuff(this.commandOff);
    }

    this.white = function(cb){
        this.limitlessLedInstance.queueStuff(this.commandWhite);
    }

    this.disco = function(cb){

        this.limitlessLedInstance.queueStuff(this.commandOn);
        this.limitlessLedInstance.queueStuff(this.commandDisco);
        cb;
        /*
        // Turn it on
        this.limitlessLedInstance.send(this.commandOn, function(cb){
            // Make it white
            this.limitlessLedInstance.send(this.commandDisco, cb);
        });*/
    }

    this.discoFaster = function(cb){
        // Turn it on
        this.limitlessLedInstance.queueStuff(this.commandOn);
        this.limitlessLedInstance.queueStuff(this.commandDiscoFaster);

    }

    this.discoSlower = function(cb){
        // Turn it on
        this.limitlessLedInstance.queueStuff(this.commandOn);
        this.limitlessLedInstance.queueStuff(this.commandDiscoSlower);
    }

    this.sendStuff = function(){
        this.limitlessLedInstance.sendStuff();
    }
}


function LightPrograms(){

    console.log(lights);

	this.getZonesByProgramName = function(programName){

        var exp;

		if(programName.match('^all lights off')){
            lights.boards.socket.off();
            lights.officeLamp.socket.off();
            lights.kitchenLamp.socket.off();
            lights.boards.socket.sendStuff();
            return true;
		}

		if(programName.match('^all lights on')){
            lights.boards.socket.on();
            lights.officeLamp.socket.on();
            lights.kitchenLamp.socket.on();
            lights.boards.socket.sendStuff();
            return true;
		}

		if(programName.match('^all lights white')){
            lights.boards.socket.white();
            lights.officeLamp.socket.white();
            lights.kitchenLamp.socket.white();
            lights.boards.socket.sendStuff();
            return true;
        }

		exp = programName.match('^all lights (.*)');
		if(exp){
			console.log(exp[1]);
			if(exp[1] == 'disco'){
                lights.boards.socket.disco();
                lights.officeLamp.socket.disco();
                lights.kitchenLamp.socket.disco();
                lights.boards.socket.sendStuff();

                /*
                lights.boards.socket.disco(function() {
                    lights.officeLamp.socket.disco(function () {
                        lights.kitchenLamp.socket.disco();
                    });
                });
                */
                return true;
			}

			if(exp[1] == 'disco faster'){
                lights.boards.socket.discoFaster(
                    lights.officeLamp.socket.discoFaster(
                        lights.kitchenLamp.socket.discoFaster()
                    )
                );
                return true;
			}

			if(exp[1] == 'disco slower'){
                lights.boards.socket.discoSlower(
                    lights.officeLamp.socket.discoSlower(
                        lights.kitchenLamp.socket.discoSlower()
                    )
                );
                return true;

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

        if(affectedZones === true){
            return ;
        }

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











/** HTTP SERVER **/

/** Command HTTP API **/
function receiveCommands(req, res){
	commandString = req.query.command;

	var programs = new LightPrograms();
	programs.runProgram(commandString);
	res.send("Command received.");
}


function getLightStatus(req, res){
    res.send(JSON.stringify(lightStatus));
}

function getHeaterStatus(req, res){
    res.send(JSON.stringify(heaterStatus));
}

function renderIndexPage(req,res){}


app.get('/commands/', receiveCommands);
app.get('/getStatus/lights/', getLightStatus);
app.get('/getStatus/heaters/', getHeaterStatus);
app.get('/', renderIndexPage);

app.listen(port);


/** END OF HTTP SERVER **/