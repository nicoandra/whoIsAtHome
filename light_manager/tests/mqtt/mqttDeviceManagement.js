'use strict'
const debug = require('debug')("server")
const moment = require('moment')
	  , manager = require(__dirname + '/../../components/core/mqttDeviceManagement.js')
	  , broker = require(__dirname + '/../../components/core/mqtt.js')

const util = require('util');

// console.log(manager);

broker.subscribe("/device/announcement", function(topic, message){

	try {
		message = JSON.parse(message);
	} catch(exception){
		debug("Announcement was not properly decoded", message)
	}

	if(manager.addAsDiscoveredDevice(message['mac_address'], message)){
		debug("Added new device as Discovered. Please set it up.", message['mac_address'])
		return ;
	}
	debug("There's nothing to do.")
	
})


const listDevices = function(){
	console.log(manager.getDiscoveredDevices())

}

// setInterval(listDevices, 1000)



setTimeout(function(){

	let br = 1024;
	// br = Math.round(Math.random() * 1024)
	for(let i = 0; i < 8; i++){
		manager.setLightValue("60019449CB55", i, br);	
	}
	

	/*manager.setLightValue("60019449CB55", 1,  Math.round(Math.random() * 1024) );
	setTimeout(function(){
		// manager.setLightValue("60019449CB55", 2, Math.round(Math.random() * 1024) );	
	}, 100)*/
	
}, 100)