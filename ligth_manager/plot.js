
function cityPlotter(){
	var path = require('path');

	var cities = {
		'BUE': {'name' : 'Buenos Aires, Argentina'},
		'YUL': {'name' : 'Montreal, QC, Canada'}
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

		for(i=0; i < 10; i++){
			setTimeout( function(){ getValues() }, 3000);
		}
		setInterval(getValues, refreshPeriod);
	}


	var getValues = function(){
		Object.keys(cities).forEach(function(key){


			url = 'http://api.openweathermap.org/data/2.5/weather?APPID='+openWeatherMapAppId+'&q='+cities[key].name+'&units=metric';
			url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22"+cities[key].name+"%22)%20AND%20u%3D'c'&format=json&diagnostics=true&callback=";

			// url = 'http://api.openweathermap.org/data/2.5/weather?APPID='+openWeatherMapAppId+'&q='+cities[key].name+'&units=metric';


			request(url, function(error, response, body){
				if(!error && response.statusCode == 200){

					var info = JSON.parse(body);

					console.log(info.query.results.channel.item.condition.temp);

					values[key].push(parseFloat(info.query.results.channel.item.condition.temp));
					if(values[key].length > sampleSize){
						values[key].shift();
					}
				}
			});
		});
	}

	this.servePlot = function(req, res){

		filePath = path.join(__dirname,'output.png');
		plot({
			data: values,
			filename: filePath,
			finish: function(){
				res.sendFile(filePath);
			}
		});
	}


	var generatePlot = function(callback){

		filePath = path.join(__dirname,'output.png');
		plot({
			data: values,
			filename: filePath,
			finish: function(){
				res.sendFile(filePath);
			}
		});
	}



	this.json = function(req, res){
		res.send(JSON.stringify(values));
	}

	startServer();

	// app.get('/', servePlot);
	// app.get('/json', json);
	// app.listen(port);
	// console.log('Plot generator is listening on 127.0.0.1:'+port+'. The avalilable methods are / and /json');

}


module.exports = cityPlotter;



