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
		if(!this.heatersByIp[ip]){
			return ;
		}

		for(i = 0; i < message.length; i++){
			value = message.readUInt8(i);

			messageId = [];

			if(messageId.length == 2 && (messageId[0] != 0x30 || messageId[1] != 0xFF)){
				debugConnection("Wrong message...");
				return ;
			}

			switch(i){
				case 1:
				case 2:
					messageId.push(value);
				case 3:
					temperature = value;
					break;
				case 4:
					temperature += value / 256;
					break;
				case 5:
					desiredTemperature = value;
					break;
				case 6:
					desiredTemperature += desiredTemperature / 256;
					break;
				case 7:
					heaterPower = value;
					break;
				case 8:
					humidity = value;
					break;
				case 9:
					humidity += value / 256;
					break;
				case 11:
					powerOutlet = value === 1;
					break;
			}

		}

		console.log("In the response, the heaterPower is", heaterPower);

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

	this.getStatus = function(){
		try {

			response = {}
			Object.keys(this.heaters).forEach( function(name) {
				response[name] = this.heaters[name].getStatus();
				response[name].name = name;
				response[name].desiredTemperature = Math.round(response[name].desiredTemperature * 10) / 10;	// Round to 1 decimal
				
				// this.heaters[name].setTemperature(18);

			}.bind(this))

			return response;
			// Find heater by name in the array
			// Get the status
			// Return the value
		} catch(exception){
			debug("setTemperature", exception);
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
