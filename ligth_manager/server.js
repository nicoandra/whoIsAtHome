var dgram = require('dgram');
var debug = require('debug');

var led = require('limitless-gem/index.js');

var CityPlotter = require(__dirname + '/plot.js');
var cityPlotter = new CityPlotter();

var moment = require('moment');


var env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js');


/* var redis = require("redis"),
    client = redis.createClient('redis://192.168.0.106'); */

var request = require('request');

var isNicoAtHome = false;




var delayBetweenCommands = 80;

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

//var receiver1 = new ReceiverSocket('ct5130.myfoscam.org' , 8899);
// var receiver1 = new ReceiverSocket('192.168.1.106' , 8899);
var receiver1 = new ReceiverSocket(cfg.milight1);
var receiver2 = new ReceiverSocket(cfg.milight1);
var receiver3 = new ReceiverSocket(cfg.milight1);

var lights = {
    officeLamp : new Light('officeLamp', new LightSocket('officeLampObject', 1, receiver1)),
	kitchenLamp : new Light('kitchenLamp', new LightSocket('officeLampObject', 2, receiver1)),
	kitchenCountertop : new Light('KitchenCountertop', new LightSocket('officeLampObject', 4, receiver1)),
    officeBoards : new Light('officeBoards', new LightSocket('boards', 3, receiver1)),

};

var heaterStatus = {
    // office : {name: 'Office', status: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/office' },
    kitchen : {name : 'Kitchen', power: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/kitchen' },
    living : {name: 'Living', power: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/living' },
    // bedroom : { status: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/office' },
    // guestroom : { status: 0, currentTemperature : 10, desiredTemperature : 10, url : 'http://192.168.1.125/get/office' },
}

function pollHeaterStatus(){

	Object.keys(heaterStatus).forEach(function(key){
		url = heaterStatus[key].url;
		request(url, function(error, response, body){
			if(!error && response.statusCode == 200){
				var info = JSON.parse(body);
				currTemp = parseFloat(info.currentTemperature);
				cityPlotter.addValue(heaterStatus[key].name, currTemp);
				heaterStatus[key].desiredTemperature = info.desiredTemperature;
				heaterStatus[key].currentTemperature = info.currentTemperature;
				heaterStatus[key].power = info.power;
			}
		});
	});
}

function appendCurrentTempToTrend(){
	Object.keys(heaterStatus).forEach(function(key){
		cityPlotter.addValue(heaterStatus[key].name, heaterStatus[key].currentTemperature);
	});
}

pollHeaterStatus();
appendCurrentTempToTrend();

function setHeaterTemperature(heaterName, desiredTemperature){
	if(!heaterStatus[heaterName]){
		return ;
	}

	url = heaterStatus[heaterName].url;
	url = url.replace('/get/', '/set/') + "?temperature=" + desiredTemperature;

	request(url, function(error, response, body){
		if(!error && response.statusCode == 200){
			var info = JSON.parse(body);
			currTemp = parseFloat(info.currentTemperature);

		}
	});
}

setInterval(pollHeaterStatus, 5000); // Poll heater status every minute for the trend
setInterval(appendCurrentTempToTrend, 60000); // Append temperatures every minute for the trend


/**
Command line interpreter (?) This is not really a CLI, but a terminal mode. You can type program names in the running server
as a console. try typing "all lights off" or "all lights 255 0 0"
**/
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
			programs.runProgram(programName);
		});
	}
}
module.exports = CommandLineInterpreter;
var cliInterpreter = new CommandLineInterpreter();
cliInterpreter.start();



