const dgram = require('dgram');


function Strip(){

	this.server = dgram.createSocket('udp4');
	this.server.on('error', (err) => {
	  console.log(`server error:\n${err.stack}`);
	  this.server.close();
	});

	this.server.on('message', (msg, rinfo) => {
	  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
	});

	// server.on('listening', () => {
	//   var address = server.address();
	//   console.log(`server listening ${address.address}:${address.port}`);
	// });

	//server.bind(process.argv[2]);
	// server listening 0.0.0.0:41234

	//send some data

	this.setColor = function(start, end, r, g, b, callback){
		var payload = [];
		payload.push(0x01) // set range to color
		payload.push(start);
		payload.push(end);
		payload.push(r)
		payload.push(g)
		payload.push(b);

		callback = typeof callback == "function" ? callback : function(){}

		this.server.send(new Buffer(payload), 0 ,6, 5000 /* port? */, "192.168.1.134", function(err,res){
			if(err){
				console.log("StripError", err.stack);
				this.server.close();
			}

			callback();
		}.bind(this))
	}

	this.writeObject = function(toWrite){
		Object.keys(toWrite).forEach(function(key){
			this.setColor(key, key+1, toWrite[key][0], toWrite[key][1], toWrite[key][2])
		}.bind(this))
	}

}

module.exports = Strip;