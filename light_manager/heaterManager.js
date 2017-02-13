Heater = require('./heater.js');
var dgram = require('dgram')
	, debug = require("debug")("app:heaterManager")
	, debugConnection = require("debug")("app:heaterConnection");

function HeaterManager(eventEmitter){
	this.heaters = {};
	this.heatersByIp = {};
	this.eventEmitter = eventEmitter;
	this.globalTemperature = -1;

	this.pollInterval = 15000;

	this.client = dgram.createSocket('udp4');
	this.localPort = 8888;


	this.handleMovementDetectedResponse = function(message, networkInfo){
		ip = networkInfo.address;

		if(!this.heatersByIp[ip]){
			return false;
		}
		heaterName = this.heaters[this.heatersByIp[ip]].name;
		debug("Movement has been detected in", heaterName);
		eventEmitter.emit("movementDetected", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip });
		return true;
	}

	this.handleHeaterStatusResponse = function(message, networkInfo){
		ip = networkInfo.address;

		if(!this.heatersByIp[ip]){
			return ;
		}

		temperature = message[3] + message[4] / 256;
		desiredTemperature = message[5] + message[6] / 256;
		heaterPower = message[7];
		humidity = message[8] + message[9] / 256;
		powerOutlet = message[11] === 1;

		debug("In the response from",ip,"the heaterPower is", heaterPower, desiredTemperature);

		this.heaters[this.heatersByIp[ip]].setValues(temperature, desiredTemperature, humidity, heaterPower, powerOutlet);
		eventEmitter.emit("heaterUpdated", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip });
	}

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(message, networkInfo){
		ip = networkInfo.address;
		if(message[0] == 0x31 && message[1] == 0xFF && message.length === 12) {
			debug("Status received from ", ip);
			return this.handleHeaterStatusResponse(message, networkInfo);
		}

		if(message[0] == 0x11 && message[1] == 0x00){
			return this.handleMovementDetectedResponse(message, networkInfo);
		}

		console.log(message, networkInfo);

		if(message.length = 4 && message[0] == 0x41 && message[1] == 0xFF && message[2] == 0x00){
			if(message[3] == 0x01){
				console.log("CAMBIOOOO");
				eventEmitter.emit("lightsSwitchProgramRequested", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip, program: "switch" });
				return;
			}

			if(message[3] == 0x02){
				console.log("OFFF");
				eventEmitter.emit("lightsSwitchProgramRequested", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip , program: "off"});
				return;
			}
			return ;
		}


		debugConnection("Wrong message...");
		return ;


	}.bind(this));


	this.client.on('error', function(a,b,c,d,e,f){
		debug("on(error)", a,b,c,d,e,f);
	}.bind(this));

	this.addHeater = function(name, descriptiveName, id, ip, port, options){
		newHeater = new Heater(descriptiveName, id, ip, port, this.client, this.localPort, options);
		this.heaters[name] = newHeater;
		this.heatersByIp[ip] = name;
	}

	this.getStatus = function(callback){

		try {

			response = {}
			Object.keys(this.heaters).forEach( function(name) {
				response[name] = this.heaters[name].getStatus();
				response[name].name = name;
				response[name].desiredTemperature = Math.round(response[name].desiredTemperature * 10) / 10;	// Round to 1 decimal
				
				// this.heaters[name].setTemperature(18);

			}.bind(this))

			if(typeof callback != "function"){
				return response;
			}
			callback(false, response);
			
			// Find heater by name in the array
			// Get the status
			// Return the value
		} catch(exception){
			debug("setTemperature", exception);
			if(typeof callback != "function"){
				return false;
			}			
			callback(true, null);
		}
	}
	

	this.setTemperature = function(name, temperature){

		temperature = Math.round(temperature * 10) / 10; 	// Round to 1 decimal

		try {
			return this.heaters[name].setTemperature(temperature);
		} catch(exception){
			debug("setTemperature", exception);
		}
	}

	
	this.queryAllHeaters = function(){
		Object.keys(this.heaters).forEach( (name) => {
			this.heaters[name].requestStatus();
		})
	}

	this.setMultipleStatus = function(statuses, callback){
		if(typeof callback !== "function"){
			callback = function(){};
		}

		statuses.forEach(function(status){
			try {
				heatherName = Object.keys(status)[0];
				temperature = status[heatherName];
				this.setTemperature(heatherName, temperature);
				console.log("Updating", heatherName, temperature);
			} catch(exception){
				console.log("ERRRRR", exception);
			}
		}.bind(this))

		callback();

	}


	this.client.bind(this.localPort);
	this.client.on("listening", this.queryAllHeaters.bind(this));
	setInterval(this.queryAllHeaters.bind(this), this.pollInterval);
	

}


module.exports = HeaterManager
