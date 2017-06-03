var shell = require('shelljs');
var moment = require('moment');
var Debug = require('debug');

function DevicePresence(options){
	
	this.failureCounter = 120;
	this.intervalWhenFoundOnline = 40000;
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
	this.deviceIsPresent = false;

	this.ping = function(){
		var code = shell.exec('ping ' + this.address + ' -c2 -W1', { silent : 1 }).code;
		
		debug('Pinging...', code, 'Try: ', this.failureCounter);

		if(code === 0){
			// Device is found
			this.lastTimeSeenOnline = new moment();

			this.failureCounter = 120 ;

			var hour = this.lastTimeSeenOnline.hour();
			if(hour > 1 && hour < 7){
				this.failureCounter = 250 ;
			}

			// Ping worked. Next ping will be done in 20 seconds
			setTimeout(this.ping.bind(this), this.intervalWhenFoundOnline);
			if(this.deviceIsPresent){
				debug("Still around...");
				return ;
			}

			this.deviceIsPresent = true;
			return this.deviceIsBack();
		}


		// Ping did not work. Next ping will be done in 4 seconds
		setTimeout(this.ping.bind(this), this.intervalWhenNotFound);
		if(!this.deviceIsPresent){
			return ;
		}


		var momentsAgo = new moment().subtract(10, this.unit);

		if(this.lastTimeSeenOnline.isBefore(momentsAgo)){
			// Last pong was some time ago...
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
		this.app.internalEventEmitter.emit("presenceMessage", { event : "left" , name: this.name.toString() });
	}

	this.deviceIsBack = function(){
		this.lastTimeSeenOnline = new moment();
		debug("Device is back")
		this.app.internalEventEmitter.emit("presenceMessage", { event : "back" , name: this.name.toString() });
		this.deviceIsPresent = true;
	}

	this.start = function(app){
		if(this.app != undefined ){
			return this;
		}
		this.app = app;
		debug("Begin")
		setTimeout(this.ping.bind(this), 4000);
		this.app.internalEventEmitter.emit("componentStarted", "devicePresence");
		return this;
	}

}

module.exports = DevicePresence;