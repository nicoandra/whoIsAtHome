var shell = require('shelljs');
var moment = require('moment');
var Debug = require('debug');

function DevicePresence(options){


	this.unit = 'minutes';
	try {
		this.name = options.name ;
		this.address = options.address;
		this.eventEmitter = options.eventEmitter !== undefined ? options.eventEmitter : new EventEmitter;
		var debug = Debug('presence:' + this.name);
	} catch(exception){
		throw exception;
	}

	this.isPresent = function(){
		return this.deviceIsPresent;
	}

	this.lastTimeSeenOnline = new moment().subtract(5, this.unit);
	this.deviceIsPresent = true;

	this.ping = function(){
		var code = shell.exec('ping ' + this.address + ' -c1 -W1', { silent : 1 }).code;
		
		debug('Pinging...', code);

		if(code === 0){
			var momentsAgo = new moment().subtract(10, this.unit);
			if(this.lastTimeSeenOnline.isBefore(momentsAgo)){
				// Ping was successful and it was long time ago...
				// The device is back!
				return this.deviceIsBack();
			}

			if(this.deviceIsPresent){
				debug("Still around...");
				return ;
			}

			return;
		}


		var momentsAgo = new moment().subtract(10, this.unit);
		if(code === 1 && this.lastTimeSeenOnline.isBefore(momentsAgo)){
			this.deviceIsGone();
		}
	}

	this.deviceIsGone = function(){
		if(!this.deviceIsPresent){
			// debug("Still gone")
			return;
		}

		this.deviceIsPresent = false;
		debug("Device left...")
		this.eventEmitter.emit("presenceMessage", { event : "left" , ref: this});
	}

	this.deviceIsBack = function(){
		this.lastTimeSeenOnline = new moment();
		debug("Device is back")
		this.eventEmitter.emit("presenceMessage", { event : "back" , ref: this});
		this.deviceIsPresent = true;
		
	}

	this.begin = function(){
		debug("Begin")
		this.ping();
		setInterval(this.ping.bind(this), 4000);
	}

}


/*
instance = new devicePresence({ name : "phone", address : '192.168.1.141', eventEmitter : 'none'});
instance.begin();

*/


module.exports = DevicePresence;