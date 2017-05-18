var EventEmitter = require('events').EventEmitter
var debug = require('debug')('app:core:InternalEventEmitter');

function InternalEventEmitter() {
	this.__proto__ = new EventEmitter;

	// this.prototype = EventEmitter.prototype;
	this.setMaxListeners(100);


	this.emit = function(event, data){
		debug("Emitting: ", event);
		this.__proto__.emit(event, data)
	}	

}

module.exports = new InternalEventEmitter();