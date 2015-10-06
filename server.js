
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

var users = [
	{"name": "Nico", "status" : "Offline", "newStatus" : "Offline" , "devices" : devices }
]

usersAtHome = []





/*
setInterval(function(){
	// Ping hosts to get status and update status in devices array
	users.forEach(function(user, userId){
		user.devices.forEach(function(device, deviceId){

			host = device.ip;
			console.log("Testing "+ device.name + " of user " + userId);

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

*/

/*
setInterval(function(){
	console.log(users[0].status, users[0].newStatus, users[0].devices );
}, 1000);
*/


var pingHost = function(host){
	var isAlive = false;
	return ping.sys.probe(host, function(isAlive){
		return isAlive;	
	});
	return isAlive;
}



UserObject = function(name){
	this.name = name;
	this.status = 'Offline';
	this.newStatus = 'Offline';
	this.devices = [];

	this.addDevice = function(device){
		this.devices.push(devices);
	}
}


DeviceObject = function(name, ipAddress){
	this.name = name;
	this.status = 'Offline';
	this.newStatus = 'Offline';
	this.ipAddress = ipAddress;
}

var users = [
	new UserObject("nico")
]

users[0].addDevice(new DeviceObject("Phone", "192.168.1.141"));
users[0].addDevice(new DeviceObject("Helmet", "192.168.1.142"));

console.log(users);


users.forEach(function(user, userId){
	users[userId].newStatus = "Offline";

	users[userId].devices.forEach(function(device, deviceId){
		console.log("Testing U:" + users[userId].name + " D: " + devices[deviceId].name);
		console.log(pingHost(devices[deviceId].ipAddress));
	});



});


