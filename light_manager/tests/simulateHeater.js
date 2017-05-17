const dgram = require('dgram');

var server = dgram.createSocket('udp4');

/*server.bind(8888, function(){
 server.setBroadcast(true);
 });*/

function send(payload){
	server.send(new Buffer(payload), 0, payload.length, 8888, "127.0.0.1", function(err,res){
	});
}

send([0x11 ,0x00, 0xAA , 0x01]);
