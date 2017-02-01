var request = require('request');

function Heater(name, id, ip, options){
	this.name = name;
	this.id = id;
	this.ip = ip;
	this.eventEmitter = options.eventEmitter;
	this.currentTemperature = 999;
	this.humidity = 999;
	this.desiredTemp = 14;
	this.power = 0;
	this.uptime = 0;
	this.downSince = 0;

	this.intervalId = 0;

	this.buildUrl = function(method){
		return "http://" + this.ip + '/' + method +'/' + this.id;
	}


	this.ensureTemperatureIsSet = function(desiredTemperature, callback){
		this.desiredTemp = desiredTemperature;

		this.setTemperature(this.desiredTemp, 

			function(err, info){
				if(err && !this.intervalId ){

					this.intervalId = setTimeout(function(){
						this.intervalId = 0;
						this.ensureTemperatureIsSet(this.desiredTemp, callback);
						console.log("Heaters:: Watch Out! Trying to set temp to", this.desiredTemp, "again on", this.id)
					}.bind(this), 30000);

					return ;
				}


				if(info.desiredTemperature == this.desiredTemp){
					callback(false, info);
					return ;
				}

			if(!this.intervalId){
				// The desired temperature in the heater is not the one I expected. Retry.
				this.intervalId = setTimeout(function(){
					this.intervalId = 0;
					this.ensureTemperatureIsSet(this.desiredTemp, callback);
					console.log("Heaters:: Watch Out! Trying to set temp to", this.desiredTemp, "again on", this.id)
				}.bind(this), 30000);

				return ;
			}

		}.bind(this));
	}


	this.setTemperature = function(desiredTemperature, callback){

		this.desiredTemperature = desiredTemperature;

		options = {
			url: this.buildUrl('set'),
			qs : {temperature : desiredTemperature },
			timeout : 1000
		}

		request(options, function(error, response, body){
			if(!error && response.statusCode == 200){
				var info = JSON.parse(body);
				callback(false, info);
			} else {

				// @@TODO@@ Add retry here. It's important to ensure the device knows the new
				// Desired Temperature.
				// As a safety measure, the device will also PULL these values and set itself to what it should be
				callback(error, false)
			}
		});
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