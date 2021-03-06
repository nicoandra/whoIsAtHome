
const debug = require('debug')('devices:drivers:milight:light')

function Light(name, displayName, socket){
	// Parameters
	this.name = name;
	this.displayName = displayName;
	this.socket = socket;

	// Status tracking
	this.actualStatus = {};  // Shows the actual status
	this.autoStatus = {};    //
	this.manualStatus = {};    //

	this.status = 0;
	this.color = 'white';
	this.fadeInProgress = 0;
	this.currentProgram = '';

	this.abilities = { hasRgb : false, hasDimmer : false};

	this.colorCodes = {
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


	this.hasRgb = function(hasRgb){
		this.abilities.hasRgb = (hasRgb === true)
		return this;
	}

	this.hasDimmer = function(hasDimmer){
		this.abilities.hasDimmer = (hasDimmer === true)
		return this;
	}

	this.setManualStatus = function(status, callback){
		callback = (typeof callback === 'function') ? callback : function() {};

		if(status.onOff != undefined && this.actualStatus.onOff != status.onOff){
			this.actualStatus.onOff = status.onOff;
			this.sendOnOff(status.onOff);
			if(!status.onOff){
				// When sending OFF, don't send anything else.
				return ;
			}
		}

		if(status.brightness != undefined){
			this.setBrightness(status.brightness);
		}

		if(status.nightMode != undefined && status.nightMode == true){
			this.actualStatus.nightMode = status.nightMode;
			this.nightMode();
		}

		if(status.color != undefined){
			/*this.actualStatus.brightness = status.brightness;
			this.setBrightness(status.brightness);*/
			if(status.color == "white"){
				this.white();
			} else {
				this.setColor(status.color);
			}
		}

		if(status.onOff != undefined && this.actualStatus.onOff != status.onOff){
			this.actualStatus.onOff = status.onOff;
			this.sendOnOff(status.onOff);
		}

		callback;
	}


	this.getStatus = function(){
		return {
			'name' : this.name,
			'displayName' : this.displayName,
			'actualStatus' : this.actualStatus,
			'status' : this.actualStatus,
			'autoStatus' : this.autoStatus,
			'manualStatus' : this.manualStatus
		}
	}

	this.getInterfaceOptions = function(){

		let resultOptions = {
            main: {
                displayName: "On / Off",
                type: "switch",
                options: [
                    {displayName: "On", status: {onOff: true}},
                    {displayName: "Off", status: {onOff: false}},
                ]
            }
        }

		if(this.abilities.hasRgb){
			resultOptions.rgb = {
				name : 'color',
				displayName : "Color",
				type : "colorPicker",
				values : [
					{ name: "White", htmlColor : "White", id: 'white' },
                    { name: "Violet", htmlColor : '#975297' , id : 'violet'},
                    { name: "Royal Blue", htmlColor : '#4169e1', id : 'royalBlue'},
                    { name: "Blue", htmlColor : '#4169e1', id : 'blue'},
                    { name: "Light Blue", htmlColor : '#87ceeb', id : 'lightBlue'},
                    { name: "Aqua", htmlColor : '#00ffff' , id : 'aqua'},
                    { name: "Royal mint", htmlColor : '#8fff9f' , id : 'royalMint'},
                    { name: "Seafoam green", htmlColor : '#7af9ab' , id : 'seafoamGreen'},
                    { name: "Green", htmlColor : '#15b01a' , id : 'green'},
                    { name: "Lime green", htmlColor : '#89fe05' , id : 'limeGreen'},
                    { name: "Yellow", htmlColor : '#ffff14' , id : 'yellow'},
                    { name: "Yellow orange",  htmlColor : '#fcb001' , id : 'yellowOrange'},
                    { name: "Orange",  htmlColor : '#f97306' , id : 'orange'},
                    { name: "Red",  htmlColor : '#e50000' , id : 'red'},
                    { name: "Pink",  htmlColor : '#ff81c0' , id : 'pink'},
                    { name: "Fuchsia", htmlColor : '#ed0dd9' , id : 'fuchsia'},
                    { name: "Lilac",  htmlColor : '#cea2fd' , id : 'lilac'},
                    { name: "Lavender", htmlColor : '#c79fef' , id : 'lavender'}
				]
			}
		}

        if(this.abilities.hasDisco){
            resultOptions.disco = {
                name : 'disco',
                displayName : "Disco",
                values : [
                    { name: "Disco"		, id: 'disco' },
                    { name: "Next >"	,  id : 'discoNext'},
                    { name: "< Prev"	, id : 'discoPrev'},
                    { name: "+ Faster"	, id : 'discoFaster'},
                    { name: "- Slower"	, id : 'discoSlower'}
                ]
            }
        }

		if(this.abilities.hasDimmer){
			resultOptions.dimmer = {
				displayName : "Dim",
				name : 'dim',
				type : "slider",
				status : function(){
					return this.value;
				}
			}
		}

		return resultOptions;

	}

	// Internal, queue management attributes and methods
	this.commandQueue = [];

	this.sendOnOff = function(value){
		if(value == true){
			this.queueOn();
		}

		if(value == false){
			this.queueOff();
		}
	}

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

	setInterval(this.sendQueue.bind(this), 50);

	this.on = function(){
		this.socket.on();
		this.status = 1;
		this.actualStatus.onOff = true;
		this.clearQueue();
	}

	this.off = function(){
		this.socket.off();
		this.actualStatus.onOff = false;
		this.color = '';
		this.clearQueue();
	}

	this.white = function(){
		this.socket.white();
		this.actualStatus.onOff = true;
		this.actualStatus.color = 'white';
		this.clearQueue();
	}

	this.disco = function(){
		this.socket.disco();
		this.status = 1;
		this.color = 'disco';
		this.actualStatus.color = 'disco';
		this.actualStatus.onOff = true;
		this.clearQueue();
	}

	this.discoFaster = function(){
		this.socket.discoFaster();
		this.status = 1;
		this.color = 'disco';
		this.actualStatus.color = 'disco';
		this.actualStatus.onOff = true;
		this.clearQueue();
	}

	this.discoSlower = function(){
		this.socket.discoSlower();
		this.status = 1;
		this.color = 'disco';
		this.actualStatus.color = 'disco';
		this.actualStatus.onOff = true;
		this.clearQueue();
	}

	this.setColor = function(colorName){
		this.socket.setColor(colorName);
		this.actualStatus.color = colorName;
		this.actualStatus.onOff = true;
		this.status = 1;
		this.color = colorName;
		this.clearQueue();
	}

	this.setBrightnessMax = function(){
		this.socket.brightnessMax();
		this.brightness = 100;
		this.actualStatus.onOff = true;
		this.actualStatus.brightness = 100;
	}

	this.setBrightnessMin = function(){
		this.socket.brightnessMin();
		this.brightness = 1;
		this.actualStatus.onOff = true;
		this.actualStatus.brightness = 10;
	}


	this.setBrightness = function(value){

		if(this.actualStatus.brightness == value){
			return false;
		}

		this.actualStatus.brightness = value;
		if(value == 0){
			return this.off();
		}

		this.sendOnOff(true);
		this.socket.brightness(value);
		this.actualStatus.onOff = true;
	}

	this.clearQueue = function() {
		// The queue needs to be cleared when a previous command might have sent a lot of instructions in the queue
		// but a new command needs to be sent. For example, a fade from Blue to Green will send multiple color changes.
		// If you turn of the light while the change is happening, the light will keep changing colors and
		// It will turn off itself at the end of the fading sequence.
		// By clearing the queue you ensure nothing else is sent to it after the Off command.
		this.commandQueue = [];
		return ;
	}

	this.fade = function(colorFrom, colorTo, maxSteps){
		var colorFrom = Array.isArray(colorFrom) ? colorFrom : this.colorCodes[colorFrom];
		colorFrom = colorFrom[1];
		var colorTo = Array.isArray(colorTo) ? colorTo : this.colorCodes[colorTo];
		colorTo = colorTo[1];

		var step = colorFrom < colorTo ? 1 : -1;

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
			}.bind(this).bind(step), Math.random() * 2000);
		}
	}

	this.fire = function(step){
		this.commandQueue = [];

		if(!step){
			if(this.color == 'fire'){
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
			}.bind(this).bind(step), 100);
		}
	}

	this.pinks = function(step){
		this.commandQueue = [];

		if(!step){
			if(this.color == 'pinks'){
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
			}.bind(this).bind(step), 2500);
		}
	}

	this.greens = function(step){
		this.commandQueue = [];

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
				this.fade(this.colorCodes.seafoamGreen, this.colorCodes.limeGreen, 8);
			} else if(step === 2){
				this.fade(this.colorCodes.limeGreen, this.colorCodes.green, 8);
			} else if(step === 3){
				this.fade(this.colorCodes.green, this.colorCodes.seafoamGreen, 8);
			}

			step = step == 3 ? 0 : step;
			step++;

			setTimeout(function(){
				if(this.color == 'greens'){
					this.greens(step);
				}
			}.bind(this).bind(step), 2500);
		}
	}
}


module.exports = Light;
