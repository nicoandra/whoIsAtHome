var rpio = require('rpio');


function ShiftRegister(options){


	this.pinDs = options.pinDs;
	this.pinClk = options.pinClk;
	this.pinClear = 21;
	console.log(options, this.pinDs, this.pinClk);
	this.data = [0,0,0,0,0,0,0,0];

	this.init = function(){
		rpio.setOutput(this.pinDs);
		rpio.setOutput(this.pinClk);
		rpio.setOutput(this.pinClear);
		

		// Start with the clock pin low
		rpio.write(this.pinClk, 0);
		rpio.write(this.pinClear, 1);
	}

	this.setData = function(data){
		this.data = data;
	}

	this.writeData = function(){

		dataToWrite = this.data.concat();

		var step = 1;
		var delay = 200;

		setTimeout(function(){
			rpio.write(this.pinClear, 1);
		}.bind(this), delay*step++);


		setTimeout(function(){
			rpio.write(this.pinClear, 0);
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
			rpio.write(this.pinClk, 0);
		}.bind(this), delay*step++);
	}

}

module.exports = ShiftRegister;
var tempControl = new ShiftRegister({pinDs : 17 , pinClk : 18 });
tempControl.init();
// tempControl.writeData();

setTimeout(
	function(){
		tempControl.setData([1,1,1,1,0,0,0,0,1]); // ,1,1,1,1,1,1,1,1,0]);
		tempControl.writeData();
	}.bind(tempControl)
, 1);

setTimeout(
	function(){
		tempControl.setData([0,0,0,0,1,1,1,1,1]); // ,1,1,1,1,1,1,1,1,0]);
		tempControl.writeData();
	}.bind(tempControl)
, 8000);
