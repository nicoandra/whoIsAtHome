var rpio = require('rpio');
rpio.init({mapping: 'gpio'}); 


const ShiftRegister = require("./shiftRegister.js");
var shiftRegister = new ShiftRegister(rpio, 8);

kitchenPin = 18;
livingPin = 23;

rpio.open(kitchenPin, rpio.OUTPUT, rpio.LOW);
rpio.open(livingPin, rpio.OUTPUT, rpio.LOW);




var sensorLib = require('node-dht-sensor');	// https://github.com/momenso/node-dht-sensor
/*
var sensor = {
	sensors: [ {
			name: "kitchen",
			type: 22,
			pin: 25
		}, {
			name: "living",
			type: 22,
			pin: 24
		}
	],

	read: function() {
		for (var a in this.sensors) {
			var b = sensorLib.read(this.sensors[a].type, this.sensors[a].pin);

			temperature = b.temperature.toFixed(2) 
			humidity =  b.humidity.toFixed(2) 

			console.log(this.sensors[a].name + ": " + temperature + "C, " + humidity + "%"); 

			if(this.sensors[a].name=='kitchen' || this.sensors[a].name=='living'){
				heaters[this.sensors[a].name].currentTemp = temperature
				heaters[this.sensors[a].name].humidity = humidity
			}
		};
	},

	start: function(){
		setTimeout(function() {
			this.read();
		}.bind(this), 3000);
	}
};

*/



function Sensor(name, type, pin){
	this.name = name;
	this.type = type;
	this.pin = pin;
	this.temperature = 0;
	this.humidity = 0;
	this.error = false;

	this.read = function(){
		try {
			var b = sensorLib.read(this.type, this.pin);
			this.temperature = b.temperature.toFixed(2);
			this.humidity = b.humidity.toFixed(2);
			this.error = false;
		} catch (excep){
			this.error = new Date();
		}
	}

	this.start = function(){
		setTimeout(function(){
			this.read()
		}.bind(this), 10000)
	}

	this.getTemperature = function(){
		return this.temperature;
	}

	this.getHumidity = function(){
		return this.humidity;
	}

	this.read();
	this.start();
}


var kitchenSensor = new Sensor("Kitchen", 22, 25);
var livingSensor = new Sensor("Living", 22, 24);

function Heater(name, pinNumber, positionInShiftRegister) {
	this.name = name;
	this.humidity = -1;
	this.currentTemp = 19.8;
	this.desiredTemp = 20;
	this.power = 0;
	this.pinNumber = pinNumber;
	this.positionInShiftRegister = positionInShiftRegister;

	this.setCurrentTemperature = function(temperature){
		this.currentTemp = temperature;
	}

	this.setDesiredTemperature = function(temperature){
		this.desiredTemp = temperature;
	}

	this.calculate = function(){
		diff = this.currentTemp - this.desiredTemp;
		// console.log(this.name, this.currentTemp, this.desiredTemp, diff);

		if(diff >= .5){ this.power = 0; return ; }
		if(diff < -1){ this.power = 100; return ; }
		if(diff < -.1){ this.power = 30; return ; }
		if(diff < .5){ this.power = 70; return ; }

		this.power = 50;
	}



	this.writeValue = function(){
		// PWM Pulse width modulation
		steps = 10;
		for(i=0; i<steps; i++){
			bit = (i * 10 < this.power);

			setTimeout(function(bit){
				// console.log('Setting power', this.pinNumber, this.power, bit);
				shiftRegister.setValueInArray(this.positionInShiftRegister, bit);
			}.bind(this, bit), i*500);
		}
	}

	this.start = function(){
		rpio.open(this.pinNumber, rpio.OUTPUT, rpio.LOW);
		setInterval(this.calculate.bind(this), 	5000);
		setInterval(this.writeValue.bind(this), 5000);
		this.calculate();
		this.writeValue();
	}

	this.powerCycleDuration = 10; // in seconds
}

var heaters = {
	kitchen : new Heater('kitchen', 18, 2),
	living : new Heater('living', 23, 4)
}

heaters.kitchen.start();
heaters.living.start();




var express = require('express'),
app = express();
app.get('/get/:room/', function(req, res){
	room = req.params.room;

	try {
		res.json({
			response: 'OK', 
			name : room,
			currentTemperature: heaters[room].currentTemp,
			desiredTemperature : heaters[room].desiredTemp, 
			power : heaters[room].power,
			currentHumidity: heaters[room].humidity
		});
		console.log('Getting stats for ', room);
	} catch(exception){
		res.json({response: "KO", 'exception' : exception, "availableHeaters" : Object.keys(heaters)});
	}

});


app.get('/light/:lightNumber/:lightStatus', function(req, res){
	console.log(req.params);
})



app.get('/set/:room/', function(req, res){
	room = req.params.room;
	try {
		desiredTemperature = parseFloat(req.query.temperature).toFixed(3);
	} catch (e){
		desiredTemperature = 99999;
	}

	if(desiredTemperature < 8 || desiredTemperature > 35){
		res.json({response: "Temperature out of boundaries", status:"KO"});
		return ;
	}

	heaters[room].setDesiredTemperature(desiredTemperature);

	res.json({
		response: 'OK',
		name : room,
		currentTemperature: heaters[room].currentTemp,
		desiredTemperature : heaters[room].desiredTemp,
		power : heaters[room].power,
		uptime : process.uptime()
	});

	console.log('Setting temperature for', req.params.room, 'to', heaters[room].desiredTemp);
});


setInterval(function(){
	heaters.kitchen.setCurrentTemperature(kitchenSensor.getTemperature());
	heaters.living.setCurrentTemperature(livingSensor.getTemperature())

}, 30000);



var PORT = 80;
app.listen(PORT, function(){
	console.log('Thermostat listening at port', PORT);
})



setInterval(
	function(){
		shiftRegister.writeBuffer(function(){})
	},
	250
)
