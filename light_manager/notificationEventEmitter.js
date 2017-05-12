var EventEmitter = require('events').EventEmitter

module.exports = NotificationEventEmitter();

function NotificationEventEmitter(){

	this.prototype = EventEmitter.prototype;


	this.prototype.setMaxListeners(100);


	this.prototype.on('heaters', function(data){
		
		var type = "normal";
		var message;
		switch(data.type){
			case 'heaters:heater:wentDown': type = 'danger'; message = data.ref + " heater went down"; break;
			case 'heaters:heater:cameBack': type = 'success'; message = data.ref + " heater came back"; break;
			default: return;
		}

		var toSend = { date : new Date(), type: type, title:"Heaters", text: message }
		notificationQueue.unshift(toSend);
	})

	this.prototype.on('movement', function(data){
		var toSend = { date : new Date(), type: "alert", title:"Movement detected", text: "Movement detected in " + data.name }
		notificationQueue.unshift(toSend);
	})



}