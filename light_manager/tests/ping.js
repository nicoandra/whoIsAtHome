var shell = require('shelljs');
var moment = require('moment');

var lastTimeNicWasSeen = new moment().subtract(25, 'days');
var lastTimeNicWasDetectedAway = new moment().subtract(25, 'days');

function ping(){


	ping = shell.exec('ping 192.168.1.141 -c1 -W1', { silent : 1 }).code;
	if(ping === 0){
		heIsJustBack();
	} else {
		console.log("He's away since", lastTimeNicWasSeen);
	}
}


function heIsJustBack(){
	var momentsAgo = new moment().subtract(30, 'seconds');

	if(lastTimeNicWasSeen.isBefore(momentsAgo)){
		lastTimeNicWasSeen = new moment();
		console.log("He just came back...");
	} else {
		console.log("He's still around...")
	}
}


setInterval(ping, 1000);