const dgram = require('dgram');

var server = dgram.createSocket('udp4');

/*server.bind(8888, function(){
	server.setBroadcast(true);	
});*/

function send(payload){
	server.send(new Buffer(payload), 0, 2, 8888, "192.168.1.146", function(err,res){
	});
}

const R = 0xF1;
const G = 0xF2;
const B = 0xF3;

function breath(){
	setInterval(function(){

		// Dim UP
		for(var i = 0; i < 16; i++){
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
	send([R, 2550]);
	send([G, 0]);
	send([B, 0]);
}


function warning(){
	send([R, 200]);
	send([G, 100]);
	send([B, 0]);
}

function off(){
	send([R, 0]);
	send([G, 0]);
	send([B, 0]);
}


function halogen(){
	send([R, 255]);
	send([G, 241]);
	send([B, 224]);
}

function white(){
	send([R, 255]);
	send([G, 255]);
	send([B, 255]);
}

off();
