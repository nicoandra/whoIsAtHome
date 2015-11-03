var rpio = require('rpio'),
sensorLib = require('node-dht-sensor');	// https://github.com/momenso/node-dht-sensor



var sensor = {
	sensors: [ {
			name: "kitchen",
			type: 22,
			pin: 17
		}, {
			name: "living",
			type: 22,
			pin: 4
		}
	],
	read: function() {
		for (var a in this.sensors) {
			var b = sensorLib.readSpec(this.sensors[a].type, this.sensors[a].pin);

			// console.log(this.sensors[a].name + ": " + b.temperature.toFixed(1) + "C, " + b.humidity.toFixed(1) + "%"); 

			if(this.sensors[a].name=='kitchen'){
				heaters.kitchen.currentTemp = b.temperature.toFixed(1);
			}

			if(this.sensors[a].name=='living'){
				heaters.living.currentTemp = b.temperature.toFixed(1);
			}
		}
		setTimeout(function() {
			sensor.read();
		}, 2000);
	}
};





function Heater(name, pinNumber) {
	this.name = name;
	this.currentTemp = 19.8;
	this.desiredTemp = 20;
	this.power = 0;
	this.pinNumber = pinNumber;

	this.calculate = function(){
		diff = this.currentTemp - this.desiredTemp;
		// console.log(this.name, this.currentTemp, this.desiredTemp, diff);

		if(diff > .5){
			this.power = 0;
			return ;
		}

		if(diff < -1){
			this.power = 100;
			return ;
		}
		this.power = 50;
	}


	this.writeValue = function(){
		steps = 100;
		for(i=0; i<steps ;i++){
			bit = (i < this.power);
			// console.log('Power ', this.power, ' Loop ', i, ' Value ', value, 'CurrentBit ', bit);
			setTimeout(function(bit){
				console.log('Setting power', this.pinNumber, this.power, bit);
				rpio.write(this.pinNumber, bit ? 1 : 0);
			}.bind(this, bit), i*300);
		}
		
		
	}

	this.start = function(){
		rpio.setFunction(this.pinNumber, rpio.OUTPUT);
		setInterval(this.calculate.bind(this), 10000);
		setInterval(this.writeValue.bind(this), 30000);
		this.calculate();
		this.writeValue();
	}
}

var heaters = {
	kitchen : new Heater('kitchen', 18),
	living : new Heater('living', 23)
}

heaters.kitchen.start();
heaters.living.start();

sensor.read();



var express = require('express'),
app = express();
app.get('/get/:room/', function(req, res){
	room = req.params.room;

	res.json({response: 'OK', name : room, currentTemperature: heaters[room].currentTemp, desiredTemperature : heaters[room].desiredTemp, power : heaters[room].power });
	console.log('Getting stats for ', room);

});

app.get('/set/:room/', function(req, res){
	room = req.params.room;
	desiredTemperature = parseInt(req.query.temperature);

	if(desiredTemperature < 8 || desiredTemperature > 28){
		res.json({response: "Temperature out of boundaries", status:"KO"});
		return ;
	}

	heaters[room].desiredTemp = desiredTemperature;
	res.json({response: 'OK', name : room, currentTemperature: heaters[room].currentTemp, desiredTemperature : heaters[room].desiredTemp, power : heaters[room].power });
	console.log('Setting temperature for', req.params.room, 'to', heaters[room].desiredTemp);
});

var PORT = 80;
app.listen(PORT, function(){
	console.log('Thermostat listening at port', PORT);
})