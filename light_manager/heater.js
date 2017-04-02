var request = require('request');
var dgram = require('dgram');
const debug = require("debug")("app:heater");
var moment = require('moment');



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
	this.lastResponseTime = 0;
	this.lastTimeMovementWasDetected = moment().subtract(20, 'seconds');

	this.getStatusPayload = [0x30, 0xFF, Math.floor(this.serverPort / 256),  Math.floor(this.serverPort % 256)] ; //  Requests for status to be sen back to port

	this.movementNeedsToBeNotified = function(){
		fiveMinutesAgo = moment().subtract(20, 'seconds');

		if(this.lastTimeMovementWasDetected.isBefore(fiveMinutesAgo)){
			this.lastTimeMovementWasDetected = moment();
			return true;
		}

		return false;
	}

	this.sendRawPayload = function(payload){
		var buffer = new Buffer(payload);

		this.dgramClient.send(buffer, 0, buffer.length, this.heaterPort, this.ip, function(err){
			if(err){
				debug("Err setHeaterTemperature", err)
			} else {
				this.lastResponseTime = moment();
			}
		}.bind(this));		
	}

	this.setTemperature = function(desiredTemperature){
		desiredTemperature = Math.trunc(Math.abs(desiredTemperature) * 10) / 10;

		// this.desiredTemperature = desiredTemperature;
		var temperatureInteger = Math.trunc(desiredTemperature);
		var temperatureDecimal = Math.trunc((desiredTemperature - temperatureInteger) * 256);
		var payload = [ 0x10 , this.id, temperatureInteger, temperatureDecimal];

		debug("setHeaterTemperature", name, desiredTemperature, payload);

		var buffer = new Buffer(payload);


		this.sendRawPayload(payload);

	}

	this.setValues = function(currentTemperature, desiredTemperature, humidity, heaterPower, powerOutlet){
		this.currentTemperature = currentTemperature;
		this.desiredTemperature = desiredTemperature;
		debug("desiredTemperature set to", desiredTemperature);
		this.humidity = humidity;
		this.power = heaterPower;
		this.lastResponseTime = moment();
	}


	this.parseMovementResponse = function(response, networkInfo){
		try {
			if(response[3] == this.id){
				return true;
			}
			return false;
		} catch(exception){
		}
		return false;
	}

	this.parseResponse = function(message, networkInfo){
		ip = networkInfo.address;

		if(this.ip !== ip){
			debug(this.name , "ip Mismatch", this.ip, ip);
			return false;
		}

		if(message[0] == 0x11){
			debug(this.name , "Movement");
			return this.parseMovementResponse(message, networkInfo);
		}

		// 3-9 or 10-16;
		indexToRead = 3 + (this.id - 1) * 7;
		var temperature = parseInt(message[indexToRead++]) + parseInt(message[indexToRead++]) / 256;
		var desiredTemperature = parseInt(message[indexToRead++]) + parseInt(message[indexToRead++]) / 256;
		var heaterPower = parseInt(message[indexToRead++]);
		var humidity = parseInt(message[indexToRead++]) + parseInt(message[indexToRead++]) / 256;
		var powerOutlet = 0;

		debug("In the response from",ip,"the heaterPower is", heaterPower, desiredTemperature);

		if(temperature < 10 || temperature > 35){
			var nodemailer = require('nodemailer');
			var smtpTransport = require('nodemailer-smtp-transport');
			var transporter = nodemailer.createTransport(smtpTransport(cfg.email.smtp));
			var message = {
				from: cfg.email.fromFields,
				to:  cfg.email.whoToContact
			};

			warningOrAlert = temperature < 5 || temperature > 40 ? "ALERT" : "Warning";
			message.subject = warningOrAlert + ": temperature in " + this.name + " is " + temperature;
			message.text = message.subject;
			message.html = message.subject;

			transporter.sendMail(message, function(err, info){
				console.log('send', err, info);
			})
		}

		this.setValues(temperature, desiredTemperature, humidity, heaterPower, powerOutlet);
		return true;
	}

	this.getStatus = function(){
		return {
			displayName: this.name ,
			temperature: Math.trunc(Math.abs(this.currentTemperature) * 10) / 10,
			humidity: this.humidity,
			desiredTemperature: this.desiredTemperature,
			power: this.power * 10,
			lastResponse: this.lastResponseTime
		}
	}

	this.requestStatus = function(){
		this.dgramClient.send(new Buffer(this.getStatusPayload), 0, 4, this.heaterPort, this.ip, function(err,res){
			debug("Sent status request to ", this.name)
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