"use strict"

let MiLight = require("../devices/drivers/milight/light.js"),
	EspLight = require("../devices/drivers/espLight/light.js"),
	LightSocket = require("./../devices/drivers/milight/lightSocket.js"),
	ReceiverSocket = require("./../devices/drivers/milight/receiverSocket.js"),
	crypto = require('crypto'),
	path = require('path'),
	debug = require('debug')("app:component:lightManager"),
	HeaterLight = require("./../devices/drivers/nHeatersV1/heaterLight.js"),
	fs = require('fs');

const settingsPath = path.join(__dirname, '..','settings', 'lightmanager.js');



function LightManager(cfg){
	this.lights = {};
	this.receiverSockets = [];
	this.programs = {}
	this.scenes = {}
	this.allKnownPrograms = {}
	this.activeScene = false;
	this.sceneNamesByAlias = {};

	this.addLightsFromObject = function(lights){
		lights.forEach(function(lightDefinition){
			if(lightDefinition.type == 'milight'){
				this.addMilightLight(lightDefinition.id, lightDefinition.alias, lightDefinition.receiverId, lightDefinition.groupId, lightDefinition.hasRgb, lightDefinition.hasDimmer);
				return ;
			}

			if(lightDefinition.type == 'espLight'){
				this.addEspLight(lightDefinition.id, lightDefinition.alias, lightDefinition.macAddress, lightDefinition.channel);
				return ;
			}

		}.bind(this));
	}

	this.updateLightBrigthnessByIdAndDelta = function(lightNumber, delta){
		debug("Set light")
		try {
			let light = this.lights[Object.keys(this.lights)[lightNumber]];

			let currentBrightness = light.getStatus().status.brightness;
			let desiredBrightness = currentBrightness + delta;

			if(desiredBrightness < 0){
				desiredBrightness = 0;
			}

			if(desiredBrightness > 100){
				desiredBrightness = 100;
			}

			debug("Light number ", lightNumber, "goes from", currentBrightness, "to", desiredBrightness)

			light.setBrightness(desiredBrightness);
		} catch(excp){
			debug(excp);
			return ;
		}


	}

	this.setLightBrightnessByArray = function(powerValues, callback){
		if(typeof callback != "function"){
			callback = () => {}
		}
		let err = false, res = true
		debug("LIGHTS TO BE SET AS", powerValues);


		let lightNames = Object.keys(this.lights);

		powerValues.forEach(function(value, index){
			this.lights[lightNames[index]].setBrightness(value);
		}.bind(this))

		callback(err, res);

	}

	this.addEspLight = function(name, displayName, macAddress, channelNumber){
		this.lights[name] = new EspLight(name, displayName, macAddress, channelNumber);
	}

	this.allLightsOff = function(){
		debug("allLightsOff: Turning all lights off")
		Object.keys(this.lights).forEach(function(key){
			this.setStatus(key, {onOff : false});
		}.bind(this))
	}

	this.addHeaterLight = function(name, displayName, heater){
		this.lights[name] = new HeaterLight(name, displayName, heater);
	}

	this.addMilightLight = function(name, displayName, socketNumber, groupNumber, hasRgb, hasDimmer){
		// this.app.notify('lights', {message: "added one"});

		if(this.receiverSockets[socketNumber] === undefined){
			this.receiverSockets[socketNumber] = new ReceiverSocket(cfg.milight[socketNumber]);
		}

		let lightSocket = new LightSocket("name", groupNumber, this.receiverSockets[socketNumber]);
		let light = new MiLight(name, displayName, lightSocket).hasRgb(hasRgb).hasDimmer(hasDimmer);
		this.lights[name] = light;
	}

	this.addProgramInstance = function(lightProgram){
		this.programs[this.hash(lightProgram.id)] = lightProgram;
		this.allKnownPrograms[this.hash(lightProgram.id)] = lightProgram;

		if(lightProgram.childPrograms.length > 0){
			lightProgram.childPrograms.forEach(function(childProgram){
				this.allKnownPrograms[childProgram.id] = childProgram;
			}.bind(this));
		}
	}

	this.addProgram = function(name, command, affectedLights, statusObject){
		// This method will store a program in memory
		// So it can be matched when a command is executed with "executeProgram"

		var programToAdd = new Object();
		programToAdd.name = name;
		programToAdd.command = command.toLowerCase().trim();

		if(!Array.isArray(affectedLights)){
			affectedLights = [ affectedLights ];
		}
		programToAdd.lights = affectedLights;
		programToAdd.status = statusObject;

		this.programs[this.hash(programToAdd.command)] = programToAdd;

		this.allKnownPrograms[this.hash(programToAdd.command)] = programToAdd;

	}

	this.getAvailablePrograms = function(){
		return this.programs;
	}

	this.hash = function(string){
		return crypto.createHash("md5").update(string.toLowerCase().trim()).digest("hex");
	}

	this.setStatus = function(lightName, status, callback){
		if(typeof lightName != "string"){
			// Lightname is an object. Obtain the light name from it.
			callback = status;
			status = lightName;
			lightName = status.lightName;
			//delete status.lightName;
		}

		callback = (typeof callback === 'function') ? callback : function() {};
		this.lights[lightName].setManualStatus(status, callback);
	}

	/*
	This method supports two formats:
	1- Array of lightnames and a status: [light1, light2,light3], { statusObject }
	2-An array of statuses to apply, each of them containing a light name: [{ lightName: light1, status1 }, { lightName: light2, status2} , ... ]
	 */

	this.setMultipleStatus = function(lightNames, status, callback){
		lightNames.forEach(function(lightName){
			if(typeof lightName == 'string') {
				// Handling first case
				this.setStatus(lightName, status, function () {
					debug("Setting status of", lightName)
				});
			}

			if(typeof lightName == 'object') {
				status = lightName;
				lightName = status.lightName;
				this.setStatus(lightName, status, function () {
					indexToRead("Setting status of", lightName)
				});
			}
		}.bind(this))

		this.activeScene = false;
		callback = (typeof callback === 'function') ? callback : function() {};
		callback;
	}

	this.useScene = function(sceneName, isTheSecondCall){
		debug("useScene switch from ",this.currentScene,"to", sceneName);
		if(this.currentScene == sceneName){
			return false;
		}

		this.currentScene = sceneName;

		debug("Loading scene ", sceneName);
		if(sceneName === "allLightsOff"){
			this.allLightsOff();
			return ;
		}

		if(sceneName === "homeIsAloneAtNight"){
			this.setStatus({ lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'kitchenCountertop', onOff : true, color: "white", "brightness": 80 })
			this.setStatus({ lightName: 'officeLamp', onOff : true, color: "white", "brightness": 60 })
			this.setStatus({ lightName: 'screen1', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen2', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen3', onOff : true, color: "white", "brightness": 10 })
			return ;
		}

		if(sceneName === "homeIsAloneLow"){
			this.setStatus({ lightName: 'kitchenLamp', onOff : false, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'kitchenCountertop', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'officeLamp', onOff : false, color: "white", "brightness": 60 })
			this.setStatus({ lightName: 'screen1', onOff : false, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen2', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen3', onOff : true, color: "white", "brightness": 10 })
			return ;
		}

		if(sceneName === "welcomeHomeHigh"){
			this.setStatus({ lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 100 })
			this.setStatus({ lightName: 'kitchenCountertop', onOff : true, color: "white", "brightness": 100 })
			this.setStatus({ lightName: 'officeLamp', onOff : true, color: "white", "brightness": 100 })
			return ;
		}

		if(sceneName === "welcomeHomeLow"){
			this.allLightsOff();
			this.setStatus({ lightName: 'kitchenLamp', onOff : false, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'kitchenCountertop', onOff : true, color: "white", "brightness": 100 })
			this.setStatus({ lightName: 'officeLamp', onOff : false, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen1', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen2', onOff : true, color: "white", "brightness": 10 })
			this.setStatus({ lightName: 'screen3', onOff : true, color: "white", "brightness": 40 })
			return ;
		}

		debug("Scene ", sceneName, "not found.");
	}

	this.getProgrammaticStatus = function(){
		let status = { lights : {} }
		let actual = this.getStatus();
		Object.keys(actual.lights).forEach(function(lightName){
			status.lights[lightName] = actual.lights[lightName].status
		})
		return status;
	}

	this.getStatus = function(){
		var result = new Object();
		result.lights = new Object();
		var allLightsOff = true;
		var allLightsOn = true;

		Object.keys(this.lights).forEach(function(lightName){

			var status = this.lights[lightName].getStatus()
			allLightsOn = allLightsOn && status.status;
			allLightsOff = allLightsOff && !status.status;
			result.lights[lightName] = status
			result.lights[lightName].interface = this.lights[lightName].getInterfaceOptions();
		}.bind(this))

		// use allLightsOff to set the program all off
		result.programs = new Object();
		result.programs.activeScene = this.activeScene;
		result.programs.availablePrograms = JSON.parse(JSON.stringify(this.programs))


		result.scenes = {
			active: this.activeScene,
			available: JSON.parse(JSON.stringify(this.sceneNamesByAlias))
		}

		return result;
	}

	this.start = function(app){
		if(this.app !== undefined){
			return this;
		}
		this.app = app;

		this.loadScenesFromFile((err, res) => { });

		setInterval(this.loadScenesFromFile.bind(this), 300 * 1000)	// Populate programs
		debug(this.scenes)
		this.app.internalEventEmitter.emit("componentStarted", "lightManager");
		return this;
	}

	this.loadScenesFromFile = function(cb){
		if(typeof cb !== "function") {
			cb = () => {}
		}

		let filepath = settingsPath
		fs.readFile(filepath, (err, content) => {
			let curr
			if(err){
				debug(err);
				curr = {}
				return cb(err)
			}

			try {
				let scenes = this.scenes = JSON.parse(content)

				Object.keys(scenes).forEach((sceneAlias, somethingA) => {
					if(typeof scenes[sceneAlias].status == "undefined"){
						delete scenes[sceneAlias]
					}
				})

				this.scenes = scenes

			} catch (exception){
				this.scenes = {}
			}

			Object.keys(this.scenes).forEach( (alias) => {
				this.sceneNamesByAlias[alias] = this.scenes[alias].displayName
			})
			cb(null)

		})
	}

	this.loadScene = function(sceneAlias){
		if(this.scenes[sceneAlias] == undefined){
			return false;
		}

		try {

			Object.keys(this.scenes[sceneAlias].status.lights).forEach((lightName) => {
				this.setStatus(lightName, this.scenes[sceneAlias].status.lights[lightName])
			})

			this.activeScene = sceneAlias
		} catch(exception){
			debug("Something failed when loading scene ", sceneAlias, exception)
		}
	}

	this.addScene = function (sceneId, displayName, cb) {
		if (typeof cb != "function"){
			cb = () => {}
		}
		debug("addScene ", sceneId, displayName)
		this.scenes[sceneId] = { displayName: displayName, status : this.getProgrammaticStatus() }
		this.sceneNamesByAlias[sceneId] = displayName;
		this.persistScenesToFile(cb)
	}

	this.deleteScene = function (programAlias, cb) {
		if(this.scenes[programAlias] != undefined){
			debug("Found and removed", programAlias)
			delete this.scenes[programAlias];
			delete this.sceneNamesByAlias[programAlias];
			this.persistScenesToFile(cb)
		} else {
			debug("Nothing deleted", programAlias)
			return cb();
		}
	}

	this.persistScenesToFile  = function(cb){
		let filepath = settingsPath

		let content = JSON.stringify(this.scenes);
		fs.writeFile(filepath, content, () => {
			this.loadScenesFromFile(cb)
		})
	}

	this.getInterfaceOptions = function(){
		return this.getStatus();
	}

	this.getDeviceClassName = function(){
		return 'lights';
	}
}

module.exports = LightManager;
