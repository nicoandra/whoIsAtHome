const dgram = require('dgram');

server = dgram.createSocket('udp4');
var payload = [0xF0, 0x00, 0x10, 0x88];

server.send(new Buffer(payload), 0, 4, 8888, "192.168.1.113", function(err,res){
	console.log(err, res);
});
