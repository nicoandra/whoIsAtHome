var env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js'),
    LightSocket = require("./lightSocket.js"),
    ReceiverSocket = require("./receiverSocket.js"),
    crypto = require('crypto');

function LightManager(){
    this.lights = {};
    this.receiverSockets = [];
    this.programs = {}

    this.addLight = function(name, displayName, socketNumber, groupNumber, hasRgb, hasDimmer){

        if(this.receiverSockets[socketNumber] == undefined){
            this.receiverSockets[socketNumber] = new ReceiverSocket(cfg.milight[socketNumber]);
        }

        lightSocket = new LightSocket("name", groupNumber, this.receiverSockets[socketNumber]);
        light = new Light(name, displayName, lightSocket).hasRgb(hasRgb).hasDimmer(hasDimmer);
        this.lights[name] = light;
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

    }

    this.getAvailablePrograms = function(){
        return this.programs;
    }

    this.runProgram = function(command){
        // hash = this.hash(command);
        hash = command;

        if(typeof this.programs[hash] != "object"){
            throw new Error("Program not found");
            // Discard if the invoked command did not match any known program
            return false;
        }



        this.programs[hash].lights.forEach(function(lightName, index) {

            if (typeof lightName == "object") {
                status = lightName;
                lightName = lightName.lightName;
            } else if (typeof lightName == "string") {
                status = this.programs[hash].status;
            }

            console.log("Setting ", lightName, " with status ", status);
            this.lights[lightName].setManualStatus(status);
            return true;

        }.bind(this))

    }

    this.hash = function(string){
        return crypto.createHash("md5").update(string.toLowerCase().trim()).digest("hex");
    }

    this.setStatus = function(lightName, status, callback){

        if(typeof lightName != "string"){
            callback = status;
            status = lightName;
            lightName = status.lightName;
            delete status.lightName;
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

        callback = (typeof callback === 'function') ? callback : function() {};
        callback;
    }

    this.getStatus = function(){
        // console.log(this.lights);

        result = new Object();

        Object.keys(this.lights).forEach(function(lightName, index){
            result[lightName] = this.lights[lightName].getStatus()
        }.bind(this))
        return result;
    }


    this.getInterfaceOptions = function(){
        result = new Object();

        Object.keys(this.lights).forEach(function(lightName, index){

            result[lightName] = this.lights[lightName].getStatus();
            result[lightName].interface = this.lights[lightName].getInterfaceOptions();

        }.bind(this))
        return result;
    }
}

module.exports = LightManager;