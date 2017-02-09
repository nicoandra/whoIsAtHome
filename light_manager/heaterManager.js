Heater = require('./heater.js');
var dgram = require('dgram')
	, debug = require("debug")("app:heaterManager")
	, debugConnection = require("debug")("app:heaterConnection");

function HeaterManager(){
	this.heaters = {};
	this.heatersByIp = {};

	this.pollInterval = 15000;

	this.client = dgram.createSocket('udp4');
	this.localPort = 8888;

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(message, networkInfo){

		ip = networkInfo.address;
		if(message[0] == 0x31 && message[1] == 0xFF){
			debug("Status received from ", ip);
		} else {
			debugConnection("Wrong message...");
			return ;
		}

		debug("RES", message[5], message[6]);

		
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
