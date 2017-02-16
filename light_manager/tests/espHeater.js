const dgram = require('dgram');

server = dgram.createSocket('udp4');

var setTempPayload = [0x10, 0x00, 0x13, 0x08];
var getStatusPayload = [0x30, 0xFF, 0x22, 0xB8];


server.on("message", function(message, networkInfo){
	// message = message.values(;

	console.log(message.length, message);

	desiredTemperature = humidity = heaterPower = temperature = powerOutlet = 999;

	for(i = 0; i < message.length; i++){
		value = message.readUInt8(i);
		console.log(i, value);

		messageId = [];

		if(messageId.length == 2 && (messageId[0] != 0x30 || messageId[1] != 0xFF)){
			console.log("Wrong message...");
			return ; 
		}

		switch(i){
			case 1:
			case 2:
				messageId.push(value);
			case 3:
				temperature = value;
				break;
			case 4:
				temperature += value / 256;
				break;
			case 5:
				desiredTemperature = value;
				break;
			case 6:
				desiredTemperature += desiredTemperature / 256;
				break;
			case 7:
				heaterPower = value;
				break;
			case 8:
				humidity = value;
				break;
			case 9:
				humidity += value / 256;
				break;
			case 11:
				powerOutlet = value === 1;
				break;
		}

	}

	remoteIp = networkInfo.address;

	console.log(
		"Heater at", remoteIp, "> Current:", 
		temperature, "*C, ", humidity, "%. Desired:", 
		desiredTemperature, "Power:", heaterPower, "/10; Outlet:", powerOutlet
	);
})



payload = getStatusPayload;


server.bind(8888, function(){
	server.setBroadcast(true);	
});

server.send(new Buffer(payload), 0, 4, 8888, "192.168.1.255", function(err,res){
	console.log(err, res);
});
