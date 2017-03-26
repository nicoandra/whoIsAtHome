const dgram = require('dgram');

server = dgram.createSocket('udp4');

var setTempPayload = [0x10, 0x02, 0x15, 0x10];
var getStatusPayload = [0x30, 0xFF, 0x22, 0xB8];


// var setLedPowerPayload = [0x20, 0x00, 0x03, 0xFF];


server.on("message", function(message, networkInfo){
	// message = message.values(;

	remoteIp = networkInfo.address;

	if(remoteIp != "192.168.1.128"){
		return false;
	}

	console.log(message.length, message);

	desiredTemperature1 = desiredTemperature2 = 
	temperature1 = temperature2 = humidity1 = humidity2 = 
	heaterPower1 = heaterPower2 = powerOutlet = 999;


	if(message[0] == 0x11){
		console.log("Sensor message", message[3])
		return ;
	}


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
				temperature1 = value;
				break;
			case 4:
				temperature1 += value / 256;
				break;
			case 5:
				desiredTemperature1 = value;
				break;
			case 6:
				desiredTemperature1 += desiredTemperature1 / 256;
				break;
			case 7:
				heaterPower1 = value;
				break;
			case 8:
				humidity1 = value;
				break;
			case 9:
				humidity1 += value / 256;
				break;


			case 10:
				temperature2 = value;
				break;
			case 11:
				temperature2 += value / 256;
				break;
			case 12:
				desiredTemperature2 = value;
				break;
			case 13:
				desiredTemperature2 += desiredTemperature2 / 256;
				break;
			case 14:
				heaterPower2 = value;
				break;
			case 15:
				humidity2 = value;
				break;
			case 16:
				humidity2 += value / 256;
				break;				
			case 17:
				break;
			case 18:
				powerOutlet = value * 256;
				break;
			case 19:
				powerOutlet = powerOutlet + value;
				break;				
		}

	}

	console.log(
		"Heater at", remoteIp, ">");

	console.log("Current1:", temperature1, "*C, ", humidity1, "%. Desired:", desiredTemperature1, "Power:", heaterPower1, "/10; ");
	console.log("Current2:", temperature2, "*C, ", humidity2, "%. Desired:", desiredTemperature2, "Power:", heaterPower2, "/10");
	console.log("powerOutlet:", powerOutlet);

})



payload = setTempPayload;


server.bind(8888, function(){
	server.setBroadcast(true);	
});

server.send(new Buffer(payload), 0, 4, 8888, "192.168.1.128", function(err,res){
	console.log(err, res);
});