function ReceiverSocket(params){
	this.client = dgram.createSocket('udp4');
	this.buffer = [];
    this.port = params.port;
    this.host = params.host;
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

        if(toSend.length > 3){
        	/*
        	 Some commands are better to send together; notably the "light on" command and any of the colors or
        	 disco mode. The reason is that in order to set a light on disco mode, for example, the light that will be
        	 affected needs to be identified first. The way to identity the lights is by sending an "on" command.

        	 But, if 2 setColor are sent at the same time for different lights, the end result can be the opposite; light A will take the color intended to
        	 be for B, and light B will take the color intended for light A.

        	 Because of this, some commands need to be sent together */

        	buffer1 = [toSend[0],toSend[1], toSend[2]];
        	buffer2 = [toSend[3],toSend[4], toSend[5]];

	        var buffer1 = new Buffer(buffer1.concat(), 'hex');
	        var buffer2 = new Buffer(buffer2.concat(), 'hex');

        	// console.log('[>Buffer1] ', buffer1);
	        this.client.send(
    	        buffer1, 0, buffer1.length, self.port,
            	self.host,
            	function(err){

            		setTimeout(function(){

						this.client.send(
							buffer2, 0, buffer2.length, self.port,
							self.host,
							function(err){
								// calls itelf again
								setTimeout(self.sendQueuedStuff.bind(self), 10);
							}
						)}.bind(this), 10);
            	}.bind(this)
        	);

        } else {

        	/** This is a short command of 3 datagrams; it's OK to send standalone */

	        var buffer = new Buffer(toSend.concat(), 'hex');
	        // console.log('sending: ', buffer);

	        this.client.send(
	            buffer, 0, buffer.length, self.port,
	            self.host,
	            function(err){
	            	// calls itelf again
	                setTimeout(self.sendQueuedStuff.bind(self), delayBetweenCommands);
	            }
	        );
        }
    }

    this.getQueueSize = function(){
    	return this.buffer.length;
    }

    // Start sending queued messages. The function will call itself in the queue
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

    this.commandBrightnessMax = led.RGBW.BRIGHTNESS_MAX;
    this.commandBrightnessMin = led.RGBW.BRIGHTNESS_MIN;




    this.on = function(cb){
        this.receiver.queueStuff(this.commandOn);
    }

    this.off = function(cb){
        this.receiver.queueStuff(this.commandOff);
    }

    this.white = function(cb){
        this.receiver.queueStuff(this.commandWhite);
        this.receiver.queueStuff(this.commandWhite);
    }

    this.disco = function(cb){
        this.receiver.queueStuff(this.commandOn.concat(0x55, this.commandDisco));
        cb;
    }

    this.discoFaster = function(cb){
        // Turn it on
        this.receiver.queueStuff(this.commandOn.concat(0x55, this.commandDiscoFaster));
    }

    this.discoSlower = function(cb){
        // Turn it on
        this.receiver.queueStuff(this.commandOn.concat(0x55, this.commandDiscoSlower));
    }

	this.setColor = function(colorName){
		if(Array.isArray(colorName)){
			colorCode = colorName;
		} else {
			colorCode = colorCodes[colorName];
		}

		this.receiver.queueStuff(this.commandOn.concat(this.receiver.CLOSE_BYTE, colorCode));
	}

	this.brightnessMax = function(){
		this.receiver.queueStuff(this.commandOn.concat(this.commandBrightnessMax));
	}

	this.brightnessMin = function(){
		this.receiver.queueStuff(this.commandOn.concat(this.commandBrightnessMin));
	}	

	this.brightness = function(value){
		value = Math.round(2+((value/100)*25));
		this.receiver.queueStuff(this.commandOn.concat(0x55, 0x4e, value));
	}

    this.queueStuff = function(stuff){
        this.receiver.queueStuff(stuff);
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
    this.brightnessValue = 100;
    this.fadeInProgress = 0;

    this.currentProgram = '';

    this.commandQueue = [];

	this.queueOn = function(){
		this.commandQueue.push(this.socket.commandOn);
	}

	this.queueOff = function(){
		this.commandQueue.push(this.socket.commandOff);
	}

	this.queueColor = function(color){
		// this.commandQueue.push(this.socket.commandOn);
		this.commandQueue.push([].concat(this.socket.commandOn, [0x55], color));
	}

	this.sendQueue = function(){
		if(this.socket && this.commandQueue.length){
			toSend = this.commandQueue.shift();
			this.socket.queueStuff(toSend);
		}
	}

	self = this;
	setInterval(this.sendQueue.bind(self), 100);

    this.on = function(){
        this.socket.on();
        this.status = 1;
        this.commandQueue = [];
    }

    this.off = function(){
        this.socket.off();
        this.status = 0;
        this.color = '';
        this.commandQueue = [];
    }

    this.white = function(){
        this.socket.white();
        this.status = 1;
        this.color = 'white';
        this.commandQueue = [];
    }

    this.disco = function(){
        this.socket.disco();
        this.status = 1;
        this.color = 'disco';
        this.commandQueue = [];
    }

    this.discoFaster = function(){
        this.socket.discoFaster();
        this.status = 1;
        this.color = 'disco';
        this.commandQueue = [];
    }

    this.discoSlower = function(){
        this.socket.discoSlower();
        this.status = 1;
        this.color = 'disco';
        this.commandQueue = [];
    }

    this.setColor = function(colorName){
        this.socket.setColor(colorName);
        this.socket.setColor(colorName);
        this.socket.setColor(colorName);
        this.socket.setColor(colorName);
        this.status = 1;
        this.color = colorName;
        this.commandQueue = [];
    }

	this.brightnessMax = function(){
		this.socket.brightnessMax();
		this.brightness = 10;
	}

	this.brightnessMin = function(){
		this.socket.brightnessMin();
		this.brightness = 1;
	}	


	this.brightness = function(value){
		this.socket.brightness(value);
		this.brightnessValue = value;
	}

	this.fade = function(colorFrom, colorTo, maxSteps){
		colorFrom = Array.isArray(colorFrom) ? colorFrom : colorCodes[colorFrom];
		colorFrom = colorFrom[1];
		colorTo = Array.isArray(colorTo) ? colorTo : colorCodes[colorTo];
		colorTo = colorTo[1];

		step = colorFrom < colorTo ? 1 : -1;

		step = Math.max(1, Math.abs(colorFrom - colorTo) / maxSteps) * step;

		if(colorFrom == colorTo){
			return ;
		}

		for(colorToSet = colorFrom; ; colorToSet = colorToSet + step){
			if(colorToSet < colorTo && step < 0){
				break;
			}

			if(colorToSet > colorTo && step > 0){
				break;
			}

			this.queueColor([0x40, colorToSet]);
		}

	}

	this.ocean = function(step){
		this.commandQueue = [];
		var self = this;
		if(!step){
			if(this.color =='ocean'){
				// Return immediately to not pile up timeouts
				return ;
			}
			this.color = 'ocean';
			step = 1;
			this.status = 1;
		}

		if(this.color == 'ocean'){
			if(step === 1){
				this.fade('lightBlue', 'aqua', 8);
			} else if(step === 2){
				this.fade('aqua', 'royalBlue', 8);
			} else if(step === 3){
				this.fade('royalBlue', 'lightBlue', 8);
			}

			step = step == 3 ? 0 : step;
			step++;

			setTimeout(function(){
				if(this.color == 'ocean'){
					this.ocean(step);
				}
			}.bind(self).bind(step), Math.random() * 2000);
		}
	}

	this.fire = function(step){
		this.commandQueue = [];
		var self = this;
		if(!step){
			if(self.color == 'fire'){
				// Return immediately to not pile up timeouts
				return ;
			}			
			this.color = 'fire';
			step = 1;
			this.status = 1;
		}
		
		if(this.color == 'fire'){
			if(step === 1){
				this.fade('red', 'orange', 5 + Math.random() * 3);
			} else if(step === 2){
				this.fade('orange', 'yellowOrange', 2);
			} else if(step === 3){
				this.fade('yellowOrange', 'orange', 2);
			} else if(step === 3){
				this.fade('orange', 'red', 2);				
			}

			step = step == 2 ? 0 : step;
			step++;

			setTimeout(function(){
				if(this.color == 'fire'){
					this.fire(step);
				}
			}.bind(self).bind(step), 100);
		}
	}

	this.pinks = function(step){
		this.commandQueue = [];
		var self = this;
		if(!step){
			if(self.color == 'pinks'){
				// Return immediately to not pile up timeouts
				return ;
			}			
			this.color = 'pinks';
			step = 1;
			this.status = 1;
		}
		
		if(this.color == 'pinks'){
			if(step === 1){
				this.fade('lilac', 'pink', 24);
			} else if(step === 2){
				this.fade('pink', 'lilac', 24);
			}

			step = step == 2 ? 0 : step;
			step++;

			setTimeout(function(){
				if(this.color == 'pinks'){
					this.pinks(step);
				}
			}.bind(self).bind(step), 2500);
		}
	}

	this.greens = function(step){
		this.commandQueue = [];
		var self = this;
		if(!step){
			if(this.color == 'greens'){
				// Return immediately to not pile up timeouts
				return ;
			}
			this.color = 'greens';
			step = 1;
			this.status = 1;
		}

		if(this.color == 'greens'){
			if(step === 1){
				this.fade(colorCodes.seafoamGreen, colorCodes.limeGreen, 8);
			} else if(step === 2){
				this.fade(colorCodes.limeGreen, colorCodes.green, 8);
			} else if(step === 3){
				this.fade(colorCodes.green, colorCodes.seafoamGreen, 8);
			}

			step = step == 3 ? 0 : step;
			step++;

			setTimeout(function(){
				if(this.color == 'greens'){
					this.greens(step);
				}
			}.bind(self).bind(step), 2500);
		}
	}	


}


