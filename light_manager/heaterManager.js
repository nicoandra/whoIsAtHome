Heater = require('./heater.js');
var dgram = require('dgram')
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, debug = require("debug")("app:heaterManager");

function HeaterManager(){
	this.heaters = {};
	this.heatersByIp = {};

	this.client = dgram.createSocket('udp4');
	this.localPort = 8888;

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(a,b,c,d,e,f){
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
		return this.heaters[name].getStatus();
		// Find heater by name in the array
		// Get the status
		// Return the value
	}

	this.setTemperature = function(name, temperature){
		return this.heaters[name].setTemperature(temperature);
	}

}

module.exports = HeaterManager
