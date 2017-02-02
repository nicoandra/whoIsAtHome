var dgram = require('dgram');
const env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js')
    , debug = require("debug")("app:heaterInterface");



/*
	Commands:
		To implement:
			Discovery
				Payload:	FF 00 XX YY => Ask heaters to report themselves to port XX * 256 + YY
				Response:	FF 00 XX YY => Sent to the port specified before. This reports how many temperature sensors and heater has XX, how many 110v outlets has YY

			Set temperature:
				Payload: 	10 XX YY ZZ => Ask heater to set temperature of heater XX to YY + (ZZ / 256)
				Response:	11 XX YY ZZ => Confirms temperature has been requested

			Set power outlets on/off
				Payload		20 XX 00 YY => Sets status of the power outlet XX to YY (either 0 or 1)
				Response 	21 XX 00 YY => Confirms the status change has been done

			Request for status
				Payload		30 FF XX YY =>  Requests for status to be sen back to port
				Response	30 FF AA (Name BB CC DD) EE (FF) =>
													Response starts with 30 FF.
													The device reports to have AA heaters. Followed by AA pairs of temperatures for each heater and DD with the power of that heater.
													Then it reports to have EE 110v relays. Followed by EE bytes, one for each 110v device, with 1 being ON and 0 being OFF.

 */
function HeatersInterface(){

	this.knownHeaters = {
		//
		// name : { host : , port : , number : , actualTemperature : , desiredTemperature : , timeOfLastSuccessfulCommunication: , actualHumidity , }
	};

	this.client = dgram.createSocket('udp4');
	this.broadcaster = dgram.createSocket('udp4');

	this.discoveryPayload = [0xFF, 0x00, 0x22, 0xB2]; // 22 B2 => 8888 , send the LOCAL port so the heaters reply back
	this.requestStatusPayload = [0x30, 0xFF, 0x22, 0xB2]; // 22 B2 => 8888 , send the LOCAL port so the heaters reply back

	this.remotePort = 8888;

	this.buffer = [];
	this.localPort = 8888;
	this.broadcastIp = "192.168.1.255";
	// this.broadcastIp = "192.168.1.128";

	this.discoverHeaters = function(){
		// Broadcast message
		this.sendBroadcastMessage(this.discoveryPayload);
	}

	this.sendStatusRequest = function(){
		this.sendBroadcastMessage(this.requestStatusPayload);
	}

	this.sendBroadcastMessage = function(arrayToSend){
		if(this.client.listeners('listening').length == 0){
			debug("sendBroadcastMessage", "No listeners have been declared.")
			this.client.on("listening", function(){
				debug("sendBroadcastMessage", "Listener has been declared");
				this.sendBroadcastMessage(arrayToSend);
			}.bind(this));

			return ;
		}

		try{
			this.client.bind(this.localPort);
			this.broadcaster.setBroadcast(true);
			debug("sendBroadcastMessage", "Listener in port", this.localPort);
		} catch(exception){
			debug("sendBroadcastMessage", "Error when setting listener in port", this.localPort, exception);
		}

		debug("Sending broadcast message:", arrayToSend);

		var buffer = new Buffer(arrayToSend);
	
		// this.client.setBroadcast(true);
		this.broadcaster.send(
			buffer, 0, buffer.length, this.remotePort,	this.broadcastIp,
			function(err){
				debug("Err sendBroadcastMessage", err)
			}.bind(this)
		);
	}


	this.setHeaterTemperature = function(name, desiredTemperature){
		var exists = name in this.knownHeaters;
		if (!exists){
			debug("setHeaterTemperature", name, "does not point to a valid heater");
			return ;
		}

		desiredTemperature = Math.abs(desiredTemperature);
		var heaterInfo = this.knownHeaters[name];


		var temperatureInteger = Math.trunc(desiredTemperature);
		var temperatureDecimal = Math.trunc((desiredTemperature - temperatureInteger) * 256);
		var payload = [ 0x10 , heaterInfo.toString(16), temperatureInteger.toString(16), temperatureDecimal.toString(16) ];

		debug("setHeaterTemperature", name, desiredTemperature, payload);

		var buffer = new Buffer(payload);

		this.client.send(buffer, 0, buffer.length, heaterInfo.port, heaterInfo.host, function(err){
			debug("Err setHeaterTemperature", err)
		})
	}

	this.handleIncomingPackets = function(msg, rinfo){
		debug("MSG", msg, rinfo);
	}

	this.handleError = function(msg, rinfo){
		debug("ERRR", msg, info);
	}

	// this.client.on('message', this.handleIncomingPackets.bind(this));
	this.client.on('message', function(a,b,c,d,e,f){
		console.log(a,b,c,d,e,f);
		this.handleIncomingPackets(a,b);
	}.bind(this));

	This.client.on('error', this.handleError.bind(this));


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