function LightPrograms(){

	this.getZonesByProgramName = function(programName){
        var exp;
        var action = '';
        var actionArguments = [];
        var affectedLights = [];
        var affectedHeaters = [];

        //console.log(heaterStatus);

		if(programName.match('romantic mode')){
			this.getZonesByProgramName('all lamps white');
			
			this.getZonesByProgramName('all lamps brightness 5');
			this.getZonesByProgramName('all lamps brightness 10');
			this.getZonesByProgramName('all lamps brightness 15');
			this.getZonesByProgramName('all lamps brightness 20');
			
			return true;
		}



		if(programName.match('nico is out')){

			this.getZonesByProgramName('kitchen lamp off');
			this.getZonesByProgramName('office lamp off');
			this.getZonesByProgramName('kitchen countertop off');

			for(i = 0; i < 100; i = i + 10) {
				this.getZonesByProgramName('office lamp brightness ' + i);	
				this.getZonesByProgramName('office lamp white');

				if(i < 51){
					this.getZonesByProgramName('kitchen countertop brightness ' + i);
					this.getZonesByProgramName('kitchen countertop white');
				}
			}

			return true;
		}


		if(programName.match('nico is in')){

			this.getZonesByProgramName('all lights off');	
		
			return true;
		}

        if(programName.match('get lights status')){
            return {methodToExecute : 'getLightsStatus' };
        }


		exp = programName.match('^temperature ([a-zA-Z]+) ([0-9\.]+)');
		if(exp){
			roomName = exp[1]
			desiredTemperature = exp[2];

			if(roomName == "all"){
				affectedHeaters = Object.keys(heaterStatus);
			} else {
				affectedHeaters.push(roomName);
			}

			affectedHeaters.forEach(function(name){
				setHeaterTemperature(name, desiredTemperature);
				console.log(name, desiredTemperature);
			})
			
			console.log("roomName is", roomName, heaterStatus[exp[2]], "cambiando ", affectedHeaters);

		}


		exp = programName.match('^all lights (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
			affectedLights.push(lights.officeLamp);
			affectedLights.push(lights.kitchenLamp);
			affectedLights.push(lights.kitchenCountertop);
		}

		exp = programName.match('^all lamps (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeLamp);
			affectedLights.push(lights.kitchenLamp);
		}		

		exp = programName.match('^office all (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
			affectedLights.push(lights.officeLamp);
		}


		exp = programName.match('^office lamp (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeLamp);
		}

		exp = programName.match('^office boards (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
		}

		exp = programName.match('^kitchen lamp (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.kitchenLamp);
		}

		exp = programName.match('^kitchen countertop (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.kitchenCountertop);
		}

		exp = programName.match('^kitchen all (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.kitchenLamp);
			affectedLights.push(lights.kitchenCountertop);
		}

		// Now parse the action!
		exp = action.match('^color (.*)');
		if(exp){
			action = 'setColor';
			actionArguments.push(exp[1]);
		}

		colorMatch = action.match('([0-9]{1,3}) ([0-9]{1,3}) ([0-9]{1,3})');
		if(colorMatch){
			colorToSet = rgbToMilightColor(colorMatch[1], colorMatch[2], colorMatch[3]);
			action = 'setColor';
			actionArguments.push(colorToSet);
		}

		// console.log(action);

		exp = action.match("^brightness (.*)");
		if(exp){
			if(exp[1] == 'max'){
				action = 'brightnessMax';
			} else if(exp[1] == 'min'){
				action = 'brightnessMin';
			} else if(exp[1] >= 0 && exp[1] <= 100) {
				action = 'brightness';
				actionArguments.push(exp[1]);
			}
		}


		if(action){
			affectedLights.forEach(function(lightObject){
				if(lightObject.hasOwnProperty(action) && typeof lightObject[action] === 'function'){
					
					// console.log('Calling method '+action+ ' with params ', actionArguments);
					lightObject[action].apply(lightObject, actionArguments);
					return true;
				} else {
					console.log('This object does not have a method '+action+'. Fallback');
				}

			});
		}

		if(programName.match('^all lights off')){
            lights.officeBoards.off();
            lights.officeLamp.off();
            lights.kitchenLamp.off();
            return true;
		}

		if(programName.match('^all lights on')){
            lights.officeBoards.on();
            lights.officeLamp.on();
            lights.kitchenLamp.on();
            return true;
		}

		if(programName.match('^all lights white')){
            lights.officeBoards.white();
            lights.officeLamp.white();
            lights.kitchenLamp.white();
            return true;
        }

		exp = programName.match('^all lights (.*)');
		if(exp){
			if(exp[1] == 'disco'){
                lights.officeBoards.disco();
                lights.officeLamp.disco();
                lights.kitchenLamp.disco();
                return true;
			}

			if(exp[1] == 'disco faster'){
                lights.officeBoards.discoFaster();
                lights.officeLamp.discoFaster();
                lights.kitchenLamp.discoFaster();
                return true;
			}

			if(exp[1] == 'disco slower'){
                lights.officeBoards.discoSlower();
                lights.officeLamp.discoSlower();
                lights.kitchenLamp.discoSlower();
                return true;
            }


            // Handle explicit colors (ie red, blue, green) as defined in the property
			if(colorCodes.hasOwnProperty(exp[1])){
				lights.officeBoards.setColor(exp[1]);
				lights.officeLamp.setColor(exp[1]);
				lights.kitchenLamp.setColor(exp[1]);
				return true;
			}



			if(exp[1] == 'brightness max'){
				lights.officeLamp.brightnessMax();
				lights.officeBoards.brightnessMax();
				lights.kitchenLamp.brightnessMax();
				return true;
			}

			if(exp[1] == 'brightness min'){
				lights.officeLamp.brightnessMin();
				lights.officeBoards.brightnessMin();
				lights.kitchenLamp.brightnessMin();
				return true;
			}


			if(exp[1] == 'ocean' || exp[1] == 'pinks' || exp[1] == 'greens'){
				try {
					lights.officeBoards[exp[1]]();
					lights.officeLamp[exp[1]]();
					lights.kitchenLamp[exp[1]]();
				} catch(e){
					console.log('Sorry, such method does not exist');
				}
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
                    lights.officeBoards.on();
                    return true;
				}

				if(exp[1] == 'off'){
                    lights.officeLamp.off();
                    lights.officeBoards.off();
                    return true;
				}

				if(exp[1] == 'white'){
                    lights.officeLamp.white();
                    lights.officeBoards.white();
                    return true;
				}

                if(exp[1] == 'disco'){
                    lights.officeLamp.disco();
                    lights.officeBoards.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.officeLamp.discoFaster();
                    lights.officeBoards.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeLamp.discoSlower();
                    lights.officeBoards.discoSlower();
                    return true;
                }

				if(exp[1] == 'brightness max'){
					lights.officeLamp.brightnessMax();
					lights.officeBoards.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.officeLamp.brightnessMin();
					lights.officeBoards.brightnessMin();
					return true;
				}    

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeLamp.setColor(exp[1]);
                    lights.officeBoards.setColor(exp[1]);
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


				if(exp[1] == 'brightness max'){
					lights.officeLamp.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.officeLamp.brightnessMin();
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

				if(exp[1] == 'ocean' || exp[1] == 'pinks' || exp[1] == 'greens'){
					lights.officeLamp[exp[1]]();
					return true;
				}

			}

			exp = programName.match('^office boards (.*)');
            if(exp){
                if(exp[1] == 'on'){
                    lights.officeBoards.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.officeBoards.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.officeBoards.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.officeBoards.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.officeBoards.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeBoards.discoSlower();
                    return true;
                }

				if(exp[1] == 'brightness max'){
					lights.officeBoards.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.officeBoards.brightnessMin();
					return true;
				}                

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeBoards.setColor(exp[1]);
                    return true;
                }

				if(exp[1] == 'ocean' || exp[1] == 'pinks' || exp[1] == 'greens'){
					lights.officeBoards[exp[1]]();
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

				if(exp[1] == 'brightness max'){
					lights.kitchenLamp.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.kitchenLamp.brightnessMin();
					return true;
				}                 

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.kitchenLamp.setColor(exp[1]);
                    return true;
                }

				if(exp[1] == 'ocean' || exp[1] == 'pinks'){
					lights.kitchenLamp[exp[1]]();
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
				affectedZones.methodToRunOnZones = '_send';
				affectedZones.parametersForMethod = colorCodes[a];
				affectedZones.parseComplete = true;
			}
		})

		return affectedZones;
	}

	this.runProgram = function(programName){

		console.log("Running program", programName);

        names = peopleStatusTracker.getPossibleNames();
        params = peopleStatusTracker.getPossibleParameters();

        regExp = "^(" + names.join("|") + ") (" + params.join("|") + ")$";

        exp = programName.match(regExp);
        if(exp){
        	console.log(exp);
        	
        	peopleStatusTracker.setStatus(exp[1],  exp[2]);
        }
        
        //* Verification for Configuration commands */
		exp = programName.match('config set delayBetweenCommands ([0-9]+)');
		if(exp){
			console.log(exp)
			delayBetweenCommands = exp[1];
			return ;
		}

		exp = programName.match('config set delayBetweenCommands ([0-9]+)');
		if(exp){
			console.log(exp)
			delayBetweenCommands = exp[1];
			return ;
		}


		//* Ligth commands by zone name (kitchen, office, etc)*/
		affectedZones = this.getZonesByProgramName(programName);
        if(affectedZones === true){
            return ;
        }

        // console.log("Affected Zones", affectedZones);
        if(affectedZones.hasOwnProperty('methodToExecute')){
            return global[affectedZones.methodToExecute]();
        }

        return ;
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
    	var status = {};
    	Object.keys(lights).forEach(function(key){
    		status[key] = {
    			'status' : lights[key].status,
    			'color' : lights[key].color,
    			'brightness' : lights[key].brightnessValue,
    			'queueSize' : lights[key].commandQueue.length
    		};
    	});
        return status;
    }
}




