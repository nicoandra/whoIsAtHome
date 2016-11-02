var rpio = require('rpio');
rpio.init({mapping: 'gpio'}); 


/*
rpio.open(4, rpio.OUTPUT, rpio.LOW);

var cnt = 0;
setInterval(function(){
	console.log("Sending ", cnt);
	rpio.write(4, cnt++)
	if(cnt > 1) cnt = 0

}, 5000)
*/



const ShiftRegister = require("./shiftRegister.js");
var shiftRegister = new ShiftRegister(rpio, 8);


var cnt = 0;
setInterval(
	function(){
		console.log("EL UNO");
		shiftRegister.setValueInArray(0, 1)
		shiftRegister.setValueInArray(1, 1)
		shiftRegister.setValueInArray(2, 1)
		shiftRegister.setValueInArray(3, 1)
		shiftRegister.setValueInArray(4, 1)
		shiftRegister.setValueInArray(5, 1)
		shiftRegister.writeBuffer();
	}, 
	200
)

var cnt2 = 0;
setInterval(
	function(){
		console.log("EL DOS");
		shiftRegister.setValueInArray(0, 1)
		shiftRegister.setValueInArray(1, Math.random() < .5)
		shiftRegister.setValueInArray(2, Math.random() < .5)
		shiftRegister.setValueInArray(3, Math.random() < .5)
		shiftRegister.setValueInArray(4, Math.random() < .5)
		shiftRegister.setValueInArray(5, Math.random() < .5)
		shiftRegister.writeBuffer();
	},
	10
)
