/**
 * Created by n_andrade on 10/27/2016.
 */

function peopleTracker(){

    this.home = {
        isAlone: true,
        sinceWhen: new Date()
    }

    this.people = {
        'nico' : { name : 'Nic', ips: ['192.68.1.112'], status : 'away', arrivesIn : false, lastTimeSeen : false }
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

        var homeIsAlone = false;

        Object.keys(this.people).forEach(function (name) {
            result = true;

            if(this.wasUserOfflineLongTime(name)){
                this.setAsAway(name);
            }

            if (this.people[name].status == 'away') {
                result = false;
            }

            if (this.people[name].status == 'comingBack') {
                result = false;
            }

            homeIsAlone = homeIsAlone || !result;
            this.peopleAtHome[name] = this.people[name].status
        }, this)

        if(this.home.isAlone != homeIsAlone){
            this.home.sinceWhen = new Date();
        }

        this.home.isAlone = homeIsAlone ? true : false;

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
    setInterval(function(){
        this.decideIfHomeIsAloneOrNot()
    }.bind(this), 60 * 5 * 1000)

}

module.exports = new peopleTracker();