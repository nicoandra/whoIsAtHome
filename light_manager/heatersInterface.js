var dgram = require('dgram');
const env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js')
    , debug = require("debug")("appHeaterInterface");


function HeatersInterface(){

	this.knownHeaters = {};
	this.client = dgram.createSocket('udp4');

	
	this.buffer = [];
	this.port = 8888;
	this.broadcastIp = "192.168.1.255";
	// this.broadcastIp = "192.168.1.128";

	this.discoverHeaters = function(){
		// Broadcast message 


		if(this.client.listeners('listening').length == 0){
			this.client.on("listening", this.sendBroadcastMessage.bind(this))
		}

		try{
			this.client.bind(3814);
		} catch(exception){
			this.sendBroadcastMessage();
		}

		

	}

	this.sendBroadcastMessage = function(){
		debug("uno")
		this.client.setBroadcast(true);
		var buffer = new Buffer([0xFF, 0xFF, 0x00, 0x00]);
	
		// this.client.setBroadcast(true);
		this.client.send(
			buffer, 0, buffer.length, this.port,
			this.broadcastIp,
			function(err){
				this.client.setBroadcast(false);
				debug("Err", err)
			}.bind(this)
		);

	}

	this.handleIncomingPackets = function(msg, rinfo){
		debug("MSG", msg, rinfo);
	}

	this.handleError = function(msg, rinfo){
		debug("ERRR", msg, info);
	}

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(a,b){ console.log(a,b)});
	this.client.on('error', this.handleError.bind(this));


}



/*
Flow:

This class broadcasts a message saying "heaters, introduce yourselves"

Heaters reply back with information

Class saves them!


Class can query them

Class can 
*/


module.exports = HeatersInterface;
