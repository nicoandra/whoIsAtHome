var dgram = require('dgram');
var debug = require('debug');

var led = require('limitless-gem/index.js');

var CityPlotter = require(__dirname + '/plot.js');
var cityPlotter = new CityPlotter();


var env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js');


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
var receiver1 = new ReceiverSocket('192.168.1.148' , 8899);
var receiver2 = new ReceiverSocket('192.168.1.148' , 8899);
var receiver3 = new ReceiverSocket('192.168.1.148' , 8899);

var lights = {
    officeLamp : new Light('officeLamp', new LightSocket('officeLampObject', 1, receiver1)),
	kitchenLamp : new Light('kitchenLamp', new LightSocket('officeLampObject', 2, receiver1)),
	kitchenCountertop : new Light('KitchenCountertop', new LightSocket('officeLampObject', 4, receiver1)),
    officeBoards : new Light('officeBoards', new LightSocket('boards', 3, receiver1)),

};

var heaterStatus = {
    office : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    kitchen : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    living : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    bedroom : { status: 0, currentTemperature : 10, desiredTemperature : 10},
    guestroom : { status: 0, currentTemperature : 10, desiredTemperature : 10},
}



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
						// console.log('[>Buffer1] ', buffer2);
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
		console.log(colorName);
		// this.receiver.queueStuff(this.commandOn);

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
				this.fade('lilac', 'pink', 12);
			} else if(step === 2){
				this.fade('pink', 'lilac', 12);
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

        if(programName.match('get lights status')){
            return {methodToExecute : 'getLightsStatus' };
        }

		exp = programName.match('^all lights (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
			affectedLights.push(lights.officeLamp);
			affectedLights.push(lights.kitchenLamp);
			affectedLights.push(lights.kitchenCountertop);
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

		console.log(action);

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


		exp = programName.match('config set delayBetweenCommands ([0-9]+)');
		if(exp){
			console.log(exp)
			delayBetweenCommands = exp[1];
			return ;
		}


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
                    socketInfo : { host : cfg.httpHost , port : cfg.httpPort }

            	},
            	heaters : {},
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
    	res.sendFile(__dirname + '/webroot/index.html');
    }

}
module.exports = HttpResponses;




var express = require('express'),
app = express(),
port = cfg.httpPort;

var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);


io.sockets.on('connection', function(socket){

	socket.on('sendCommand', function (commands) {
		var programs = new LightPrograms();

		console.log("vino esteee", commands);

		// commands = JSON.parse(commands);

		commands.forEach(function(programName){
			console.log(programName)
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
			memory : process.memoryUsage()
		},
		heaters : {},
	});
}


// setInterval(sendResponse, 2000);




app.use('/static', express.static(__dirname + '/webroot'));

app.get('/commands/', function(req, res){ new HttpResponses().receiveCommands(req, res); });

app.get('/plot/', function(req, res){
	cityPlotter.servePlot(req, res);
});

app.get('/plot/json', function(req, res){
	cityPlotter.json(req, res);
});

app.use('/', function(req, res, next){
	new HttpResponses().renderIndexPage(req, res);
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


/*
var peopleAtHome = {
	nico : { devices : ['192.168.1.141'] , status : 0 , lastCheck : 0 }
}




var ping = require ("net-ping");

var pingDevices = function(){
	var pingSession = ping.createSession();
	Object.keys(peopleAtHome).forEach(function(personName){
		if(peopleAtHome[personName].lastCheck > Date.now() - 60000 ){
			console.log('Already checked ', personName);
			return ;
		}

		peopleAtHome[personName].devices.forEach(function(deviceAddress, index){
			if(index != 0 && peopleAtHome[personName].status == 1){
				// Already found online on this run... 
				return;
			}

			pingSession.pingHost (deviceAddress, function (error, target) {
				if (error){
					peopleAtHome[personName].status = 0;
				} else {
					peopleAtHome[personName].status = 1
				}
			});
		});

		peopleAtHome[personName].lastCheck = Date.now();

	});
	console.log(peopleAtHome);
}

// setInterval(pingDevices, 1000);


*/