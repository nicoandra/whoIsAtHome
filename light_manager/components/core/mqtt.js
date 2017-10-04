'use strict'
const  env = process.env.NODE_ENV || 'development',
    cfg = require(__dirname + '/../../config/config.'+env+'.js'),
    mqtt = require('mqtt'),
    debug = require('debug')('core:mqtt')

function MessageBroker(cfg) {

    this.callbacks = {};
    let client = mqtt.connect(cfg);

    function connect(){
        debug ("Connecting to ", cfg)
        client = mqtt.connect(cfg);
    }

    client.on('error', function(err){
        debug ("On Error:", err);
    })

    client.on('connect', function () {
        debug ("Connected");
        client.subscribe('/device/announcement');
        client.publish('/device/announcement', "MQTT Class - Main server started");
    })

    client.on('message', function (topic, message) {
        // message is Buffer
        debug ("Received message in topic:", topic, message.toString())

        if(this.callbacks[topic] == undefined){

            debug("No callback for topic", topic, this.callbacks);
            return false;
        }

        debug("SuperCall On Topic ", topic);
        this.callbacks[topic]()

    }.bind(this))

    client.on('offline', function(){
        debug ("Disconnected...");
        this.connect();
    }.bind(this))


    this.subscribe = function(topic, callback) {
        this.callbacks[topic] = callback
        client.subscribe(topic);
    }

    this.publish = function(topic, message){
        client.publish("/device/announcement", "Message published", {}, function(err){ debug("[PUBLISH]", err )} );
        debug("Publishing",message, "over", topic);
        
        client.publish(topic, message);
    }
}

const broker = new MessageBroker(cfg.mqtt);

module.exports = broker;
