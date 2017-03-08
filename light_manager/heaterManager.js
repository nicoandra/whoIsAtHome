Heater = require('./heater.js');
var env = process.env.NODE_ENV || 'development'
	, dgram = require('dgram')
	, cfg = require(__dirname + '/config/config.'+env+'.js')
	, debug = require("debug")("app:heaterManager")
	, debugConnection = require("debug")("app:heaterConnection");

var moment = require('moment');
var request = require("request");

function HeaterManager(eventEmitter){
	this.heaters = {};
	this.heatersByIp = {};
	this.eventEmitter = eventEmitter;
	this.globalTemperature = -1;

	this.pollInterval = 60000;
	this.externalWeatherPollInterval = 15 * 60 * 1000; // Every 15 minutes

	this.client = dgram.createSocket('udp4');
	this.localPort = 8888;

	this.getHeaterByName = function(name){
		return this.heaters[name];
	}

	this.currentWeatherAtHome = {};

	this.handleMovementDetectedResponse = function(message, networkInfo){
		ip = networkInfo.address;

		if(!this.heatersByIp[ip]){
			return false;
		}

		heater = this.heaters[this.heatersByIp[ip]];

		if(heater.movementNeedsToBeNotified()){
			heaterName = heater.name;
			debug("Movement has been detected in", heaterName);
			eventEmitter.emit("movementDetected", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip });
			return true;
		}

		return false;
	}

	this.handleHeaterStatusResponse = function(message, networkInfo){
		ip = networkInfo.address;

		if(!this.heatersByIp[ip]){
			return ;
		}

		temperature = message[3] + message[4] / 256;
		desiredTemperature = message[5] + message[6] / 256;
		heaterPower = message[7];
		humidity = message[8] + message[9] / 256;
		powerOutlet = message[11] === 1;

		debug("In the response from",ip,"the heaterPower is", heaterPower, desiredTemperature);

		heaterName = this.heaters[this.heatersByIp[ip]].name;

		if(temperature < 10 || temperature > 35){
			var nodemailer = require('nodemailer');
			var smtpTransport = require('nodemailer-smtp-transport');
			var transporter = nodemailer.createTransport(smtpTransport(cfg.email.smtp));
			var message = {
				from: cfg.email.fromFields,
				to:  cfg.email.whoToContact
			};

			warningOrAlert = temperature < 5 || temperature > 40 ? "ALERT" : "Warning";
			message.subject = warningOrAlert + ": temperature in " + heaterName + " is " + temperature;
			message.text = message.subject;
			message.html = message.subject;

			transporter.sendMail(message, function(err, info){
				console.log('send', err, info);
			})
		}

		this.heaters[this.heatersByIp[ip]].setValues(temperature, desiredTemperature, humidity, heaterPower, powerOutlet);
		eventEmitter.emit("heaterUpdated", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip });
	}

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(message, networkInfo){
		ip = networkInfo.address;
		if(message[0] == 0x31 && message[1] == 0xFF && message.length === 12) {
			debug("Status received from ", ip);
			return this.handleHeaterStatusResponse(message, networkInfo);
		}

		if(message[0] == 0x11 && message[1] == 0x00){
			return this.handleMovementDetectedResponse(message, networkInfo);
		}

		console.log(message, networkInfo);

		if(message.length = 4 && message[0] == 0x41 && message[1] == 0xFF && message[2] == 0x00){
			if(message[3] == 0x01){
				eventEmitter.emit("lightsSwitchProgramRequested", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip, program: "switch" });
				return;
			}

			if(message[3] == 0x02){
				eventEmitter.emit("lightsSwitchProgramRequested", { name: this.heaters[this.heatersByIp[ip]].name, ip: ip , program: "off"});
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

	this.addHeater = function(name, descriptiveName, id, ip, port, options){
		newHeater = new Heater(descriptiveName, id, ip, port, this.client, this.localPort, options);
		this.heaters[name] = newHeater;
		this.heatersByIp[ip] = name;
	}

	this.getStatus = function(callback){

		momentsAgo = moment().subtract(5, 'minutes');
		try {

			response = { heaters : { }}
			Object.keys(this.heaters).forEach( function(name) {
				response.heaters[name] = this.heaters[name].getStatus();
				response.heaters[name].name = name;
				response.heaters[name].isDown = response.heaters[name].lastResponse == 0 ? false : response.heaters[name].lastResponse.isBefore(momentsAgo);
				if(response.heaters[name].isDown){
					response.heaters[name].isDownSince = response.heaters[name].lastResponseTime;
				} else {
					response.heaters[name].isDownSince = false;
				}
				response.heaters[name].desiredTemperature = Math.round(response.heaters[name].desiredTemperature * 10) / 10;	// Round to 1 decimal

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


	this.queryCurrentWeatherAtHome = function(){
		var url = "http://api.openweathermap.org/data/2.5/weather?id=" + cfg.secrets.openWeatherMap.cityId + "&units=metric&APPID=" + cfg.secrets.openWeatherMap.apiKey;
		request.get(url, function(err, res, body){
			if(err){
				return false;
			}

			try {
				body = JSON.parse(res.toJSON().body); 

				this.currentWeatherAtHome = body.weather[0];
				this.currentWeatherAtHome.cityName = body.name;
				this.currentWeatherAtHome.currentTemperature = body.main.temp;
				this.currentWeatherAtHome.humidity 			 = body.main.humidity;
				this.currentWeatherAtHome.minimumTemperature = body.main.temp_min;
				this.currentWeatherAtHome.maximumTemperature = body.main.temp_max;

			} catch(exception){
				console.log("Getting weather", exception);
			}

		}.bind(this))

	}


	this.client.bind(this.localPort);
	this.client.on("listening", this.queryAllHeaters.bind(this));
	setInterval(this.queryAllHeaters.bind(this), this.pollInterval);
	setInterval(this.queryCurrentWeatherAtHome.bind(this), this.externalWeatherPollInterval);
	this.queryCurrentWeatherAtHome();


}


module.exports = HeaterManager
