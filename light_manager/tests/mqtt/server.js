const debug = require('debug')("server")
      , moment = require('moment')
	  , broker = require(__dirname + '/../../components/core/mqtt.js')
	  , broker3 = require(__dirname + '/../../components/core/mqtt.js')
	  , broker5 = require(__dirname + '/../../components/core/mqtt.js')
	  , light = require(__dirname + '/../../components/core/mqtt.js')


broker.subscribe("/lights/eaa", function(topic, message){
	console.log("TE MANDÉ A GUARDAR EL ASUNTO", topic, message)
})


setTimeout(function(){
	console.log("TIMEOUT VINO!!");
	broker.publish("/lights/eaa", "URCO SOS??");
}, 2000)

