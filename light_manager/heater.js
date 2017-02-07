var request = require('request');
var dgram = require('dgram');
const debug = require("debug")("app:heater");



function Heater(name, id, ip, heaterPort, dgramClient, serverPort, options){
	this.name = name;
	this.id = id;
	this.ip = ip;
	this.heaterPort = heaterPort;
	this.serverPort = serverPort;
	this.dgramClient = dgramClient;
	this.eventEmitter = options.eventEmitter;

	this.currentTemperature = 999;
	this.humidity = 999;
	this.desiredTemp = 14;
	this.power = 0;
	this.upSince = 0;
	this.downSince = 0;

	this.getStatusPayload = [0x30, 0xFF, Math.floor(this.serverPort / 256).toString(16),  Math.floor(this.serverPort % 256).toString(16)] ; //  Requests for status to be sen back to port

	this.flagAsUp = function(){
		if(this.upSince == 0){
			this.upSince = new Date();
			this.downSince = 0;
		}
	}

	this.flagAsDown = function(){
		if(this.downSince == 0){
			this.downSince = new Date();
			this.upSince = 0;
		}
	}

	this.setTemperature = function(desiredTemperature){
		desiredTemperature = Math.abs(desiredTemperature);

		var temperatureInteger = Math.trunc(desiredTemperature);
		var temperatureDecimal = Math.trunc((desiredTemperature - temperatureInteger) * 256);
		var payload = [ 0x10 , 0x00, temperatureInteger.toString(16), temperatureDecimal.toString(16) ];

		debug("setHeaterTemperature", name, desiredTemperature, payload);

		var buffer = new Buffer(payload);

		this.dgramClient.send(buffer, 0, buffer.length, this.heaterPort, this.host, function(err){
			if(err){
				debug("Err setHeaterTemperature", err)
				this.flagAsDown();
			} else {
				this.flagAsUp();
			}
		}.bind(this));
	}

	this.setStatusFromHeaterResponse = function(buffer){

	}

	this.getStatus = function(){

	}

	this.getTemperature = function(){
		return this.currentTemperature;
	}

	this.getHumidity = function(){
		return this.humidity;
	}

	this.getPower = function(){
		return this.power;
	}

	//  Go!!
	setInterval(this.pollData.bind(this), 60000);	// Poll temperature every minute

	setTimeout(function() {
		this.pollData()
	}.bind(this), 10000);
}

module.exports = Heater;