module.exports = LightPrograms;
/** HTTP SERVER **/

/** Command HTTP API **/

function HttpResponses() {
    this.receiveCommands = function(req, res) {
        commandString = req.query.command;


        /*
		if(commandString == "nico out"){

			peopleStatusTracker.setStatus("nico", "out");
			res.send(JSON.stringify(["NICO OUT"]));
			return ;
		}

		if(commandString == "nico in"){
			peopleStatusTracker.setStatus("nico", "in");
			res.send(JSON.stringify(["NICO in"]));
			return ;
		}


		if(commandString == "gesto out"){
			peopleStatusTracker.setStatus("gesto", "out");
			res.send(JSON.stringify(["gesto OUT"]));
			return ;
		}

		if(commandString == "gesto in"){
			peopleStatusTracker.setStatus("gesto", "in");
			res.send(JSON.stringify(["gesto in"]));
			return ;
		}
		*/

        var programs = new LightPrograms();

        console.log("http", req.ip, commandString);
        response = programs.runProgram(commandString);
        if(!response){
			memoryUsage = process.memoryUsage();

            response = { 
            	lights : programs.getLightsStatus(), 
            	system : {
            		queueSize : [receiver1.getQueueSize(),receiver2.getQueueSize(),receiver3.getQueueSize()],
            		delayBetweenCommands : delayBetweenCommands,
            		memory : memoryUsage,
                    socketInfo : { host : cfg.httpHost , port : cfg.httpPort },
                    uptime : { 'human' : moment.duration(process.uptime(), 'seconds').humanize(), 'seconds' : process.uptime()  }

            	},
            	heaters : heaterStatus,
            	peopleAtHome: peopleStatusTracker
            };
        }
        res.send(JSON.stringify(response));
    }


    this.getLightStatus = function(req, res) {
        res.send(JSON.stringify(lightStatus));
    }

    this.getHeaterStatus = function(req, res) {
        res.send(JSON.stringify(heaterStatus));
    }

    this.renderIndexPage = function (req, res) {
    	res.sendFile(__dirname + '/webroot/index-2.html');
    }
}
module.exports = HttpResponses;



