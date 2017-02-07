Heater = require('./heater.js');
var dgram = require('dgram')
	, debug = require("debug")("app:heaterManager");

function HeaterManager(){
	this.heaters = {};
	this.heatersByIp = {};

	this.client = dgram.createSocket('udp4');
	this.localPort = 8888;

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(message, networkInfo){


		for(i = 0; i < message.length; i++){
			value = message.readUInt8(i);
			console.log(i, value);

			messageId = [];

			if(messageId.length == 2 && (messageId[0] != 0x30 || messageId[1] != 0xFF)){
				console.log("Wrong message...");
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

		remoteIp = networkInfo.address;

		console.log(
			"Heater at", remoteIp, "> Current:",
			temperature, "*C, ", humidity, "%. Desired:",
			desiredTemperature, "Power:", heaterPower, "/10; Outlet:", powerOutlet
		);


		debug("on(message)", a,b,c,d,e,f);
		ip = a;
		if(this.heatersByIp[ip] === undefined){
			debug("Heater with IP", ip, "was not found when handling response. Return.")
			return;
		}
		debug("Going to parse the message!");
	}.bind(this));

	this.client.on('error', function(a,b,c,d,e,f){
		debug("on(error)", a,b,c,d,e,f);
	}.bind(this));

	this.addHeater = function(name, descriptiveName, id, ip, port, options){
		newHeater = new Heater(descriptiveName, id, ip, port, this.client, this.localPort, options);
		this.heaters[name] = newHeater;
		this.heatersByIp[ip] = name;
	}

	this.getStatus = function(name){
		try {
			return this.heaters[name].getStatus();
			// Find heater by name in the array
			// Get the status
			// Return the value
		} catch(exception){
			debug("setTemperature", exception);
		}

	}

	this.setTemperature = function(name, temperature){
		try {
			return this.heaters[name].setTemperature(temperature);
		} catch(exception){
			debug("setTemperature", exception);
		}

	}

}

module.exports = HeaterManager
