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

        if(this.callbacks[topic] == undefined || typeof this.callbacks[topic] !== 'function')  {
            debug("No callback for topic", topic, this.callbacks);
            return false;
        }

        debug("SuperCall On Topic ", topic);
        try {
            this.callbacks[topic](topic, message.toString())
        } catch(exception){
            debug("Error in message", exception)
        }

    }.bind(this))

    client.on('offline', function(){
        debug ("Disconnected...");
        connect();
    }.bind(this))


    this.subscribe = function(topic, callback) {
        this.callbacks[topic] = callback
        client.subscribe(topic);
    }

    this.publish = function(topic, message){
        client.publish(topic, message, {}, function(err){ debug("[PUBLISH] Err: ", err )} );
        debug("Publishing",message, "over", topic);

        client.publish(topic, message);
    }


    this.start = function(app){
  		debug("Starting MQTT instance")
  		if(this.app != undefined){
  			return this;
  		}
  		this.app = app;
    }

    this.getStatus = function(){
      return {};
    }
}

const broker = new MessageBroker(cfg.mqtt);

module.exports = broker;
