Heater = require('./heater.js');

function HeaterManager(){
    this.heaters = [];
    this.addHeater = function(name, id, ip){
        newHeater = new Heater(name, id, ip);
        this.heaters.push(newHeater);
    }

    this.getStatus = function(){
        var response = {};
        this.heaters.forEach(function(heaterInfo, index){
            response[heaterInfo.name] = heaterInfo.getStatus();
        })

        return response;
    }

    this.setStatus = function(temperature, whichHeater){
        // if(whichHeater){}
        

    }

}

module.exports = HeaterManager
