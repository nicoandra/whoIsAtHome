var request = require('request');
var dgram = require('dgram');
const debug = require("debug")("app:heater");



function Heater(name, id, ip, port, dgramClient, options){
	this.name = name;
	this.id = id;
	this.ip = ip;
	this.port = port;
	this.dgramClient = dgramClient;
	this.eventEmitter = options.eventEmitter;

	this.currentTemperature = 999;
	this.humidity = 999;
	this.desiredTemp = 14;
	this.power = 0;
	this.upSince = 0;
	this.downSince = 0;

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
		var payload = [ 0x10 , heaterInfo.toString(16), temperatureInteger.toString(16), temperatureDecimal.toString(16) ];

		debug("setHeaterTemperature", name, desiredTemperature, payload);

		var buffer = new Buffer(payload);

		this.dgramClient.send(buffer, 0, buffer.length, this.port, this.host, function(err){
			if(err){
				debug("Err setHeaterTemperature", err)
				this.flagAsDown();
			} else {
				this.flagAsUp();
			}
		}.bind(this));

	}

	this.pollData = function(callback){
		options = {
			url: this.buildUrl('get'),
			timeout: 2000
		}

		callback = typeof callback == "function" ? callback : function(){};

		request(options, function(error, response, body){
			if(!error && response.statusCode == 200){
				var info = JSON.parse(body);
				this.currentTemperature = parseFloat(info.currentTemperature);
				this.humidity = parseFloat(info.humidity);
				this.uptime = parseFloat(info.uptime);
				this.power = parseFloat(info.power);
				this.downSince = false;
				this.eventEmitter.emit("heaters" , {type : "heaters:heater:cameBack", 'ref' : this.id , 'data' : { 'when' : new Date() } });

				callback(false, info);
			} else {
				if(this.downSince == false){
					this.downSince = new Date();
					this.eventEmitter.emit("heaters" , {type : "heaters:heater:wentDown", 'ref' : this.id , 'data' : { 'when' : this.downSince } });
				}
				callback(error, false)
			}
		}.bind(this));
	}

	this.getStatus = function(){
		// @@TODO@@ Make it so we poll the heater here, before sending a response
		// with a promise!
		response = new Object();
		response.id = this.id;
		response.name = this.name;
		response.temperature =  this.getTemperature();
		response.humidity = this.getHumidity();
		response.power = this.getPower();
		response.uptime = this.uptime;
		response.downSince = this.downSince;
		return response;

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