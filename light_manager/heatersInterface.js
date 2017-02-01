var dgram = require('dgram');
const env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js')
    , debug = require("debug")("appHeaterInterface");


function HeatersInterface(){

	this.knownHeaters = {};
	this.client = dgram.createSocket('udp4');
	this.announcer = dgram.createSocket('udp4');

	this.clientSettings = {};


	
	this.buffer = [];
	this.port = 8888;
	this.broadcastIp = "192.168.1.112";
	// this.broadcastIp = "192.168.1.128";


	this.initClient = function(callback){
		debug("1");
		if(this.client.listeners('listening').length == 0){
			
			this.client.on("listening", function(){
				debug("Init Client");
				this.clientSettings = this.client.address();
				callback();
			}.bind(this))

			this.client.bind();

		} else {
			callback();
		}
	}

	this.initAnnouncer = function(callback){
		debug("2");
		if(this.announcer.listeners('listening').length == 0){
			this.announcer.on("listening", function(){
				debug("Init Announcer");
				this.announcer.setBroadcast(true);
				callback;
			}.bind(this))

			this.announcer.bind();

		} else {
			callback();
		}

	}

	this.sendBroadcastDiscoveryMessage = function(callback){
		var buffer = new Buffer([0xFF, 0xFA]);
	
		// this.client.setBroadcast(true);
		this.announcer.send(buffer, 0, buffer.length, this.port, this.broadcastIp, function(err){
				debug("Err", err)
				callback();
			}.bind(this)
		);

	}

	this.discoverHeaters = function(){
		this.initClient(
			function(){
				this.initAnnouncer(function(){
					this.sendBroadcastDiscoveryMessage(function(){debug("All DOne");})
					
				}.bind(this))
			}.bind(this)
		);
	}

















	this.discoverHeaters2 = function(){
		// Broadcast message 

		if(this.client.listeners('listening').length == 0){
			this.client.on("listening", function(){
				this.sendBroadcastMessage();
				this.clientSettings = this.client.address();
			}.bind(this))
		}

		try{
			this.client.bind();
		} catch(exception){
			debug("exc", exception)
			this.sendBroadcastMessage();
		}
	}

	this.sendBroadcastMessage = function(){
		debug("uno")
		
		if(this.announcer.listeners('listening').length == 0){
			this.announcer.on("listening", function(){
				this.announcer.setBroadcast(true)
				// Once the announcer socket is setup; call me again.
				debug("Setup done. Call boardcast again")
				this.sendBroadcastMessage()
			}.bind(this));

			return ;
		}
		
		debug(this.clientSettings);

		this.clientSettings.port


		var buffer = new Buffer([0xFF, 0xFA]);
	
		// this.client.setBroadcast(true);
		this.announcer.send(
			buffer, 0, buffer.length, this.port,
			this.broadcastIp,
			function(err){
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
