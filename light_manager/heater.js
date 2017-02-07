var request = require('request');
var dgram = require('dgram');
const debug = require("debug")("app:heater");



function Heater(name, id, ip, heaterPort, dgramClient, serverPort, options){
	this.pollInterval = 60000;

	this.name = name;
	this.id = id;
	this.ip = ip;
	this.heaterPort = heaterPort;
	this.serverPort = serverPort;
	this.dgramClient = dgramClient;
	this.eventEmitter = options.eventEmitter;

	this.currentTemperature = 999;
	this.humidity = 999;
	this.desiredTemperature = 14;
	this.power = 0;
	this.upSince = 0;
	this.downSince = 0;

	this.getStatusPayload = [0x30, 0xFF, Math.floor(this.serverPort / 256),  Math.floor(this.serverPort % 256)] ; //  Requests for status to be sen back to port

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
		var payload = [ 0x10 , 0x00, temperatureInteger, temperatureDecimal];

		debug("setHeaterTemperature", name, desiredTemperature, payload);

		var buffer = new Buffer(payload);

		this.dgramClient.send(buffer, 0, buffer.length, this.heaterPort, this.ip, function(err){
			if(err){
				debug("Err setHeaterTemperature", err)
				this.flagAsDown();
			} else {
				this.flagAsUp();
			}
		}.bind(this));
	}

	this.setValues = function(currentTemperature, desiredTemperature, humidity, heaterPower, powerOutlet){
		this.currentTemperature = currentTemperature;
		this.desiredTemperature = desiredTemperature;
		this.humidity = humidity;
		this.power = heaterPower;
	}


	this.getStatus = function(){
		return {
			temperature: this.currentTemperature,
			humidity: this.humidity,
			desiredTemperature: this.desiredTemperature,
			power: this.power * 10,
			uptime: this.upSince,
			downtime: this.downSince
		}
	}

	this.requestStatus = function(){
		this.dgramClient.send(new Buffer(this.getStatusPayload), 0, 4, this.heaterPort, this.ip, function(err,res){
			console.log(err, res, this.getStatusPayload);
		}.bind(this));

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

}

module.exports = Heater;