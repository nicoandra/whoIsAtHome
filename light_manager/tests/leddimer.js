const dgram = require('dgram');

var server = dgram.createSocket('udp4');

const setDimPayload = [0xF3, 0x58];


var payload = setDimPayload;

server.bind(8888, function(){
	server.setBroadcast(true);	
});



function send(payload){
	server.send(new Buffer(payload), 0, 2, 8888, "192.168.1.146", function(err,res){
		// console.log(err, res);
	});
}

function breath(){
	setInterval(function(){

		// Dim UP
		for(i = 0; i < 16; i++){
			let v = i * 16;
			console.log("+Queuing", v);

			setTimeout(function(){
				console.log("+Sending", v);
				send([0xF3, v]);
				send([0xF2, v]);
				send([0xF1, v]);			
			}, parseInt(1600 / 16) * i)
		}


		// Dim Down
		for(i = 16; i > -1 ; i--){
			let v = i * 16;
			console.log("-Queuing", v);

			setTimeout(function(){
				console.log("-Sending", v);
				send([0xF3, v]);
				send([0xF2, v]);
				send([0xF1, v]);
			}, 4000 + parseInt(1600 / 16) * Math.abs(i - 16))
		}

	}, 10 * 1000)
}

function alert(){
	send([0xF2, 255]);
	send([0xF3, 0]);
	send([0xF1, 0]);
}


function warning(){
	send([0xF2, 200]);
	send([0xF3, 100]);
	send([0xF1, 0]);
}



function off(){
	send([0xF2, 0]);
	send([0xF3, 0]);
	send([0xF1, 0]);
}


function halogen(){
	send([0xF2, 255]);
	send([0xF3, 241]);
	send([0xF1, 224]);
}

function white(){
	send([0xF2, 255]);
	send([0xF3, 255]);
	send([0xF1, 255]);
}

alert();
