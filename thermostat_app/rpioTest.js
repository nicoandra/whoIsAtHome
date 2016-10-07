var rpio = require('rpio');

rpio.init({mapping: 'gpio'}); 

kitchenPin = 18;
livingPin = 23;

rpio.open(kitchenPin, rpio.OUTPUT, rpio.LOW);
rpio.open(livingPin, rpio.OUTPUT, rpio.LOW);


for (var i = 0; i < 5; i++) {
        /* On for 1 second */


        rpio.write(kitchenPin, rpio.HIGH);
	rpio.write(livingPin, rpio.HIGH);

        rpio.sleep(1);

        /* Off for half a second (500ms) */
	rpio.write(kitchenPin, rpio.LOW);
        rpio.write(livingPin, rpio.LOW);
        rpio.msleep(500);
}
