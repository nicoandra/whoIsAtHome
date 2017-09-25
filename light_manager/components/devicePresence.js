const { exec } = require('child_process');
const moment = require('moment');
const Debug = require('debug');

function DevicePresence(options){
	
	this.failureCounter = 1;
	this.intervalWhenFoundOnline = 360 * 1000;
	this.intervalWhenNotFound = 250;
	this.ownerName = options.ownerName;
	this.lastPingExitCode = 0

	let ipRegularExpression = /([0-9]{1,3}\.){3}([0-9]{1,3})/
	if(!options.address.match(ipRegularExpression)){
		throw new Error("The Address parameter is not a valid / safe IP");
	}

	this.unit = 'minutes';
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

	this.lastTimeSeenOnline = new moment().subtract(30, this.unit);
	this.deviceIsPresent = true;

	this.doPing = function(){
		let command = 'ping ' + this.address + ' -c2 -W1';
		
		debug('Pinging... Try: ', this.failureCounter);

		exec(command, (error, stdout, stderr) => {
			stdout = null;
			stderr = null;
			this.lastPingExitCode = error ? error.code : 0;
			debug("Code is", this.lastPingExitCode);
			/*
			if(this.lastPingExitCode === 0){
				debug("Setting intervalWhenFoundOnline for", this.name);
				return 
			}
			debug("Setting intervalWhenNotFound for", this.name);
			*/
		});
	}

	this.ping = function(){
		let code = this.lastPingExitCode;

		this.doPing();
		debug('Try: ', this.failureCounter)

		if(code === 0){
			// Device is found
			this.lastTimeSeenOnline = new moment()
			this.failureCounter = 1200

			let hour = this.lastTimeSeenOnline.hour()
			if(hour > 18 || hour < 8){
				this.failureCounter = Math.round(this.failureCounter * 1.5)
			}

			// Ping worked. Next ping will be done in 20 seconds
			setTimeout(this.ping.bind(this), this.intervalWhenFoundOnline);
			debug("Setting intervalWhenFoundOnline for", this.name);
			if(this.deviceIsPresent){
				debug("Still around...");
				return ;
			}

			this.deviceIsPresent = true;
			return this.deviceIsBack();
		}

		// Ping did not work. Next ping will be done in 4 seconds
		setTimeout(this.ping.bind(this), this.intervalWhenNotFound);
		debug("Setting intervalWhenNotFound for", this.name);

		if(!this.deviceIsPresent){
			return ;
		}

		let momentsAgo = new moment().subtract(5, this.unit);
		if(this.lastTimeSeenOnline.isBefore(momentsAgo)){
			// Last pong was some time ago...
			if(this.failureCounter-- < 0){
				this.failureCounter = 0;
				this.deviceIsGone();
			}
		}

	}

	this.deviceIsGone = function(){
		if(!this.deviceIsPresent){
			debug("Still gone");
			return;
		}

		this.deviceIsPresent = false;
		debug("Device left...")
		this.app.internalEventEmitter.emit("presenceMessage", { event : "left" , name: this.name.toString(), 'ownerName': this.ownerName.toString() });
	}

	this.deviceIsBack = function(){
		this.lastTimeSeenOnline = new moment();
		debug("Device is back")
		this.app.internalEventEmitter.emit("presenceMessage", { event : "back" , name: this.name.toString(), 'ownerName': this.ownerName.toString() });
		this.deviceIsPresent = true;
	}

	this.start = function(app){
		if(this.app !== undefined ){
			return this;
		}
		this.app = app;
		debug("Begin")

		setTimeout(this.ping.bind(this), 4000);

		this.app.internalEventEmitter.emit("componentStarted", "devicePresence");

		this.app.internalEventEmitter.on("presenceMessage", function(data){
			if(data.event === 'resetValuesToFakePresence' && data.device === this.name){
				this.resetValuesToFakePresence();
			}

		}.bind(this));

		return this;
	}

	this.resetValuesToFakePresence = function(){
		this.failureCounter = 120;
		this.lastTimeSeenOnline = new moment();
		this.deviceIsPresent = true;
	}
}

module.exports = DevicePresence;