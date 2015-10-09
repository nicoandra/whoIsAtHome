var dgram = require('dgram');
var debug = require('debug');

var led = require('limitless-gem/index.js');

var CityPlotter = require('../plot/plot.js');
var cityPlotter = new CityPlotter();

var express = require('express'),
app = express(),
port = process.env.PORT || 3999;


var delayBetweenCommands = 300;

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

var receiver1 = new ReceiverSocket('ct5130.myfoscam.org' , 8899);

var lights = {
    boards : new Light('boards', new LightSocket('boards', 3, receiver1)),
    officeLamp : new Light('officeLamp', new LightSocket('officeLampObject', 1, receiver1)),
    kitchenLamp : new Light('kitchenLamp', new LightSocket('officeLampObject', 2, receiver1)),
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

            if(!programName){
                return ;
            }
			console.log("running program ", programName);
			programs.runProgram(programName);
		});
	}
}
module.exports = CommandLineInterpreter;
var cliInterpreter = new CommandLineInterpreter();
cliInterpreter.start();



function ReceiverSocket(host, port){
	this.client = dgram.createSocket('udp4');
	this.buffer = [];
    this.port = port;
    this.host = host;
    this.CLOSE_BYTE = 0x55;
    var self = this;


    this.queueStuff = function(stuff){
        stuff = JSON.parse(JSON.stringify(stuff));
        stuff.push(this.CLOSE_BYTE);
        this.buffer.push(stuff);
	}

    this.sendQueuedStuff = function(){
        var queueSize = self.buffer.length;

        if(queueSize  == 0){
            setTimeout(self.sendQueuedStuff.bind(self), delayBetweenCommands);
            return false;
        }

        toSend = self.buffer.shift();

        var buffer = new Buffer(toSend.concat(), 'hex');
        console.log('sending: ', buffer);

        this.client.send(
            buffer, 0, buffer.length, self.port,
            self.host,
            function(err){
                setTimeout(self.sendQueuedStuff.bind(self), delayBetweenCommands);
            }
        );
    }


    setTimeout(this.sendQueuedStuff.bind(self), delayBetweenCommands);
}

function LightSocket(name, group, receiver){
    this.name = name;
    this.group = group;
    this.receiver = receiver;

    this.commandOn = led.RGBW['GROUP'+group+'_ON'];
    this.commandOff = led.RGBW['GROUP'+group+'_OFF'];
    this.commandWhite = led.RGBW['GROUP'+group+'_SET_TO_WHITE'];
    this.commandDisco = led.RGBW.DISCO_MODE;
    this.commandDiscoFaster = led.RGBW.DISCO_FASTER;
    this.commandDiscoSlower = led.RGBW.DISCO_SLOWER;

    this.on = function(cb){
        this.receiver.queueStuff(this.commandOn);
    }

    this.off = function(cb){
        this.receiver.queueStuff(this.commandOff);
    }

    this.white = function(cb){
        this.receiver.queueStuff(this.commandWhite);
    }

    this.disco = function(cb){
        this.receiver.queueStuff(this.commandOn);
        this.receiver.queueStuff(this.commandDisco);
        cb;
    }

    this.discoFaster = function(cb){
        // Turn it on
        this.receiver.queueStuff(this.commandOn);
        this.receiver.queueStuff(this.commandDiscoFaster);
    }

    this.discoSlower = function(cb){
        // Turn it on
        this.receiver.queueStuff(this.commandOn);
        this.receiver.queueStuff(this.commandDiscoSlower);
    }

    this.setColor = function(colorName){
        this.receiver.queueStuff(this.commandOn);
        this.receiver.queueStuff(colorCodes[colorName]);
    }

    this.sendStuff = function(){
        this.receiver.sendStuff();
    }
}


function Light(name, socket){
    this.name = name;
    this.socket = socket;
    this.status = 0;
    this.color = 'white';
    this.brightness = 100;

    this.on = function(){
        this.socket.on();
        this.status = 1;
    }

    this.off = function(){
        this.socket.off();
        this.status = 0;
    }

    this.white = function(){
        this.socket.white();
        this.status = 1;
    }

    this.disco = function(){
        this.socket.disco();
        this.status = 1;
    }

    this.discoFaster = function(){
        this.socket.discoFaster();
        this.status = 1;
    }

    this.discoSlower = function(){
        this.socket.discoSlower();
        this.status = 1;
    }

    this.setColor = function(colorName){
        this.socket.setColor(colorName);
        this.status = 1;
    }

}


