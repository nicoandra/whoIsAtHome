
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

	var servePlot = function(req, res){

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



	var json = function(req, res){
		res.send(JSON.stringify(values));
	}

	startServer();

	app.get('/', servePlot);
	app.get('/json', json);
	app.listen(port);
	console.log('Plot generator is listening on 127.0.0.1:'+port+'. The avalilable methods are / and /json');

}


module.exports = cityPlotter;



