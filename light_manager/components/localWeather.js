"use strict"

var Heater = require('./../devices/drivers/nHeatersV1/heater.js');
var dgram = require('dgram')
	, debug = require("debug")("app:component:localWeather")

var request = require("request");

function HeaterManager(cfg){
	this.pollInterval = 15 * 60 * 1000;
	this.currentWeather = {};

	this.getDeviceClassName = function(){
		return 'localWeather';
	}

	this.queryCurrentWeather = function(){
		var url = "http://api.openweathermap.org/data/2.5/weather?id=" + cfg.secrets.openWeatherMap.cityId + "&units=metric&APPID=" + cfg.secrets.openWeatherMap.apiKey;

		debug("Getting weather", url);
		request.get({
			url: url,
			json: true
		}, function(err, res, body){
		
			debug(url);

			if(err){
				return false;
			}

			try {
				this.currentWeather = body.weather[0];
				this.currentWeather.cityName = body.name;
				this.currentWeather.currentTemperature = body.main.temp;
				this.currentWeather.humidity 			 = body.main.humidity;
				this.currentWeather.minimumTemperature = body.main.temp_min;
				this.currentWeather.maximumTemperature = body.main.temp_max;
			} catch(exception){
				debug("Getting weather", exception);
			}

		}.bind(this))

	}

	this.getStatus = function(){
		return this.currentWeather;
	}


	this.start = function(app){
		if(this.app !== undefined){
			return this;
		}
		this.app = app;
		setInterval(this.queryCurrentWeather.bind(this), this.pollInterval);
		this.queryCurrentWeather();
		this.app.internalEventEmitter.emit("componentStarted", "localWeather");
		return this;
	}




}

module.exports = HeaterManager