var express = require('express'),
app = express(),
port = cfg.httpPort;

var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);

io.sockets.on('connection', function(socket){
	console.log("[Socket] on");

	socket.on('sendCommand', function (commands) {

		var programs = new LightPrograms();

		console.log("[Socket] Received ", commands);

		commands.forEach(function(programName){
			console.log("[rec socket] ", programName);
			programs.runProgram(programName);
		});

		sendResponse();


	});

});

sendResponse = function(){
	var programs = new LightPrograms();
	io.emit('statusUpdate', {
		lights : programs.getLightsStatus(), 
		system : {
			queueSize : [receiver1.getQueueSize(),receiver2.getQueueSize(),receiver3.getQueueSize()],
			delayBetweenCommands : delayBetweenCommands,
			memory : process.memoryUsage(),
			uptime : { 'human' : moment.duration(process.uptime(), 'seconds').humanize(), 'seconds' : process.uptime()  }
		},
//		heaters : heaterStatus,
	});
}


app.use('/static', express.static(__dirname + '/webroot'));

app.get('/commands/', function(req, res){
	new HttpResponses().receiveCommands(req, res);

	console.log(req.ip);

	/*switch(req.ip){
		case '192.168.1.1':
		case '::ffff:192.168.1.1':
		case '192.168.1.111':
		case '::ffff:192.168.1.111':
		case '192.168.1.112':
		case '::ffff:192.168.1.112':
		case '192.168.1.141':
		case '::ffff:192.168.1.141':
		// case '127.0.0.1': 
			isNicoAtHome = true; break;
		default: isNicoAtHome = false; break;	
	}	*/
});

