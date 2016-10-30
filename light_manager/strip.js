const dgram = require('dgram');
const server = dgram.createSocket('udp4');
// const client = dgram.createSocket('udp4');


server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

// server.on('listening', () => {
//   var address = server.address();
//   console.log(`server listening ${address.address}:${address.port}`);
// });

//server.bind(process.argv[2]);
// server listening 0.0.0.0:41234

//send some data

var payload = [];

payload[0] = 0X01; // payload command:: set range to color
payload[1] = parseInt(process.argv[2]); //start index >= 0
payload[2] = parseInt(process.argv[3]); //end index < 30
payload[3] = parseInt(process.argv[4]); //R channel
payload[4] = parseInt(process.argv[5]); //G Channel
payload[5] = parseInt(process.argv[6]); //B Channel

console.log(payload);
server.send(new Buffer(payload), 0, 6, 5000, "192.168.1.134", function(err) {
  server.close();
});
