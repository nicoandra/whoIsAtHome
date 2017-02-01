var moment = require('moment');
const debug = require('debug')("app:actionScheduler");

function actionScheduler(peopleTracker, lightManager, heaterManager, internalEventEmitter){

	this.checkCycleDuration = 60; // In seconds

	this.internalEventEmitter = internalEventEmitter;
	this.peopleTracker = peopleTracker;
	this.lightManager = lightManager;
	this.heaterManager = heaterManager;
	this.wasNightOnLastCheck = false;
	this.nightStartsAt = 16;
	this.nightEndsAt = 8;
	this.lightsOffAtNightAfter = 1;
	this.wasHomeAloneBefore = false;


	this.isHomeAlone = function(){
		homeStatus = this.peopleTracker.getHomeStatus().home;		
		return homeStatus.isAlone;
	}

	this.runActionBasedOnHomeStatus = function(){
		if(this.wasHomeAloneBefore == this.isHomeAlone()){
			// Return, nothing changed;
			debug("runActionBasedOnHomeStatus: nothing changed.")
			return;
		}

		this.wasHomeAloneBefore = this.isHomeAlone();

		if(this.isHomeAlone()){
			debug("runActionBasedOnHomeStatus: home is alone. call homeStartedToBeAlone()")
			this.homeStartedToBeAlone();
		} else {
			debug("runActionBasedOnHomeStatus: home is NOT alone. Someone is at home. Call someoneIsAtHome();")
			this.someoneIsAtHome();
		}
	}

	this.verifyStatus = function(){
		homeStatus = this.peopleTracker.getHomeStatus().home;

		now = moment().unix();
		lastStatusChange = moment(homeStatus.sinceWhen).add(this.checkCycleDuration, 'seconds').unix();

		if(now - lastStatusChange < this.checkCycleDuration){
			// If the change was done in the last cycle, consider the actual status as the "new" status
			// and trigger an action
			console.log("Home status changed to ", homeStatus)

			this.runActionBasedOnHomeStatus();
		}
		this.verifyIfNightStartedOrEnded();
	}

	this.verifyIfNightStartedOrEnded = function(){
		// If the status did not change, do nothing
		if(this.wasNightOnLastCheck === this.isNightTime()){
			debug("Night Status did not change. Return.")
			return ;
		}

		this.wasNightOnLastCheck = this.isNightTime();

		if(this.isDayTime()){
			internalEventEmitter.emit("time:isDayOrNight", { day: true, night: false });
		} else {
			internalEventEmitter.emit("time:isDayOrNight", { day: false, night: true });
		}

		this.runActionBasedOnHomeStatus();


		debug("Is Home Alone in verifyIfNightStartedOrEnded?", this.isHomeAlone());

		if(this.isHomeAlone() && this.lightsShouldBeTurnedOffWhenHomeIsAlone()){
			this.lightManager.allLightsOff();
		}
	}

	this.lightsShouldBeTurnedOffWhenHomeIsAlone = function(){
		if(this.isDayTime()){
			// During the day, the lights should be off
			return true;
		}

		if(this.isNightTime()){
			hour = moment().hour();
			if(hour >= this.lightsOffAtNightAfter){
				// During night, after 1AM, lights should be off.
				return true;
			}
		}

		return false;
	}

	this.homeStartedToBeAlone = function(){
		// Disable heaters, set temperature back to 17;
		console.log('Called homeStartedToBeAlone');

		if(this.isNightTime()){
			console.log("It's night")
			this.lightManager.setStatus({ lightName: 'officeLamp', onOff : true, color: "white", "brightness": 80  })
			this.lightManager.setStatus({ lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 80  })
			this.lightManager.setStatus({ lightName: 'kitchenCountertop', onOff : true, color: "white", "brightness": 80  })
		} else {
			console.log("It's day")
			this.lightManager.setStatus({ lightName: 'officeLamp', onOff : false })
			this.lightManager.setStatus({ lightName: 'kitchenLamp', onOff : false })
			this.lightManager.setStatus({ lightName: 'kitchenCountertop', onOff : false })

		}
		this.heaterManager.setTemperature(17);
	}


	this.someoneIsAtHome = function(){
		// Disable enable heaters back, set temperature back to 22;
		this.heaterManager.setStatus(22);

	}


	this.isNightTime = function(){
		hour = moment().hour();
		if(hour >= this.nightStartsAt || hour < this.nightEndsAt){
			return true;
		}
		return false
	}

	this.isDayTime  = function(){
		return !this.isNightTime();
	}

	this.start = function(){
		setInterval(this.verifyStatus.bind(this), this.checkCycleDuration * 1000);
		setInterval(this.verifyIfNightStartedOrEnded.bind(this), this.checkCycleDuration * 1000);
	}

	this.start();
}

module.exports = actionScheduler;