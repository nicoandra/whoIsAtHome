'use strict'
const mqtt = require('mqtt')

function messageBroker(cfg) {

    let client = mqtt.connect(cfg.mqtt.dsn);

    function connect(){
        client = mqtt.connect(cfg.mqtt.dsn);
    }

    client.on('connect', function () {
        client.subscribe('/device/announcement');
        client.publish('/device/announcement', "Main server started");
    })

    client.on('message', function (topic, message) {
        // message is Buffer
        console.log(message.toString())
        client.end()
    })

    client.on('offline', function(){
        this.connect();
    }.bind(this))
}

module.exports = messageBroker;
