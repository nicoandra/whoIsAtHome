function ShiftRegister(rpio, length){

	var delay = 0;

	this.data = new Array(8).fill(0)
	// this.data = [0,0,0,0,0,0,0,0]
	
	this.pinValues = {
		SER : 0, // (Serial) Input for the next pin that gets shifted in.
		SRCLK : 0, // Serial Clock) When this pin is pulled high, it will shift the register.
		RCLK: 0 , // (Register Clock) Needs to be pulled high to set the output to the new shift register values, This must be pulled high directly after SRCLK has gone LOW again.
		SRCLR : 0, // (Serial Clear) Will empty the whole Shift Register if pulled LOW, must be pulled High to enable.
		OE : 0, // (Output Enable) This pin enables the output when tied to GND, & disabled when HIGH.
	}

	this.pinNumbers = {
		SER: 4 , // Chip #14
		SRCLK: 17, // Chip #11
		RCLK: 13, // Chip #12
		SRCLR :  22, //, Chip #10
		OE: 27 // Chip #13
	}

	this.setPin = function(pinId, value){

		if(value === 0){
			value = rpio.LOW;
		}

		if(value === 1){
			value = rpio.HIGH;
		}


		this.pinValues[pinId] = value;
		rpio.write(this.pinNumbers[pinId], this.pinValues[pinId]);
		console.log("Pin values:", this.pinValues);
	}

	this.init = function(){
		Object.keys(this.pinValues).forEach(function(pinName){
			rpio.open(this.pinNumbers[pinName], rpio.OUTPUT, this.pinValues[pinName]);
			// this.setPin(pinName, this.pinValues[pinName]);
		}.bind(this));

		this.setPin("SRCLR", 1);

		this.enableOutput();

		
		this.setPin("RCLK", 0);
		

		this.writeBuffer();
	}

	this.enableOutput = function(){
		this.setPin("OE", 0);
	}

	this.disableOutput = function(){
		this.setPin("OE", 1);
	}

	this.sendBit = function(value){
		
		// this.setPin("RCLK", 0);

		this.setPin("SRCLK", 0);
		console.log("Ser set to", value)
		this.setPin("SER", value);
		this.setPin("SRCLK", 1);

		// this.setPin("RCLK", 1);

	}


	this.addPin = function(value){
		this.setPin("RCLK", 0);
		this.sendBit(value);		
		this.setPin("RCLK", 1);
	}


	this.writeBuffer = function(callback){

		callback = typeof callback == "function" ? callback : function(){}
		position = 0;

		this.setPin("RCLK", 0);
		this.data.forEach(function(value, key){
			keyToRead = this.data.length - (key + 1)
			value = this.data[keyToRead];
			value = value == 1 ? rpio.HIGH : value;
			value = value == 0 ? rpio.LOW : value;
			this.sendBit(value);
		}.bind(this))
		
		this.setPin("RCLK", 1);
		callback();
	}



	this.setValueInArray = function(position, value){
		if(position < 0) throw new Exception("Position is too low");
		if(position >= this.data.length) throw new Exception("Position is too high");

		this.data[position] = value;
	}

	this.init();
	this.disableOutput();
	this.enableOutput();	

}


module.exports = ShiftRegister;

/*
delay = 10;
shiftRegister = new ShiftRegister()

var toWrite = Array(8).fill(0);
toWrite[0] = 1
power = 1;


setInterval(function(){
	shiftRegister.writeArray(toWrite)
}, 2);


// Set heater 1
setInterval(function(){
	rand = Math.random() < .5;
	toWrite[2] = rand ? 1 : 0;
}, 1)

*/