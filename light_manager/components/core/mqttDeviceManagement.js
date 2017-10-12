'use strict'
const  env = process.env.NODE_ENV || 'development',
    cfg = require(__dirname + '/../../config/config.'+env+'.js'),
    broker = require(__dirname + '/mqtt.js'),
    debug = require('debug')('core:deviceManagement')


function MqttDeviceManager() {

	let knownDevices = {}
	let discoveredDevices = {}


	this.isDeviceSet = function(macAddress){
		return (knownDevices.hasOwnProperty(macAddress))
	}

	this.isDeviceDiscovered = function(macAddress){
		return (discoveredDevices.hasOwnProperty(macAddress))
	}

	this.addAsDiscoveredDevice = function(macAddress, values){
		if(macAddress === undefined || this.isDeviceSet(macAddress) || this.isDeviceDiscovered(macAddress)){
			// Don't add it. It exists.
			return false;
		}

		discoveredDevices[macAddress] = values;
		return true;
	}


	this.getDiscoveredDevices = function(){
		return JSON.parse(JSON.stringify(discoveredDevices));
	}

	this.setLightValue = function(macAddress, lightNumber, lightValue){
		let topic = '/lights/' + macAddressToTopic(macAddress);
		debug("TOPIC:", topic, lightNumber, lightValue);
		let status = {};
		status['light' + lightNumber] = lightValue;
		let message = JSON.stringify(status);
		broker.publish(topic, message)
	}

	function macAddressToTopic(macAddress){
		let value = '';
		for(let i = 0; i < macAddress.length; i++){
			if(i % 2 === 0 && i > 0){
				value += ':'
			}
			value += macAddress[i]
		}

		return value;
	}

	

}

const manager = new MqttDeviceManager();

module.exports = manager;
