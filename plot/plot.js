
function cityPlotter(){
	var cities = {
		'BUE': {'name' : 'Buenos Aires, Argentina'},
		'YUL': {'name' : 'Montreal, QC, Canada'},
		'YYZ': {'name' : 'Toronto, Ontario, Canada'},
	};

	var refreshPeriod = 60*1000; // in milliseconds
	var sampleSize = 24*60; // How many samples to keep
	var values = {};
	var openWeatherMapAppId = 'bd537ac0061185142a6f6e69635415b0';
	var request = require('request');
	var plot = require('plotter').plot;


	var express = require('express'),
	app = express(),
	port = process.env.PORT || 4000;

	var startServer = function(){
		Object.keys(cities).forEach(function(key){
			values[key] = [];
		});

		getValues();
		getValues();

		setInterval(getValues, refreshPeriod);
	}


	var getValues = function(){
		Object.keys(cities).forEach(function(key){
			url = 'http://api.openweathermap.org/data/2.5/weather?APPID='+openWeatherMapAppId+'&q='+cities[key].name+'&units=metric';
			request(url, function(error, response, body){
				if(!error && response.statusCode == 200){
					var info = JSON.parse(body);
					values[key].push(info.main.temp);
					if(values[key].length > sampleSize){
						values[key].shift();
					}
				}
			});
		});
	}

	var generatePlot = function(req, res){
		plot({
			data: values,
			filename: 'output.png',
			finish: function(){
				res.sendfile('output.png');
			}
		});
	}


	var json = function(req, res){
		res.send(JSON.stringify(values));
	}

	startServer();

	app.get('/', generatePlot);
	app.get('/json', json);
	app.listen(port);

	values.toString = function(){
		return "Here are the temps for the cities" + JSON.stringify(this);
	}
}


module.exports = cityPlotter;



