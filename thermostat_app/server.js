var rpio = require('rpio');


function ShiftRegister(options){


	this.pinDs = options.pinDs;
	this.pinClk = options.pinClk;
	this.pinClear = 21;
	this.pinRClk = options.pinRClk;

	// console.log(options, this.pinDs, this.pinClk);
	this.data = [0,0,0,0,0,0,0,0];

	this.init = function(){
		rpio.setOutput(this.pinDs);
		rpio.setOutput(this.pinClk);
		rpio.setOutput(this.pinClear);
		

		// Start with the clock pin low
		rpio.write(this.pinClk, 0);
		rpio.write(this.pinClear, 0);
	}

	this.reset = function(){
		// rpio.write(this.pinClear, 0);	
		// rpio.write(this.pinClear, 1);
	}

	this.setData = function(data){
		this.data = data;
	}

	this.writeData = function(){

		dataToWrite = this.data.concat().reverse();

		var step = 1;
		var delay = 2;

		setTimeout(function(){
			rpio.write(this.pinClear, 0);
		}.bind(this), delay*step++);


		setTimeout(function(){
			rpio.write(this.pinClear, 1);
		}.bind(this), delay*step++);


		setTimeout(function(){
			console.log("Closing request ");
			// rpio.write(this.pinClk, 0);
			rpio.write(this.pinRClk, 0);
		}.bind(this), delay*step++);


		dataToWrite.forEach(function(value, index){

			setTimeout(function(){
				console.log("Setting clk low");
				;
				rpio.write(this.pinClk, 0);
			}.bind(this), delay*step++);

			setTimeout(function(){
				console.log("Writing ", value, " now ");
				rpio.write(this.pinDs, value);
			}.bind(this), delay*step++);


			setTimeout(function(){
				console.log("Setting clk High")
				rpio.write(this.pinClk, 1);
			}.bind(this), delay*step++);
		}.bind(this));

		setTimeout(function(){
			console.log("Closing request ");
			// rpio.write(this.pinClk, 0);
			rpio.write(this.pinRClk, 1);
		}.bind(this), delay*step++);
	}

}

module.exports = ShiftRegister;
var tempControl = new ShiftRegister({pinDs : 17 , pinClk : 18, pinRClk : 23 });
tempControl.init();
// tempControl.writeData();

tempControl.reset();

setInterval(
	function(){
		a=Math.round(Math.random());
		tempControl.setData([
			a,a,a,a,
			a,a,a,a,
			a,a,a,0,
			0,0,0,0
		]);
		tempControl.writeData();



	}.bind(tempControl)
, 30);