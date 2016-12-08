const dgram = require('dgram');


function Strip(){

	this.eventEmitter = null;
	this.isStripUp = true;

	this.host = "192.168.1.134";
	this.port = 5000;

	this.setEventEmitter = function(eventEmitter){
		this.eventEmitter = eventEmitter;
	}


	this.setStatusOk = function(isStripUp){
		if(this.isStripUp == isStripUp){
			return false;
		}

		this.isStripUp = isStripUp;
		if(this.isStripUp){
			this.eventEmitter.emit("strips" , {type : "strips:strip:cameBack", 'ref' : "TheOnlyStrip" , 'data' : { 'when' : new Date()} });	
		} else {
			this.eventEmitter.emit("strips" , {type : "strips:strip:notReachable", 'ref' : "TheOnlyStrip" , 'data' : { 'when' : new Date()} });
		}

		return true;
	}

	this.init = function(){
		this.server = dgram.createSocket('udp4');
		this.server.on('error', (err) => {
		  console.log(`server error:\n${err.stack}`);
		  this.server.close();
		  this.init();
		});

		this.server.on('message', (msg, rinfo) => {
			try {
				if(rinfo.address == this.host && rinfo.port == this.port){
					this.setStatusOk(true);
				}
			} catch (exc){
				this.setStatusOk(false);
				console.log("strip is down");
			}
			
	  		console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		});
	}


	this.init();
	
	this.setColor = function(start, end, r, g, b, callback){
		var payload = [];
		payload.push(0x01) // set range to color
		payload.push(start);
		payload.push(end);
		payload.push(r)
		payload.push(g)
		payload.push(b);

		callback = typeof callback == "function" ? callback : function(){}

		console.log("Sending to strip", payload)

		try {
			this.server.send(new Buffer(payload), 0, 6, this.port /* port? */, this.host, function(err,res){
				if(err){
					this.setStatusOk(false);
					this.server.close();
					this.init();
				}

				callback();

			}.bind(this));
		} catch(err){
			console.log("Strip would have failed. Caught.");				
		}
	}

	this.fillStrip = function(toWrite){

		toWrite.forEach(function(val, key){
			console.log("Pos", key, val);
			this.setColor(key, key+1, val[0], val[1], val[2])
		}.bind(this))
	}

	this.updateStrip = function(toWrite){

		toWrite.forEach(function(val, key){
			if(val[0] == 0 && val[1] == 0 && val[2] == 0){
				return ;
			}
			console.log("Pos", key, val);
			this.setColor(key, key+1, val[0], val[1], val[2])
		}.bind(this))
	}


}

module.exports = Strip;