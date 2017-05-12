/**
 * Created by n_andrade on 10/27/2016.
 */
var ping = require ("ping");
const debug = require('debug')("app:peopleTracker");

var peopleTracker = function(cfg, lightManager, internalEventEmitter){

    var lightManager = lightManager;
    var internalEventEmitter = internalEventEmitter;

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
        var someoneAtHome = false;

        Object.keys(this.people).forEach(function (name) {

            if (['online', 'atHome', 'sleeping'].indexOf(this.people[name].status) > -1) {
                someoneAtHome = true;
            }

            this.peopleAtHome[name] = this.people[name].status

            debug("decideIfHomeIsAloneOrNot", name, this.people[name].status);
        }, this)

        var homeIsAlone = !someoneAtHome;

        if(this.home.isAlone != homeIsAlone){
            this.home.sinceWhen = new Date();
            this.home.isAlone = homeIsAlone ? true : false;
            internalEventEmitter.emit("home:presence:statusChange", this.home);
        }
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
    }.bind(this), 300) // 60 * 5 * 1000

}

module.exports = peopleTracker;