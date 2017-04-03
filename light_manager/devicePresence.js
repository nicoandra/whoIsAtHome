var shell = require('shelljs');
var moment = require('moment');
var Debug = require('debug');

function DevicePresence(options){

	this.failureCounter = 20;
	this.intervalWhenFoundOnline = 20000;
	this.intervalWhenNotFound = 2000;

	this.unit = 'seconds';
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

	this.lastTimeSeenOnline = new moment().subtract(60 * 3 + 15, this.unit);
	this.deviceIsPresent = true;

	this.ping = function(){
		var code = shell.exec('ping ' + this.address + ' -c1 -W1', { silent : 1 }).code;
		
		debug('Pinging...', code, this.failureCounter);

		if(code === 0){
			this.failureCounter = 20;
			// Ping worked. Next ping will be done in 20 seconds

			setTimeout(this.ping.bind(this), this.intervalWhenFoundOnline);

			this.lastTimeSeenOnline = new moment();

			if(this.deviceIsPresent){
				debug("Still around...");
				return ;
			}

			this.deviceIsPresent = true;
			return this.deviceIsBack();
		}


		// Ping did not work. Next ping will be done in 4 seconds
		setTimeout(this.ping.bind(this), this.intervalWhenNotFound);

		var momentsAgo = new moment().subtract(60 * 2, this.unit);
		if(
			code === 1 && 				// Not pong
			this.deviceIsPresent &&		// I think it should pong!
			this.lastTimeSeenOnline.isBefore(momentsAgo)	// Last pong was some time ago...
			){

			if(this.failureCounter-- == 0){
				this.failureCounter = 0;
				this.deviceIsGone();
			};
			
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

		setTimeout(this.ping.bind(this), 4000);
	}

}


/*
instance = new devicePresence({ name : "phone", address : '192.168.1.141', eventEmitter : 'none'});
instance.begin();

*/


module.exports = DevicePresence;