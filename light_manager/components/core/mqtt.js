'use strict'
const mqtt = require('mqtt')

function messageBroker(cfg) {

    let client = mqtt.connect(cfg.mqtt.dsn);

    client.on('connect', function () {
        client.subscribe('/device/announcement')
        client.publish('/device/announcement', "Main server started");
    })

}

module.exports = messageBroker;
