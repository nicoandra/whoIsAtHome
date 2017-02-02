Heater = require('./heater.js');
var dgram = require('dgram')
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, debug = require("debug")("app:heaterManager");

function HeaterManager(){
	this.heaters = [];

	this.client = dgram.createSocket('udp4');

	this.addHeater = function(name, id, ip, options){
		newHeater = new Heater(name, id, ip, this.client, options);
		this.heaters.push(newHeater);
	}

	this.getStatus = function(name){
		// Find heater by name in the array
		// Get the status
		// Return the value
	}

	this.setTemperature = function(temperature, whichHeater){
		// Find heater by name in the array
		// Set the temperature
		// Return the value
	}

}

module.exports = HeaterManager
