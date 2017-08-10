/**
 * Created by n_andrade on 10/27/2016.
 */
var ping = require ("ping");
const debug = require('debug')("app:component:peopleTracker");

var peopleTracker = function(cfg){

    this.pollInterval = 10000;

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
        ], status : 'away', arrivesIn : false, lastTimeSeen : false },

        'pepo' : { name : 'Nic', ips: [
            {'ip': '192.168.1.142', 'status' : 'offline', 'lastTimeSeen' : false , 'scanIntervalTime' : 600, maxConsecutiveFailures: 3, consecutiveFailures : 0 , timeoutId : false} ,
        ], status : cfg.peopleTracker.defaultStatus.nico, arrivesIn : false, lastTimeSeen : false },        
    }

    this.peopleAtHome = {}

    this.setAsAway = function(name){
        this.people[name].status = "away";
        this.people[name].arrivesIn = false;
        this.app.notify("presence", {name: name, atHome: false, message: name + " gone away"})
    }

    this.setAsSleeping = function(name){
        this.people[name].status = "sleeping";
        this.people[name].arrivesIn = false;
    }

    this.setAsAtHome = function(name){
        this.people[name].status = "atHome";
        this.people[name].arrivesIn = false;
        this.app.notify("presence", {name: name, atHome: true, message: name + " is back home"})
        this.people[name].lastTimeSeen = new Date();
    }

    this.setAsComingBack = function(name, delayInMinutes){
        this.people[name].status = "comingBack";
        now = new Date();
        var arrivalDate = new Date(now.getTime() + delayInMinutes * 60 * 1000)
        this.people[name].arrivesIn = arrivalDate;
    }

    this.decideIfHomeIsAloneOrNot = function() {

        var someoneAtHome = false;

        Object.keys(this.people).forEach(function (name) {

            if (['online', 'atHome', 'sleeping'].indexOf(this.people[name].status) > -1) {
                someoneAtHome = true;
            }

            this.peopleAtHome[name] = this.people[name].status

            // debug("decideIfHomeIsAloneOrNot", name, this.people[name].status);
        }, this)

        var homeIsAlone = !someoneAtHome;
        debug("decideIfHomeIsAloneOrNot. Is Home alone?", homeIsAlone);

        if(this.home.isAlone != homeIsAlone){
            this.home.sinceWhen = new Date();
            this.home.isAlone = homeIsAlone ? true : false;
            this.app.internalEventEmitter.emit("home:presence:statusChange", this.home);
        }
    }

    this.getStatus = function(){
        return this.getHomeStatus();
    }

    this.getHomeStatus = function(){
        this.decideIfHomeIsAloneOrNot();
        result = { 
            people : this.peopleAtHome, 
            home: this.home
        };
        return result;
    }


    this.start = function(app){
        if(this.app !== undefined){
            return this;
        }
        this.app = app;
        setInterval(this.decideIfHomeIsAloneOrNot.bind(this), this.pollInterval);
        this.app.internalEventEmitter.emit("componentStarted", "peopleTracker");
        return this;
    }
}

module.exports = peopleTracker;