app.get('/plot/', function(req, res){
	cityPlotter.servePlot(req, res);
});

app.get('/plot/json', function(req, res){
	cityPlotter.json(req, res);
});

app.use('/', function(req, res, next){
	// isNicoAtHome

	console.log(req.ip);

	switch(req.ip){
		case '192.168.1.1':
		case '::ffff:192.168.1.1':
		case '192.168.1.111':
		case '::ffff:192.168.1.111':
		case '192.168.1.112':
		case '::ffff:192.168.1.112':
		case '192.168.1.141':
		case '::ffff:192.168.1.141':
		// case '127.0.0.1': 
			isNicoAtHome = true; break;
		default: isNicoAtHome = false; break;	
	}

	new HttpResponses().renderIndexPage(req, res);
});

app.post('/heater/', function(req, res){
	var room = req.query.room;
	var temperature = req.query.temperature;
	
});


httpServer.listen(port, function(){
	console.log('http interface listening on port '+port);	
});


/** END OF HTTP SERVER **/
var rgbToMilightColor = function(r, g, b){
    r = r / 255;
    g = g / 255;
    b = b / 255;

    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    l = (max + min) / 2;
    d = max - min;
    h = '';

    if (d == 0) {
        h = s = 0;
    } else {
        s = d / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case r:

            	rem = ((g - b) / d) / 6;
            	rem = (rem - Math.floor(rem)) * 6;

                h = 60 * rem;
                if (b > g) {
                    h += 360;
                }
                break;
            case g:
                h = 60 * ((b - r) / d + 2);
                break;
            case b:
                h = 60 * ((r - g) / d + 4);
                break;
        }
    }
    // return [h, s, l];

    color = (256 + 176 - Math.round(h / 360.0 * 255.0)) % 256;
    return [0x40 , color + 0xfa];
}	


