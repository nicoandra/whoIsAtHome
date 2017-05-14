var EventEmitter = require('events').EventEmitter
var debug = require('debug')('app:core:NotificationEventEmitter');

function NotificationEventEmitter() {
	this.__proto__ = new EventEmitter;
	

	this.emit = function(event, data){
		debug("Emitting: ", event, data);
		this.__proto__.emit(event, data)
	}	
	
	this.setMaxListeners(100);
	this.notifications = [];

	this.on('lights', function(data){
		var type = "system";
		var message = data.message;
		var toSend = { date : new Date(), type: type, title:"System", text: message }
		this.notifications.unshift(toSend);
	}.bind(this))



	this.on('heaters', function(data){
		var type = "normal";
		var message;
		switch(data.type){
			case 'heaters:heater:wentDown': type = 'danger'; message = data.ref + " heater went down"; break;
			case 'heaters:heater:cameBack': type = 'success'; message = data.ref + " heater came back"; break;
			default: return;
		}

		var toSend = { date : new Date(), type: type, title:"Heaters", text: message }
		this.notifications.unshift(toSend);
	}.bind(this))

	this.on('movement', function(data){
		var toSend = { date : new Date(), type: "alert", title:"Movement detected", text: "Movement detected in " + data.name }
		this.notifications.unshift(toSend);
	}.bind(this))


	this.removeOldNotifications = function(){
		var oneHourAgo = new Date().setMinutes(new Date().getMinutes() - 60);
		var twoDaysAgo = new Date().setMinutes(new Date().getMinutes() - 60 * 24 *2);

		this.notifications = this.notifications.filter(function(notification){
			if(notification.type == "normal"){
				if(notification.date < oneHourAgo){
					return false;
				}
			}

			if(notification.date < twoDaysAgo){
				return false;
			}
			return true;
		})
	}

	this.getNotificationsToSend = function(){
		return this.notifications.slice();
	}

	// Cleanup the queue every minute
	setInterval(this.removeOldNotifications.bind(this), 60 * 1000);
}

module.exports = new NotificationEventEmitter();