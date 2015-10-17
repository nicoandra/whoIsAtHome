var Gpio = require('onoff').Gpio;
  // var led = new Gpio(21, 'out');
  // var button = new Gpio(4, 'in', 'both');

var piblaster = require('pi-blaster.js');


function exit() {
	led.unexport();
	button.unexport();
	process.exit();
}


function Thermostat(){
	this.currentTemperature = 10;
	this.desiredTemperature = 20;
	this.nextCheck = 1;
	this.power = 0;


	this.efectoDelInvierno = function(){
		this.currentTemperature = this.currentTemperature - (1 + Math.random() * 2);
	}

	this.efectoDelHeater = function(){
		this.currentTemperature = this.currentTemperature + Math.random() * (this.power / 2);	
	}


	this.calculatePower = function(){
		var tempDiff = this.currentTemperature - this.desiredTemperature;
		var absoluteTempDiff = Math.abs(tempDiff);


		if(tempDiff > .5){
			// More than .5 degrees, turn heater off and check in 2 minutes
			this.nextCheck = 60 * 2 * 1000;
			// Set power off
			this.power = 0;
		} else if(absoluteTempDiff <= .5){
			// When .5 degrees of diff; set power to a proportional value.
			this.nextCheck = 60 * 2 * 1000;
			this.power = Math.abs(absoluteTempDiff - .3) * 10;
		} else if(tempDiff < 2){
			// Check in 3 minutes
			this.nextCheck = 60 * 3 * 1000;
			// Set power to 10
			this.power = 10;
		} else {
			// At this stage, the temperature is between .5 and 2 degrees below the desired temperature
			// Recheck in 1 minute
			this.nextCheck = 60 * 1 * 1000;
			// Set power to something proportional to the temp difference
			this.power = 10 * (1-(absoluteTempDiff / 1.5)); 
		}

		this.nextCheck = this.nextCheck / 60;
		// console.log("Checking again in ", this.nextCheck);
		console.log('Curr:', this.currentTemperature, 'Des:', this.desiredTemperature, 'Diff:', tempDiff, 'Power:', this.power);

		setTimeout(
			function(){
				this.calculatePower();
			}.bind(this), this.nextCheck
		);

	}

	this.setDesiredTemperature = function(desiredTemperature){
		this.desiredTemperature = desiredTemperature;
	}

	this.start = function(){
		setInterval(function(){this.efectoDelHeater()}.bind(this), 1000);
		setInterval(function(){this.efectoDelInvierno()}.bind(this), 1000);

		setTimeout(
			function(){
				this.calculatePower();
			}.bind(this), 1000
		);



		setInterval(function(){
			piblaster.setPwm(21, this.power / 10)
		}.bind(this), 1000);

		// setInterval(function(){this.show()}.bind(this), 1000);
	}

	this.show = function(){
		console.log('Curr Temp:', this.currentTemperature, '; Desired Temp:', this.desiredTemperature, '; Heat Pwr: ', this.power);
	}

}

module.exports = Thermostat;

var kitchenTerm = new Thermostat();

console.log(kitchenTerm);
kitchenTerm.start();


function CommandLineInterpreter(){
	this.start = function(){
		console.log('Command Line Interpreter: up and running!');
		var stdin = process.openStdin();

		stdin.addListener("data", function(d) {
			var programName = d.toString().trim();
			kitchenTerm.setDesiredTemperature(programName);
		});
	}
}
module.exports = CommandLineInterpreter;
var cliInterpreter = new CommandLineInterpreter();
cliInterpreter.start();



/*
var onOrOff = true;
button.watch(function (err, value) {

	if(value) return;

	onOrOff = !onOrOff;

	if (err) {
		throw err;
	}
	console.log('Botón:', value, onOrOff);
	led.writeSync(onOrOff ? 1 : 0);
});

process.on('SIGINT', exit);




var clock = 0;
function tick(){
	//led.write(clock);
	rotClk.write(clock);
	// console.log(clock ? 'tic' : 'tac');
	clock = clock ? 0 : 1;
}
setInterval(tick, 50);


var a1,a2,a3 = -1;
var totalValue = 0;
var direction = 'back';


setInterval(function(){ console.log(totalValue)}, 1000);

rotSw.watch(function (err, value) {




});

rotOt.watch(function (err, value) {
	console.log('ot', err, value);
});*/