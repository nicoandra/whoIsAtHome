var shell = require('shelljs');
var moment = require('moment');
var Debug = require('debug');

function DevicePresence(options){
	
	this.failureCounter = 25;
	this.intervalWhenFoundOnline = 20000;
	this.intervalWhenNotFound = 2000;

	ipRegularExpression = /([0-9]{1,3}\.){3}([0-9]{1,3})/
	if(!options.address.match(ipRegularExpression)){
		throw new Error("The Address parameter is not a valid / safe IP");
	}

	this.unit = 'seconds';
	try {
		this.name = options.name ;
		this.address = options.address;
		var debug = Debug('presence:' + this.name);
	} catch(exception){
		throw exception;
	}

	this.isPresent = function(){
		return this.deviceIsPresent;
	}

	this.lastTimeSeenOnline = new moment().subtract(15, this.unit);
	this.deviceIsPresent = true;

	this.ping = function(){
		var code = shell.exec('ping ' + this.address + ' -c1 -W1', { silent : 1 }).code;
		
		debug('Pinging...', code, 'Try: ', this.failureCounter);

		if(code === 0){
			this.failureCounter = 25 ;
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

		var momentsAgo = new moment().subtract(10, this.unit);
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
			debug("Still gone")
			return;
		}

		this.deviceIsPresent = false;
		debug("Device left...")
		this.app.internalEventEmitter.emit("presenceMessage", { event : "left" , ref: this});
	}

	this.deviceIsBack = function(){
		this.lastTimeSeenOnline = new moment();
		debug("Device is back")
		this.app.internalEventEmitter.emit("presenceMessage", { event : "back" , ref: this});
		this.deviceIsPresent = true;
		
	}

	this.begin = function(app){
		this.app = app;
		debug("Begin")

		setTimeout(this.ping.bind(this), 4000);
	}

}

module.exports = DevicePresence;