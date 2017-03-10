var dgram = require('dgram');
const  debug = require("debug")("app:heaterClient");



var socket = dgram.createSocket('udp4');

socket.on("error", function(err){ debug("ERROR", err)});
socket.on("message", function(a,b){ debug("MSG", a,b)});


socket.on('listening', () => {
  var address = socket.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

socket.bind({port : 8888});