peopleAtHome = function(){
	this.people = [
		// @@TODO@@ this.getPossibleNames needs to be refactored to return values from here.
		{ name : "nico", status : "out" },
		{ name : "gesto" , status : "out" }
	]
	
	this.homeStatus = "alone";
	this.aggregatedStatus = {};


	this.setStatus = function(who, status, cb){

		this.aggregatedStatus = {};

		this.people.forEach(function(person, position){
			
			
			console.log("PERSON: ", person, "WHO:", who, 'status:', status);
			this.aggregatedStatus[person.status] = 1;
			console.log("Aggregated Status", this.aggregatedStatus)

			if(person.name != who){
				return false;
			}
			person.status = status;

			switch(status){
				case "in":
					this.homeStatus = "day";
					break;
				case "sleeping":
				case "out":
					break;

			}
			
		}.bind(this));

/*
		if(Object.keys(this.aggregatedStatus).length = 1){
			this.homeStatus = Object.keys(this.aggregatedStatus)[0];
			
		} else {
			// Home status depends on time and day
			this.homeStatus = "it depends";
		}

		console.log("Home Status is ", this.homeStatus);
*/
	}


	this.debug = function(){
		console.log("AASDASD", this.people);
		console.log("Aggregated Home Status is ", this.aggregatedStatus);
	}

	this.start = function(){
		setInterval(function(){
			this.debug();
		}.bind(this), 5000);
	}

	this.getPossibleNames = function(){
		// @@TODO@@ this.getPossibleNames needs to be refactored to return values from here.
		return ["gesto", "nico"];
	}


	this.getPossibleParameters = function(){
		return ["in", "out", "sleeping" ];
	}


}


var peopleStatusTracker = new peopleAtHome();
peopleStatusTracker.start();

