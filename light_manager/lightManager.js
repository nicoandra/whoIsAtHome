var env = process.env.NODE_ENV || 'development'
	, cfg = require(__dirname + '/config/config.'+env+'.js'),
	Light = require("./light.js"),
	LightSocket = require("./lightSocket.js"),
	ReceiverSocket = require("./receiverSocket.js"),
	crypto = require('crypto'),
	debug = require('debug')("app:lightManager"),
	HeaterLight = require("./heaterLight");

function LightManager(){
	this.lights = {};
	this.receiverSockets = [];
	this.programs = {}
	this.allKnownPrograms = {}
	this.activeProgram = false;

	this.allLightsOff = function(){
		debug("allLightsOff: Turning all lights off")
		Object.keys(this.lights).forEach(function(key){
			this.setStatus(key, {onOff : false});
		}.bind(this))
	}

	this.iterateBetweenChildPrograms = function(parentProgramKey){

		debug("iterateBetweenChildPrograms:", Object.keys(this.programs));

		if(!this.programs[parentProgramKey]){
			debug("Can not find such program... sorry");
			return false;
		}

		parentProgram = this.programs[parentProgramKey];
		if(parentProgram.childPrograms.length < 1){
			debug("The selected program does not have child programs. Fallback to parent");
			this.runProgram(parentProgramKey);
		}
	   
		indexOfProgramToRun = parentProgram.childPrograms.map(function(childProgram, index){
			debug("iterateBetweenPrograms", childProgram.id , this.activeProgram, index);
			return childProgram.id == this.activeProgram ? index : 0;
		}.bind(this)).reduce(function(prev, current){
			return prev + current;
		});

		indexOfProgramToRun++;
		if(indexOfProgramToRun == parentProgram.childPrograms.length){
			indexOfProgramToRun = 0;
		}

		this.runProgram(parentProgram.childPrograms[indexOfProgramToRun].id);
		
	}

	this.addHeaterLight = function(name, displayName, heater){
		this.lights[name] = new HeaterLight(name, displayName, heater);
	}

	this.addLight = function(name, displayName, socketNumber, groupNumber, hasRgb, hasDimmer){

		if(this.receiverSockets[socketNumber] == undefined){
			this.receiverSockets[socketNumber] = new ReceiverSocket(cfg.milight[socketNumber]);
		}

		lightSocket = new LightSocket("name", groupNumber, this.receiverSockets[socketNumber]);
		light = new Light(name, displayName, lightSocket).hasRgb(hasRgb).hasDimmer(hasDimmer);
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

		programToAdd = new Object();
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

	this.runProgram = function(command){
		// hash = this.hash(command);
		hash = command;

		if(typeof this.allKnownPrograms[hash] != "object"){
			throw new Error("Program not found");
			// Discard if the invoked command did not match any known program
			return false;
		}


		if(this.allKnownPrograms[hash].statusToApply && this.allKnownPrograms[hash].statusToApply.length > 0){

			// Here are the statuses to apply
			debug("runProgram", this.allKnownPrograms[hash].statusToApply);
			this.allKnownPrograms[hash].statusToApply.forEach(function(status){

				debug("runProgram", "One Status", status);
				this.setStatus(status, function(){});

			}.bind(this));
			this.activeProgram = hash;
			return;
		}

		this.allKnownPrograms[hash].lights.forEach(function(lightName, index) {

			if (typeof lightName == "object") {
				status = lightName;
				lightName = lightName.lightName;

			} else if (typeof lightName == "string") {
				status = this.programs[hash].status;
			}

			debug("Setting ", lightName, " with status ", status);
			this.lights[lightName].setManualStatus(status);
			return true;

		}.bind(this))
		this.activeProgram = hash;

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
					console.log("Setting status of", lightName)
				});
			}

			if(typeof lightName == 'object') {
				status = lightName;
				lightName = status.lightName;
				this.setStatus(lightName, status, function () {
					console.log("Setting status of", lightName)
				});
			}
		}.bind(this))

		this.activeProgram = false;
		callback = (typeof callback === 'function') ? callback : function() {};
		callback;
	}

	this.getStatus = function(){
		// console.log(this.lights);

		result = new Object();
		result.lights = new Object();

		Object.keys(this.lights).forEach(function(lightName, index){
			result.lights[lightName] = this.lights[lightName].getStatus()
		}.bind(this))

		result.programs = new Object();
		result.programs.activeProgram = this.activeProgram;

		return result;
	}


	this.getInterfaceOptions = function(){
		result = new Object();
		result.lights = new Object();

		Object.keys(this.lights).forEach(function(lightName, index){

			result.lights[lightName] = this.lights[lightName].getStatus();
			result.lights[lightName].interface = this.lights[lightName].getInterfaceOptions();

		}.bind(this))

		result.programs = new Object();
		result.programs.activeProgram = this.activeProgram;

		return result;
	}
}

module.exports = LightManager;