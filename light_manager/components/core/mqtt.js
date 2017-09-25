'use strict'
const mqtt = require('mqtt')

function messageBroker(cfg) {

    let client = mqtt.connect(cfg.mqtt.dsn);

    function connect(){
	console.log("Connecting to ", cfg.mqtt.dsn)
        client = mqtt.connect(cfg.mqtt.dsn);
    }

    client.on('error', function(err){
	console.log("On Error:", err);
    })

    client.on('connect', function () {
	console.log("Connected");
        client.subscribe('/device/announcement');
        client.publish('/device/announcement', "Main server started");
    })

    client.on('message', function (topic, message) {
        // message is Buffer
        console.log(topic, message.toString())
    })

    client.on('offline', function(){
	console.log("Disconnected...");
        // connect();
    }.bind(this))

    // connect();

}

module.exports = messageBroker;
