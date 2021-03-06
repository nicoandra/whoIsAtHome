"use strict"

var Heater = require('./../devices/drivers/nHeatersV1/heater.js');
const dgram = require('dgram')
	, debug = require("debug")("app:component:heaterManager")
	, debugConnection = require("debug")("app:heaterConnection");

const moment = require('moment');

const EventEmitter = require('events').EventEmitter

function HeaterManager(cfg){
	this.heaters = {};
	this.heatersByIpAndId = {};
	this.pollInterval = 60000;

	this.client = dgram.createSocket('udp4');
	this.localPort = 8888;
	this.eventEmitter = new EventEmitter();

	function personMovementDetectedEventHanlder(data){
		debugConnection("Movement: personMovementDetected", data)
		try {
			return this.app.internalEventEmitter.emit("personMovementDetected", { name: this.heatersByIpAndId[data.ip][data.id].name });
		} catch (exception){
			debug("Exception: ", exception);
		}
		
	};
	this.eventEmitter.on("personMovementDetected", personMovementDetectedEventHanlder.bind(this));


	this.getHeaterByName = function(name){
		return this.heaters[name];
	}

	this.addHeatersFromObject = function(heaters){
		heaters.forEach(function(heater){
			this.addHeater(heater.id, heater.alias, heater.slot, heater.ip, heater.port, this.eventEmitter);
		}.bind(this));
	}

	this.handleMovementDetectedResponse = function(message, networkInfo){

		// Loop through all heaters and call parseResponse(message, networkInfo)
		Object.keys(this.heaters).forEach(function(heaterName){
			if(this.heaters[heaterName].parseResponse(message, networkInfo)){
				debugConnection("Movement message from ", networkInfo.address);
			}
			
		}.bind(this))
	}

	this.handleHeaterStatusResponse = function(message, networkInfo){
		// Loop through all heaters and call parseResponse(message, networkInfo)
		Object.keys(this.heaters).forEach(function(heaterName){
			if(this.heaters[heaterName].parseResponse(message, networkInfo)){
				debug("Heater matched:", heaterName);
				return this.app.internalEventEmitter.emit("heaterUpdated",  { name: this.heaters[heaterName].name });
			};
		}.bind(this))
	}



	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(message, networkInfo){
		var ip = networkInfo.address;
		if(message[0] == 0x31 && message[1] == 0xFF && (message.length === 20 || message.length === 12)) {
			debug("Status received from ", ip);
			return this.handleHeaterStatusResponse(message, networkInfo);
		}

		if(message[0] == 0x11 && message[1] == 0x00){
			debug("Movement detected: ", ip);
			return this.handleMovementDetectedResponse(message, networkInfo);
		}

		debug(message, networkInfo);

		if(message.length == 4 && message[0] == 0x41 && message[1] == 0xFF && message[2] == 0x00){
			if(message[3] == 0x01){
				this.eventEmitter.emit("lightsSwitchProgramRequested", { name: ip, ip: ip, program: "switch" });
				return;
			}

			if(message[3] == 0x02){
				this.eventEmitter.emit("lightsSwitchProgramRequested", { name: ip, ip: ip , program: "off"});
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

	this.addHeater = function(name, descriptiveName, id, ip, port){
		if(!this.heatersByIpAndId.hasOwnProperty(ip)){
			this.heatersByIpAndId[ip] = {};
		}
		var options = {eventEmitter : this.eventEmitter};

		var newHeater = new Heater(descriptiveName, id, ip, port, this.client, this.localPort, options, cfg);
		this.heaters[name] = newHeater;
		this.heatersByIpAndId[ip][id] = newHeater;
	}



	this.getStatus = function(callback){
		var momentsAgo = moment().subtract(5, 'minutes');
		try {

			var response = { heaters : { }}
			Object.keys(this.heaters).forEach( function(name) {
				var status = this.heaters[name].getStatus();
				response.heaters[name] = {};
				response.heaters[name].desiredTemperatureFromHeater = status.desiredTemperatureFromHeater;
				response.heaters[name].displayName = status.displayName;
				response.heaters[name].humidity = status.humidity;
				response.heaters[name].isDown = status.isDown;
				response.heaters[name].isDownSince = status.isDownSince;
				response.heaters[name].lastResponse = status.lastResponse;
				response.heaters[name].name = status.name;
				response.heaters[name].power = status.power;
				response.heaters[name].temperature = status.temperature;
				response.heaters[name].isDown = response.heaters[name].lastResponse == 0 ? false : response.heaters[name].lastResponse.isBefore(momentsAgo);
				if(response.heaters[name].isDown){
					response.heaters[name].isDownSince = response.heaters[name].lastResponseTime;
				} else {
					response.heaters[name].isDownSince = false;
				}
				response.heaters[name].desiredTemperatureFromHeater = Math.round(response.heaters[name].desiredTemperatureFromHeater * 10) / 10;	// Round to 1 decimal

			}.bind(this))

			response['localWeather'] = this.currentWeatherAtHome;

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

	this.queryAllHeaters = function(){
		Object.keys(this.heaters).forEach(function(name){
			this.heaters[name].requestStatus();
		}.bind(this))
	}

	this.setTemperature = function(name, temperature){
		temperature = Math.round(temperature * 10) / 10; 	// Round to 1 decimal
		try {
			if(this.heaters[name] === undefined){
				return false;
			}
			return this.heaters[name].setTemperature(temperature);
		} catch(exception)
{			debug("Err with ", name);
			debug("setTemperature", exception);

		}
	}

	this.setMultipleStatus = function(statuses, callback){
		if(typeof callback !== "function"){
			callback = function(){};
		}

		Object.keys(statuses).forEach(function(alias){
			var temperature = statuses[alias].desiredTemperatureFromInterface;
			this.setTemperature(alias, temperature);
		}.bind(this));

		this.app.internalEventEmitter.emit('majorChange', {name: 'heaters'});
		callback();		
		return ;
	}

	this.start = function(app){
		if(this.app !== undefined){
			return this;
		}
		this.app = app;
		this.client.bind(this.localPort);
		this.client.on("listening", this.queryAllHeaters.bind(this));
		setInterval(this.queryAllHeaters.bind(this), this.pollInterval);
		this.app.internalEventEmitter.emit("componentStarted", "heaterManager");
		return this;
	}


}

module.exports = HeaterManager
