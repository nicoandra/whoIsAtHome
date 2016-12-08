var rpio = require('rpio');
var request = require('request');

/// 
rpio.init({mapping: 'gpio'}); 

var PININ=19
var PINOUT=12


rpio.open(PINOUT, rpio.OUTPUT, rpio.PULL_HIGH);
rpio.write(PINOUT, rpio.HIGH)
/* Set the pin high every 10ms, and low 5ms after each transition to high */

rpio.open(PININ, rpio.INPUT, rpio.PULL_DOWN);
rpio.poll(PININ, pollcb);

function pollcb(pin)
{
        /*
         * Interrupts aren't supported by the underlying hardware, so events
         * may be missed during the 1ms poll window.  The best we can do is to
         * print the current state after a event is detected.
         */
        var state = rpio.read(pin) ? 'pressed' : 'released';
        // console.log('Button event on P%d (button currently %s)', pin, state);

        if(rpio.read(pin)){
                detector.buttonPressed();
        } else if(!rpio.read(pin)){
                detector.buttonReleased();
        }
}


myDetector = function(){

        this.startPress = false;
        this.timeoutToCheckRelease = false;
        this.ignoreRelease = false;

        this.buttonPressed = function(){
                this.startPress = new Date().getTime();
                this.timeoutToCheckRelease = setTimeout(function(){
                        console.log("Baja la persiana");
                        allOff();
                        this.ignoreRelease = true;
                }.bind(this), 1000)   // Verify in 3 seconds
        }

        this.buttonReleased = function(){

                if(this.ignoreRelease){
                        // The release should be ignored because the action already kicked in
                        this.ignoreRelease = false;
                        return ;
                }

                console.log("Switching light mode");
                toggleProgram();
                clearTimeout(this.timeoutToCheckRelease)

        }

}

detector = new myDetector();

function toggleProgram(){

        options = {
            url: "http://192.168.1.112:3999/lights/iterateBetweenChildPrograms",
            form : {"programKey": "13aa6f8804c24f132573b221c93f0e87" },
            timeout : 1000
        }

        request.post(options, function(error, response, body){
            if(!error && response.statusCode == 200){
                // var info = JSON.parse(body);
                console.log(body);
            } else {
                console.log("Error polling heater", error)
            }
        });
}

function allOff(){

    options = {
    url: "http://192.168.1.112:3999/angular/runProgram",
    form : {onOff: false, lightName: ["officeLamp", "kitchenLamp", "officeBoards", "kitchenCountertop"]},
    timeout : 1000
    }

    request.post(options, function(error, response, body){
    console.log(body);
    if(!error && response.statusCode == 200){
    // var info = JSON.parse(body);
    console.log(body);
    } else {
    console.log("Error polling heater", error)
    }
    });
}