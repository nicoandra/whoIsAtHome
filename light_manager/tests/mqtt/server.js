'use strict'
const debug = require('debug')("server")
      , moment = require('moment')
	  , broker = require(__dirname + '/../../components/core/mqtt.js')

broker.subscribe("/lights/eaa", function(topic, message){
	debug("TE MANDÉ A GUARDAR EL ASUNTO", topic, message)
})

broker.subscribe("/device/announcement", function(topic, message){

	try {
		message = JSON.parse(message);
	} catch(exception){
		debug("Announcement was not properly decoded", message)
	}

	debug("Device is announcing on ", topic, message['mac_address'], message['lights'])
})

broker.subscribe("/lights/eaa", function(topic, message){
	debug("TE MANDÉ A GUARDAR EL ASUNTO", topic, message)
})


/*
setInterval(function(){

	let values = {};
	for(let i = 0; i < 8; i++){
		values["light" + i] = Math.round(Math.random());
	}

	let message = JSON.stringify(values);

	debug(values, message)

	broker.publish("/lights/60:01:94:49:CB:55", message)
	debug("Setting to", message)


}, 5000)

*/