Heater = require('./heater.js');

function HeaterManager(){
    this.heaters = [];
    this.addHeater = function(name, id, ip, options){
        newHeater = new Heater(name, id, ip, options);
        this.heaters.push(newHeater);
    }

    this.getStatus = function(){
        var response = {};
        this.heaters.forEach(function(heaterInfo, index){
            response[heaterInfo.name] = heaterInfo.getStatus();
        })

        return response;
    }

    this.setTemperature = function(temperature, whichHeater){
        var temperature = temperature;
        this.heaters.forEach(function(heater, key){
            heater.setTemperature(temperature, function(){})
        })
    }

}

module.exports = HeaterManager