function LightPrograms(){

	this.getZonesByProgramName = function(programName){

        var exp;

        if(programName.match('get lights status')){
            lights.boards.off();
            lights.officeLamp.off();
            lights.kitchenLamp.off();
            return {methodToExecute : 'getLightsStatus' };
        }

		if(programName.match('^all lights off')){
            lights.boards.off();
            lights.officeLamp.off();
            lights.kitchenLamp.off();
            return true;
		}

		if(programName.match('^all lights on')){
            lights.boards.on();
            lights.officeLamp.on();
            lights.kitchenLamp.on();
            return true;
		}

		if(programName.match('^all lights white')){
            lights.boards.white();
            lights.officeLamp.white();
            lights.kitchenLamp.white();
            return true;
        }

		exp = programName.match('^all lights (.*)');
		if(exp){
			console.log(exp[1]);
			if(exp[1] == 'disco'){
                lights.boards.disco();
                lights.officeLamp.disco();
                lights.kitchenLamp.disco();
                return true;
			}

			if(exp[1] == 'disco faster'){
                lights.boards.discoFaster();
                lights.officeLamp.discoFaster();
                lights.kitchenLamp.discoFaster();
                return true;
			}

			if(exp[1] == 'disco slower'){
                lights.boards.discoSlower();
                lights.officeLamp.discoSlower();
                lights.kitchenLamp.discoSlower();
                return true;
            }

            if(colorCodes.hasOwnProperty(exp[1])){
                lights.boards.setColor(exp[1]);
                lights.officeLamp.setColor(exp[1]);
                lights.kitchenLamp.setColor(exp[1]);
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
                    lights.officeLamp.on();
                    lights.boards.on();
                    return true;
				}

				if(exp[1] == 'off'){
                    lights.officeLamp.off();
                    lights.boards.off();
                    return true;
				}

				if(exp[1] == 'white'){
                    lights.officeLamp.white();
                    lights.boards.white();
                    return true;
				}

                if(exp[1] == 'disco'){
                    lights.officeLamp.disco();
                    lights.boards.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.officeLamp.discoFaster();
                    lights.boards.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeLamp.discoSlower();
                    lights.boards.discoSlower();
                    return true;
                }

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeLamp.setColor(exp[1]);
                    lights.boards.setColor(exp[1]);
                    return true;
                }

			}

            exp = programName.match('^office lamp (.*)');
			if(exp){
                if(exp[1] == 'on'){
                    lights.officeLamp.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.officeLamp.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.officeLamp.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.officeLamp.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.officeLamp.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeLamp.discoSlower();
                    return true;
                }

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeLamp.setColor(exp[1]);
                    return true;
                }
			}

			exp = programName.match('^office boards (.*)');
            if(exp){
                if(exp[1] == 'on'){
                    lights.boards.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.boards.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.boards.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.boards.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.boards.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.boards.discoSlower();
                    return true;
                }

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.boards.setColor(exp[1]);
                    return true;
                }
            }

			if(programName.match('^office light (.*)')){
				return "COMMAND NOT IMPLEMENTED";
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


            exp = programName.match('^kitchen lamp (.*)');
            if(exp){
                if(exp[1] == 'on'){
                    lights.kitchenLamp.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.kitchenLamp.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.kitchenLamp.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.kitchenLamp.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.kitchenLamp.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.kitchenLamp.discoSlower();
                    return true;
                }

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.kitchenLamp.setColor(exp[1]);
                    return true;
                }
            }

			if(programName.match('^kitchen countertop (.*)')){
			}
			if(programName.match('^kitchen light (.*)')){
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

        if(affectedZones.hasOwnProperty('methodToExecute')){
            return global[affectedZones.methodToExecute]();
        }

        // console.log('CurrentStatus', lights);
        return ;



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

    this.getLightsStatus = function(){
        return lights;
    }

}

module.exports = LightPrograms;











/** HTTP SERVER **/

/** Command HTTP API **/

function HttpResponses() {
    this.receiveCommands = function(req, res) {
        commandString = req.query.command;
        var programs = new LightPrograms();
        console.log("http", req.ip, commandString);
        response = programs.runProgram(commandString);
        if(!response){
            response = programs.getLightsStatus();
        }
        res.send(JSON.stringify(response));
    }


    function getLightStatus(req, res) {
        res.send(JSON.stringify(lightStatus));
    }

    function getHeaterStatus(req, res) {
        res.send(JSON.stringify(heaterStatus));
    }

    function renderIndexPage(req, res) {
    }

}
module.exports = HttpResponses;

app.get('/commands/', function(req, res){ new HttpResponses().receiveCommands(req, res); });
// app.get('/getStatus/lights/', new HttpResponses.getLightStatus);
// app.get('/getStatus/heaters/', HttpResponses.getHeaterStatus);
// app.get('/', HttpResponses.renderIndexPage);

console.log('http interface listening on port '+port);
app.listen(port);


/** END OF HTTP SERVER **/