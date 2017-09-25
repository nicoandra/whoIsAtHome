'use strict'
const mqtt = require('mqtt'),
    debug = require('debug')('core:mqtt')

function messageBroker(cfg) {

    let client = mqtt.connect(cfg.mqtt.dsn);

    function connect(){
        debug ("Connecting to ", cfg.mqtt.dsn)
        client = mqtt.connect(cfg.mqtt.dsn);
    }

    client.on('error', function(err){
        debug ("On Error:", err);
    })

    client.on('connect', function () {
        debug ("Connected");
        client.subscribe('/device/announcement');
        client.publish('/device/announcement', "Main server started");
    })

    client.on('message', function (topic, message) {
        // message is Buffer
        debug ("Received message in topic:", topic, message.toString())
    })

    client.on('offline', function(){
        debug ("Disconnected...");
        connect();
    }.bind(this))
}

module.exports = messageBroker;
