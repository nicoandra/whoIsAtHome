var EventEmitter = require('events').EventEmitter

function InternalEventEmitter() {

	this.prototype = EventEmitter.prototype;
	this.prototype.setMaxListeners(100);

}

module.exports = new InternalEventEmitter();