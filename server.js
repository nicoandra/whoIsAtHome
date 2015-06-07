
var ping = require('ping');
// require('./devices.js');

scenarios = {
	"allOn" : {"description" : "All cameras are on"},
	"perimetral" : {"description" : "Only door and kitchen" }
}

devices = [
	{"name" : "Phone", "ip" : "192.168.1.141" , "status" : "Offline" },
	{"name" : "AnotherPhone", "ip" : "192.168.1.142" , "status" : "Offline" },
]

users = [
	{"name": "Nico", "status" : "Offline", "newStatus" : "Offline" , "devices" : devices }
]

usersAtHome = []



setInterval(function(){
	// Ping hosts to get status and update status in devices array
	users.forEach(function(user, userId){
		
		users[userId].newStatus = "Offline";

		user.devices.forEach(function(device, deviceId){
			host = device.ip;
			console.log("Testing "+ device.name);


			if(users[userId].newStatus == "Online"){
				// User already seen online, stop testing
				console.log("User "+user.name+ " already found online. Skipping test for device "+ device.name);
				return ;
			}

			ping.sys.probe(host, function(isAlive){

				users[userId].devices[deviceId].status = isAlive ? "Online" : "Offline";
				users[userId].newStatus = isAlive ? 'Online' : users[userId].newStatus;

				// console.log(users, users[userId].devices);
	    	});
		});

	});
}, 1000);




setInterval(function(){
	console.log(devices, users);
}, 1000);
