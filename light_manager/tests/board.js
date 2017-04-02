const dgram = require('dgram');

server = dgram.createSocket('udp4');

var setTempPayload = [0x10, 0x02, 0x10, 0x00];
var getStatusPayload = [0x30, 0xFF, 0x22, 0xB8];


var setLedPowerPayload = [0x20, 0x00, 0x03, 0xFF];

server.on("message", function(message, networkInfo){
	console.log(message,networkInfo);

})

server.bind(8888, function(){

});
