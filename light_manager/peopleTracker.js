/**
 * Created by n_andrade on 10/27/2016.
 */
var ping = require ("ping");
const debug = require('debug')("app:peopleTracker");
var env = process.env.NODE_ENV || 'development'
    , cfg = require(__dirname + '/config/config.'+env+'.js');

var peopleTracker = function(lightManager, internalEventEmitter){

    var lightManager = lightManager;
    var internalEventEmitter = internalEventEmitter;

    this.enableDetectionByPing = false;

    this.home = {
        isAlone: true,
        sinceWhen: new Date()
    }

    this.people = {
        'nico' : { name : 'Nic', ips: [
            {'ip': '192.168.1.111', 'status' : 'offline', 'lastTimeSeen' : false , 'scanIntervalTime' : 600, maxConsecutiveFailures: 3, consecutiveFailures : 0, timeoutId : false} ,
            {'ip': '192.168.1.112', 'status' : 'offline', 'lastTimeSeen' : false , 'scanIntervalTime' : 600, maxConsecutiveFailures: 3, consecutiveFailures : 0 , timeoutId : false} ,
        ], status : cfg.peopleTracker.defaultStatus.nico, arrivesIn : false, lastTimeSeen : false },

        'pris' : { name : 'Pris', ips: [
            {'ip': '192.168.1.115', 'status' : 'offline', 'lastTimeSeen' : false , 'scanIntervalTime' : 600, maxConsecutiveFailures: 3, consecutiveFailures : 0 , timeoutId : false} ,
            {'ip': '192.168.1.116', 'status' : 'offline', 'lastTimeSeen' : false , 'scanIntervalTime' : 600, maxConsecutiveFailures: 3, consecutiveFailures : 0 , timeoutId : false} , // iPad?
        ], status : 'away', arrivesIn : false, lastTimeSeen : false }        
    }



    this.peopleAtHome = {}

    this.setAsAway = function(name){
        this.people[name].status = "away";
        this.people[name].arrivesIn = false;
    }

    this.setAsSleeping = function(name){
        this.people[name].status = "sleeping";
        this.people[name].arrivesIn = false;
        // lightManager.allLightsOff();
    }

    this.setAsAtHome = function(name){
        this.people[name].status = "atHome";
        this.people[name].arrivesIn = false;
        this.people[name].lastTimeSeen = new Date();
    }

    this.setAsComingBack = function(name, delayInMinutes){
        this.people[name].status = "comingBack";
        now = new Date();
        arrivalDate = new Date(now.getTime() + delayInMinutes * 60 * 1000)
        this.people[name].arrivesIn = arrivalDate;
    }

    this.wasUserOfflineLongTime = function(name){
        return false;

        if(this.people[name].lastTimeSeen === false){
            // I dont' know
            return false;
        }

        now = new Date();
        oneHourAgo = new Date(now - 60 * 60 * 1000);
        then = this.people[name].lastTimeSeen;

        if(then < oneHourAgo){
            return true;
        }
        return false;

    }


    this.decideIfHomeIsAloneOrNot = function() {

        var homeIsAlone = true;
        var someoneAtHome = false;

        Object.keys(this.people).forEach(function (name) {

            if(this.enableDetectionByPing && this.wasUserOfflineLongTime(name)){
                this.setAsAway(name);
            }

            if (['online', 'atHome', 'sleeping'].indexOf(this.people[name].status) > -1) {
                result = false;
                someoneAtHome = true;
            }

            if (this.people[name].status == 'away') {
                result = true;
            }

            if (this.people[name].status == 'comingBack') {
                result = true;
            }

            // homeIsAlone = homeIsAlone || result;

            this.peopleAtHome[name] = this.people[name].status

            debug("decideIfHomeIsAloneOrNot", name, this.people[name].status);

        }, this)

        
        homeIsAlone = !someoneAtHome;

        if(this.home.isAlone != homeIsAlone){
            this.home.sinceWhen = new Date();
            this.home.isAlone = homeIsAlone ? true : false;
            internalEventEmitter.emit("home:statusChange", this.home);
        }
    }


    this.findPersonByIpAddress = function(ipAddress){
        var ipAddress = ipAddress;
        var nameFound = false;

        Object.keys(this.people).forEach(function(name){

            if(nameFound){
                return ;
            }

            this.people[name].ips.forEach(function(ip){
                if(nameFound){
                    return ;
                }
                nameFound = nameFound || ip == ipAddress;
            })

        }.bind(this));

        return nameFound;
    }

    this.getHomeStatus = function(){
        this.decideIfHomeIsAloneOrNot();
        result = { 
            people : this.peopleAtHome, 
            home: this.home
        };
        return result;
    }

    // Test home alone state every 5 minutes
    if(true) setInterval(function(){
        this.decideIfHomeIsAloneOrNot()
    }.bind(this), 60000) // 60 * 5 * 1000


    setInterval(function(){
        this.startPingIntervals();
    }.bind(this), 50000)


    this.startPingIntervals = function(){

        Object.keys(this.people).forEach(function(name){

            // console.log(this.people[name])
            if(this.enableDetectionByPing === false){
                return ;
            }

            this.people[name].ips.forEach(function(device){

                if(device.timeoutId){
                    // If the device already has a timeout ID, skip
                    // console.log("Skipping", device.ip);
                    return ;
                }


                // Helper method to perform pings
                pingThisIp = function(){
                    var options = {
                        ttl: 64,
                        timeout: 2000, // In seconds
                        extra: ["-i 2"]
                    };

                    var host = this.ip;

                    ping.sys.probe(host, function(isAlive){
                        if(isAlive){
                            this.consecutiveFailures = 0;
                            this.status = "online";
                            this.lastTimeSeen = new Date();
                         } else {
                            
                            this.consecutiveFailures++;
                            if(this.maxConsecutiveFailures == 0 || this.consecutiveFailures == this.maxConsecutiveFailures){
                                this.status = "offline";    
                            }
                        }

                        var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
                        debug(msg);

                        this.timeoutId = false;

                    }.bind(this), options);
                }

                // Device looks like:
                // {'ip': '192.68.1.115', 'status' : 'offline', 'lastTimeSeen' = false , 'scanIntervalTime' : 1800 } ,

                // If never seen, force scan
                var doScan = (device.lastTimeSeen == false);

                // If the device is offline, do scan every 5 minutes;
                if(!doScan && device.status == "offline"){
                    doScan = true;
                    var interval = 1 * 600 * 1000 ;    // 5 minutes, set to 500ms for testing purposes
                    // var interval = 1 * 3 * 1000 ;    // 5 minutes, set to 500ms for testing purposes

                }

                // If the device is online, flag it as online and scan again in 30 minutes
                if(!doScan && device.status == "online"){
                    doScan = true;
                    var interval = device.scanIntervalTime * 1000; // Use value from Object. Set to 5 seconds for testing purposes
                    // var interval = 15 * 1000 ; // Use value from Object. Set to 5 seconds for testing purposes
                }

                if(doScan){
                    device.timeoutId = setTimeout(pingThisIp.bind(device), interval);
                }

            }.bind(this))


            var onlineOrOffline = "offline";
            onlineOrOffline = this.people[name].ips.reduce(function(accumulator,currentDevice,index,fullArray){
                if(accumulator == "online" || currentDevice.status == "online"){
                    return "online";
                }
                return accumulator;
            }, onlineOrOffline)
            this.people[name].status = onlineOrOffline;

        }.bind(this))

    }

}

module.exports = peopleTracker;